
-- opportunity-media: any authenticated user can read; admins write
CREATE POLICY "opp_media_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'opportunity-media');
CREATE POLICY "opp_media_admin_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'opportunity-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));
CREATE POLICY "opp_media_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'opportunity-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));
CREATE POLICY "opp_media_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'opportunity-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));

-- opportunity-documents: same
CREATE POLICY "opp_docs_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'opportunity-documents');
CREATE POLICY "opp_docs_admin_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'opportunity-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));
CREATE POLICY "opp_docs_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'opportunity-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));

-- reports: finance/admin only
CREATE POLICY "reports_finance_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'reports' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance')));
CREATE POLICY "reports_finance_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance')));
