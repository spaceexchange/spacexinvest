
-- CRM docs: staff only
CREATE POLICY "crm-docs staff read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id='crm-documents' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support'))
);
CREATE POLICY "crm-docs staff write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='crm-documents' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support'))
);
CREATE POLICY "crm-docs staff del" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id='crm-documents' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
);

-- Messages: authenticated users (channel membership enforced at message level)
CREATE POLICY "msg-att auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='message-attachments');
CREATE POLICY "msg-att self write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='message-attachments' AND owner = auth.uid()
);
CREATE POLICY "msg-att self del" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id='message-attachments' AND (owner = auth.uid() OR has_role(auth.uid(),'admin'))
);

-- Announcements media: all auth read, staff write
CREATE POLICY "ann-media auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='announcement-media');
CREATE POLICY "ann-media staff write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='announcement-media' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support'))
);
CREATE POLICY "ann-media staff del" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id='announcement-media' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
);
