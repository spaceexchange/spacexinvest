
-- =================== ACHIEVEMENTS ===================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  points INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  tier TEXT NOT NULL DEFAULT 'bronze',
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated, anon;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach read all" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "ach admin write" ON public.achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER ach_updated BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress NUMERIC NOT NULL DEFAULT 100,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ua self read" ON public.user_achievements FOR SELECT USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
);
CREATE POLICY "ua admin write" ON public.user_achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;

-- =================== HELP ARTICLES ===================
CREATE TABLE IF NOT EXISTS public.help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  summary TEXT,
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.help_articles TO authenticated, anon;
GRANT ALL ON public.help_articles TO service_role;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help read pub" ON public.help_articles FOR SELECT USING (published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "help bump views" ON public.help_articles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "help admin all" ON public.help_articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER help_updated BEFORE UPDATE ON public.help_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS help_articles_search_idx ON public.help_articles USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(body,'')));

-- =================== AUTOMATION RUNS ===================
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar admin read" ON public.automation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE INDEX IF NOT EXISTS automation_runs_rule_idx ON public.automation_runs(rule_id, created_at DESC);

-- =================== HELPER: award_achievement ===================
CREATE OR REPLACE FUNCTION public.award_achievement(_user_id UUID, _code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ach RECORD;
  v_new BOOLEAN := false;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  SELECT id, title, points INTO v_ach FROM public.achievements WHERE code = _code AND active = true LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (_user_id, v_ach.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  GET DIAGNOSTICS v_new = ROW_COUNT;
  IF v_new THEN
    INSERT INTO public.notifications (user_id, title, message, notification_type, category, metadata)
      VALUES (_user_id, 'Achievement unlocked: ' || v_ach.title, 'You earned ' || v_ach.points || ' points.', 'system', 'achievement', jsonb_build_object('achievement_id', v_ach.id, 'code', _code));
    IF v_ach.points > 0 THEN
      INSERT INTO public.investor_points (user_id, points, lifetime_points)
        VALUES (_user_id, v_ach.points, v_ach.points)
        ON CONFLICT (user_id) DO UPDATE SET points = public.investor_points.points + EXCLUDED.points, lifetime_points = public.investor_points.lifetime_points + EXCLUDED.points;
      INSERT INTO public.reward_transactions (user_id, points, reason, metadata)
        VALUES (_user_id, v_ach.points, 'achievement:' || _code, jsonb_build_object('achievement_id', v_ach.id));
    END IF;
  END IF;
  RETURN v_new;
END; $$;

-- =================== EVENT TRIGGERS ===================
-- Investment created → first_investment + count-based tiers
CREATE OR REPLACE FUNCTION public.tg_award_investment_achievements()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER; v_total NUMERIC;
BEGIN
  PERFORM public.award_achievement(NEW.user_id, 'first_investment');
  SELECT COUNT(*), COALESCE(SUM(amount),0) INTO v_count, v_total FROM public.investments WHERE user_id = NEW.user_id;
  IF v_count >= 5  THEN PERFORM public.award_achievement(NEW.user_id, 'investor_level_1'); END IF;
  IF v_count >= 10 THEN PERFORM public.award_achievement(NEW.user_id, 'investor_level_2'); END IF;
  IF v_count >= 25 THEN PERFORM public.award_achievement(NEW.user_id, 'investor_level_3'); END IF;
  IF v_total >= 10000  THEN PERFORM public.award_achievement(NEW.user_id, 'portfolio_10k'); END IF;
  IF v_total >= 100000 THEN PERFORM public.award_achievement(NEW.user_id, 'portfolio_100k'); END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS tg_inv_ach ON public.investments;
CREATE TRIGGER tg_inv_ach AFTER INSERT ON public.investments FOR EACH ROW EXECUTE FUNCTION public.tg_award_investment_achievements();

-- KYC approved
CREATE OR REPLACE FUNCTION public.tg_award_kyc_achievements()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    PERFORM public.award_achievement(NEW.user_id, 'kyc_verified');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS tg_kyc_ach ON public.kyc_submissions;
CREATE TRIGGER tg_kyc_ach AFTER UPDATE ON public.kyc_submissions FOR EACH ROW EXECUTE FUNCTION public.tg_award_kyc_achievements();

-- Referral activity → referrer milestones
CREATE OR REPLACE FUNCTION public.tg_award_referral_achievements()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  PERFORM public.award_achievement(NEW.referrer_id, 'first_referral');
  SELECT COUNT(*) INTO v_count FROM public.referrals WHERE referrer_id = NEW.referrer_id;
  IF v_count >= 5  THEN PERFORM public.award_achievement(NEW.referrer_id, 'referral_5'); END IF;
  IF v_count >= 25 THEN PERFORM public.award_achievement(NEW.referrer_id, 'referral_master'); END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS tg_ref_ach ON public.referrals;
CREATE TRIGGER tg_ref_ach AFTER INSERT ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.tg_award_referral_achievements();

-- New profile → early_adopter (if among first 1000)
CREATE OR REPLACE FUNCTION public.tg_award_signup_achievements()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.profiles;
  IF v_count <= 1000 THEN PERFORM public.award_achievement(NEW.id, 'early_adopter'); END IF;
  PERFORM public.award_achievement(NEW.id, 'welcome');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS tg_signup_ach ON public.profiles;
CREATE TRIGGER tg_signup_ach AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_award_signup_achievements();

-- =================== SEED ACHIEVEMENTS ===================
INSERT INTO public.achievements (code, title, description, category, points, tier, icon) VALUES
  ('welcome','Welcome aboard','Joined the Orbit Investments platform','onboarding',10,'bronze','sparkles'),
  ('early_adopter','Early Adopter','One of the first 1,000 investors','onboarding',100,'gold','rocket'),
  ('kyc_verified','Identity Verified','Completed KYC verification','compliance',50,'silver','shield-check'),
  ('first_investment','First Investment','Made your first investment','investing',25,'bronze','trending-up'),
  ('investor_level_1','Investor Level 1','Made 5 investments','investing',100,'silver','star'),
  ('investor_level_2','Investor Level 2','Made 10 investments','investing',250,'gold','star'),
  ('investor_level_3','Investor Level 3','Made 25 investments','investing',500,'platinum','crown'),
  ('portfolio_10k','Portfolio $10k','Reached $10,000 in investments','investing',150,'silver','wallet'),
  ('portfolio_100k','Portfolio $100k','Reached $100,000 in investments','investing',1000,'platinum','wallet'),
  ('first_referral','First Referral','Referred your first investor','referral',50,'bronze','users'),
  ('referral_5','5 Referrals','Brought in 5 investors','referral',150,'silver','users'),
  ('referral_master','Referral Master','Brought in 25 investors','referral',1000,'gold','crown')
ON CONFLICT (code) DO NOTHING;

-- =================== SEED HELP ARTICLES ===================
INSERT INTO public.help_articles (slug, title, category, summary, body, tags) VALUES
  ('getting-started','Getting started on Orbit Investments','Onboarding','Create your account, verify identity, and fund your wallet to start investing.','# Getting started\n\n1. Create your account\n2. Verify your identity (KYC)\n3. Fund your wallet via bank transfer or crypto\n4. Browse opportunities and place your first investment\n\nYour funds are held in segregated wallets and you can withdraw at any time subject to compliance review.', ARRAY['signup','onboarding','start']),
  ('how-kyc-works','How KYC verification works','Compliance','Why we ask for ID, what documents are accepted, and how long approval takes.','# KYC verification\n\nWe verify identity to comply with global AML/KYC regulations.\n\n**Accepted documents:** Passport, national ID, driver license, plus a proof of address (utility bill or bank statement under 3 months old).\n\n**Timeline:** Most submissions are reviewed within 24 hours. You will be notified by email and in-app when status changes.',ARRAY['kyc','compliance','verification']),
  ('funding-deposits','Depositing funds','Funding','Bank transfer and crypto deposit options.','# Deposits\n\nWe support **bank transfer (SWIFT/SEPA/ACH)** and **crypto (BTC, ETH, USDT, USDC)**. Deposits are reflected in your wallet once on-chain confirmations or bank settlement complete.',ARRAY['funding','deposits','wallet']),
  ('funding-withdrawals','Withdrawing funds','Funding','How to request a withdrawal and processing times.','# Withdrawals\n\nWithdrawals are processed within 1-3 business days after compliance review. You can withdraw to any bank account in your name or to a verified crypto wallet.',ARRAY['funding','withdrawal']),
  ('investment-process','How investing works','Investing','Browse opportunities, allocate, sign, and track returns.','# Investment process\n\n1. Browse the **Opportunities** page\n2. Open an opportunity and review terms, documents and risks\n3. Click **Invest** and choose your amount\n4. Funds are reserved from your wallet and the investment appears in your Portfolio\n5. Returns and statements appear on your dashboard',ARRAY['investing','portfolio']),
  ('referrals-program','Referral program','Rewards','Earn commission when friends invest through your link.','# Referrals\n\nShare your referral link from the **Referrals** page. When someone signs up and makes a qualifying investment you earn commission credited to your wallet.',ARRAY['referral','rewards']),
  ('rewards-tiers','Reward tiers explained','Rewards','How points and tiers work.','# Reward tiers\n\nEarn points for investments, referrals, and achievements. Points unlock tiers (Bronze → Diamond) with increasing benefits.',ARRAY['rewards','points','tiers']),
  ('account-security','Securing your account','Security','Enable 2FA, manage devices, and recover access.','# Account security\n\nEnable two-factor authentication and review trusted devices regularly on the **Security** page.',ARRAY['security','2fa','password']),
  ('tax-statements','Tax statements','Documents','Where to download year-end tax documents.','# Tax statements\n\nYear-end statements are available in the **Document Vault** in January. Consult a qualified tax advisor for your jurisdiction.',ARRAY['tax','statements','documents']),
  ('contact-support','Contact support','Support','How to open a support ticket.','# Contact support\n\nOpen a ticket from the **Support** page or click *Open a ticket* below any help article. Average first response is under 4 hours during business days.',ARRAY['support','help','ticket'])
ON CONFLICT (slug) DO NOTHING;
