import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      plan_adjustments,
      pain_reports,
      benchmarks,
      activity_logs,
      planned_sessions,
      plan_weeks,
      plan_versions,
      training_plans,
      athlete_profiles,
      accounts,
      sessions,
      verification_tokens,
      weather_observations,
      users
    RESTART IDENTITY CASCADE;
  `);
  console.log("Database cleared.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
