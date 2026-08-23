"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRef, useTransition } from "react";
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
import { tanakaHrMax } from "@/lib/engine/plan-engine";

export function SettingsForm({
  profile,
}: {
  profile: {
    level: string;
    progressionRatePct: number;
    buildWeeks: number;
    hrMax: number | null;
    birthYear: number | null;
    hrMaxSource: string | null;
    defaultLat: number | null;
    defaultLon: number | null;
  } | null;
}) {
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSave() {
    const form = formRef.current;
    if (!form) return;

    const hrMaxRaw = (form.elements.namedItem("hrMax") as HTMLInputElement).value.trim();
    const birthYearRaw = (form.elements.namedItem("birthYear") as HTMLInputElement).value.trim();
    const progressionRaw = (form.elements.namedItem("progression") as HTMLInputElement).value.trim();

    const hrMax = hrMaxRaw ? Number(hrMaxRaw) : undefined;
    const birthYear = birthYearRaw ? Number(birthYearRaw) : undefined;
    const progressionRatePct = progressionRaw ? Number(progressionRaw) : undefined;

    let hrMaxSource: "manual" | "tanakaEstimate" | undefined;
    let finalHrMax = hrMax;

    if (hrMax != null && hrMax !== profile?.hrMax) {
      hrMaxSource = "manual";
    } else if (
      birthYear != null &&
      birthYear !== profile?.birthYear &&
      (profile?.hrMaxSource == null || profile.hrMaxSource === "tanakaEstimate")
    ) {
      const age = new Date().getFullYear() - birthYear;
      finalHrMax = tanakaHrMax(age);
      hrMaxSource = "tanakaEstimate";
    }

    startTransition(async () => {
      try {
        await updateProfile({
          hrMax: finalHrMax,
          birthYear,
          progressionRatePct,
          buildWeeks: profile?.buildWeeks,
          hrMaxSource,
        });
        toast.success(t("save"));
      } catch {
        toast.error("Error");
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-0 pt-5">
        <form ref={formRef}>
          <SettingsSection title={t("profile")} />

          <SettingsRow label={t("hrMax")} htmlFor="hrMax">
            <Input
              id="hrMax"
              name="hrMax"
              defaultValue={profile?.hrMax ?? ""}
              inputMode="numeric"
              className="ml-auto h-9 w-28 text-right text-sm tabular-nums"
            />
          </SettingsRow>

          <SettingsRow label={t("birthYear")} htmlFor="birthYear">
            <Input
              id="birthYear"
              name="birthYear"
              defaultValue={profile?.birthYear ?? ""}
              inputMode="numeric"
              className="ml-auto h-9 w-28 text-right text-sm tabular-nums"
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
            <Button type="button" disabled={pending} className="w-full" onClick={handleSave}>
              {t("save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
