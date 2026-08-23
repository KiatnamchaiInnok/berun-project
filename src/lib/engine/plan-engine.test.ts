import { describe, expect, it } from "vitest";
import {
  assignPhase,
  buildWorkoutSegments,
  computeEwmaAcwr,
  computeHrZones,
  evaluateDetraining,
  evaluatePainGate,
  formatWorkoutDetailSummary,
  generatePlan,
  heatAdvisoryFromDewPoint,
  intensityShareFromRpe,
  longRunCapMinutes,
  reconcileNextWeekMinutes,
  rpeAdjustedStep,
  tanakaHrMax,
} from "./plan-engine";

const baseInput = {
  level: "beginner" as const,
  currentWeeklyMinutes: 60,
  currentLongRunMinutes: 20,
  daysPerWeek: 3,
  availableWeekdays: [1, 3, 5],
  totalWeeks: 8 as const,
  progressionRatePct: 10 as const,
  buildWeeks: 3 as const,
  recoveryReductionPct: 25,
  startDate: new Date("2026-01-06"),
};

describe("assignPhase", () => {
  it("assigns base for weeks 1-5 in 8-week plan", () => {
    expect(assignPhase(1, 8)).toBe("base");
    expect(assignPhase(5, 8)).toBe("base");
    expect(assignPhase(6, 8)).toBe("build");
    expect(assignPhase(8, 8)).toBe("build");
  });

  it("assigns base for weeks 1-7 in 12-week plan", () => {
    expect(assignPhase(7, 12)).toBe("base");
    expect(assignPhase(8, 12)).toBe("build");
  });
});

describe("generatePlan", () => {
  it("creates correct number of weeks", () => {
    const result = generatePlan(baseInput);
    expect(result.weeks).toHaveLength(8);
  });

  it("includes recovery weeks", () => {
    const result = generatePlan({
      ...baseInput,
      level: "regular",
      currentWeeklyMinutes: 120,
      currentLongRunMinutes: 45,
      daysPerWeek: 4,
      availableWeekdays: [1, 2, 4, 6],
      totalWeeks: 12,
    });
    const recoveryWeeks = result.weeks.filter((w) => w.isRecoveryWeek);
    expect(recoveryWeeks.length).toBeGreaterThan(0);
  });

  it("assigns base phase to early weeks and build to later weeks", () => {
    const result = generatePlan(baseInput);
    expect(result.weeks[0].phase).toBe("base");
    expect(result.weeks[4].phase).toBe("base");
    expect(result.weeks[5].phase).toBe("build");
  });

  it("beginner base has runWalk early then strides", () => {
    const result = generatePlan(baseInput);
    const week1Types = result.weeks[0].sessions.map((s) => s.workoutType);
    expect(week1Types).toContain("runWalk");

    const week4 = result.weeks.find((w) => w.weekIndex === 4 && !w.isRecoveryWeek);
    expect(week4?.sessions.some((s) => s.workoutType === "strides")).toBe(true);
  });

  it("regular build has tempo and intervals", () => {
    const result = generatePlan({
      ...baseInput,
      level: "regular",
      currentWeeklyMinutes: 120,
      currentLongRunMinutes: 40,
      daysPerWeek: 4,
      availableWeekdays: [1, 2, 4, 6],
      totalWeeks: 12,
    });
    const buildWeeks = result.weeks.filter(
      (w) => w.phase === "build" && !w.isRecoveryWeek,
    );
    expect(buildWeeks.length).toBeGreaterThan(0);
    const types = buildWeeks.flatMap((w) => w.sessions.map((s) => s.workoutType));
    expect(types).toContain("tempo");
    expect(types).toContain("intervals");
  });

  it("recovery weeks have no quality sessions", () => {
    const result = generatePlan({
      ...baseInput,
      level: "regular",
      currentWeeklyMinutes: 120,
      currentLongRunMinutes: 40,
      daysPerWeek: 4,
      availableWeekdays: [1, 2, 4, 6],
    });
    for (const week of result.weeks.filter((w) => w.isRecoveryWeek)) {
      const types = week.sessions.map((s) => s.workoutType);
      expect(types).not.toContain("tempo");
      expect(types).not.toContain("intervals");
      expect(types).not.toContain("fartlek");
    }
  });

  it("uses step loading not flat percentage", () => {
    const result = generatePlan(baseInput);
    const week2 = result.weeks.find((w) => w.weekIndex === 2 && !w.isRecoveryWeek);
    const week3 = result.weeks.find((w) => w.weekIndex === 3 && !w.isRecoveryWeek);
    if (week2 && week3) {
      const diff = week3.targetMinutes - week2.targetMinutes;
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThanOrEqual(15);
    }
  });

  it("stores workout detail for quality sessions", () => {
    const result = generatePlan({
      ...baseInput,
      level: "returning",
      currentWeeklyMinutes: 90,
      currentLongRunMinutes: 30,
      totalWeeks: 8,
    });
    const buildWeek = result.weeks.find(
      (w) => w.phase === "build" && !w.isRecoveryWeek,
    );
    const tempo = buildWeek?.sessions.find((s) => s.workoutType === "tempo");
    expect(tempo?.workoutDetail).toBeTruthy();
    expect(tempo?.workoutDetail).toHaveProperty("steadyMinutes");
  });
});

describe("rpeAdjustedStep", () => {
  it("increases step when RPE is low", () => {
    expect(rpeAdjustedStep(10, 3)).toBe(13);
  });

  it("holds step when RPE is appropriate", () => {
    expect(rpeAdjustedStep(10, 5)).toBe(10);
  });

  it("reduces step when RPE is high", () => {
    expect(rpeAdjustedStep(10, 7)).toBe(5);
  });

  it("holds volume when RPE is very high", () => {
    expect(rpeAdjustedStep(10, 9)).toBe(0);
  });
});

describe("computeHrZones", () => {
  it("uses Karvonen when resting HR is provided", () => {
    const zones = computeHrZones(190, 50);
    expect(zones?.method).toBe("karvonen");
    expect(zones?.zone2.min).toBeGreaterThan(Math.round(190 * 0.6));
    expect(zones?.zone2.max).toBeLessThanOrEqual(Math.round(190 * 0.7 + 50));
  });

  it("falls back to %HRmax without resting HR", () => {
    const zones = computeHrZones(190);
    expect(zones?.method).toBe("hrmax");
    expect(zones?.zone2.min).toBe(Math.round(190 * 0.6));
    expect(zones?.zone2.max).toBe(Math.round(190 * 0.7));
  });

  it("returns null without hrMax", () => {
    expect(computeHrZones(0)).toBeNull();
  });
});

describe("reconcileNextWeekMinutes", () => {
  it("weights recent actuals higher", () => {
    const next = reconcileNextWeekMinutes({
      plannedWeekMinutes: 100,
      actualWeekMinutes: [80, 90, 110],
    });
    expect(next).toBeGreaterThan(80);
    expect(next).toBeLessThanOrEqual(120);
  });

  it("applies step loading with RPE when level provided", () => {
    const next = reconcileNextWeekMinutes({
      plannedWeekMinutes: 100,
      actualWeekMinutes: [100, 100, 100],
      level: "beginner",
      phase: "base",
      lastWeekAvgRpe: 3,
    });
    expect(next).toBeGreaterThan(100);
  });
});

describe("evaluatePainGate", () => {
  it("triggers deload on repeated pain", () => {
    const result = evaluatePainGate({
      reports: [
        { location: "knee", score: 4, altersGait: false },
        { location: "knee", score: 5, altersGait: false },
      ],
    });
    expect(result.deloadPct).toBe(30);
    expect(result.blockQuality).toBe(true);
  });
});

describe("evaluateDetraining", () => {
  it("requires rebaseline after 21 days", () => {
    const result = evaluateDetraining({
      daysSinceLastActivity: 25,
      avgMinutesBeforeGap: 90,
    });
    expect(result.rebaseline).toBe(true);
  });
});

describe("computeEwmaAcwr", () => {
  it("returns null before 28 days", () => {
    expect(computeEwmaAcwr(Array(20).fill(10))).toBeNull();
  });

  it("returns ratio after enough data", () => {
    const loads = Array.from({ length: 35 }, (_, i) => (i > 30 ? 15 : 10));
    const acwr = computeEwmaAcwr(loads);
    expect(acwr).not.toBeNull();
    expect(acwr!).toBeGreaterThan(0.8);
  });
});

describe("intensityShareFromRpe", () => {
  it("computes 80/20 split", () => {
    const share = intensityShareFromRpe([
      { minutes: 40, rpe: 3 },
      { minutes: 10, rpe: 8 },
    ]);
    expect(share.easyPct).toBe(80);
    expect(share.hardPct).toBe(20);
  });
});

describe("heatAdvisoryFromDewPoint", () => {
  it("returns effort_only in hot humid conditions", () => {
    const advisory = heatAdvisoryFromDewPoint(24);
    expect(advisory.level).toBe("effort_only");
  });
});

describe("tanakaHrMax", () => {
  it("estimates HR max from age", () => {
    expect(tanakaHrMax(30)).toBe(187);
  });
});

describe("longRunCap", () => {
  it("caps long run at 30% for beginners", () => {
    expect(longRunCapMinutes(30, 100, "beginner")).toBeLessThanOrEqual(30);
  });
});

describe("formatWorkoutDetailSummary", () => {
  it("formats interval detail", () => {
    const summary = formatWorkoutDetailSummary("intervals", {
      repDistanceM: 800,
      reps: 5,
      restSec: 90,
      targetZone: "zone4",
    });
    expect(summary).toEqual({
      key: "intervalsDetail",
      params: { reps: 5, distance: 800, rest: 90 },
    });
  });
});

describe("buildWorkoutSegments", () => {
  const workoutTypes = [
    "easy",
    "long",
    "runWalk",
    "strides",
    "fartlek",
    "tempo",
    "intervals",
  ] as const;

  for (const type of workoutTypes) {
    it(`builds segments for ${type} that sum to total minutes`, () => {
      const totalMinutes = 45;
      const detail =
        type === "intervals"
          ? { repDistanceM: 400, reps: 6, restSec: 90, targetZone: "zone4" as const }
          : type === "tempo"
            ? { steadyMinutes: 20, warmupMin: 12, cooldownMin: 10 }
            : type === "fartlek"
              ? { segments: [{ fastSec: 60, easySec: 90 }], repeats: 6 }
              : type === "strides"
                ? { count: 6, durationSec: 25, restSec: 60 }
                : null;

      const result = buildWorkoutSegments(type, detail, totalMinutes);
      expect(result).not.toBeNull();
      const sum = result!.segments.reduce((acc, s) => acc + s.durationMin, 0);
      expect(sum).toBe(totalMinutes);
      expect(result!.totalDurationMin).toBe(totalMinutes);
    });
  }

  it("assigns zone2 to easy main set", () => {
    const result = buildWorkoutSegments("easy", null, 30);
    const main = result!.segments.find((s) => s.type === "main");
    expect(main?.zone).toBe("zone2");
  });

  it("includes warmup and cooldown for intervals", () => {
    const result = buildWorkoutSegments(
      "intervals",
      { repDistanceM: 400, reps: 6, restSec: 90, targetZone: "zone4" },
      55,
    );
    expect(result!.segments.some((s) => s.type === "warmup")).toBe(true);
    expect(result!.segments.some((s) => s.type === "activation")).toBe(true);
    expect(result!.segments.some((s) => s.type === "cooldown")).toBe(true);
    const main = result!.segments.find((s) => s.type === "main");
    expect(main?.zone).toBe("zone4");
    expect(main?.detailKey).toBe("intervalsDetail");
  });

  it("returns null for rest", () => {
    expect(buildWorkoutSegments("rest", null, 0)).toBeNull();
  });
});
