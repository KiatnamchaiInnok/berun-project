"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { setStoredLocale } from "@/lib/locale-storage";

const labels: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("settings");

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("language")}</Label>
      <div className="flex flex-wrap gap-2">
        {routing.locales.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={locale === value ? "default" : "outline"}
            className="min-h-12"
            aria-pressed={locale === value}
            onClick={() => {
              if (value === locale) return;
              setStoredLocale(value);
              router.replace(pathname, { locale: value });
            }}
          >
            {labels[value]}
          </Button>
        ))}
      </div>
    </div>
  );
}
