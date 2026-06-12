import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n, { SUPPORTED_COUNTRIES, SUPPORTED_LANGUAGES, type LanguageCode } from "./config";
import { supabase } from "@/integrations/supabase/client";

type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]["code"];

interface LocaleContextValue {
  language: LanguageCode;
  country: CountryCode;
  setLanguage: (code: LanguageCode) => void;
  setCountry: (code: CountryCode) => void;
  dir: "ltr" | "rtl";
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_LANG = "spx_lang";
const STORAGE_COUNTRY = "spx_country";

const LANG_TO_COUNTRY: Record<string, CountryCode> = {
  en: "US", fr: "FR", es: "ES", de: "DE", it: "IT", pt: "PT",
  ar: "AE", zh: "CN", ja: "JP", ko: "KR", ru: "RU", tr: "TR", nl: "NL", hi: "IN",
};

function detectInitial(): { lang: LanguageCode; country: CountryCode } {
  if (typeof window === "undefined") return { lang: "en", country: "US" };
  const storedLang = (localStorage.getItem(STORAGE_LANG) as LanguageCode | null) ?? undefined;
  const storedCountry = (localStorage.getItem(STORAGE_COUNTRY) as CountryCode | null) ?? undefined;
  const navLang = navigator.language?.split("-")[0] as LanguageCode | undefined;
  const navCountry = navigator.language?.split("-")[1] as CountryCode | undefined;
  const lang = (storedLang && SUPPORTED_LANGUAGES.some((l) => l.code === storedLang)
    ? storedLang
    : navLang && SUPPORTED_LANGUAGES.some((l) => l.code === navLang)
      ? navLang
      : "en") as LanguageCode;
  const country = (storedCountry && SUPPORTED_COUNTRIES.some((c) => c.code === storedCountry)
    ? storedCountry
    : navCountry && SUPPORTED_COUNTRIES.some((c) => c.code === navCountry)
      ? navCountry
      : LANG_TO_COUNTRY[lang] ?? "US") as CountryCode;
  return { lang, country };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [{ lang, country }, setState] = useState(() => detectInitial());
  const userIdRef = useRef<string | null>(null);

  // Hydrate from the signed-in user's profile (cross-device persistence).
  useEffect(() => {
    let cancelled = false;
    async function loadFromProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("locale, country_code")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled || !data) return;
      setState((s) => ({
        lang: (data.locale as LanguageCode) ?? s.lang,
        country: (data.country_code as CountryCode) ?? s.country,
      }));
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { userIdRef.current = data.user.id; loadFromProfile(data.user.id); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      userIdRef.current = session?.user?.id ?? null;
      if (session?.user) loadFromProfile(session.user.id);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    void i18n.changeLanguage(lang);
    if (typeof document !== "undefined") {
      const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = meta?.dir ?? "ltr";
    }
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_LANG, lang);
    if (userIdRef.current) {
      void supabase.from("profiles").update({ locale: lang }).eq("id", userIdRef.current);
    }
  }, [lang]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_COUNTRY, country);
    if (userIdRef.current) {
      void supabase.from("profiles").update({ country_code: country }).eq("id", userIdRef.current);
    }
  }, [country]);

  const setLanguage = useCallback((code: LanguageCode) => setState((s) => ({ ...s, lang: code })), []);
  const setCountry = useCallback((code: CountryCode) => setState((s) => ({ ...s, country: code })), []);

  const value = useMemo<LocaleContextValue>(() => ({
    language: lang,
    country,
    setLanguage,
    setCountry,
    dir: SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.dir ?? "ltr",
  }), [lang, country, setLanguage, setCountry]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}

export { useTranslation, SUPPORTED_LANGUAGES, SUPPORTED_COUNTRIES };
export type { CountryCode };
