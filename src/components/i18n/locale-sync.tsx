"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { getStoredLocale, isLocale, setStoredLocale } from "@/lib/locale-storage";

export function LocaleSync() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored && stored !== locale) {
      router.replace(pathname, { locale: stored });
      return;
    }
    if (isLocale(locale)) {
      setStoredLocale(locale);
    }
  }, [locale, pathname, router]);

  return null;
}
