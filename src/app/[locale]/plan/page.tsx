import { getTranslations, getLocale } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { reconcilePlan } from "@/lib/actions/training";
import { formatShortDate } from "@/lib/utils";

export default async function PlanPage() {
  const t = await getTranslations("plan");
  const tw = await getTranslations("workout");
  const locale = await getLocale();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect({ href: "/login", locale: await getLocale() });

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

          return (
            <Card key={week.id} className={isCurrent ? "border-primary" : undefined}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {week.isRecoveryWeek ? <CheckCircle2 className="h-5 w-5 text-primary" /> : null}
                  <CardTitle className="text-base">
                    {t("week", { n: week.weekIndex })}
                    {week.isRecoveryWeek ? ` · ${t("recovery")}` : ""}
                  </CardTitle>
                </div>
                <CardDescription>
                  {t("targetMinutes", { minutes: week.targetMinutes })}
                  {week.isRecoveryWeek ? ` — ${t("recoveryHint")}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ProgressBar value={pct} />
                <ul className="flex flex-col gap-2">
                  {week.sessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-border px-3 py-2 text-sm leading-relaxed"
                    >
                      <span>{formatShortDate(s.scheduledDate, locale)}</span>
                      <span className="tabular-nums">
                        {tw(s.workoutType)} · {Math.round(s.targetDurationSec / 60)}m
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
