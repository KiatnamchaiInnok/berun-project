import { describe, expect, it } from "vitest";
import {
  computeEwmaAcwr,
  evaluateDetraining,
  evaluatePainGate,
  generatePlan,
  heatAdvisoryFromDewPoint,
  intensityShareFromRpe,
  longRunCapMinutes,
  reconcileNextWeekMinutes,
  tanakaHrMax,
} from "./plan-engine";

describe("generatePlan", () => {
  it("creates correct number of weeks", () => {
    const result = generatePlan({
      level: "beginner",
      currentWeeklyMinutes: 60,
      currentLongRunMinutes: 20,
      daysPerWeek: 3,
      availableWeekdays: [1, 3, 5],
      totalWeeks: 8,
      progressionRatePct: 10,
      buildWeeks: 3,
      recoveryReductionPct: 25,
      startDate: new Date("2026-01-06"),
    });
    expect(result.weeks).toHaveLength(8);
  });

  it("includes recovery weeks", () => {
    const result = generatePlan({
      level: "regular",
      currentWeeklyMinutes: 120,
      currentLongRunMinutes: 45,
      daysPerWeek: 4,
      availableWeekdays: [1, 2, 4, 6],
      totalWeeks: 12,
      progressionRatePct: 10,
      buildWeeks: 3,
      recoveryReductionPct: 25,
      startDate: new Date("2026-01-06"),
    });
    const recoveryWeeks = result.weeks.filter((w) => w.isRecoveryWeek);
    expect(recoveryWeeks.length).toBeGreaterThan(0);
  });
});

describe("reconcileNextWeekMinutes", () => {
  it("weights recent actuals higher", () => {
    const next = reconcileNextWeekMinutes({
      plannedWeekMinutes: 100,
      actualWeekMinutes: [80, 90, 110],
    });
    expect(next).toBeGreaterThan(80);
    expect(next).toBeLessThanOrEqual(110);
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
    const result = evaluateDetraining({ daysSinceLastActivity: 25, avgMinutesBeforeGap: 90 });
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
