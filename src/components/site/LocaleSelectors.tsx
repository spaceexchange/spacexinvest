import { useState, useRef, useEffect } from "react";
import { Globe, MapPin, ChevronDown, Check } from "lucide-react";
import { useLocale, SUPPORTED_LANGUAGES, SUPPORTED_COUNTRIES } from "@/i18n/LocaleProvider";
import { useTranslation } from "react-i18next";

function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

export function LanguageSelector() {
  const { language, setLanguage } = useLocale();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.selectLanguage")}
        aria-expanded={open}
        className="inline-flex items-center gap-1 px-1.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-colors"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-md border border-border bg-popover shadow-xl z-50">
          <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-muted-foreground border-b border-border">
            {t("common.selectLanguage").toUpperCase()}
          </div>
          <ul role="listbox" className="py-1">
            {SUPPORTED_LANGUAGES.map((l) => (
              <li key={l.code}>
                <button
                  role="option"
                  aria-selected={l.code === language}
                  onClick={() => { setLanguage(l.code); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                >
                  <span className="flex flex-col">
                    <span className="text-foreground">{l.native}</span>
                    <span className="text-[10px] text-muted-foreground">{l.label}</span>
                  </span>
                  {l.code === language && <Check className="h-3.5 w-3.5 text-accent-blue" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CountrySelector() {
  const { country, setCountry } = useLocale();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const current = SUPPORTED_COUNTRIES.find((c) => c.code === country) ?? SUPPORTED_COUNTRIES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.selectCountry")}
        aria-expanded={open}
        className="inline-flex items-center gap-1 px-1.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-colors"
      >
        <span aria-hidden className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.code}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-md border border-border bg-popover shadow-xl z-50">
          <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-muted-foreground border-b border-border flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> {t("common.selectCountry").toUpperCase()}
          </div>
          <ul role="listbox" className="py-1">
            {SUPPORTED_COUNTRIES.map((c) => (
              <li key={c.code}>
                <button
                  role="option"
                  aria-selected={c.code === country}
                  onClick={() => { setCountry(c.code); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden className="text-base leading-none">{c.flag}</span>
                    <span className="text-foreground">{c.name}</span>
                  </span>
                  {c.code === country && <Check className="h-3.5 w-3.5 text-accent-blue" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
