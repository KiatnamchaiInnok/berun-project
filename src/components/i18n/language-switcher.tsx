"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setStoredLocale } from "@/lib/locale-storage";

const labels: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        if (!value || value === locale) return;
        setStoredLocale(value as Locale);
        router.replace(pathname, { locale: value as Locale });
        router.refresh();
      }}
    >
      <SelectTrigger className="ml-auto w-auto min-w-28" aria-label="Language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((value) => (
          <SelectItem key={value} value={value}>
            {labels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
