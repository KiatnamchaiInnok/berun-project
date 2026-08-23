"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { setStoredLocale } from "@/lib/locale-storage";
import { cn } from "@/lib/utils";

const labels: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
};

export function LoginLanguageFooter() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    setStoredLocale(next);
    router.replace(pathname, { locale: next });
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      {routing.locales.map((value, index) => (
        <span key={value} className="inline-flex items-center gap-2">
          {index > 0 ? <span aria-hidden>|</span> : null}
          <button
            type="button"
            onClick={() => switchLocale(value)}
            className={cn(
              "min-h-11 px-2 leading-relaxed transition-colors",
              value === locale
                ? "font-medium text-foreground"
                : "hover:text-foreground",
            )}
            aria-current={value === locale ? "true" : undefined}
          >
            {labels[value]}
          </button>
        </span>
      ))}
    </div>
  );
}
