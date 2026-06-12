
-- Referral rewards (commissions earned per referral event)
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup','kyc','first_investment','recurring')),
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rewards" ON public.referral_rewards FOR SELECT USING (auth.uid()=referrer_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage rewards" ON public.referral_rewards FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_referral_rewards_updated BEFORE UPDATE ON public.referral_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Referral link clicks
CREATE TABLE public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referer TEXT,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.referral_clicks TO authenticated;
GRANT SELECT, INSERT ON public.referral_clicks TO anon;
GRANT ALL ON public.referral_clicks TO service_role;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log clicks" ON public.referral_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "own clicks read" ON public.referral_clicks FOR SELECT USING (auth.uid()=referrer_id OR public.has_role(auth.uid(),'admin'));

-- Affiliate payouts
CREATE TABLE public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL DEFAULT 'wallet',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payouts" ON public.affiliate_payouts FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "request payouts" ON public.affiliate_payouts FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "admin manage payouts" ON public.affiliate_payouts FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_aff_payouts_updated BEFORE UPDATE ON public.affiliate_payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reward levels
CREATE TABLE public.reward_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tier INT NOT NULL UNIQUE,
  min_points INT NOT NULL DEFAULT 0,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reward_levels TO authenticated, anon;
GRANT ALL ON public.reward_levels TO service_role;
ALTER TABLE public.reward_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view levels" ON public.reward_levels FOR SELECT USING (true);
CREATE POLICY "admin levels" ON public.reward_levels FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.reward_levels (name, tier, min_points, benefits, color) VALUES
('Bronze',1,0,'["Standard support"]'::jsonb,'#cd7f32'),
('Silver',2,500,'["Priority support","Reduced fees 5%"]'::jsonb,'#c0c0c0'),
('Gold',3,2500,'["Priority support","Reduced fees 10%","Early opportunities"]'::jsonb,'#ffd700'),
('Platinum',4,10000,'["Dedicated manager","Reduced fees 20%","Exclusive deals"]'::jsonb,'#e5e4e2'),
('Diamond',5,50000,'["Concierge","Zero fees","Private opportunities","Bonus rewards"]'::jsonb,'#b9f2ff');

-- Investor points (current totals)
CREATE TABLE public.investor_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  lifetime_points INT NOT NULL DEFAULT 0,
  level_tier INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investor_points TO authenticated;
GRANT ALL ON public.investor_points TO service_role;
ALTER TABLE public.investor_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own points" ON public.investor_points FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage points" ON public.investor_points FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_inv_points_updated BEFORE UPDATE ON public.investor_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reward transactions (point ledger)
CREATE TABLE public.reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reward_transactions TO authenticated;
GRANT ALL ON public.reward_transactions TO service_role;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reward tx" ON public.reward_transactions FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write reward tx" ON public.reward_transactions FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));

-- KYC documents (extends existing kyc_submissions with per-document upload tracking)
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.kyc_submissions(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('passport','drivers_license','national_id','selfie','proof_of_address')),
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_documents TO authenticated;
GRANT ALL ON public.kyc_documents TO service_role;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kyc docs" ON public.kyc_documents FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'compliance'));
CREATE POLICY "upload own kyc" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "admin review kyc" ON public.kyc_documents FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'compliance'));
CREATE TRIGGER trg_kyc_docs_updated BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
