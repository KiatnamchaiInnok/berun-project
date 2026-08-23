"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <div className="h-9 w-28" aria-hidden />;
  }

  return (
    <Select value={theme ?? "system"} onValueChange={setTheme}>
      <SelectTrigger className="ml-auto w-auto min-w-28" aria-label={t("theme")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">{t("themeLight")}</SelectItem>
        <SelectItem value="dark">{t("themeDark")}</SelectItem>
        <SelectItem value="system">{t("themeSystem")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
