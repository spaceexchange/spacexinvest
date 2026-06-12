
-- Revoke public execute on the new trigger function
REVOKE EXECUTE ON FUNCTION public.create_user_wallet() FROM PUBLIC, anon, authenticated;

-- Helper to extract owner from path "userId/filename..."
-- Storage policies use path tokens; files MUST be uploaded as "<auth.uid()>/<rest>"

-- ============ STORAGE POLICIES ============
-- KYC documents
CREATE POLICY "kyc own read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'kyc-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'employee')
  )
);
CREATE POLICY "kyc own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "kyc own delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'kyc-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
);

-- Investor documents
CREATE POLICY "invdoc read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'investor-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'employee')
  )
);
CREATE POLICY "invdoc upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'investor-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'employee')
  )
);
CREATE POLICY "invdoc delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'investor-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
);

-- Contracts / Statements / Tax — staff upload, owner read
DO $$
DECLARE b TEXT;
BEGIN
  FOR b IN SELECT unnest(ARRAY['contracts','statements','tax-documents']) LOOP
    EXECUTE format($f$CREATE POLICY "%1$s read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %2$L AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'employee') OR public.has_role(auth.uid(),'support')));$f$, b||'_own_read', b);
    EXECUTE format($f$CREATE POLICY "%1$s upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %2$L AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'employee')));$f$, b||'_staff_up', b);
  END LOOP;
END $$;

-- Funding proofs
CREATE POLICY "fund proof read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'funding-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'))
);
CREATE POLICY "fund proof upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'funding-proofs' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Support attachments
CREATE POLICY "supatt read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'support-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'))
);
CREATE POLICY "supatt upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = auth.uid()::text
);
