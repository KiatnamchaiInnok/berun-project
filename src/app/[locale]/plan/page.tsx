import { getTranslations, getLocale } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { reconcilePlan } from "@/lib/actions/training";
import {
  computeHrZones,
  formatZoneDisplay,
  formatWorkoutDetailSummary,
  getRpeGuide,
  type IntensityZone,
  type WorkoutDetail,
  type WorkoutType,
} from "@/lib/engine/plan-engine";
import { formatShortDate } from "@/lib/utils";

export default async function PlanPage() {
  const t = await getTranslations("plan");
  const tw = await getTranslations("workout");
  const locale = await getLocale();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect({ href: "/login", locale: await getLocale() });

  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  const hrZones = computeHrZones(profile?.hrMax ?? 0, profile?.restingHr);

  const plan = await prisma.trainingPlan.findFirst({
    where: { userId, status: "active" },
    include: {
      versions: {
        orderBy: { versionNo: "desc" },
        take: 1,
        include: {
          weeks: {
            orderBy: { weekIndex: "asc" },
            include: { sessions: { orderBy: { scheduledDate: "asc" } } },
          },
        },
      },
    },
  });

  const weeks = plan?.versions[0]?.weeks ?? [];
  const today = new Date();

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="flex items-center justify-between gap-3 lg:col-span-2">
        <h1 className="text-2xl font-semibold leading-relaxed">{t("title")}</h1>
        <form
          action={async () => {
            "use server";
            await reconcilePlan();
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            {t("reconcile")}
          </Button>
        </form>
      </div>

      <div className="grid gap-4 lg:col-span-2 lg:grid-cols-2">
        {weeks.map((week) => {
          const end = new Date(week.weekStartDate);
          end.setDate(end.getDate() + 6);
          const isCurrent = today >= week.weekStartDate && today <= end;
          const completedMin = week.sessions
            .filter((s) => s.status === "completed")
            .reduce((sum, s) => sum + s.targetDurationSec / 60, 0);
          const pct = week.targetMinutes ? Math.round((completedMin / week.targetMinutes) * 100) : 0;
          const phaseLabel = week.phase === "build" ? t("phaseBuild") : t("phaseBase");

          return (
            <Card key={week.id} className={isCurrent ? "border-primary" : undefined}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  {week.isRecoveryWeek ? <CheckCircle2 className="h-5 w-5 text-primary" /> : null}
                  <CardTitle className="text-base">
                    {t("week", { n: week.weekIndex })}
                    {week.isRecoveryWeek ? ` · ${t("recovery")}` : ""}
                  </CardTitle>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {phaseLabel}
                  </span>
                </div>
                <CardDescription>
                  {t("targetMinutes", { minutes: week.targetMinutes })}
                  {week.isRecoveryWeek ? ` — ${t("recoveryHint")}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ProgressBar value={pct} />
                <ul className="flex flex-col gap-2">
                  {week.sessions.map((s) => {
                    const workoutType = s.workoutType as WorkoutType;
                    const targetZone = (s.targetZone ?? null) as IntensityZone | null;
                    const zoneDisplay = formatZoneDisplay(targetZone, hrZones, workoutType);
                    const detailSummary = formatWorkoutDetailSummary(
                      workoutType,
                      (s.workoutDetail as WorkoutDetail | null) ?? null,
                    );
                    const zoneText =
                      targetZone && zoneDisplay.includes("bpm")
                        ? `Z${targetZone.replace("zone", "")} ${zoneDisplay}`
                        : `RPE ${getRpeGuide(workoutType)}`;

                    return (
                      <li
                        key={s.id}
                        className="flex flex-col gap-1 rounded-xl border border-border px-3 py-2 text-sm leading-relaxed"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <span>{formatShortDate(s.scheduledDate, locale)}</span>
                          <span className="tabular-nums">
                            {tw(s.workoutType)} · {Math.round(s.targetDurationSec / 60)}m
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {zoneText}
                          {detailSummary ? ` · ${detailSummary}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
