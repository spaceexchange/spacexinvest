
-- Extend funding_requests with workflow + flexible details
ALTER TABLE public.funding_requests
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS asset TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS network TEXT,
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS destination_address TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS compliance_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS compliance_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS compliance_notes TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Crypto deposit addresses (admin assigned per user/asset)
CREATE TABLE IF NOT EXISTS public.crypto_deposit_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  memo TEXT,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset, network)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crypto_deposit_addresses TO authenticated;
GRANT ALL ON public.crypto_deposit_addresses TO service_role;
ALTER TABLE public.crypto_deposit_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cda read own/staff" ON public.crypto_deposit_addresses FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'support'));
CREATE POLICY "cda staff write" ON public.crypto_deposit_addresses FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'finance'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'finance'));

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
