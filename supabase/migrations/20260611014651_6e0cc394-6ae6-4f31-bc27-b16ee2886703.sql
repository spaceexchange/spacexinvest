
-- Roles
CREATE TYPE public.app_role AS ENUM ('visitor','registered','verified','vip','employee','support','admin','super_admin');
CREATE TYPE public.verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.security_event_type AS ENUM (
  'login_success','login_failed','logout','password_changed','password_reset_requested',
  'email_changed','phone_changed','2fa_enabled','2fa_disabled','2fa_challenge_success','2fa_challenge_failed',
  'account_locked','suspicious_activity','device_added','session_revoked','email_verified','phone_verified'
);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  preferred_currency TEXT DEFAULT 'USD',
  avatar_url TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  kyc_status public.verification_status NOT NULL DEFAULT 'pending',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- USER PREFERENCES
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_sms BOOLEAN NOT NULL DEFAULT false,
  notify_push BOOLEAN NOT NULL DEFAULT true,
  notify_in_app BOOLEAN NOT NULL DEFAULT true,
  security_alerts BOOLEAN NOT NULL DEFAULT true,
  product_updates BOOLEAN NOT NULL DEFAULT true,
  marketing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_prefs_all" ON public.user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_prefs_updated BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SECURITY EVENTS
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type public.security_event_type NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sec_events_user_time ON public.security_events(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_events_select" ON public.security_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_events_insert" ON public.security_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- USER DEVICES
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  trusted BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_devices_all" ON public.user_devices FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LOGIN ATTEMPTS (for rate limiting / lockouts; service writes)
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_attempts_id_time ON public.login_attempts(identifier, attempted_at DESC);
GRANT INSERT, SELECT ON public.login_attempts TO authenticated;
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_attempts" ON public.login_attempts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insert_attempts_anon" ON public.login_attempts FOR INSERT TO anon WITH CHECK (true);
GRANT INSERT ON public.login_attempts TO anon;

-- REFERRALS
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_referrals_select" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- NOTIFICATION LOG (infra only)
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  template TEXT,
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notif_select" ON public.notification_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- AUDIT RECORDS
CREATE TABLE public.audit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_records TO authenticated;
GRANT ALL ON public.audit_records TO service_role;
ALTER TABLE public.audit_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_audit_select" ON public.audit_records FOR SELECT TO authenticated USING (auth.uid() = actor_id);
CREATE POLICY "own_audit_insert" ON public.audit_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

-- COUNTRIES reference (public read)
CREATE TABLE public.countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dial_code TEXT,
  flag TEXT
);
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries_public_read" ON public.countries FOR SELECT TO anon, authenticated USING (true);

-- AUTO PROFILE / ROLE / PREFS CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_first TEXT := NEW.raw_user_meta_data->>'first_name';
  v_last  TEXT := NEW.raw_user_meta_data->>'last_name';
  v_phone TEXT := NEW.raw_user_meta_data->>'phone';
  v_country TEXT := NEW.raw_user_meta_data->>'country';
  v_marketing BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false);
  v_ref TEXT := NEW.raw_user_meta_data->>'referral_code';
  v_code TEXT := upper(substr(md5(random()::text || NEW.id::text), 1, 8));
  v_referrer UUID;
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, country, marketing_opt_in, referral_code, display_name)
  VALUES (NEW.id, NEW.email, v_first, v_last, v_phone, v_country, v_marketing, v_code, COALESCE(NULLIF(trim(coalesce(v_first,'') || ' ' || coalesce(v_last,'')), ''), split_part(NEW.email,'@',1)));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'registered');
  INSERT INTO public.user_preferences (user_id, marketing) VALUES (NEW.id, v_marketing);

  IF v_ref IS NOT NULL AND length(v_ref) > 0 THEN
    SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = upper(v_ref) LIMIT 1;
    IF v_referrer IS NOT NULL THEN
      UPDATE public.profiles SET referred_by = v_referrer WHERE id = NEW.id;
      INSERT INTO public.referrals (referrer_id, referred_user_id, code) VALUES (v_referrer, NEW.id, upper(v_ref));
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync email_verified flag when email confirmed
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at <> NEW.email_confirmed_at) THEN
    UPDATE public.profiles SET email_verified = true WHERE id = NEW.id;
    -- upgrade to verified role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'verified') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_email_verified();

-- Seed minimal countries
INSERT INTO public.countries (code, name, dial_code, flag) VALUES
('US','United States','+1','🇺🇸'),('GB','United Kingdom','+44','🇬🇧'),('CA','Canada','+1','🇨🇦'),
('FR','France','+33','🇫🇷'),('DE','Germany','+49','🇩🇪'),('ES','Spain','+34','🇪🇸'),
('IT','Italy','+39','🇮🇹'),('PT','Portugal','+351','🇵🇹'),('NL','Netherlands','+31','🇳🇱'),
('CH','Switzerland','+41','🇨🇭'),('AE','United Arab Emirates','+971','🇦🇪'),('SA','Saudi Arabia','+966','🇸🇦'),
('SG','Singapore','+65','🇸🇬'),('HK','Hong Kong','+852','🇭🇰'),('JP','Japan','+81','🇯🇵'),
('KR','Korea','+82','🇰🇷'),('CN','China','+86','🇨🇳'),('IN','India','+91','🇮🇳'),
('AU','Australia','+61','🇦🇺'),('BR','Brazil','+55','🇧🇷'),('MX','Mexico','+52','🇲🇽'),
('TR','Turkey','+90','🇹🇷'),('RU','Russia','+7','🇷🇺')
ON CONFLICT DO NOTHING;
