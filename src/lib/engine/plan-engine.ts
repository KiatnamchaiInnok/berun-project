export const ENGINE_VERSION = "1.0.0";

export type Level = "beginner" | "returning" | "regular";

export type WorkoutType = "easy" | "long" | "tempo" | "runWalk" | "rest";

export type IntensityZone = "zone1" | "zone2" | "zone3" | "zone4" | "zone5";

export interface PlanEngineInput {
  level: Level;
  currentWeeklyMinutes: number;
  currentLongRunMinutes: number;
  daysPerWeek: number;
  availableWeekdays: number[];
  totalWeeks: 8 | 12;
  progressionRatePct: 5 | 10 | 15;
  buildWeeks: 2 | 3 | 4;
  recoveryReductionPct: number;
  startDate: Date;
}

export interface RunWalkPattern {
  runMin: number;
  walkMin: number;
  repeats: number;
}

export interface PlannedSessionDraft {
  scheduledDate: Date;
  sequence: number;
  workoutType: WorkoutType;
  targetDurationSec: number;
  targetZone: IntensityZone | null;
  runWalkPattern: RunWalkPattern | null;
}

export interface PlanWeekDraft {
  weekIndex: number;
  blockIndex: number;
  weekStartDate: Date;
  isRecoveryWeek: boolean;
  targetMinutes: number;
  targetLongRunMinutes: number;
  targetEasySharePct: number;
  sessions: PlannedSessionDraft[];
}

export interface PlanEngineOutput {
  weeks: PlanWeekDraft[];
  adjustments: Array<{
    rule: string;
    messageKey: string;
    input: Record<string, unknown>;
    outcome: Record<string, unknown>;
  }>;
}

export interface ReconcileInput {
  plannedWeekMinutes: number;
  actualWeekMinutes: number[];
  weights?: number[];
}

export interface PainGateInput {
  reports: Array<{ location: string; score: number; altersGait: boolean }>;
}

export interface DetrainingInput {
  daysSinceLastActivity: number;
  avgMinutesBeforeGap: number;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function longRunCapMinutes(
  previousLongRun: number,
  weeklyMinutes: number,
  level: Level,
): number {
  const maxShare = level === "beginner" ? 0.3 : 0.35;
  const capFromWeekly = Math.floor(weeklyMinutes * maxShare);
  const capFromProgression = Math.floor(previousLongRun * 1.1);
  return Math.min(capFromWeekly, capFromProgression, weeklyMinutes);
}

function distributeSessions(
  weekStart: Date,
  weekdays: number[],
  count: number,
  weeklyMinutes: number,
  longRunMinutes: number,
  level: Level,
  isRecovery: boolean,
  weekIndex: number,
): PlannedSessionDraft[] {
  const sorted = [...weekdays].sort((a, b) => a - b).slice(0, count);
  const sessions: PlannedSessionDraft[] = [];
  const easyTotal = Math.max(0, weeklyMinutes - longRunMinutes);
  const easyPerSession =
    count > 1 ? Math.floor(easyTotal / (count - 1)) : easyTotal;

  sorted.forEach((wd, idx) => {
    const dayOffset = (wd - weekStart.getUTCDay() + 7) % 7;
    const scheduledDate = addDays(weekStart, dayOffset);
    const isLong = idx === sorted.length - 1 && longRunMinutes > 0;

    if (isLong) {
      sessions.push({
        scheduledDate,
        sequence: idx,
        workoutType: "long",
        targetDurationSec: longRunMinutes * 60,
        targetZone: "zone2",
        runWalkPattern: null,
      });
      return;
    }

    const minutes = isLong ? longRunMinutes : easyPerSession;
    if (minutes <= 0) return;

    if (level === "beginner" && weekIndex <= 2 && !isRecovery) {
      sessions.push({
        scheduledDate,
        sequence: idx,
        workoutType: "runWalk",
        targetDurationSec: minutes * 60,
        targetZone: "zone1",
        runWalkPattern: { runMin: 2, walkMin: 2, repeats: Math.ceil(minutes / 4) },
      });
    } else if (
      level === "regular" &&
      weekIndex >= 4 &&
      idx === 0 &&
      !isRecovery &&
      weekIndex % 4 !== 0
    ) {
      sessions.push({
        scheduledDate,
        sequence: idx,
        workoutType: "tempo",
        targetDurationSec: Math.min(minutes, 40) * 60,
        targetZone: "zone3",
        runWalkPattern: null,
      });
    } else {
      sessions.push({
        scheduledDate,
        sequence: idx,
        workoutType: "easy",
        targetDurationSec: minutes * 60,
        targetZone: "zone2",
        runWalkPattern: null,
      });
    }
  });

  return sessions;
}

export function generatePlan(input: PlanEngineInput): PlanEngineOutput {
  const adjustments: PlanEngineOutput["adjustments"] = [];
  const weeks: PlanWeekDraft[] = [];
  let weeklyMinutes = Math.max(15, input.currentWeeklyMinutes);
  let longRunMinutes = Math.max(
    10,
    Math.min(input.currentLongRunMinutes, longRunCapMinutes(input.currentLongRunMinutes, weeklyMinutes, input.level)),
  );
  let blockPeak = weeklyMinutes;
  let weekInBlock = 0;

  for (let w = 0; w < input.totalWeeks; w++) {
    const weekIndex = w + 1;
    const blockIndex = Math.floor(w / (input.buildWeeks + 1)) + 1;
    const isRecoveryWeek = weekInBlock === input.buildWeeks;

    if (isRecoveryWeek) {
      weeklyMinutes = Math.floor(
        blockPeak * (1 - input.recoveryReductionPct / 100),
      );
      longRunMinutes = Math.floor(longRunMinutes * 0.75);
      weekInBlock = 0;
    } else if (w > 0) {
      const hasQualityNext =
        input.level === "regular" && weekIndex >= 4 && weekIndex % 4 !== 0;
      if (!hasQualityNext) {
        weeklyMinutes = Math.floor(
          weeklyMinutes * (1 + input.progressionRatePct / 100),
        );
      }
      longRunMinutes = longRunCapMinutes(
        longRunMinutes,
        weeklyMinutes,
        input.level,
      );
      blockPeak = Math.max(blockPeak, weeklyMinutes);
      weekInBlock++;
    }

    const weekStartDate = addDays(input.startDate, w * 7);
    const sessions = distributeSessions(
      weekStartDate,
      input.availableWeekdays,
      input.daysPerWeek,
      weeklyMinutes,
      longRunMinutes,
      input.level,
      isRecoveryWeek,
      weekIndex,
    );

    weeks.push({
      weekIndex,
      blockIndex,
      weekStartDate,
      isRecoveryWeek,
      targetMinutes: weeklyMinutes,
      targetLongRunMinutes: longRunMinutes,
      targetEasySharePct: 80,
      sessions,
    });
  }

  return { weeks, adjustments };
}

export function reconcileNextWeekMinutes(input: ReconcileInput): number {
  const weights = input.weights ?? [0.5, 0.3, 0.2];
  const actuals = input.actualWeekMinutes.slice(-3);
  while (actuals.length < 3) {
    actuals.unshift(input.plannedWeekMinutes);
  }
  const weighted =
    actuals[0] * (weights[2] ?? 0.2) +
    actuals[1] * (weights[1] ?? 0.3) +
    actuals[2] * (weights[0] ?? 0.5);
  return Math.round(weighted);
}

export function evaluatePainGate(input: PainGateInput): {
  deloadPct: number;
  blockQuality: boolean;
  messageKey: string;
} {
  const byLocation = new Map<string, number[]>();
  for (const r of input.reports) {
    const list = byLocation.get(r.location) ?? [];
    list.push(r.score);
    byLocation.set(r.location, list);
  }

  for (const [, scores] of byLocation) {
    const recent = scores.slice(-2);
    if (recent.length >= 2 && recent.every((s) => s >= 3)) {
      return { deloadPct: 30, blockQuality: true, messageKey: "pain.deload" };
    }
  }

  if (input.reports.some((r) => r.score >= 6 || r.altersGait)) {
    return { deloadPct: 50, blockQuality: true, messageKey: "pain.stop" };
  }

  return { deloadPct: 0, blockQuality: false, messageKey: "pain.none" };
}

export function evaluateDetraining(input: DetrainingInput): {
  factor: number;
  rebaseline: boolean;
  messageKey: string;
} {
  if (input.daysSinceLastActivity >= 21) {
    return { factor: 0, rebaseline: true, messageKey: "detrain.rebaseline" };
  }
  if (input.daysSinceLastActivity >= 14) {
    return { factor: 0.7, rebaseline: false, messageKey: "detrain.severe" };
  }
  if (input.daysSinceLastActivity >= 7) {
    return { factor: 0.8, rebaseline: false, messageKey: "detrain.mild" };
  }
  return { factor: 1, rebaseline: false, messageKey: "detrain.none" };
}

export function computeEwmaAcwr(
  dailyLoads: number[],
  acuteDays = 7,
  chronicDays = 28,
): number | null {
  if (dailyLoads.length < chronicDays) return null;

  const lambdaAcute = 2 / (acuteDays + 1);
  const lambdaChronic = 2 / (chronicDays + 1);

  let acute = dailyLoads[0];
  let chronic = dailyLoads[0];

  for (let i = 1; i < dailyLoads.length; i++) {
    acute = dailyLoads[i] * lambdaAcute + acute * (1 - lambdaAcute);
    chronic = dailyLoads[i] * lambdaChronic + chronic * (1 - lambdaChronic);
  }

  if (chronic === 0) return null;
  return acute / chronic;
}

export function intensityShareFromRpe(
  sessions: Array<{ minutes: number; rpe: number | null }>,
): { easyPct: number; hardPct: number } {
  let easy = 0;
  let hard = 0;
  let total = 0;
  for (const s of sessions) {
    if (!s.rpe) continue;
    total += s.minutes;
    if (s.rpe <= 4) easy += s.minutes;
    else if (s.rpe >= 7) hard += s.minutes;
  }
  if (total === 0) return { easyPct: 0, hardPct: 0 };
  return { easyPct: (easy / total) * 100, hardPct: (hard / total) * 100 };
}

export function tanakaHrMax(age: number): number {
  return Math.round(208 - 0.7 * age);
}

export function computeEfficiencyFactor(
  distanceM: number,
  durationSec: number,
  avgHr: number,
): number {
  const speedMps = distanceM / durationSec;
  return Number((speedMps / avgHr).toFixed(3));
}

export function heatAdvisoryFromDewPoint(dewPointC: number): {
  level: "ok" | "caution" | "effort_only";
  paceAdjustmentPct: number;
  messageKey: string;
} {
  if (dewPointC >= 23) {
    return { level: "effort_only", paceAdjustmentPct: 8, messageKey: "heat.effortOnly" };
  }
  if (dewPointC >= 21) {
    return { level: "caution", paceAdjustmentPct: 5, messageKey: "heat.caution" };
  }
  if (dewPointC >= 18) {
    return { level: "caution", paceAdjustmentPct: 3, messageKey: "heat.mild" };
  }
  return { level: "ok", paceAdjustmentPct: 0, messageKey: "heat.ok" };
}
