
CREATE SEQUENCE IF NOT EXISTS public.invoice_dep_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS public.invoice_pur_seq START 1000;

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('deposit','purchase')),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  funding_request_id uuid REFERENCES public.funding_requests(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount_due numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text,
  status text NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment','pending_verification','partially_paid','paid','processing','completed','cancelled','expired','refunded','rejected')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invoices_user_idx ON public.invoices(user_id, created_at DESC);
CREATE INDEX invoices_status_idx ON public.invoices(status);
CREATE INDEX invoices_source_idx ON public.invoices(source_type, source_id);
CREATE INDEX invoices_funding_req_idx ON public.invoices(funding_request_id);

GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'finance')
    OR public.has_role(auth.uid(),'support')
    OR public.has_role(auth.uid(),'compliance')
  );

CREATE POLICY "System inserts invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins update invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'finance')
  );

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.next_invoice_number(_kind text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_year text := to_char(now(),'YYYY'); v_n bigint; v_prefix text;
BEGIN
  IF _kind='deposit' THEN
    v_n := nextval('public.invoice_dep_seq'); v_prefix := 'DEP';
  ELSE
    v_n := nextval('public.invoice_pur_seq'); v_prefix := 'INV';
  END IF;
  RETURN v_prefix || '-' || v_year || '-' || lpad(v_n::text,6,'0');
END $$;

CREATE OR REPLACE FUNCTION public.tg_create_deposit_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.request_type <> 'deposit' THEN RETURN NEW; END IF;
  INSERT INTO public.invoices (user_id, invoice_number, kind, source_type, source_id, funding_request_id,
    title, description, amount_due, currency, payment_method, status, metadata)
  VALUES (NEW.user_id, public.next_invoice_number('deposit'), 'deposit', 'funding_request', NEW.id, NEW.id,
    'Deposit · ' || upper(coalesce(NEW.asset,NEW.currency,'USD')) || ' via ' || NEW.payment_method,
    'Deposit ' || NEW.amount::text || ' ' || coalesce(NEW.asset,NEW.currency,'USD'),
    NEW.amount, coalesce(NEW.asset,NEW.currency,'USD'), NEW.payment_method,
    'awaiting_payment',
    jsonb_build_object('reference_number',NEW.reference_number,'details',NEW.details));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS create_deposit_invoice ON public.funding_requests;
CREATE TRIGGER create_deposit_invoice AFTER INSERT ON public.funding_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_create_deposit_invoice();

CREATE OR REPLACE FUNCTION public.tg_sync_deposit_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_new_status text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  v_new_status := CASE NEW.status
    WHEN 'approved' THEN 'paid'
    WHEN 'completed' THEN 'completed'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'pending_verification'
  END;
  UPDATE public.invoices
     SET status = v_new_status,
         amount_paid = CASE WHEN v_new_status IN ('paid','completed') THEN amount_due ELSE amount_paid END,
         paid_at = CASE WHEN v_new_status IN ('paid','completed') THEN now() ELSE paid_at END
   WHERE funding_request_id = NEW.id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sync_deposit_invoice ON public.funding_requests;
CREATE TRIGGER sync_deposit_invoice AFTER UPDATE ON public.funding_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_deposit_invoice();

CREATE OR REPLACE FUNCTION public.tg_create_tesla_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status text;
BEGIN
  IF NEW.side <> 'buy' THEN RETURN NEW; END IF;
  v_status := CASE WHEN NEW.status = 'filled' THEN 'paid' ELSE 'awaiting_payment' END;
  INSERT INTO public.invoices (user_id, invoice_number, kind, source_type, source_id,
    title, description, amount_due, amount_paid, currency, payment_method, status, paid_at, metadata)
  VALUES (NEW.user_id, public.next_invoice_number('purchase'), 'purchase', 'tesla_order', NEW.id,
    'Tesla Stock Purchase', 'Buy ' || NEW.shares || ' ' || NEW.symbol || ' @ $' || NEW.price,
    NEW.amount, CASE WHEN v_status='paid' THEN NEW.amount ELSE 0 END, 'USD', 'wallet', v_status,
    CASE WHEN v_status='paid' THEN now() ELSE NULL END,
    jsonb_build_object('shares',NEW.shares,'price',NEW.price,'symbol',NEW.symbol));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS create_tesla_invoice ON public.tesla_orders;
CREATE TRIGGER create_tesla_invoice AFTER INSERT ON public.tesla_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_create_tesla_invoice();

CREATE OR REPLACE FUNCTION public.tg_create_spacex_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status text;
BEGIN
  IF NEW.side <> 'buy' THEN RETURN NEW; END IF;
  v_status := CASE WHEN NEW.status = 'filled' THEN 'paid' ELSE 'awaiting_payment' END;
  INSERT INTO public.invoices (user_id, invoice_number, kind, source_type, source_id,
    title, description, amount_due, amount_paid, currency, payment_method, status, paid_at, metadata)
  VALUES (NEW.user_id, public.next_invoice_number('purchase'), 'purchase', 'spacex_order', NEW.id,
    'SpaceX Stock Purchase', 'Buy ' || NEW.shares || ' ' || NEW.symbol || ' @ $' || NEW.price,
    NEW.amount, CASE WHEN v_status='paid' THEN NEW.amount ELSE 0 END, 'USD', 'wallet', v_status,
    CASE WHEN v_status='paid' THEN now() ELSE NULL END,
    jsonb_build_object('shares',NEW.shares,'price',NEW.price,'symbol',NEW.symbol));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS create_spacex_invoice ON public.spacex_orders;
CREATE TRIGGER create_spacex_invoice AFTER INSERT ON public.spacex_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_create_spacex_invoice();

CREATE OR REPLACE FUNCTION public.tg_create_vehicle_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status text; v_due numeric; v_paid numeric; v_model text;
BEGIN
  v_due := CASE WHEN NEW.order_type='reservation' THEN NEW.deposit_amount ELSE NEW.total_price END;
  v_paid := COALESCE(NEW.amount_paid,0);
  v_status := CASE
    WHEN NEW.payment_method='wallet' AND v_paid >= v_due THEN 'paid'
    WHEN v_paid > 0 AND v_paid < v_due THEN 'partially_paid'
    ELSE 'awaiting_payment'
  END;
  SELECT model INTO v_model FROM public.tesla_vehicles WHERE id = NEW.vehicle_id;
  INSERT INTO public.invoices (user_id, invoice_number, kind, source_type, source_id,
    title, description, amount_due, amount_paid, currency, payment_method, status, paid_at, metadata)
  VALUES (NEW.user_id, public.next_invoice_number('purchase'), 'purchase', 'tesla_vehicle_order', NEW.id,
    CASE WHEN NEW.order_type='reservation' THEN 'Tesla Vehicle Reservation' ELSE 'Tesla Vehicle Purchase' END,
    coalesce(v_model,'Tesla Vehicle') || ' · ' || NEW.order_type,
    v_due, v_paid, 'USD', NEW.payment_method, v_status,
    CASE WHEN v_status='paid' THEN now() ELSE NULL END,
    jsonb_build_object('vehicle_id',NEW.vehicle_id,'configuration',NEW.configuration,'order_type',NEW.order_type,'total_price',NEW.total_price));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS create_vehicle_invoice ON public.tesla_vehicle_orders;
CREATE TRIGGER create_vehicle_invoice AFTER INSERT ON public.tesla_vehicle_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_create_vehicle_invoice();
