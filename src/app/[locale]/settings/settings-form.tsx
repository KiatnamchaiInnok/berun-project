"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SettingsRow,
  SettingsSection,
  SettingsSeparator,
} from "@/components/ui/settings-row";
import { updateProfile } from "@/lib/actions/training";

export function SettingsForm({
  profile,
}: {
  profile: {
    level: string;
    progressionRatePct: number;
    buildWeeks: number;
    hrMax: number | null;
    birthYear: number | null;
    defaultLat: number | null;
    defaultLon: number | null;
  } | null;
}) {
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="p-0 pt-5">
        <SettingsSection title={t("profile")} />

        <SettingsRow label={t("hrMax")} htmlFor="hrMax">
          <Input
            id="hrMax"
            name="hrMax"
            defaultValue={profile?.hrMax ?? ""}
            inputMode="numeric"
            className="ml-auto h-9 w-28 text-right text-sm"
          />
        </SettingsRow>

        <SettingsRow label={t("birthYear")} htmlFor="birthYear">
          <Input
            id="birthYear"
            name="birthYear"
            defaultValue={profile?.birthYear ?? ""}
            inputMode="numeric"
            className="ml-auto h-9 w-28 text-right text-sm"
          />
        </SettingsRow>

        <SettingsRow label={`${t("progression")} (%)`} htmlFor="progression">
          <Input
            id="progression"
            name="progression"
            defaultValue={profile?.progressionRatePct ?? 10}
            inputMode="numeric"
            className="ml-auto h-9 w-28 text-right text-sm tabular-nums"
          />
        </SettingsRow>

        <SettingsSeparator className="my-2" />

        <SettingsSection title={t("preferences")} />

        <SettingsRow label={t("theme")}>
          <ThemeToggle />
        </SettingsRow>

        <SettingsRow label={t("language")}>
          <LanguageSwitcher />
        </SettingsRow>

        <SettingsSeparator className="my-2" />

        <Link
          href="/glossary"
          className="flex min-h-12 items-center justify-between gap-4 px-5 py-2 text-sm leading-relaxed hover:bg-accent/50"
        >
          <span>{t("glossary")}</span>
          <span className="text-muted-foreground" aria-hidden>
            ›
          </span>
        </Link>

        <div className="px-5 pb-5 pt-3">
          <Button
            type="button"
            disabled={pending}
            className="w-full"
            onClick={() => {
              startTransition(async () => {
                try {
                  await updateProfile({
                    hrMax: profile?.hrMax ?? undefined,
                    progressionRatePct: profile?.progressionRatePct,
                    buildWeeks: profile?.buildWeeks,
                  });
                  toast.success(t("save"));
                } catch {
                  toast.error("Error");
                }
              });
            }}
          >
            {t("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
