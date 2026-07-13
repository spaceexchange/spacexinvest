// Locale + country aware formatters. Driven by the LocaleProvider.
import { useMemo } from "react";
import { useLocale } from "@/i18n/LocaleProvider";

// Country → primary currency (ISO 4217). Falls back to USD.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "NZD",
  FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", NL: "EUR", IE: "EUR", BE: "EUR", AT: "EUR", FI: "EUR",
  CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK",
  JP: "JPY", KR: "KRW", CN: "CNY", HK: "HKD", SG: "SGD", IN: "INR",
  AE: "AED", SA: "SAR", TR: "TRY", RU: "RUB",
  BR: "BRL", MX: "MXN",
};

export function bcp47(lang: string, country?: string) {
  return country ? `${lang}-${country}` : lang;
}

export interface Formatters {
  locale: string;
  currency: string;
  formatNumber: (n: number, opts?: Intl.NumberFormatOptions) => string;
  formatCurrency: (n: number, currency?: string, opts?: Intl.NumberFormatOptions) => string;
  formatPercent: (n: number, fractionDigits?: number) => string; // expects 0.123 → "12.3%"
  formatDate: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (d: Date | string | number) => string;
  formatTime: (d: Date | string | number) => string;
  formatRelative: (d: Date | string | number) => string;
}

export function useFormatters(): Formatters {
  const { language, country } = useLocale();
  return useMemo(() => buildFormatters(language, country), [language, country]);
}

export function buildFormatters(language: string, country?: string): Formatters {
  const locale = bcp47(language, country);
  const currency = (country && COUNTRY_TO_CURRENCY[country]) || "USD";

  const toDate = (d: Date | string | number) => (d instanceof Date ? d : new Date(d));

  return {
    locale,
    currency,
    formatNumber: (n, opts) => new Intl.NumberFormat(locale, opts).format(n),
    formatCurrency: (n, cur, opts) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    ...opts,
  }).format(n),
    formatPercent: (n, fractionDigits = 2) =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: fractionDigits,
      }).format(n),
    formatDate: (d, opts) =>
      new Intl.DateTimeFormat(locale, opts ?? { dateStyle: "medium" }).format(toDate(d)),
    formatDateTime: (d) =>
      new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(toDate(d)),
    formatTime: (d) =>
      new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(toDate(d)),
    formatRelative: (d) => {
      const date = toDate(d);
      const diff = (date.getTime() - Date.now()) / 1000;
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
      const abs = Math.abs(diff);
      if (abs < 60) return rtf.format(Math.round(diff), "second");
      if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
      if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
      if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
      if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), "month");
      return rtf.format(Math.round(diff / 31536000), "year");
    },
  };
}
