
-- Tesla Stock Center
CREATE TABLE IF NOT EXISTS public.tesla_quotes (
  symbol text PRIMARY KEY,
  company_name text NOT NULL,
  price numeric(18,4) NOT NULL,
  previous_close numeric(18,4),
  day_high numeric(18,4),
  day_low numeric(18,4),
  week52_high numeric(18,4),
  week52_low numeric(18,4),
  market_cap numeric(22,2),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tesla_quotes TO authenticated, anon;
GRANT ALL ON public.tesla_quotes TO service_role;
ALTER TABLE public.tesla_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_read_all" ON public.tesla_quotes FOR SELECT USING (true);
CREATE POLICY "quotes_admin_manage" ON public.tesla_quotes FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.tesla_quotes (symbol, company_name, price, previous_close, day_high, day_low, week52_high, week52_low, market_cap)
VALUES ('TSLA','Tesla, Inc.',284.10,277.36,286.50,275.20,299.29,138.80,904000000000)
ON CONFLICT (symbol) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tesla_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL DEFAULT 'TSLA',
  side text NOT NULL DEFAULT 'buy' CHECK (side IN ('buy','sell')),
  shares numeric(18,6) NOT NULL CHECK (shares > 0),
  price numeric(18,4) NOT NULL CHECK (price > 0),
  amount numeric(18,2) NOT NULL,
  status text NOT NULL DEFAULT 'filled' CHECK (status IN ('pending','filled','rejected','cancelled')),
  fee numeric(18,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tesla_orders TO authenticated;
GRANT ALL ON public.tesla_orders TO service_role;
ALTER TABLE public.tesla_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tesla_orders_own_read" ON public.tesla_orders FOR SELECT
  USING (auth.uid()=user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));
CREATE POLICY "tesla_orders_own_insert" ON public.tesla_orders FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "tesla_orders_admin_update" ON public.tesla_orders FOR UPDATE USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_tesla_orders_upd BEFORE UPDATE ON public.tesla_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.tesla_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL DEFAULT 'TSLA',
  shares numeric(18,6) NOT NULL DEFAULT 0,
  average_cost numeric(18,4) NOT NULL DEFAULT 0,
  total_invested numeric(18,2) NOT NULL DEFAULT 0,
  realized_pl numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);
GRANT SELECT, INSERT, UPDATE ON public.tesla_holdings TO authenticated;
GRANT ALL ON public.tesla_holdings TO service_role;
ALTER TABLE public.tesla_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tesla_hold_own_read" ON public.tesla_holdings FOR SELECT
  USING (auth.uid()=user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));
CREATE POLICY "tesla_hold_admin_write" ON public.tesla_holdings FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_tesla_hold_upd BEFORE UPDATE ON public.tesla_holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  company_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);
GRANT SELECT, INSERT, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist_own" ON public.watchlist FOR ALL
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Tesla buy trigger: applies order to holdings, debits wallet
CREATE OR REPLACE FUNCTION public.tg_apply_tesla_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_h RECORD;
  v_wallet RECORD;
  v_new_shares numeric;
  v_new_invested numeric;
  v_new_avg numeric;
BEGIN
  IF NEW.status <> 'filled' THEN RETURN NEW; END IF;

  -- Debit wallet (buy)
  IF NEW.side = 'buy' THEN
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = NEW.user_id AND currency='USD' FOR UPDATE;
    IF v_wallet.id IS NULL THEN RAISE EXCEPTION 'wallet missing'; END IF;
    IF v_wallet.balance < NEW.amount THEN RAISE EXCEPTION 'insufficient funds'; END IF;
    UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = v_wallet.id;
    INSERT INTO public.wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference, description)
    VALUES (v_wallet.id,'debit',NEW.amount,v_wallet.balance,v_wallet.balance-NEW.amount,'tesla:'||NEW.id::text,'Tesla stock purchase');
  END IF;

  -- Upsert holdings
  SELECT * INTO v_h FROM public.tesla_holdings WHERE user_id=NEW.user_id AND symbol=NEW.symbol FOR UPDATE;
  IF v_h.id IS NULL THEN
    INSERT INTO public.tesla_holdings (user_id, symbol, shares, average_cost, total_invested)
    VALUES (NEW.user_id, NEW.symbol, NEW.shares, NEW.price, NEW.amount);
  ELSE
    IF NEW.side = 'buy' THEN
      v_new_shares := v_h.shares + NEW.shares;
      v_new_invested := v_h.total_invested + NEW.amount;
      v_new_avg := CASE WHEN v_new_shares > 0 THEN v_new_invested / v_new_shares ELSE 0 END;
      UPDATE public.tesla_holdings SET shares=v_new_shares, total_invested=v_new_invested, average_cost=v_new_avg WHERE id=v_h.id;
    ELSE
      v_new_shares := v_h.shares - NEW.shares;
      UPDATE public.tesla_holdings SET shares=v_new_shares,
        realized_pl = realized_pl + (NEW.price - v_h.average_cost) * NEW.shares,
        total_invested = GREATEST(0, v_h.total_invested - v_h.average_cost * NEW.shares)
        WHERE id=v_h.id;
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, notification_type, category, metadata)
  VALUES (NEW.user_id, 'Tesla order filled',
    'You ' || NEW.side || ' ' || NEW.shares || ' TSLA @ $' || NEW.price,
    'system', 'investment', jsonb_build_object('order_id',NEW.id));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_apply_tesla_order ON public.tesla_orders;
CREATE TRIGGER trg_apply_tesla_order AFTER INSERT ON public.tesla_orders FOR EACH ROW EXECUTE FUNCTION public.tg_apply_tesla_order();

-- Commission rules for affiliate
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('signup','kyc','first_investment','recurring','tesla_purchase')),
  level smallint NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  percentage numeric(6,3) NOT NULL DEFAULT 0,
  fixed_amount numeric(18,2) NOT NULL DEFAULT 0,
  minimum_amount numeric(18,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commission_rules TO authenticated;
GRANT ALL ON public.commission_rules TO service_role;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules_read" ON public.commission_rules FOR SELECT USING (true);
CREATE POLICY "rules_admin" ON public.commission_rules FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rules_upd BEFORE UPDATE ON public.commission_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.commission_rules (name, event_type, level, percentage, fixed_amount) VALUES
  ('L1 Signup','signup',1,0,10),
  ('L1 KYC bonus','kyc',1,0,15),
  ('L1 First Investment','first_investment',1,5,0),
  ('L2 Indirect Investment','first_investment',2,2,0),
  ('L3 Network Investment','first_investment',3,1,0),
  ('L1 Recurring Investment','recurring',1,2,0),
  ('L1 Tesla Purchase','tesla_purchase',1,1,0)
ON CONFLICT DO NOTHING;

-- Commission ledger (separate from existing referral_rewards which is constrained)
CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  level smallint NOT NULL DEFAULT 1,
  amount numeric(18,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissions_own" ON public.commissions FOR SELECT
  USING (auth.uid()=beneficiary_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));
CREATE POLICY "commissions_admin" ON public.commissions FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_comm_upd BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function: award multi-level commissions
CREATE OR REPLACE FUNCTION public.award_commissions(_user_id uuid, _event text, _base_amount numeric, _ref text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_current uuid := _user_id;
  v_parent uuid;
  v_level smallint := 1;
  v_rule RECORD;
  v_amount numeric;
BEGIN
  WHILE v_level <= 3 LOOP
    SELECT referred_by INTO v_parent FROM public.profiles WHERE id = v_current;
    EXIT WHEN v_parent IS NULL;
    FOR v_rule IN
      SELECT * FROM public.commission_rules
      WHERE event_type = _event AND level = v_level AND active = true
    LOOP
      v_amount := v_rule.fixed_amount + COALESCE(_base_amount,0) * (v_rule.percentage/100);
      IF v_amount > 0 AND COALESCE(_base_amount,0) >= v_rule.minimum_amount THEN
        INSERT INTO public.commissions (beneficiary_id, source_user_id, rule_id, event_type, level, amount, reference, metadata)
        VALUES (v_parent, _user_id, v_rule.id, _event, v_level, v_amount, _ref,
          jsonb_build_object('base',_base_amount));
        INSERT INTO public.notifications (user_id, title, message, notification_type, category, metadata)
        VALUES (v_parent, 'Commission earned',
          'You earned $' || v_amount::text || ' (' || _event || ' L' || v_level || ')',
          'system','rewards', jsonb_build_object('amount',v_amount,'event',_event));
      END IF;
    END LOOP;
    v_current := v_parent;
    v_level := v_level + 1;
  END LOOP;
END $$;

-- Hook into investments
CREATE OR REPLACE FUNCTION public.tg_award_investment_commissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.investments WHERE user_id = NEW.user_id;
  IF v_count = 1 THEN
    PERFORM public.award_commissions(NEW.user_id,'first_investment',NEW.amount,'inv:'||NEW.id::text);
  ELSE
    PERFORM public.award_commissions(NEW.user_id,'recurring',NEW.amount,'inv:'||NEW.id::text);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_inv_commissions ON public.investments;
CREATE TRIGGER trg_inv_commissions AFTER INSERT ON public.investments FOR EACH ROW EXECUTE FUNCTION public.tg_award_investment_commissions();

-- Hook into signup
CREATE OR REPLACE FUNCTION public.tg_award_signup_commissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.award_commissions(NEW.id,'signup',0,'signup:'||NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_signup_commissions ON public.profiles;
CREATE TRIGGER trg_signup_commissions AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_award_signup_commissions();

-- Hook into KYC approval
CREATE OR REPLACE FUNCTION public.tg_award_kyc_commissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    PERFORM public.award_commissions(NEW.user_id,'kyc',0,'kyc:'||NEW.id::text);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_kyc_commissions ON public.kyc_submissions;
CREATE TRIGGER trg_kyc_commissions AFTER UPDATE ON public.kyc_submissions FOR EACH ROW EXECUTE FUNCTION public.tg_award_kyc_commissions();

-- Hook into tesla orders
CREATE OR REPLACE FUNCTION public.tg_award_tesla_commissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='filled' AND NEW.side='buy' THEN
    PERFORM public.award_commissions(NEW.user_id,'tesla_purchase',NEW.amount,'tesla:'||NEW.id::text);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_tesla_commissions ON public.tesla_orders;
CREATE TRIGGER trg_tesla_commissions AFTER INSERT ON public.tesla_orders FOR EACH ROW EXECUTE FUNCTION public.tg_award_tesla_commissions();

-- Approve commission -> credit wallet
CREATE OR REPLACE FUNCTION public.pay_commission(_commission_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_c RECORD; v_w RECORD;
BEGIN
  SELECT * INTO v_c FROM public.commissions WHERE id=_commission_id FOR UPDATE;
  IF v_c.id IS NULL OR v_c.status='paid' THEN RETURN; END IF;
  SELECT * INTO v_w FROM public.wallets WHERE user_id=v_c.beneficiary_id AND currency=v_c.currency FOR UPDATE;
  IF v_w.id IS NULL THEN
    INSERT INTO public.wallets(user_id,balance,currency,status) VALUES (v_c.beneficiary_id,0,v_c.currency,'active') RETURNING * INTO v_w;
  END IF;
  UPDATE public.wallets SET balance = balance + v_c.amount WHERE id=v_w.id;
  INSERT INTO public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,reference,description)
  VALUES (v_w.id,'credit',v_c.amount,v_w.balance,v_w.balance+v_c.amount,'commission:'||v_c.id::text,'Affiliate commission payout');
  UPDATE public.commissions SET status='paid' WHERE id=v_c.id;
END $$;
