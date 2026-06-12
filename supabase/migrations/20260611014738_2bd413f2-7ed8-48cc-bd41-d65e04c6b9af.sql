
-- Restrict SECURITY DEFINER trigger helpers to system only
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_email_verified() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- has_role is called from RLS policies; keep authenticated execution
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;

-- Tighten login_attempts policy: still allow inserts (needed pre-auth) but add identifier length cap
DROP POLICY IF EXISTS "insert_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "insert_attempts_anon" ON public.login_attempts;
CREATE POLICY "insert_attempts" ON public.login_attempts FOR INSERT TO authenticated, anon
  WITH CHECK (length(identifier) BETWEEN 1 AND 320);
