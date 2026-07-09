
-- ============ SPACEX STOCK ============
CREATE TABLE public.spacex_quotes (
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
GRANT SELECT ON public.spacex_quotes TO anon, authenticated;
GRANT ALL ON public.spacex_quotes TO service_role;
ALTER TABLE public.spacex_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spx_quotes_read_all" ON public.spacex_quotes FOR SELECT USING (true);
CREATE POLICY "spx_quotes_admin" ON public.spacex_quotes FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.spacex_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL DEFAULT 'SPCX',
  shares numeric(18,6) NOT NULL DEFAULT 0,
  average_cost numeric(18,4) NOT NULL DEFAULT 0,
  total_invested numeric(18,2) NOT NULL DEFAULT 0,
  realized_pl numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spacex_holdings TO authenticated;
GRANT ALL ON public.spacex_holdings TO service_role;
ALTER TABLE public.spacex_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spx_hold_own_read" ON public.spacex_holdings FOR SELECT USING (auth.uid()=user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));
CREATE POLICY "spx_hold_admin_write" ON public.spacex_holdings FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_spx_hold_upd BEFORE UPDATE ON public.spacex_holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.spacex_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL DEFAULT 'SPCX',
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spacex_orders TO authenticated;
GRANT ALL ON public.spacex_orders TO service_role;
ALTER TABLE public.spacex_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spx_orders_own_read" ON public.spacex_orders FOR SELECT USING (auth.uid()=user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));
CREATE POLICY "spx_orders_own_insert" ON public.spacex_orders FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "spx_orders_admin_update" ON public.spacex_orders FOR UPDATE USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_spx_orders_upd BEFORE UPDATE ON public.spacex_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.tg_apply_spacex_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_h RECORD; v_wallet RECORD; v_new_shares numeric; v_new_invested numeric; v_new_avg numeric;
BEGIN
  IF NEW.status <> 'filled' THEN RETURN NEW; END IF;
  IF NEW.side = 'buy' THEN
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
  INSERT INTO public.notifications(user_id,title,message,notification_type,category,metadata)
  VALUES (NEW.user_id,'SpaceX order filled','You '||NEW.side||' '||NEW.shares||' SPCX @ $'||NEW.price,'system','investment',jsonb_build_object('order_id',NEW.id));
  RETURN NEW;
END $$;
CREATE TRIGGER trg_apply_spacex_order AFTER INSERT ON public.spacex_orders FOR EACH ROW EXECUTE FUNCTION public.tg_apply_spacex_order();

INSERT INTO public.spacex_quotes(symbol,company_name,price,previous_close,day_high,day_low,week52_high,week52_low,market_cap)
VALUES ('SPCX','SpaceX Pre-IPO Shares',185.00,182.40,187.20,181.10,210.00,98.50,350000000000);

-- ============ TESLA VEHICLE MARKETPLACE ============
CREATE TABLE public.tesla_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  model text NOT NULL,
  tagline text,
  description text,
  base_price numeric(12,2) NOT NULL,
  range_miles integer,
  top_speed_mph integer,
  acceleration_sec numeric(4,2),
  battery_kwh integer,
  hero_image text,
  gallery jsonb NOT NULL DEFAULT '[]',
  colors jsonb NOT NULL DEFAULT '[]',
  wheels jsonb NOT NULL DEFAULT '[]',
  interiors jsonb NOT NULL DEFAULT '[]',
  battery_options jsonb NOT NULL DEFAULT '[]',
  performance_options jsonb NOT NULL DEFAULT '[]',
  features jsonb NOT NULL DEFAULT '[]',
  delivery_estimate text,
  inventory integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tesla_vehicles TO anon, authenticated;
GRANT ALL ON public.tesla_vehicles TO service_role;
ALTER TABLE public.tesla_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_read_all" ON public.tesla_vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_admin" ON public.tesla_vehicles FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_vehicles_upd BEFORE UPDATE ON public.tesla_vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tesla_vehicle_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.tesla_vehicles(id),
  order_type text NOT NULL CHECK (order_type IN ('reservation','purchase')),
  configuration jsonb NOT NULL DEFAULT '{}',
  base_price numeric(12,2) NOT NULL,
  options_total numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL,
  deposit_amount numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'wallet',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','delivery_preparation','delivery_scheduled','delivered','cancelled','refunded')),
  delivery_address text,
  delivery_date date,
  tracking_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tesla_vehicle_orders TO authenticated;
GRANT ALL ON public.tesla_vehicle_orders TO service_role;
ALTER TABLE public.tesla_vehicle_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "veh_orders_own_read" ON public.tesla_vehicle_orders FOR SELECT USING (auth.uid()=user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));
CREATE POLICY "veh_orders_own_insert" ON public.tesla_vehicle_orders FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "veh_orders_admin_update" ON public.tesla_vehicle_orders FOR UPDATE USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_veh_orders_upd BEFORE UPDATE ON public.tesla_vehicle_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.tg_apply_vehicle_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_wallet RECORD; v_charge numeric;
BEGIN
  v_charge := CASE WHEN NEW.order_type='reservation' THEN NEW.deposit_amount ELSE NEW.total_price END;
  IF NEW.payment_method='wallet' AND v_charge > 0 THEN
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id=NEW.user_id AND currency='USD' FOR UPDATE;
    IF v_wallet.id IS NULL THEN RAISE EXCEPTION 'wallet missing'; END IF;
    IF v_wallet.balance < v_charge THEN RAISE EXCEPTION 'insufficient funds'; END IF;
    UPDATE public.wallets SET balance=balance-v_charge WHERE id=v_wallet.id;
    INSERT INTO public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,reference,description)
    VALUES (v_wallet.id,'debit',v_charge,v_wallet.balance,v_wallet.balance-v_charge,'vehicle:'||NEW.id::text,
      CASE WHEN NEW.order_type='reservation' THEN 'Tesla vehicle reservation deposit' ELSE 'Tesla vehicle purchase' END);
    NEW.amount_paid := v_charge;
    NEW.status := 'confirmed';
  END IF;
  INSERT INTO public.notifications(user_id,title,message,notification_type,category,metadata)
  VALUES (NEW.user_id,
    CASE WHEN NEW.order_type='reservation' THEN 'Tesla reservation confirmed' ELSE 'Tesla order confirmed' END,
    'Your Tesla vehicle order is being processed.','system','order',jsonb_build_object('order_id',NEW.id));
  RETURN NEW;
END $$;
CREATE TRIGGER trg_apply_vehicle_order BEFORE INSERT ON public.tesla_vehicle_orders FOR EACH ROW EXECUTE FUNCTION public.tg_apply_vehicle_order();

-- Seed vehicles
INSERT INTO public.tesla_vehicles(slug,model,tagline,description,base_price,range_miles,top_speed_mph,acceleration_sec,battery_kwh,delivery_estimate,inventory,display_order,
  colors,wheels,interiors,battery_options,performance_options,features) VALUES
('model-s','Model S','Plaid performance, executive comfort','The pinnacle of electric performance with up to 405 miles of range.',79990,405,200,1.99,100,'4-6 weeks',12,1,
 '[{"name":"Pearl White","hex":"#f5f5f5","price":0},{"name":"Solid Black","hex":"#0a0a0a","price":1500},{"name":"Midnight Silver","hex":"#42474c","price":1500},{"name":"Deep Blue","hex":"#0c2340","price":1500},{"name":"Ultra Red","hex":"#a4111d","price":3000}]'::jsonb,
 '[{"name":"19\" Tempest","price":0},{"name":"21\" Arachnid","price":4500}]'::jsonb,
 '[{"name":"All Black","price":0},{"name":"Black & White","price":2000},{"name":"Cream","price":2000}]'::jsonb,
 '[{"name":"Long Range","price":0},{"name":"Plaid","price":15000}]'::jsonb,
 '[{"name":"Standard Autopilot","price":0},{"name":"Enhanced Autopilot","price":6000},{"name":"Full Self-Driving","price":12000}]'::jsonb,
 '["17\" cinematic display","22-speaker audio","Tri-zone climate","Glass roof","Heated & ventilated seats"]'::jsonb),
('model-3','Model 3','Iconic sedan, redefined','Award-winning safety and performance in our most accessible sedan.',38990,341,162,3.1,75,'2-4 weeks',45,2,
 '[{"name":"Stealth Grey","hex":"#6d6d6d","price":0},{"name":"Pearl White","hex":"#f5f5f5","price":1000},{"name":"Solid Black","hex":"#0a0a0a","price":1000},{"name":"Deep Blue","hex":"#0c2340","price":1500},{"name":"Ultra Red","hex":"#a4111d","price":2000}]'::jsonb,
 '[{"name":"18\" Photon","price":0},{"name":"19\" Nova","price":1500}]'::jsonb,
 '[{"name":"All Black","price":0},{"name":"Black & White","price":1500}]'::jsonb,
 '[{"name":"Rear-Wheel Drive","price":0},{"name":"Long Range AWD","price":7000},{"name":"Performance","price":15000}]'::jsonb,
 '[{"name":"Standard Autopilot","price":0},{"name":"Enhanced Autopilot","price":6000},{"name":"Full Self-Driving","price":12000}]'::jsonb,
 '["15\" center display","Premium audio","Glass roof","Heated seats","Wireless charging"]'::jsonb),
('model-x','Model X','Falcon Wing freedom','Seven-seat SUV with ludicrous acceleration and unmatched utility.',89990,348,163,2.5,100,'6-8 weeks',8,3,
 '[{"name":"Pearl White","hex":"#f5f5f5","price":0},{"name":"Solid Black","hex":"#0a0a0a","price":1500},{"name":"Midnight Silver","hex":"#42474c","price":1500},{"name":"Deep Blue","hex":"#0c2340","price":1500},{"name":"Ultra Red","hex":"#a4111d","price":3000}]'::jsonb,
 '[{"name":"20\" Cyberstream","price":0},{"name":"22\" Turbine","price":5500}]'::jsonb,
 '[{"name":"All Black","price":0},{"name":"Black & White","price":2000},{"name":"Cream","price":2000}]'::jsonb,
 '[{"name":"Long Range","price":0},{"name":"Plaid","price":20000}]'::jsonb,
 '[{"name":"Standard Autopilot","price":0},{"name":"Enhanced Autopilot","price":6000},{"name":"Full Self-Driving","price":12000}]'::jsonb,
 '["Falcon Wing doors","7-seat configuration","Tri-zone climate","HEPA filtration","Tow capacity 5,000 lbs"]'::jsonb),
('model-y','Model Y','Versatile electric SUV','Spacious, capable, and efficient — the world''s best-selling electric vehicle.',44990,330,155,3.5,80,'3-5 weeks',62,4,
 '[{"name":"Stealth Grey","hex":"#6d6d6d","price":0},{"name":"Pearl White","hex":"#f5f5f5","price":1000},{"name":"Solid Black","hex":"#0a0a0a","price":1000},{"name":"Deep Blue","hex":"#0c2340","price":1500},{"name":"Ultra Red","hex":"#a4111d","price":2000}]'::jsonb,
 '[{"name":"19\" Gemini","price":0},{"name":"20\" Induction","price":2000}]'::jsonb,
 '[{"name":"All Black","price":0},{"name":"Black & White","price":1500}]'::jsonb,
 '[{"name":"Long Range AWD","price":0},{"name":"Performance","price":7000}]'::jsonb,
 '[{"name":"Standard Autopilot","price":0},{"name":"Enhanced Autopilot","price":6000},{"name":"Full Self-Driving","price":12000}]'::jsonb,
 '["7-seat option","Panoramic glass roof","Hands-free trunk","Heated steering wheel","Premium audio"]'::jsonb),
('cybertruck','Cybertruck','Built for any planet','Stainless steel exoskeleton, bulletproof glass, 11,000 lbs towing capacity.',79990,340,130,2.6,123,'8-12 weeks',5,5,
 '[{"name":"Stainless Steel","hex":"#c0c0c0","price":0},{"name":"Wrapped Black","hex":"#0a0a0a","price":6500},{"name":"Wrapped White","hex":"#f5f5f5","price":6500}]'::jsonb,
 '[{"name":"20\" All-Terrain","price":0},{"name":"35\" Off-Road","price":3500}]'::jsonb,
 '[{"name":"All Black","price":0},{"name":"Tactical Gray","price":2000}]'::jsonb,
 '[{"name":"All-Wheel Drive","price":0},{"name":"Cyberbeast Tri-Motor","price":20000}]'::jsonb,
 '[{"name":"Standard Autopilot","price":0},{"name":"Full Self-Driving","price":12000}]'::jsonb,
 '["Stainless exoskeleton","Adaptive air suspension","6,000+ lbs payload","Tonneau cover","Onboard power outlets"]'::jsonb);
