
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE lower(email) = 'ashtonelijah70@gmail.com';

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role::public.app_role
FROM auth.users u
CROSS JOIN (VALUES ('admin'), ('super_admin')) AS r(role)
WHERE lower(u.email) = 'ashtonelijah70@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
