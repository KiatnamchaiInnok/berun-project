import { routing, type Locale } from "@/i18n/routing";

export const LOCALE_STORAGE_KEY = "berun-locale";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && routing.locales.includes(value as Locale);
}

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore quota / private mode
  }
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function syncStoredLocale(locale: Locale): void {
  const stored = getStoredLocale();
  if (stored === locale) return;
  setStoredLocale(locale);
}
