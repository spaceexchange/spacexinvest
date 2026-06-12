
-- ============ Extend investment_opportunities ============
ALTER TABLE public.investment_opportunities
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS expected_roi NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS investor_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS highlights JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS investment_opportunities_slug_key ON public.investment_opportunities (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS investment_opportunities_status_idx ON public.investment_opportunities (status);
CREATE INDEX IF NOT EXISTS investment_opportunities_featured_idx ON public.investment_opportunities (featured) WHERE featured;

-- Allow staff (compliance/finance/support) to read all opportunities including drafts
DROP POLICY IF EXISTS "opps staff read all" ON public.investment_opportunities;
CREATE POLICY "opps staff read all" ON public.investment_opportunities FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'finance')
      OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'employee'));

-- ============ opportunity_documents ============
CREATE TABLE IF NOT EXISTS public.opportunity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.investment_opportunities(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'opportunity-documents',
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'investor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_documents TO authenticated;
GRANT ALL ON public.opportunity_documents TO service_role;
ALTER TABLE public.opportunity_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oppdoc read" ON public.opportunity_documents FOR SELECT
  USING (
    visibility = 'investor'
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'finance')
    OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'employee')
  );
CREATE POLICY "oppdoc admin write" ON public.opportunity_documents FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ staff_notes ============
CREATE TABLE IF NOT EXISTS public.staff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'department',
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  mentions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_notes_entity_idx ON public.staff_notes (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS staff_notes_author_idx ON public.staff_notes (author_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_notes TO authenticated;
GRANT ALL ON public.staff_notes TO service_role;
ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes staff read" ON public.staff_notes FOR SELECT
  USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'finance')
    OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'employee')
  );
CREATE POLICY "notes author write" ON public.staff_notes FOR INSERT
  WITH CHECK (author_id = auth.uid() AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'finance')
    OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'employee')
  ));
CREATE POLICY "notes author update" ON public.staff_notes FOR UPDATE
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "notes author delete" ON public.staff_notes FOR DELETE
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.staff_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ reconciliation_records ============
CREATE TABLE IF NOT EXISTS public.reconciliation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID,
  transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  ledger_id UUID REFERENCES public.ledger_entries(id) ON DELETE SET NULL,
  funding_request_id UUID REFERENCES public.funding_requests(id) ON DELETE SET NULL,
  amount NUMERIC(18,2),
  currency TEXT,
  expected_amount NUMERIC(18,2),
  difference_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unmatched',
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recon_status_idx ON public.reconciliation_records (status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reconciliation_records TO authenticated;
GRANT ALL ON public.reconciliation_records TO service_role;
ALTER TABLE public.reconciliation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recon finance read" ON public.reconciliation_records FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance'));
CREATE POLICY "recon finance write" ON public.reconciliation_records FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance'));
CREATE TRIGGER trg_recon_updated BEFORE UPDATE ON public.reconciliation_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ scheduled_reports ============
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  schedule TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_reports TO authenticated;
GRANT ALL ON public.scheduled_reports TO service_role;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr finance" ON public.scheduled_reports FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance'));
CREATE TRIGGER trg_sr_updated BEFORE UPDATE ON public.scheduled_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ report_runs (history) ============
CREATE TABLE IF NOT EXISTS public.report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID REFERENCES public.scheduled_reports(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  format TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_url TEXT,
  bucket TEXT,
  row_count INTEGER,
  status TEXT NOT NULL DEFAULT 'completed',
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.report_runs TO authenticated;
GRANT ALL ON public.report_runs TO service_role;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rr finance read" ON public.report_runs FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance'));
CREATE POLICY "rr finance write" ON public.report_runs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance'));

-- ============ profiles: account status ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Admin/staff read of profiles (for staff UIs)
DROP POLICY IF EXISTS "profiles staff read" ON public.profiles;
CREATE POLICY "profiles staff read" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'compliance') OR public.has_role(auth.uid(),'finance')
    OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'employee')
  );

DROP POLICY IF EXISTS "profiles admin update" ON public.profiles;
CREATE POLICY "profiles admin update" ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ security_events: admin/compliance see all ============
DROP POLICY IF EXISTS "sec admin read" ON public.security_events;
CREATE POLICY "sec admin read" ON public.security_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'compliance')
  );

-- user_devices: admin/compliance read all
DROP POLICY IF EXISTS "devices admin read" ON public.user_devices;
CREATE POLICY "devices admin read" ON public.user_devices FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'compliance')
  );

-- login_attempts: admin/compliance read
DROP POLICY IF EXISTS "login_attempts admin read" ON public.login_attempts;
CREATE POLICY "login_attempts admin read" ON public.login_attempts FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'compliance'));
GRANT SELECT ON public.login_attempts TO authenticated;

-- ============ Realtime ============
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_notes';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_opportunities';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.investments';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.reconciliation_records';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
