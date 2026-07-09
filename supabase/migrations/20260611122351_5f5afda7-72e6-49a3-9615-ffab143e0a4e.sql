
ALTER TABLE public.tesla_orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'wallet';
ALTER TABLE public.spacex_orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'wallet';

-- Re-define apply triggers to also fire on UPDATE when status transitions to 'filled'
CREATE OR REPLACE FUNCTION public.tg_apply_tesla_order()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_h RECORD; v_wallet RECORD; v_new_shares numeric; v_new_invested numeric; v_new_avg numeric;
BEGIN
  IF NEW.status <> 'filled' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'filled' THEN RETURN NEW; END IF;

  IF NEW.side = 'buy' AND COALESCE(NEW.payment_method,'wallet') = 'wallet' THEN
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id=NEW.user_id AND currency='USD' FOR UPDATE;
    IF v_wallet.id IS NULL THEN RAISE EXCEPTION 'wallet missing'; END IF;
    IF v_wallet.balance < NEW.amount THEN RAISE EXCEPTION 'insufficient funds'; END IF;
    UPDATE public.wallets SET balance=balance-NEW.amount WHERE id=v_wallet.id;
    INSERT INTO public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,reference,description)
    VALUES (v_wallet.id,'debit',NEW.amount,v_wallet.balance,v_wallet.balance-NEW.amount,'tesla:'||NEW.id::text,'Tesla stock purchase');
  END IF;

  SELECT * INTO v_h FROM public.tesla_holdings WHERE user_id=NEW.user_id AND symbol=NEW.symbol FOR UPDATE;
  IF v_h.id IS NULL THEN
    INSERT INTO public.tesla_holdings (user_id, symbol, shares, average_cost, total_invested)
    VALUES (NEW.user_id, NEW.symbol, NEW.shares, NEW.price, NEW.amount);
  ELSE
    IF NEW.side='buy' THEN
      v_new_shares := v_h.shares + NEW.shares;
      v_new_invested := v_h.total_invested + NEW.amount;
      v_new_avg := CASE WHEN v_new_shares>0 THEN v_new_invested/v_new_shares ELSE 0 END;
      UPDATE public.tesla_holdings SET shares=v_new_shares, total_invested=v_new_invested, average_cost=v_new_avg WHERE id=v_h.id;
    ELSE
      UPDATE public.tesla_holdings SET shares=v_h.shares-NEW.shares,
        realized_pl=realized_pl+(NEW.price-v_h.average_cost)*NEW.shares,
        total_invested=GREATEST(0,v_h.total_invested-v_h.average_cost*NEW.shares)
        WHERE id=v_h.id;
    END IF;
  END IF;

  -- sync invoice paid if exists
  UPDATE public.invoices SET status='paid', amount_paid=amount_due, paid_at=now()
    WHERE source_type='tesla_order' AND source_id=NEW.id AND status <> 'paid';

  INSERT INTO public.notifications (user_id, title, message, notification_type, category, metadata)
  VALUES (NEW.user_id, 'Tesla order filled',
    'You ' || NEW.side || ' ' || NEW.shares || ' TSLA @ $' || NEW.price,
    'system', 'investment', jsonb_build_object('order_id',NEW.id));
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_apply_tesla_order ON public.tesla_orders;
CREATE TRIGGER trg_apply_tesla_order AFTER INSERT OR UPDATE OF status ON public.tesla_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_apply_tesla_order();

CREATE OR REPLACE FUNCTION public.tg_apply_spacex_order()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_h RECORD; v_wallet RECORD; v_new_shares numeric; v_new_invested numeric; v_new_avg numeric;
BEGIN
  IF NEW.status <> 'filled' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'filled' THEN RETURN NEW; END IF;

  IF NEW.side = 'buy' AND COALESCE(NEW.payment_method,'wallet') = 'wallet' THEN
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id=NEW.user_id AND currency='USD' FOR UPDATE;
    IF v_wallet.id IS NULL THEN RAISE EXCEPTION 'wallet missing'; END IF;
    IF v_wallet.balance < NEW.amount THEN RAISE EXCEPTION 'insufficient funds'; END IF;
    UPDATE public.wallets SET balance=balance-NEW.amount WHERE id=v_wallet.id;
    INSERT INTO public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,reference,description)
    VALUES (v_wallet.id,'debit',NEW.amount,v_wallet.balance,v_wallet.balance-NEW.amount,'spacex:'||NEW.id::text,'SpaceX stock purchase');
  END IF;

  SELECT * INTO v_h FROM public.spacex_holdings WHERE user_id=NEW.user_id AND symbol=NEW.symbol FOR UPDATE;
  IF v_h.id IS NULL THEN
    INSERT INTO public.spacex_holdings(user_id,symbol,shares,average_cost,total_invested)
    VALUES (NEW.user_id,NEW.symbol,NEW.shares,NEW.price,NEW.amount);
  ELSE
    IF NEW.side='buy' THEN
      v_new_shares := v_h.shares + NEW.shares;
      v_new_invested := v_h.total_invested + NEW.amount;
      v_new_avg := CASE WHEN v_new_shares>0 THEN v_new_invested/v_new_shares ELSE 0 END;
      UPDATE public.spacex_holdings SET shares=v_new_shares, total_invested=v_new_invested, average_cost=v_new_avg WHERE id=v_h.id;
    ELSE
      UPDATE public.spacex_holdings SET shares=v_h.shares-NEW.shares,
        realized_pl=realized_pl+(NEW.price-v_h.average_cost)*NEW.shares,
        total_invested=GREATEST(0,v_h.total_invested-v_h.average_cost*NEW.shares)
        WHERE id=v_h.id;
    END IF;
  END IF;

  UPDATE public.invoices SET status='paid', amount_paid=amount_due, paid_at=now()
    WHERE source_type='spacex_order' AND source_id=NEW.id AND status <> 'paid';

  INSERT INTO public.notifications(user_id,title,message,notification_type,category,metadata)
  VALUES (NEW.user_id,'SpaceX order filled','You '||NEW.side||' '||NEW.shares||' SPCX @ $'||NEW.price,'system','investment',jsonb_build_object('order_id',NEW.id));
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_apply_spacex_order ON public.spacex_orders;
CREATE TRIGGER trg_apply_spacex_order AFTER INSERT OR UPDATE OF status ON public.spacex_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_apply_spacex_order();

-- Update invoice creation triggers to set correct payment_method
CREATE OR REPLACE FUNCTION public.tg_create_tesla_invoice()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_status text;
BEGIN
  IF NEW.side <> 'buy' THEN RETURN NEW; END IF;
  v_status := CASE WHEN NEW.status = 'filled' THEN 'paid' ELSE 'awaiting_payment' END;
  INSERT INTO public.invoices (user_id, invoice_number, kind, source_type, source_id,
    title, description, amount_due, amount_paid, currency, payment_method, status, paid_at, metadata)
  VALUES (NEW.user_id, public.next_invoice_number('purchase'), 'purchase', 'tesla_order', NEW.id,
    'Tesla Stock Purchase', 'Buy ' || NEW.shares || ' ' || NEW.symbol || ' @ $' || NEW.price,
    NEW.amount, CASE WHEN v_status='paid' THEN NEW.amount ELSE 0 END, 'USD',
    COALESCE(NEW.payment_method,'wallet'), v_status,
    CASE WHEN v_status='paid' THEN now() ELSE NULL END,
    jsonb_build_object('shares',NEW.shares,'price',NEW.price,'symbol',NEW.symbol));
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.tg_create_spacex_invoice()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_status text;
BEGIN
  IF NEW.side <> 'buy' THEN RETURN NEW; END IF;
  v_status := CASE WHEN NEW.status = 'filled' THEN 'paid' ELSE 'awaiting_payment' END;
  INSERT INTO public.invoices (user_id, invoice_number, kind, source_type, source_id,
    title, description, amount_due, amount_paid, currency, payment_method, status, paid_at, metadata)
  VALUES (NEW.user_id, public.next_invoice_number('purchase'), 'purchase', 'spacex_order', NEW.id,
    'SpaceX Stock Purchase', 'Buy ' || NEW.shares || ' ' || NEW.symbol || ' @ $' || NEW.price,
    NEW.amount, CASE WHEN v_status='paid' THEN NEW.amount ELSE 0 END, 'USD',
    COALESCE(NEW.payment_method,'wallet'), v_status,
    CASE WHEN v_status='paid' THEN now() ELSE NULL END,
    jsonb_build_object('shares',NEW.shares,'price',NEW.price,'symbol',NEW.symbol));
  RETURN NEW;
END $function$;
