"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { ToggleChipGroup, ToggleChipItem } from "@/components/ui/toggle-chip";

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
    return <div className="h-12" aria-hidden />;
  }

  return (
    <ToggleChipGroup
      type="single"
      value={theme ?? "system"}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
      aria-label={t("theme")}
    >
      <ToggleChipItem value="light">{t("themeLight")}</ToggleChipItem>
      <ToggleChipItem value="dark">{t("themeDark")}</ToggleChipItem>
      <ToggleChipItem value="system">{t("themeSystem")}</ToggleChipItem>
    </ToggleChipGroup>
  );
}
