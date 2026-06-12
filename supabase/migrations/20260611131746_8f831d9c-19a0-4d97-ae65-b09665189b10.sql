ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS country_code text;

-- Allow users to read/update their own profile locale (assumes existing profile policies cover this; no-op otherwise)
COMMENT ON COLUMN public.profiles.locale IS 'BCP-47 language code (en, fr, es, ...). Synced from the LocaleProvider on login.';
COMMENT ON COLUMN public.profiles.country_code IS 'ISO-3166 alpha-2 country selected by the user for formatting.';