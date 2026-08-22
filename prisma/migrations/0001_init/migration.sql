-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('running');
CREATE TYPE "WorkoutType" AS ENUM ('easy', 'long', 'tempo', 'runWalk', 'rest');
CREATE TYPE "Level" AS ENUM ('beginner', 'returning', 'regular');
CREATE TYPE "PainLocation" AS ENUM ('knee', 'shin', 'achilles', 'foot', 'hip', 'other');
CREATE TYPE "HrMaxSource" AS ENUM ('fieldTest', 'tanakaEstimate', 'manual');
CREATE TYPE "ExternalSource" AS ENUM ('manual', 'strava', 'garmin');
CREATE TYPE "PlanStatus" AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE "PlanVersionReason" AS ENUM ('initial', 'manual', 'reconcile', 'painDeload', 'detraining', 'benchmarkUpdate');
CREATE TYPE "SessionStatus" AS ENUM ('planned', 'completed', 'skipped', 'moved');
CREATE TYPE "IntensityZone" AS ENUM ('zone1', 'zone2', 'zone3', 'zone4', 'zone5');
CREATE TYPE "BenchmarkType" AS ENUM ('fixedRouteEf', 'timeTrial');
CREATE TYPE "Feel" AS ENUM ('good', 'ok', 'bad');
CREATE TYPE "Unit" AS ENUM ('km');
CREATE TYPE "Locale" AS ENUM ('th', 'en');
CREATE TYPE "AdjustmentRule" AS ENUM ('painGate', 'detraining', 'reconcile', 'acwrAdvisory', 'heatAdvisory', 'noDoubleProgression', 'longRunCap');
CREATE TYPE "PlanGoal" AS ENUM ('health');

-- Tables created by Prisma migrate; this file adds CHECK constraints, partial unique index, view, RLS

ALTER TABLE "activity_logs"
  ADD CONSTRAINT "activity_logs_rpe_check" CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  ADD CONSTRAINT "activity_logs_duration_check" CHECK (duration_sec > 0),
  ADD CONSTRAINT "activity_logs_distance_check" CHECK (distance_m IS NULL OR distance_m >= 0);

ALTER TABLE "pain_reports"
  ADD CONSTRAINT "pain_reports_score_check" CHECK (score >= 0 AND score <= 10);

CREATE UNIQUE INDEX "training_plans_one_active_per_user"
  ON "training_plans" ("user_id")
  WHERE status = 'active';

CREATE OR REPLACE VIEW v_daily_load AS
SELECT
  user_id,
  training_date AS date,
  SUM(duration_sec / 60.0) AS minutes,
  SUM(CASE WHEN rpe IS NOT NULL THEN (duration_sec / 60.0) * rpe ELSE 0 END) AS srpe
FROM activity_logs
WHERE deleted_at IS NULL
GROUP BY user_id, training_date;

-- Enable RLS (deny by default for anon/authenticated via Supabase REST)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "athlete_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan_weeks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planned_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pain_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benchmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan_adjustments" ENABLE ROW LEVEL SECURITY;
