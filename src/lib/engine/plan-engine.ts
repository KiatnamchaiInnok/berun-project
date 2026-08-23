export const ENGINE_VERSION = "2.0.0";

export type Level = "beginner" | "returning" | "regular";
export type TrainingPhase = "base" | "build";
export type WorkoutType =
  | "easy"
  | "long"
  | "tempo"
  | "runWalk"
  | "rest"
  | "strides"
  | "fartlek"
  | "intervals"
  | "strength";
export type IntensityZone = "zone1" | "zone2" | "zone3" | "zone4" | "zone5";

export interface ZoneRange {
  min: number;
  max: number;
}

export interface HrZones {
  zone1: ZoneRange;
  zone2: ZoneRange;
  zone3: ZoneRange;
  zone4: ZoneRange;
  zone5: ZoneRange;
  method: "karvonen" | "hrmax";
}

export interface RunWalkPattern {
  runMin: number;
  walkMin: number;
  repeats: number;
}

export interface StridesDetail {
  count: number;
  durationSec: number;
  restSec: number;
}

export interface FartlekDetail {
  segments: Array<{ fastSec: number; easySec: number }>;
  repeats: number;
}

export interface IntervalsDetail {
  repDistanceM: number;
  reps: number;
  restSec: number;
  targetZone: IntensityZone;
}

export interface TempoDetail {
  steadyMinutes: number;
  warmupMin: number;
  cooldownMin: number;
}

export interface StrengthExercise {
  nameKey: string;
  sets: number;
  reps: number;
  isUnilateral: boolean;
  isTimed: boolean;
  categoryKey: "lower" | "core" | "plyo";
}

export interface StrengthDetail {
  exercises: StrengthExercise[];
  estimatedMinutes: number;
  focusKey: "foundation" | "power" | "maintenance";
}

export type WorkoutDetail =
  | StridesDetail
  | FartlekDetail
  | IntervalsDetail
  | TempoDetail
  | StrengthDetail;

export type SegmentType = "warmup" | "activation" | "main" | "rest" | "cooldown";

export interface WorkoutSegment {
  type: SegmentType;
  durationMin: number;
  zone: IntensityZone | null;
  rpe: string;
  labelKey: string;
  detailKey?: string;
  detailParams?: Record<string, string | number>;
}

export interface WorkoutSegments {
  segments: WorkoutSegment[];
  totalDurationMin: number;
  variant?: "running" | "strength";
}

export interface WorkoutDetailSummary {
  key: string;
  params: Record<string, string | number>;
}

export interface PlannedSessionDraft {
  scheduledDate: Date;
  sequence: number;
  workoutType: WorkoutType;
  targetDurationSec: number;
  targetZone: IntensityZone | null;
  runWalkPattern: RunWalkPattern | null;
  workoutDetail: WorkoutDetail | null;
}

export interface PlanWeekDraft {
  weekIndex: number;
  blockIndex: number;
  weekStartDate: Date;
  isRecoveryWeek: boolean;
  phase: TrainingPhase;
  targetMinutes: number;
  targetLongRunMinutes: number;
  targetEasySharePct: number;
  sessions: PlannedSessionDraft[];
}

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
  lastWeekAvgRpe?: number | null;
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
  level?: Level;
  phase?: TrainingPhase;
  lastWeekAvgRpe?: number | null;
}

export interface PainGateInput {
  reports: Array<{ location: string; score: number; altersGait: boolean }>;
}

export interface DetrainingInput {
  daysSinceLastActivity: number;
  avgMinutesBeforeGap: number;
}

const ZONE_BOUNDARIES: Array<{ minPct: number; maxPct: number }> = [
  { minPct: 50, maxPct: 60 },
  { minPct: 60, maxPct: 70 },
  { minPct: 70, maxPct: 80 },
  { minPct: 80, maxPct: 90 },
  { minPct: 90, maxPct: 100 },
];

const STEP_BY_LEVEL: Record<
  Level,
  { base: number; build: number; maxWeekly: number }
> = {
  beginner: { base: 10, build: 5, maxWeekly: 150 },
  returning: { base: 15, build: 10, maxWeekly: 240 },
  regular: { base: 20, build: 10, maxWeekly: 360 },
};

const RPE_GUIDE: Record<WorkoutType, string> = {
  runWalk: "2-3",
  easy: "3-4",
  long: "3-5",
  strides: "7-8",
  fartlek: "5-7",
  tempo: "6-7",
  intervals: "8-9",
  rest: "1-2",
  strength: "4-6",
};

const HARD_RUNNING_TYPES: WorkoutType[] = ["long", "tempo", "intervals", "fartlek"];

const MAX_STRENGTH_DAYS: Record<
  Level,
  { normal: number; recovery: number }
> = {
  beginner: { normal: 2, recovery: 1 },
  returning: { normal: 2, recovery: 1 },
  regular: { normal: 3, recovery: 1 },
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function zoneFromPct(
  hrMax: number,
  restingHr: number | undefined,
  minPct: number,
  maxPct: number,
): ZoneRange {
  if (restingHr != null && restingHr > 0 && restingHr < hrMax) {
    const hrr = hrMax - restingHr;
    return {
      min: Math.round(hrr * (minPct / 100) + restingHr),
      max: Math.round(hrr * (maxPct / 100) + restingHr),
    };
  }
  return {
    min: Math.round(hrMax * (minPct / 100)),
    max: Math.round(hrMax * (maxPct / 100)),
  };
}

export function computeHrZones(
  hrMax: number,
  restingHr?: number | null,
): HrZones | null {
  if (!hrMax || hrMax <= 0) return null;

  const useKarvonen =
    restingHr != null && restingHr > 0 && restingHr < hrMax;
  const method = useKarvonen ? "karvonen" : "hrmax";
  const resting = useKarvonen ? restingHr : undefined;

  const zones = {} as HrZones;
  for (let i = 0; i < ZONE_BOUNDARIES.length; i++) {
    const key = `zone${i + 1}` as keyof Omit<HrZones, "method">;
    zones[key] = zoneFromPct(
      hrMax,
      resting,
      ZONE_BOUNDARIES[i].minPct,
      ZONE_BOUNDARIES[i].maxPct,
    );
  }
  zones.method = method;
  return zones;
}

export function getRpeGuide(workoutType: WorkoutType): string {
  return RPE_GUIDE[workoutType] ?? "3-4";
}

export function formatZoneDisplay(
  zone: IntensityZone | null,
  hrZones: HrZones | null,
  workoutType: WorkoutType,
): string {
  if (!zone) return getRpeGuide(workoutType);
  const zoneKey = zone as keyof Omit<HrZones, "method">;
  if (hrZones?.[zoneKey]) {
    const range = hrZones[zoneKey];
    return `${range.min}-${range.max} bpm`;
  }
  return `RPE ${getRpeGuide(workoutType)}`;
}

export function assignPhase(
  weekIndex: number,
  totalWeeks: 8 | 12,
): TrainingPhase {
  const baseWeeks = totalWeeks === 8 ? 5 : 7;
  return weekIndex <= baseWeeks ? "base" : "build";
}

export function rpeAdjustedStep(
  baseStep: number,
  avgRpe: number | null | undefined,
): number {
  if (avgRpe == null) return baseStep;
  if (avgRpe <= 4) return Math.round(baseStep * 1.25);
  if (avgRpe <= 6) return baseStep;
  if (avgRpe <= 8) return Math.round(baseStep * 0.5);
  return 0;
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

function isQualityWorkout(type: WorkoutType): boolean {
  return (
    type === "tempo" ||
    type === "intervals" ||
    type === "fartlek" ||
    type === "strides"
  );
}

function buildStridesDetail(): StridesDetail {
  return { count: 6, durationSec: 25, restSec: 60 };
}

function buildFartlekDetail(): FartlekDetail {
  return {
    segments: [{ fastSec: 60, easySec: 90 }],
    repeats: 6,
  };
}

function buildIntervalsDetail(level: Level): IntervalsDetail {
  if (level === "regular") {
    return { repDistanceM: 800, reps: 5, restSec: 90, targetZone: "zone4" };
  }
  return { repDistanceM: 400, reps: 6, restSec: 90, targetZone: "zone4" };
}

function buildTempoDetail(minutes: number): TempoDetail {
  const steady = Math.min(Math.max(15, minutes - 20), 30);
  return { steadyMinutes: steady, warmupMin: 10, cooldownMin: 10 };
}

function strengthExercise(
  nameKey: string,
  sets: number,
  reps: number,
  categoryKey: "lower" | "core" | "plyo",
  isUnilateral = false,
  isTimed = false,
): StrengthExercise {
  return { nameKey, sets, reps, isUnilateral, isTimed, categoryKey };
}

function estimateStrengthMinutes(exercises: StrengthExercise[]): number {
  let total = 5; // warmup
  for (const ex of exercises) {
    const workPerSet = ex.isTimed ? ex.reps / 60 + 0.5 : 1.5;
    total += ex.sets * workPerSet;
  }
  total += 5; // cooldown
  return Math.max(15, Math.round(total));
}

export function buildStrengthProgram(
  level: Level,
  phase: TrainingPhase,
  isRecovery: boolean,
): StrengthDetail {
  const adjustSets = (sets: number) => (isRecovery ? Math.min(2, sets) : sets);
  const focusKey: StrengthDetail["focusKey"] = isRecovery
    ? "maintenance"
    : phase === "base"
      ? "foundation"
      : "power";

  let exercises: StrengthExercise[] = [];

  if (phase === "base") {
    if (level === "beginner") {
      exercises = [
        strengthExercise("gluteBridge", adjustSets(2), 15, "lower"),
        strengthExercise("squat", adjustSets(2), 12, "lower"),
        strengthExercise("reverseLunge", adjustSets(2), 10, "lower", true),
        strengthExercise("plank", adjustSets(2), 30, "core", false, true),
        strengthExercise("calfRaise", adjustSets(2), 15, "lower"),
      ];
    } else if (level === "returning") {
      exercises = [
        strengthExercise("singleLegGluteBridge", adjustSets(3), 12, "lower", true),
        strengthExercise("gobletSquat", adjustSets(3), 10, "lower"),
        strengthExercise("walkingLunge", adjustSets(3), 10, "lower", true),
        strengthExercise("deadBug", adjustSets(3), 10, "core", true),
        strengthExercise("singleLegCalfRaise", adjustSets(3), 12, "lower", true),
        strengthExercise("sidePlank", adjustSets(2), 20, "core", true, true),
      ];
    } else {
      exercises = [
        strengthExercise("hipThrust", adjustSets(3), 10, "lower"),
        strengthExercise("bulgarianSplitSquat", adjustSets(3), 8, "lower", true),
        strengthExercise("singleLegRDL", adjustSets(3), 8, "lower", true),
        strengthExercise("pallofPress", adjustSets(3), 10, "core", true),
        strengthExercise("calfRaise", adjustSets(3), 8, "lower", true),
        strengthExercise("nordicCurl", adjustSets(3), 6, "lower"),
      ];
    }
  } else if (level === "beginner") {
    exercises = [
      strengthExercise("gluteBridge", adjustSets(2), 15, "lower"),
      strengthExercise("squat", adjustSets(2), 12, "lower"),
      strengthExercise("reverseLunge", adjustSets(2), 10, "lower", true),
      strengthExercise("plank", adjustSets(2), 30, "core", false, true),
      strengthExercise("calfRaise", adjustSets(2), 15, "lower"),
    ];
  } else if (level === "returning") {
    exercises = [
      strengthExercise("gobletSquat", adjustSets(3), 8, "lower"),
      strengthExercise("walkingLunge", adjustSets(3), 8, "lower", true),
      strengthExercise("singleLegRDL", adjustSets(3), 8, "lower", true),
      strengthExercise("boxStepUp", adjustSets(3), 8, "lower", true),
      strengthExercise("singleLegCalfRaise", adjustSets(3), 10, "lower", true),
      strengthExercise("sidePlankHipDip", adjustSets(2), 10, "core", true),
    ];
  } else {
    exercises = [
      strengthExercise("gobletSquat", adjustSets(3), 8, "lower"),
      strengthExercise("walkingLunge", adjustSets(3), 8, "lower", true),
      strengthExercise("singleLegRDL", adjustSets(3), 8, "lower", true),
      strengthExercise("boxStepUp", adjustSets(3), 8, "lower", true),
      strengthExercise("singleLegCalfRaise", adjustSets(3), 10, "lower", true),
      strengthExercise("sidePlankHipDip", adjustSets(2), 10, "core", true),
    ];
    if (!isRecovery) {
      exercises.push(
        strengthExercise("boxJump", adjustSets(3), 5, "plyo"),
        strengthExercise("singleLegHop", adjustSets(3), 5, "plyo", true),
      );
    }
  }

  return {
    exercises,
    estimatedMinutes: estimateStrengthMinutes(exercises),
    focusKey,
  };
}

function isHardRunningWorkout(type: WorkoutType): boolean {
  return HARD_RUNNING_TYPES.includes(type);
}

function weekdayFromDate(date: Date): number {
  return date.getUTCDay();
}

function nextWeekday(weekday: number): number {
  return (weekday + 1) % 7;
}

function pickStrengthWeekdays(
  restWeekdays: number[],
  hardRunningWeekdays: Set<number>,
  maxStrength: number,
): Set<number> {
  if (restWeekdays.length === 0 || maxStrength <= 0) {
    return new Set();
  }

  const eligible = restWeekdays.filter(
    (wd) => !hardRunningWeekdays.has(nextWeekday(wd)),
  );
  const maxAssignable = Math.max(0, restWeekdays.length - 1);
  const count = Math.min(maxStrength, eligible.length, maxAssignable);

  return new Set(eligible.sort((a, b) => a - b).slice(0, count));
}

function pickWorkoutForSlot(
  slotIndex: number,
  totalSlots: number,
  level: Level,
  phase: TrainingPhase,
  weekIndex: number,
  isRecovery: boolean,
): WorkoutType {
  if (isRecovery) {
    return slotIndex === totalSlots - 1 ? "long" : "easy";
  }

  const isLongSlot = slotIndex === totalSlots - 1;

  if (isLongSlot) return "long";

  if (phase === "base") {
    if (level === "beginner" && weekIndex <= 2) {
      return "runWalk";
    }
    if (slotIndex === 0) {
      return weekIndex >= 3 ? "strides" : "easy";
    }
    return "easy";
  }

  // Build phase
  if (slotIndex === 0) {
    if (level === "beginner") return "fartlek";
    if (level === "returning") return "tempo";
    return "tempo";
  }
  if (slotIndex === 1 && level === "regular" && totalSlots >= 3) {
    return "intervals";
  }
  return "easy";
}

function sessionMinutesForType(
  workoutType: WorkoutType,
  slotIndex: number,
  totalSlots: number,
  weeklyMinutes: number,
  longRunMinutes: number,
): number {
  if (workoutType === "long") return longRunMinutes;

  const easyTotal = Math.max(0, weeklyMinutes - longRunMinutes);
  const easySlots = Math.max(1, totalSlots - 1);
  const baseEasy = Math.floor(easyTotal / easySlots);

  switch (workoutType) {
    case "strides":
      return Math.max(25, baseEasy);
    case "fartlek":
      return Math.max(30, Math.min(baseEasy, 45));
    case "tempo":
      return Math.max(35, Math.min(baseEasy, 50));
    case "intervals":
      return Math.max(40, Math.min(baseEasy, 55));
    case "runWalk":
      return Math.max(20, baseEasy);
    default:
      return baseEasy;
  }
}

function createSessionDraft(
  scheduledDate: Date,
  sequence: number,
  workoutType: WorkoutType,
  minutes: number,
  level: Level,
  phase?: TrainingPhase,
  isRecovery?: boolean,
): PlannedSessionDraft {
  const zoneMap: Record<WorkoutType, IntensityZone | null> = {
    runWalk: "zone1",
    easy: "zone2",
    long: "zone2",
    strides: "zone4",
    fartlek: "zone3",
    tempo: "zone3",
    intervals: "zone4",
    rest: null,
    strength: null,
  };

  let runWalkPattern: RunWalkPattern | null = null;
  let workoutDetail: WorkoutDetail | null = null;

  if (workoutType === "runWalk") {
    runWalkPattern = {
      runMin: 2,
      walkMin: 2,
      repeats: Math.ceil(minutes / 4),
    };
  } else if (workoutType === "strides") {
    workoutDetail = buildStridesDetail();
  } else if (workoutType === "fartlek") {
    workoutDetail = buildFartlekDetail();
  } else if (workoutType === "intervals") {
    workoutDetail = buildIntervalsDetail(level);
  } else if (workoutType === "tempo") {
    workoutDetail = buildTempoDetail(minutes);
  } else if (workoutType === "strength" && phase != null && isRecovery != null) {
    workoutDetail = buildStrengthProgram(level, phase, isRecovery);
  }

  return {
    scheduledDate,
    sequence,
    workoutType,
    targetDurationSec: minutes * 60,
    targetZone: zoneMap[workoutType],
    runWalkPattern,
    workoutDetail,
  };
}

function createRestSessionDraft(
  scheduledDate: Date,
  sequence: number,
): PlannedSessionDraft {
  return {
    scheduledDate,
    sequence,
    workoutType: "rest",
    targetDurationSec: 0,
    targetZone: null,
    runWalkPattern: null,
    workoutDetail: null,
  };
}

function distributeSessions(
  weekStart: Date,
  weekdays: number[],
  count: number,
  weeklyMinutes: number,
  longRunMinutes: number,
  level: Level,
  phase: TrainingPhase,
  isRecovery: boolean,
  weekIndex: number,
): PlannedSessionDraft[] {
  const sorted = [...weekdays].sort((a, b) => a - b).slice(0, count);
  const runningByWeekday = new Map<
    number,
    { workoutType: WorkoutType; minutes: number }
  >();

  sorted.forEach((wd, idx) => {
    const workoutType = pickWorkoutForSlot(
      idx,
      sorted.length,
      level,
      phase,
      weekIndex,
      isRecovery,
    );
    const minutes = sessionMinutesForType(
      workoutType,
      idx,
      sorted.length,
      weeklyMinutes,
      longRunMinutes,
    );
    if (minutes <= 0) return;
    runningByWeekday.set(wd, { workoutType, minutes });
  });

  const hardRunningWeekdays = new Set(
    [...runningByWeekday.entries()]
      .filter(([, v]) => isHardRunningWorkout(v.workoutType))
      .map(([wd]) => wd),
  );

  const restWeekdays = [0, 1, 2, 3, 4, 5, 6].filter((wd) => !sorted.includes(wd));
  const maxStrength = isRecovery
    ? MAX_STRENGTH_DAYS[level].recovery
    : MAX_STRENGTH_DAYS[level].normal;
  const strengthWeekdays = pickStrengthWeekdays(
    restWeekdays,
    hardRunningWeekdays,
    maxStrength,
  );

  const sessions: PlannedSessionDraft[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const scheduledDate = addDays(weekStart, dayOffset);
    const wd = weekdayFromDate(scheduledDate);
    const running = runningByWeekday.get(wd);

    if (running) {
      sessions.push(
        createSessionDraft(
          scheduledDate,
          dayOffset,
          running.workoutType,
          running.minutes,
          level,
        ),
      );
    } else if (strengthWeekdays.has(wd)) {
      const detail = buildStrengthProgram(level, phase, isRecovery);
      sessions.push(
        createSessionDraft(
          scheduledDate,
          dayOffset,
          "strength",
          detail.estimatedMinutes,
          level,
          phase,
          isRecovery,
        ),
      );
    } else {
      sessions.push(createRestSessionDraft(scheduledDate, dayOffset));
    }
  }

  return sessions;
}

function weekHasQualityIncrease(
  sessions: PlannedSessionDraft[],
  previousHadQuality: boolean,
): boolean {
  const hasQuality = sessions.some((s) => isQualityWorkout(s.workoutType));
  return hasQuality && !previousHadQuality;
}

export function generatePlan(input: PlanEngineInput): PlanEngineOutput {
  const adjustments: PlanEngineOutput["adjustments"] = [];
  const weeks: PlanWeekDraft[] = [];
  let weeklyMinutes = Math.max(15, input.currentWeeklyMinutes);
  let longRunMinutes = Math.max(
    10,
    Math.min(
      input.currentLongRunMinutes,
      longRunCapMinutes(
        input.currentLongRunMinutes,
        weeklyMinutes,
        input.level,
      ),
    ),
  );
  let blockPeak = weeklyMinutes;
  let weekInBlock = 0;
  let previousHadQuality = false;
  let lastAvgRpe = input.lastWeekAvgRpe ?? null;

  const steps = STEP_BY_LEVEL[input.level];

  for (let w = 0; w < input.totalWeeks; w++) {
    const weekIndex = w + 1;
    const blockIndex = Math.floor(w / (input.buildWeeks + 1)) + 1;
    const isRecoveryWeek = weekInBlock === input.buildWeeks;
    const phase = assignPhase(weekIndex, input.totalWeeks);

    if (isRecoveryWeek) {
      weeklyMinutes = Math.floor(
        blockPeak * (1 - input.recoveryReductionPct / 100),
      );
      longRunMinutes = Math.floor(longRunMinutes * 0.75);
      weekInBlock = 0;
    } else if (w > 0) {
      const baseStep = phase === "base" ? steps.base : steps.build;
      const step = rpeAdjustedStep(baseStep, lastAvgRpe);
      const nextPhase = assignPhase(weekIndex, input.totalWeeks);
      const wouldAddQuality =
        nextPhase === "build" &&
        !previousHadQuality &&
        input.level !== "beginner";

      if (wouldAddQuality) {
        // No volume increase when introducing quality in build phase
      } else {
        weeklyMinutes = Math.min(
          steps.maxWeekly,
          weeklyMinutes + step,
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
      phase,
      isRecoveryWeek,
      weekIndex,
    );

    if (weekHasQualityIncrease(sessions, previousHadQuality)) {
      adjustments.push({
        rule: "noDoubleProgression",
        messageKey: "plan.noDoubleProgression",
        input: { weekIndex },
        outcome: { volumeHeld: true },
      });
    }
    previousHadQuality = sessions.some((s) => isQualityWorkout(s.workoutType));

    weeks.push({
      weekIndex,
      blockIndex,
      weekStartDate,
      isRecoveryWeek,
      phase,
      targetMinutes: weeklyMinutes,
      targetLongRunMinutes: longRunMinutes,
      targetEasySharePct: phase === "base" ? 85 : 80,
      sessions,
    });

    lastAvgRpe = null;
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
  const reconciled = Math.round(weighted);

  if (input.level && input.phase) {
    const steps = STEP_BY_LEVEL[input.level];
    const baseStep = input.phase === "base" ? steps.base : steps.build;
    const step = rpeAdjustedStep(baseStep, input.lastWeekAvgRpe);
    return Math.min(steps.maxWeekly, reconciled + step);
  }

  return reconciled;
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
    return {
      level: "effort_only",
      paceAdjustmentPct: 8,
      messageKey: "heat.effortOnly",
    };
  }
  if (dewPointC >= 21) {
    return {
      level: "caution",
      paceAdjustmentPct: 5,
      messageKey: "heat.caution",
    };
  }
  if (dewPointC >= 18) {
    return { level: "caution", paceAdjustmentPct: 3, messageKey: "heat.mild" };
  }
  return { level: "ok", paceAdjustmentPct: 0, messageKey: "heat.ok" };
}

function segment(
  type: SegmentType,
  durationMin: number,
  zone: IntensityZone | null,
  rpe: string,
  labelKey: string,
  detailKey?: string,
  detailParams?: Record<string, string | number>,
): WorkoutSegment {
  return {
    type,
    durationMin: Math.max(1, Math.round(durationMin)),
    zone,
    rpe,
    labelKey,
    detailKey,
    detailParams,
  };
}

function isStridesDetail(d: WorkoutDetail): d is StridesDetail {
  return "count" in d && "durationSec" in d;
}

function isFartlekDetail(d: WorkoutDetail): d is FartlekDetail {
  return "repeats" in d && "segments" in d;
}

function isIntervalsDetail(d: WorkoutDetail): d is IntervalsDetail {
  return "reps" in d && "repDistanceM" in d;
}

function isTempoDetail(d: WorkoutDetail): d is TempoDetail {
  return "steadyMinutes" in d && "warmupMin" in d;
}

function isStrengthDetail(d: WorkoutDetail): d is StrengthDetail {
  return "exercises" in d && "focusKey" in d;
}

function categoryMinutes(exercises: StrengthExercise[], category: "lower" | "core" | "plyo"): number {
  let total = 0;
  for (const ex of exercises) {
    if (ex.categoryKey !== category) continue;
    const workPerSet = ex.isTimed ? ex.reps / 60 + 0.5 : 1.5;
    total += ex.sets * workPerSet;
  }
  return Math.max(category === "plyo" ? 0 : 1, Math.round(total));
}

export function buildWorkoutSegments(
  workoutType: WorkoutType,
  detail: WorkoutDetail | null,
  totalMinutes: number,
): WorkoutSegments | null {
  if (workoutType === "rest") return null;

  const total = Math.max(1, Math.round(totalMinutes));
  const segments: WorkoutSegment[] = [];

  switch (workoutType) {
    case "easy":
    case "long": {
      const warmup = 5;
      const cooldown = 5;
      const mainZone: IntensityZone = "zone2";
      segments.push(
        segment("warmup", warmup, "zone1", "2-3", "warmup"),
        segment("main", total - warmup - cooldown, mainZone, getRpeGuide(workoutType), "main"),
        segment("cooldown", cooldown, "zone1", "2-3", "cooldown"),
      );
      break;
    }
    case "runWalk": {
      const warmup = 5;
      const cooldown = 5;
      segments.push(
        segment("warmup", warmup, "zone1", "2-3", "warmup"),
        segment("main", total - warmup - cooldown, "zone1", getRpeGuide(workoutType), "main"),
        segment("cooldown", cooldown, "zone1", "2-3", "cooldown"),
      );
      break;
    }
    case "strides": {
      const warmup = 10;
      const cooldown = 5;
      const strides = detail && isStridesDetail(detail) ? detail : buildStridesDetail();
      const strideWorkMin = Math.max(1, Math.ceil((strides.count * strides.durationSec) / 60));
      const restMin = Math.max(1, Math.ceil((strides.count * strides.restSec) / 60));
      const easyMin = Math.max(1, total - warmup - cooldown - strideWorkMin - restMin);
      segments.push(
        segment("warmup", warmup, "zone2", "3-4", "warmup"),
        segment("main", easyMin, "zone2", "3-4", "main"),
        segment("main", strideWorkMin, "zone4", "7-8", "strides", "stridesWork", {
          count: strides.count,
          duration: strides.durationSec,
        }),
        segment("rest", restMin, "zone1", "2-3", "rest", "stridesRest", {
          count: strides.count,
          rest: strides.restSec,
        }),
        segment("cooldown", cooldown, "zone1", "2-3", "cooldown"),
      );
      break;
    }
    case "fartlek": {
      const warmup = 10;
      const activation = 2;
      const cooldown = 10;
      const fartlek = detail && isFartlekDetail(detail) ? detail : buildFartlekDetail();
      const seg = fartlek.segments[0];
      segments.push(
        segment("warmup", warmup, "zone2", "3-4", "warmup"),
        segment("activation", activation, "zone4", "7-8", "activation", "activationStrides", {
          count: 3,
        }),
        segment(
          "main",
          total - warmup - activation - cooldown,
          "zone3",
          getRpeGuide(workoutType),
          "main",
          "fartlekDetail",
          {
            repeats: fartlek.repeats,
            fast: seg.fastSec,
            easy: seg.easySec,
          },
        ),
        segment("cooldown", cooldown, "zone1", "2-3", "cooldown"),
      );
      break;
    }
    case "tempo": {
      const tempo = detail && isTempoDetail(detail) ? detail : buildTempoDetail(total);
      const warmup = tempo.warmupMin;
      const activation = 2;
      const cooldown = tempo.cooldownMin;
      segments.push(
        segment("warmup", warmup, "zone2", "3-4", "warmup"),
        segment("activation", activation, "zone4", "7-8", "activation", "activationStrides", {
          count: 3,
        }),
        segment(
          "main",
          tempo.steadyMinutes,
          "zone3",
          getRpeGuide(workoutType),
          "main",
          "tempoDetail",
          { minutes: tempo.steadyMinutes },
        ),
        segment("cooldown", cooldown, "zone1", "2-3", "cooldown"),
      );
      break;
    }
    case "intervals": {
      const warmup = 15;
      const activation = 2;
      const cooldown = 12;
      const intervals = detail && isIntervalsDetail(detail) ? detail : buildIntervalsDetail("beginner");
      segments.push(
        segment("warmup", warmup, "zone2", "3-4", "warmup"),
        segment("activation", activation, "zone4", "7-8", "activation", "activationStrides", {
          count: 4,
        }),
        segment(
          "main",
          total - warmup - activation - cooldown,
          intervals.targetZone,
          getRpeGuide(workoutType),
          "main",
          "intervalsDetail",
          {
            reps: intervals.reps,
            distance: intervals.repDistanceM,
            rest: intervals.restSec,
          },
        ),
        segment("cooldown", cooldown, "zone1", "2-3", "cooldown"),
      );
      break;
    }
    case "strength": {
      const strength =
        detail && isStrengthDetail(detail)
          ? detail
          : buildStrengthProgram("beginner", "base", false);
      const warmup = 5;
      const cooldown = 5;
      const lowerMin = categoryMinutes(strength.exercises, "lower");
      const coreMin = categoryMinutes(strength.exercises, "core");
      const plyoMin = categoryMinutes(strength.exercises, "plyo");
      segments.push(
        segment("warmup", warmup, null, "2-3", "warmup"),
        segment("main", lowerMin, null, "4-6", "lowerBody"),
        segment("main", coreMin, null, "4-5", "core"),
      );
      if (plyoMin > 0) {
        segments.push(segment("main", plyoMin, null, "6-7", "plyometric"));
      }
      segments.push(segment("cooldown", cooldown, null, "1-2", "stretch"));
      const sum = segments.reduce((acc, s) => acc + s.durationMin, 0);
      if (sum !== total && segments.length > 0) {
        const lowerIdx = segments.findIndex((s) => s.labelKey === "lowerBody");
        if (lowerIdx >= 0) {
          segments[lowerIdx].durationMin += total - sum;
          segments[lowerIdx].durationMin = Math.max(1, segments[lowerIdx].durationMin);
        }
      }
      return { segments, totalDurationMin: total, variant: "strength" };
    }
    default:
      return null;
  }

  const sum = segments.reduce((acc, s) => acc + s.durationMin, 0);
  if (sum !== total && segments.length > 0) {
    const mainIdx = segments.findIndex((s) => s.type === "main");
    if (mainIdx >= 0) {
      segments[mainIdx].durationMin += total - sum;
      segments[mainIdx].durationMin = Math.max(1, segments[mainIdx].durationMin);
    }
  }

  return { segments, totalDurationMin: total };
}

export function formatWorkoutDetailSummary(
  workoutType: WorkoutType,
  detail: WorkoutDetail | null,
): WorkoutDetailSummary | null {
  if (!detail) return null;

  if (workoutType === "strides" && isStridesDetail(detail)) {
    return {
      key: "stridesWork",
      params: { count: detail.count, duration: detail.durationSec },
    };
  }
  if (workoutType === "fartlek" && isFartlekDetail(detail)) {
    const seg = detail.segments[0];
    return {
      key: "fartlekDetail",
      params: { repeats: detail.repeats, fast: seg.fastSec, easy: seg.easySec },
    };
  }
  if (workoutType === "intervals" && isIntervalsDetail(detail)) {
    return {
      key: "intervalsDetail",
      params: {
        reps: detail.reps,
        distance: detail.repDistanceM,
        rest: detail.restSec,
      },
    };
  }
  if (workoutType === "tempo" && isTempoDetail(detail)) {
    return {
      key: "tempoDetail",
      params: { minutes: detail.steadyMinutes },
    };
  }
  if (workoutType === "strength" && isStrengthDetail(detail)) {
    return {
      key: "summary",
      params: {
        count: detail.exercises.length,
        minutes: detail.estimatedMinutes,
      },
    };
  }
  return null;
}

export function zoneColorClass(zone: IntensityZone | null): string {
  switch (zone) {
    case "zone1":
      return "bg-blue-200 dark:bg-blue-900";
    case "zone2":
      return "bg-green-200 dark:bg-green-900";
    case "zone3":
      return "bg-yellow-200 dark:bg-yellow-900";
    case "zone4":
      return "bg-orange-200 dark:bg-orange-900";
    case "zone5":
      return "bg-red-200 dark:bg-red-900";
    default:
      return "bg-muted";
  }
}

const STRENGTH_SEGMENT_COLORS: Record<string, string> = {
  warmup: "bg-purple-200 dark:bg-purple-900",
  lowerBody: "bg-purple-300 dark:bg-purple-800",
  core: "bg-purple-400 dark:bg-purple-700",
  plyometric: "bg-purple-500 dark:bg-purple-600",
  stretch: "bg-purple-200 dark:bg-purple-900",
  cooldown: "bg-purple-200 dark:bg-purple-900",
};

export function segmentColorClass(
  seg: WorkoutSegment,
  variant?: "running" | "strength",
): string {
  if (variant === "strength") {
    return STRENGTH_SEGMENT_COLORS[seg.labelKey] ?? "bg-purple-300 dark:bg-purple-800";
  }
  return zoneColorClass(seg.zone);
}
