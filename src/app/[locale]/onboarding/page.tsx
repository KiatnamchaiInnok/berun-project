"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { Input, Label } from "@/components/ui/input";
import { ToggleChipGroup, ToggleChipItem } from "@/components/ui/toggle-chip";
import { createPlanFromOnboarding } from "@/lib/actions/training";

const WEEKDAYS = [
  { value: "0", label: "Sun" },
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
];

const MIN_BIRTH_YEAR = 1930;

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const ts = useTranslations("settings");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [level, setLevel] = useState<"beginner" | "returning" | "regular">("beginner");
  const [weekdays, setWeekdays] = useState<string[]>(["1", "3", "5"]);
  const [weeklyMinutes, setWeeklyMinutes] = useState("90");
  const [birthYear, setBirthYear] = useState("");
  const [parqYes, setParqYes] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const maxBirthYear = new Date().getFullYear() - 10;

  const birthYearValid = useMemo(() => {
    if (birthYear.length !== 4) return false;
    const year = Number(birthYear);
    return Number.isInteger(year) && year >= MIN_BIRTH_YEAR && year <= maxBirthYear;
  }, [birthYear, maxBirthYear]);

  const canSubmit = accepted && !parqYes && birthYearValid && !pending;

  function submit(baselineMode: boolean) {
    startTransition(async () => {
      try {
        await createPlanFromOnboarding({
          level,
          availableWeekdays: weekdays.map(Number),
          currentWeeklyMinutes: baselineMode ? 60 : Number(weeklyMinutes),
          currentLongRunMinutes: baselineMode ? 20 : Math.round(Number(weeklyMinutes) * 0.3),
          totalWeeks: 8,
          baselineMode,
          birthYear: Number(birthYear),
        });
        router.push("/");
      } catch {
        toast.error("Failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("disclaimer")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CheckboxField id="disclaimer" checked={accepted} onCheckedChange={setAccepted}>
            {t("disclaimer")}
          </CheckboxField>
          <CheckboxField id="parq" checked={parqYes} onCheckedChange={setParqYes}>
            {t("parq")}
          </CheckboxField>
          <div>
            <Label htmlFor="birthYear">{t("birthYear")}</Label>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("birthYearHint")}</p>
            <Input
              id="birthYear"
              inputMode="numeric"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={String(maxBirthYear - 20)}
              className="mt-2"
              aria-invalid={birthYear.length > 0 && !birthYearValid}
            />
          </div>
          <div>
            <Label>{t("weeklyMinutes")}</Label>
            <Input inputMode="numeric" value={weeklyMinutes} onChange={(e) => setWeeklyMinutes(e.target.value)} />
          </div>
          <div>
            <Label>{ts("weekdays")}</Label>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ts("weekdaysHint")}</p>
            <ToggleChipGroup
              type="multiple"
              value={weekdays}
              onValueChange={setWeekdays}
              className="mt-2"
              aria-label={ts("weekdays")}
            >
              {WEEKDAYS.map((d) => (
                <ToggleChipItem key={d.value} value={d.value} aria-label={d.label}>
                  {d.label}
                </ToggleChipItem>
              ))}
            </ToggleChipGroup>
            <p className="mt-2 text-sm tabular-nums leading-relaxed text-muted-foreground">
              {t("weekdaysSummary", { runDays: weekdays.length, restDays: 7 - weekdays.length })}
            </p>
          </div>
          <div>
            <Label>{ts("level")}</Label>
            <ToggleChipGroup
              type="single"
              value={level}
              onValueChange={(value) => {
                if (value) setLevel(value as typeof level);
              }}
              className="mt-2"
              aria-label={ts("level")}
            >
              {(["beginner", "returning", "regular"] as const).map((l) => (
                <ToggleChipItem key={l} value={l}>
                  {l === "beginner"
                    ? ts("levelBeginner")
                    : l === "returning"
                      ? ts("levelReturning")
                      : ts("levelRegular")}
                </ToggleChipItem>
              ))}
            </ToggleChipGroup>
          </div>
          <Button type="button" size="lg" disabled={!canSubmit} onClick={() => submit(false)}>
            {t("createPlan")}
          </Button>
          <Button type="button" variant="outline" disabled={!canSubmit} onClick={() => submit(true)}>
            {t("notSure")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
