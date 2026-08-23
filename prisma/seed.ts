import { PrismaClient } from "@prisma/client";
import { ENGINE_VERSION, generatePlan } from "../src/lib/engine/plan-engine";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@berun.local";
  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({
      data: {
        email,
        name: "Demo Runner",
        athleteProfile: {
          create: {
            level: "regular",
            availableWeekdays: [1, 3, 5, 6],
            onboardingCompletedAt: new Date(),
            disclaimerAcceptedAt: new Date(),
            parqCompletedAt: new Date(),
            defaultLat: 13.7563,
            defaultLon: 100.5018,
          },
        },
      },
    }));

  await prisma.trainingPlan.updateMany({
    where: { userId: user.id, status: "active" },
    data: { status: "archived" },
  });

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 7 * 8);

  const engineInput = {
    level: "regular" as const,
    currentWeeklyMinutes: 120,
    currentLongRunMinutes: 45,
    daysPerWeek: 4,
    availableWeekdays: [1, 3, 5, 6],
    totalWeeks: 12 as const,
    progressionRatePct: 10 as const,
    buildWeeks: 3 as const,
    recoveryReductionPct: 25,
    startDate,
  };

  const generated = generatePlan(engineInput);
  const plan = await prisma.trainingPlan.create({
    data: {
      userId: user.id,
      startDate,
      totalWeeks: 12,
      status: "active",
    },
  });

  const version = await prisma.planVersion.create({
    data: {
      planId: plan.id,
      userId: user.id,
      versionNo: 1,
      reason: "initial",
      engineVersion: ENGINE_VERSION,
      inputSnapshot: engineInput,
    },
  });

  for (const week of generated.weeks) {
    const planWeek = await prisma.planWeek.create({
      data: {
        planVersionId: version.id,
        userId: user.id,
        weekIndex: week.weekIndex,
        blockIndex: week.blockIndex,
        weekStartDate: week.weekStartDate,
        isRecoveryWeek: week.isRecoveryWeek,
        phase: week.phase,
        targetMinutes: week.targetMinutes,
        targetLongRunMinutes: week.targetLongRunMinutes,
        targetEasySharePct: week.targetEasySharePct,
      },
    });

    for (const session of week.sessions) {
      await prisma.plannedSession.create({
        data: {
          planWeekId: planWeek.id,
          userId: user.id,
          scheduledDate: session.scheduledDate,
          sequence: session.sequence,
          workoutType: session.workoutType,
          targetDurationSec: session.targetDurationSec,
          targetZone: session.targetZone ?? undefined,
          runWalkPattern: (session.runWalkPattern ?? undefined) as object | undefined,
          workoutDetail: (session.workoutDetail ?? undefined) as object | undefined,
        },
      });
    }
  }

  await prisma.trainingPlan.update({
    where: { id: plan.id },
    data: { activeVersionId: version.id },
  });

  for (let i = 0; i < 56; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0) continue;
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        trainingDate: d,
        sport: "running",
        workoutType: i % 7 === 0 ? "long" : "easy",
        durationSec: 1800 + (i % 5) * 300,
        distanceM: 5000 + i * 50,
        rpe: i % 7 === 0 ? 6 : 3,
        avgHr: 140 + (i % 10),
      },
    });
  }

  console.log("Seed complete for", email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
