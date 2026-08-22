"use server";

import { auth } from "@/auth";
import { prisma, assertUserId } from "@/lib/db";
import { ENGINE_VERSION, generatePlan, type PlanEngineInput } from "@/lib/engine/plan-engine";
import type { Level, PlanVersionReason } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireUserId() {
  const session = await auth();
  assertUserId(session?.user?.id);
  return session.user.id;
}

export async function getTodayDashboard() {
  const userId = await requireUserId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  const plan = await prisma.trainingPlan.findFirst({
    where: { userId, status: "active" },
    include: {
      versions: {
        orderBy: { versionNo: "desc" },
        take: 1,
        include: {
          weeks: {
            include: { sessions: true },
            orderBy: { weekIndex: "asc" },
          },
        },
      },
      adjustments: { orderBy: { triggeredAt: "desc" }, take: 1 },
    },
  });

  const activeVersion = plan?.versions[0];
  const todaySession = activeVersion
    ? activeVersion.weeks
        .flatMap((w) => w.sessions)
        .find((s) => s.scheduledDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10))
    : null;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const weekLogs = await prisma.activityLog.findMany({
    where: {
      userId,
      deletedAt: null,
      trainingDate: { gte: weekStart, lte: today },
    },
  });

  const weekMinutes = weekLogs.reduce((sum, l) => sum + l.durationSec / 60, 0);
  const currentWeek = activeVersion?.weeks.find((w) => {
    const end = new Date(w.weekStartDate);
    end.setDate(end.getDate() + 6);
    return today >= w.weekStartDate && today <= end;
  });

  return {
    profile,
    plan,
    activeVersion,
    todaySession,
    weekMinutes: Math.round(weekMinutes),
    currentWeek,
    latestAdjustment: plan?.adjustments[0] ?? null,
    needsOnboarding: !profile?.onboardingCompletedAt,
  };
}

export async function createPlanFromOnboarding(input: {
  level: Level;
  availableWeekdays: number[];
  currentWeeklyMinutes: number;
  currentLongRunMinutes: number;
  totalWeeks: 8 | 12;
  baselineMode?: boolean;
}) {
  const userId = await requireUserId();

  await prisma.trainingPlan.updateMany({
    where: { userId, status: "active" },
    data: { status: "archived" },
  });

  const profile = await prisma.athleteProfile.upsert({
    where: { userId },
    create: {
      userId,
      level: input.level,
      availableWeekdays: input.availableWeekdays,
      baselineMode: input.baselineMode ?? false,
      onboardingCompletedAt: new Date(),
      disclaimerAcceptedAt: new Date(),
      parqCompletedAt: new Date(),
    },
    update: {
      level: input.level,
      availableWeekdays: input.availableWeekdays,
      baselineMode: input.baselineMode ?? false,
      onboardingCompletedAt: new Date(),
    },
  });

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const engineInput: PlanEngineInput = {
    level: input.level as PlanEngineInput["level"],
    currentWeeklyMinutes: input.currentWeeklyMinutes,
    currentLongRunMinutes: input.currentLongRunMinutes,
    daysPerWeek: input.availableWeekdays.length,
    availableWeekdays: input.availableWeekdays,
    totalWeeks: input.totalWeeks,
    progressionRatePct: profile.progressionRatePct as 5 | 10 | 15,
    buildWeeks: profile.buildWeeks as 2 | 3 | 4,
    recoveryReductionPct: profile.recoveryReductionPct,
    startDate,
  };

  const generated = generatePlan(engineInput);

  const plan = await prisma.trainingPlan.create({
    data: {
      userId,
      startDate,
      totalWeeks: input.totalWeeks,
      status: "active",
    },
  });

  const version = await prisma.planVersion.create({
    data: {
      planId: plan.id,
      userId,
      versionNo: 1,
      reason: "initial",
      engineVersion: ENGINE_VERSION,
      inputSnapshot: engineInput as object,
    },
  });

  for (const week of generated.weeks) {
    const planWeek = await prisma.planWeek.create({
      data: {
        planVersionId: version.id,
        userId,
        weekIndex: week.weekIndex,
        blockIndex: week.blockIndex,
        weekStartDate: week.weekStartDate,
        isRecoveryWeek: week.isRecoveryWeek,
        targetMinutes: week.targetMinutes,
        targetLongRunMinutes: week.targetLongRunMinutes,
        targetEasySharePct: week.targetEasySharePct,
      },
    });

    for (const session of week.sessions) {
      await prisma.plannedSession.create({
        data: {
          planWeekId: planWeek.id,
          userId,
          scheduledDate: session.scheduledDate,
          sequence: session.sequence,
          workoutType: session.workoutType,
          targetDurationSec: session.targetDurationSec,
          targetZone: session.targetZone ?? undefined,
          runWalkPattern: (session.runWalkPattern ?? undefined) as object | undefined,
        },
      });
    }
  }

  await prisma.trainingPlan.update({
    where: { id: plan.id },
    data: { activeVersionId: version.id },
  });

  revalidatePath("/");
  return { planId: plan.id };
}

export async function saveActivityLog(input: {
  plannedSessionId?: string;
  trainingDate: string;
  workoutType: string;
  durationSec: number;
  distanceM?: number;
  avgHr?: number;
  maxHr?: number;
  rpe: number;
  feel?: string;
  note?: string;
  painReports?: Array<{ location: string; score: number; altersGait: boolean }>;
  weatherObservationId?: string;
}) {
  const userId = await requireUserId();

  const log = await prisma.activityLog.create({
    data: {
      userId,
      trainingDate: new Date(input.trainingDate),
      sport: "running",
      workoutType: input.workoutType as never,
      durationSec: input.durationSec,
      distanceM: input.distanceM,
      avgHr: input.avgHr,
      maxHr: input.maxHr,
      rpe: input.rpe,
      feel: input.feel as never,
      note: input.note,
      plannedSessionId: input.plannedSessionId,
      weatherObservationId: input.weatherObservationId,
    },
  });

  if (input.plannedSessionId) {
    await prisma.plannedSession.update({
      where: { id: input.plannedSessionId },
      data: { status: "completed" },
    });
  }

  if (input.painReports?.length) {
    await prisma.painReport.createMany({
      data: input.painReports.map((p) => ({
        userId,
        activityLogId: log.id,
        reportedDate: new Date(input.trainingDate),
        location: p.location as never,
        score: p.score,
        altersGait: p.altersGait,
      })),
    });
  }

  revalidatePath("/");
  revalidatePath("/progress");
  return { id: log.id };
}

export async function getProgressData() {
  const userId = await requireUserId();
  const logs = await prisma.activityLog.findMany({
    where: { userId, deletedAt: null },
    orderBy: { trainingDate: "asc" },
  });

  const weeklyMap = new Map<string, { minutes: number; easy: number; hard: number; total: number }>();
  for (const log of logs) {
    const d = new Date(log.trainingDate);
    const weekKey = `${d.getFullYear()}-W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}-${d.getMonth()}`;
    const entry = weeklyMap.get(weekKey) ?? { minutes: 0, easy: 0, hard: 0, total: 0 };
    const mins = log.durationSec / 60;
    entry.minutes += mins;
    if (log.rpe) {
      entry.total += mins;
      if (log.rpe <= 4) entry.easy += mins;
      if (log.rpe >= 7) entry.hard += mins;
    }
    weeklyMap.set(weekKey, entry);
  }

  const dailyLoads = logs.map((l) => (l.rpe ? (l.durationSec / 60) * l.rpe : l.durationSec / 60));
  const uniqueDays = new Set(logs.map((l) => l.trainingDate.toISOString().slice(0, 10))).size;

  const benchmarks = await prisma.benchmark.findMany({
    where: { userId },
    orderBy: { performedOn: "asc" },
  });

  return {
    weekly: Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      minutes: Math.round(data.minutes),
      easyPct: data.total ? Math.round((data.easy / data.total) * 100) : 0,
      hardPct: data.total ? Math.round((data.hard / data.total) * 100) : 0,
    })),
    daysLogged: uniqueDays,
    benchmarks,
  };
}

export async function updateProfile(input: {
  level?: Level;
  availableWeekdays?: number[];
  hrMax?: number;
  birthYear?: number;
  progressionRatePct?: number;
  buildWeeks?: number;
  locale?: "th" | "en";
  defaultLat?: number;
  defaultLon?: number;
}) {
  const userId = await requireUserId();
  await prisma.athleteProfile.upsert({
    where: { userId },
    create: { userId, ...input, locale: input.locale ?? "th" },
    update: input,
  });
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function reconcilePlan() {
  const userId = await requireUserId();
  const plan = await prisma.trainingPlan.findFirst({
    where: { userId, status: "active" },
    include: {
      versions: { orderBy: { versionNo: "desc" }, take: 1, include: { weeks: true } },
    },
  });
  if (!plan?.versions[0]) return { ok: false };

  const reason: PlanVersionReason = "reconcile";
  await prisma.planAdjustment.create({
    data: {
      planId: plan.id,
      planVersionId: plan.versions[0].id,
      userId,
      rule: "reconcile",
      triggeredAt: new Date(),
      input: {},
      outcome: { message: "Preview only in MVP" },
      messageKey: "plan.reconcile",
    },
  });

  revalidatePath("/plan");
  return { ok: true };
}
