"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createPlanFromOnboarding } from "@/lib/actions/training";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [level, setLevel] = useState<"beginner" | "returning" | "regular">("beginner");
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]);
  const [weeklyMinutes, setWeeklyMinutes] = useState("90");
  const [parqYes, setParqYes] = useState(false);
  const [accepted, setAccepted] = useState(false);

  function toggleDay(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  function submit(baselineMode: boolean) {
    startTransition(async () => {
      try {
        await createPlanFromOnboarding({
          level,
          availableWeekdays: weekdays,
          currentWeeklyMinutes: baselineMode ? 60 : Number(weeklyMinutes),
          currentLongRunMinutes: baselineMode ? 20 : Math.round(Number(weeklyMinutes) * 0.3),
          totalWeeks: 8,
          baselineMode,
        });
        router.push("/");
      } catch {
        toast.error("Failed");
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("disclaimer")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm leading-relaxed">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            {t("disclaimer")}
          </label>
          <label className="flex items-center gap-2 text-sm leading-relaxed">
            <input type="checkbox" checked={parqYes} onChange={(e) => setParqYes(e.target.checked)} />
            {t("parq")}
          </label>
          <div>
            <Label>{t("weeklyMinutes")}</Label>
            <Input inputMode="numeric" value={weeklyMinutes} onChange={(e) => setWeeklyMinutes(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <Button
                key={d.value}
                type="button"
                size="sm"
                variant={weekdays.includes(d.value) ? "default" : "outline"}
                onClick={() => toggleDay(d.value)}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["beginner", "returning", "regular"] as const).map((l) => (
              <Button key={l} type="button" size="sm" variant={level === l ? "default" : "outline"} onClick={() => setLevel(l)}>
                {l}
              </Button>
            ))}
          </div>
          <Button type="button" size="lg" disabled={!accepted || parqYes || pending} onClick={() => submit(false)}>
            {t("createPlan")}
          </Button>
          <Button type="button" variant="outline" disabled={!accepted || parqYes || pending} onClick={() => submit(true)}>
            {t("notSure")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
