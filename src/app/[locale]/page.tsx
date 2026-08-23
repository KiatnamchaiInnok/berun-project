import { AlertCircle, CheckCircle2, Sun } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { WorkoutSegmentBreakdown } from "@/components/plan/workout-segment-breakdown";
import { StrengthExerciseList } from "@/components/plan/strength-exercise-list";
import {
  buildWorkoutSegments,
  computeHrZones,
  formatZoneDisplay,
  formatWorkoutDetailSummary,
  getRpeGuide,
  type IntensityZone,
  type StrengthDetail,
  type WorkoutDetail,
  type WorkoutType,
} from "@/lib/engine/plan-engine";
import { getTodayDashboard } from "@/lib/actions/training";
import { translateMessageKey } from "@/lib/i18n/translate-message-key";
import { getWeatherObservation } from "@/lib/services/weather";
import { TodayActions } from "./today-actions";

export default async function TodayPage() {
  const t = await getTranslations("today");
  const tw = await getTranslations("workout");
  const ts = await getTranslations("segment");
  const tStrength = await getTranslations("strength");

  let data;
  try {
    data = await getTodayDashboard();
  } catch {
    redirect({ href: "/login", locale: await getLocale() });
    return null;
  }

  if (data.needsOnboarding) {
    redirect({ href: "/onboarding", locale: await getLocale() });
    return null;
  }

  const lat = data.profile?.defaultLat ? Number(data.profile.defaultLat) : 13.7563;
  const lon = data.profile?.defaultLon ? Number(data.profile.defaultLon) : 100.5018;
  const weather = await getWeatherObservation(lat, lon, new Date());

  const session = data.todaySession;
  const isRest = session?.workoutType === "rest" || !session;
  const isStrength = session?.workoutType === "strength";
  const weekIndex = data.currentWeek?.weekIndex ?? 1;
  const totalWeeks = data.plan?.totalWeeks ?? 8;
  const targetMinutes = data.currentWeek?.targetMinutes ?? 0;
  const weekPct = targetMinutes ? Math.min(100, Math.round((data.weekMinutes / targetMinutes) * 100)) : 0;
  const phase = data.currentWeek?.phase ?? "base";
  const phaseLabel = phase === "build" ? t("phaseBuild") : t("phaseBase");

  const hrZones = computeHrZones(
    data.profile?.hrMax ?? 0,
    data.profile?.restingHr,
  );

  const workoutType = (session?.workoutType ?? "easy") as WorkoutType;
  const targetZone = (session?.targetZone ?? null) as IntensityZone | null;
  const zoneDisplay = formatZoneDisplay(targetZone, hrZones, workoutType);
  const zoneLabel =
    targetZone && zoneDisplay.includes("bpm")
      ? t("zoneRange", {
          zone: targetZone.replace("zone", ""),
          range: zoneDisplay,
        })
      : t("rpeGuide", { rpe: getRpeGuide(workoutType) });

  const workoutDetail = (session?.workoutDetail as WorkoutDetail | null) ?? null;
  const detailSummary = session ? formatWorkoutDetailSummary(workoutType, workoutDetail) : null;
  const detailSummaryText = detailSummary
    ? isStrength
      ? tStrength(
          detailSummary.key as Parameters<typeof tStrength>[0],
          detailSummary.params,
        )
      : ts(detailSummary.key as Parameters<typeof ts>[0], detailSummary.params)
    : null;

  const sessionMinutes = session ? Math.round(session.targetDurationSec / 60) : 0;
  const segments = session
    ? buildWorkoutSegments(workoutType, workoutDetail, sessionMinutes)
    : null;
  const strengthExercises =
    isStrength && workoutDetail ? (workoutDetail as StrengthDetail).exercises : undefined;

  const adjustmentMessage = data.latestAdjustment
    ? await translateMessageKey(data.latestAdjustment.messageKey)
    : null;
  const weatherMessage =
    weather.advisory.level !== "ok"
      ? await translateMessageKey(weather.advisory.messageKey)
      : null;

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="lg:col-span-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("weekOf", { current: weekIndex, total: totalWeeks })} · {phaseLabel}
        </p>
        <h1 className="text-2xl font-semibold leading-relaxed">{t("logRun")}</h1>
      </div>

      {data.latestAdjustment ? (
        <Card className="border-primary/30 bg-accent/40 lg:col-span-2">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-primary" />
            <div className="flex-1 leading-relaxed">
              <p className="font-medium">{t("planAdjusted")}</p>
              <p className="text-sm text-muted-foreground">{adjustmentMessage}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {weather.advisory.level !== "ok" ? (
        <Card className="border-amber-500/40 bg-amber-500/10 lg:col-span-2">
          <CardContent className="flex items-center gap-3 p-4">
            <Sun className="h-5 w-5 text-amber-600" />
            <p className="text-sm leading-relaxed">{weatherMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="lg:col-span-2">
        <CardHeader>
          {isRest ? (
            <>
              <CardTitle>{t("restDay")}</CardTitle>
              <CardDescription>{t("restReason")}</CardDescription>
            </>
          ) : isStrength ? (
            <>
              <CardTitle>{tw("strength")}</CardTitle>
              <CardDescription className="truncate">
                {t("minutesTarget", { minutes: sessionMinutes })}
                {` · RPE ${getRpeGuide(workoutType)}`}
                {detailSummaryText ? ` · ${detailSummaryText}` : ""}
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle>{tw(session!.workoutType)}</CardTitle>
              <CardDescription className="truncate">
                {t("minutesTarget", { minutes: sessionMinutes })}
                {` · ${zoneLabel}`}
                {detailSummaryText ? ` · ${detailSummaryText}` : ""}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!isRest && segments ? (
            <>
              <WorkoutSegmentBreakdown segments={segments} hrZones={hrZones} />
              {strengthExercises && strengthExercises.length > 0 ? (
                <StrengthExerciseList exercises={strengthExercises} />
              ) : null}
            </>
          ) : null}
          <TodayActions
            sessionId={session?.id}
            workoutType={session?.workoutType ?? "easy"}
            durationSec={session?.targetDurationSec}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("weekProgress")}</CardTitle>
          <CardDescription className="tabular-nums">
            {data.weekMinutes} / {targetMinutes} min ({weekPct}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar value={weekPct} />
          <div className="mt-4 flex items-center gap-2 text-sm leading-relaxed">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>{weekPct > 110 ? t("weekStatusHigh") : t("weekStatusOk")}</span>
          </div>
        </CardContent>
      </Card>

      {!data.profile?.hrMax ? (
        <Card>
          <CardContent className="p-4 text-sm leading-relaxed text-muted-foreground">{t("addHrMax")}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
