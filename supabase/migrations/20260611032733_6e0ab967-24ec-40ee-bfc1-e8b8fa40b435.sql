
-- Extend role enum (added but not referenced in this migration to avoid same-tx enum usage)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';

-- Helper: shared updated_at trigger already exists as public.update_updated_at_column()

-- ============ INVESTMENT OPPORTUNITIES ============
CREATE TABLE public.investment_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'equity',
  description TEXT,
  investment_type TEXT NOT NULL DEFAULT 'shares',
  minimum_investment NUMERIC(18,2) NOT NULL DEFAULT 0,
  maximum_investment NUMERIC(18,2),
  target_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  raised_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  available_shares NUMERIC(18,4) NOT NULL DEFAULT 0,
  price_per_share NUMERIC(18,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|open|closed|funded|archived
  open_date TIMESTAMPTZ,
  close_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.investment_opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.investment_opportunities TO authenticated;
GRANT ALL ON public.investment_opportunities TO service_role;
ALTER TABLE public.investment_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opps readable to all when open" ON public.investment_opportunities FOR SELECT USING (status IN ('open','funded','closed') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "admin manage opps" ON public.investment_opportunities FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_opps_updated BEFORE UPDATE ON public.investment_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVESTMENTS ============
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.investment_opportunities(id) ON DELETE RESTRICT,
  amount NUMERIC(18,2) NOT NULL,
  shares NUMERIC(18,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|active|cancelled|completed
  approval_status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investor own investments" ON public.investments FOR SELECT USING (investor_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'));
CREATE POLICY "investor create investment" ON public.investments FOR INSERT WITH CHECK (investor_id = auth.uid());
CREATE POLICY "admin update investment" ON public.investments FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVESTMENT ALLOCATIONS ============
CREATE TABLE public.investment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  allocated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  allocation_notes TEXT,
  allocation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.investment_allocations TO authenticated;
GRANT ALL ON public.investment_allocations TO service_role;
ALTER TABLE public.investment_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alloc read own/admin" ON public.investment_allocations FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.investments i WHERE i.id = investment_id AND (i.investor_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')))
);
CREATE POLICY "alloc admin write" ON public.investment_allocations FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ WALLETS ============
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active', -- active|frozen|closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet self/admin read" ON public.wallets FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'));
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ WALLET TRANSACTIONS ============
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- deposit|withdrawal|investment|dividend|adjustment|fee
  amount NUMERIC(18,2) NOT NULL,
  balance_before NUMERIC(18,2) NOT NULL,
  balance_after NUMERIC(18,2) NOT NULL,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wtx read own/admin" ON public.wallet_transactions FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND (w.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support')))
);

-- ============ LEDGER ============
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit NUMERIC(18,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger read own/admin" ON public.ledger_entries FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ FUNDING REQUESTS ============
CREATE TABLE public.funding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- deposit|withdrawal
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL, -- wire|card|crypto|ach
  status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|cancelled
  proof_url TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.funding_requests TO authenticated;
GRANT ALL ON public.funding_requests TO service_role;
ALTER TABLE public.funding_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fund read own/admin" ON public.funding_requests FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'));
CREATE POLICY "fund self create" ON public.funding_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fund self cancel" ON public.funding_requests FOR UPDATE USING (user_id = auth.uid() AND status = 'pending') WITH CHECK (user_id = auth.uid());
CREATE POLICY "fund admin update" ON public.funding_requests FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_fund_updated BEFORE UPDATE ON public.funding_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ KYC SUBMISSIONS ============
CREATE TABLE public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|info_requested
  first_name TEXT,
  last_name TEXT,
  nationality TEXT,
  address TEXT,
  date_of_birth DATE,
  document_type TEXT,
  document_url TEXT,
  selfie_url TEXT,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.kyc_submissions TO authenticated;
GRANT ALL ON public.kyc_submissions TO service_role;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kyc read own/admin/support" ON public.kyc_submissions FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'employee'));
CREATE POLICY "kyc self create" ON public.kyc_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "kyc self update pending" ON public.kyc_submissions FOR UPDATE USING (user_id = auth.uid() AND status IN ('pending','info_requested','rejected')) WITH CHECK (user_id = auth.uid());
CREATE POLICY "kyc admin update" ON public.kyc_submissions FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'));
CREATE TRIGGER trg_kyc_updated BEFORE UPDATE ON public.kyc_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DOCUMENTS ============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- statement|contract|tax|verification|other
  file_url TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'investor-documents',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private', -- private|investor|internal
  size_bytes BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc read own/admin/employee" ON public.documents FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'employee') OR public.has_role(auth.uid(),'support'));
CREATE POLICY "doc self upload" ON public.documents FOR INSERT WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'employee'));
CREATE POLICY "doc self/admin delete" ON public.documents FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ SUPPORT TICKETS ============
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal', -- low|normal|high|urgent
  status TEXT NOT NULL DEFAULT 'open', -- open|pending|escalated|resolved|closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tix read own/staff" ON public.support_tickets FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "tix self create" ON public.support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tix self close" ON public.support_tickets FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tix staff update" ON public.support_tickets FOR UPDATE USING (public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_tix_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUPPORT MESSAGES ============
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg read participants/staff" ON public.support_messages FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')))
);
CREATE POLICY "msg write participants/staff" ON public.support_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS(SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')))
);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'system', -- investment|security|system|verification|funding|support
  read_status BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif self read" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "notif self update" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ Auto-create wallet on profile insert ============
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, currency, status)
  VALUES (NEW.id, 0, 'USD', 'active')
  ON CONFLICT (user_id, currency) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_profiles_wallet ON public.profiles;
CREATE TRIGGER trg_profiles_wallet AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_user_wallet();

-- Backfill wallets for existing profiles
INSERT INTO public.wallets (user_id, balance, currency, status)
SELECT id, 0, 'USD', 'active' FROM public.profiles
ON CONFLICT (user_id, currency) DO NOTHING;

-- Seed some opportunities
INSERT INTO public.investment_opportunities (title, category, description, investment_type, minimum_investment, maximum_investment, target_amount, raised_amount, available_shares, price_per_share, status, open_date, close_date) VALUES
('SpaceX Series Pre-IPO Allocation', 'pre-ipo', 'Direct allocation in SpaceX private secondary shares ahead of public listing.', 'shares', 10000, 5000000, 50000000, 18750000, 250000, 200.00, 'open', now() - interval '14 days', now() + interval '90 days'),
('Starlink Revenue Note 2026', 'income', 'Fixed-income note backed by Starlink subscriber cashflows. 9.4% target yield.', 'note', 5000, 1000000, 15000000, 4250000, 0, 1000.00, 'open', now() - interval '7 days', now() + interval '60 days'),
('Tesla Energy Storage Fund', 'equity', 'Co-investment vehicle for Tesla Megapack deployments across EMEA.', 'fund', 25000, 2500000, 75000000, 31200000, 75000, 1000.00, 'open', now() - interval '30 days', now() + interval '120 days'),
('Neuralink Series C Co-Invest', 'pre-ipo', 'Limited allocation alongside the Neuralink Series C lead.', 'shares', 50000, 1000000, 20000000, 1800000, 40000, 500.00, 'open', now(), now() + interval '45 days'),
('xAI Compute Infrastructure Fund', 'fund', 'GPU cluster financing vehicle for xAI training compute.', 'fund', 100000, 5000000, 100000000, 12500000, 100000, 1000.00, 'open', now(), now() + interval '180 days');
