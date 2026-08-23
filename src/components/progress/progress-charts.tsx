"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatShortDate } from "@/lib/utils";

export function ProgressCharts({
  weekly,
  daysLogged,
  benchmarks,
}: {
  weekly: Array<{ week: string; minutes: number; easyPct: number; hardPct: number }>;
  daysLogged: number;
  benchmarks: Array<{ performedOn: Date; efficiencyFactor: { toString(): string } | null }>;
}) {
  const t = useTranslations("progress");
  const locale = useLocale();
  const acwrDaysRemaining = Math.max(0, 28 - daysLogged);
  const formatAxisDate = (value: string) => formatShortDate(value, locale);

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("weeklyMinutes")}</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          {weekly.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" hide />
                <YAxis width={32} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">No data yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("intensitySplit")}</CardTitle>
          <CardDescription>{t("easyTarget")}</CardDescription>
        </CardHeader>
        <CardContent>
          {weekly.length ? (
            weekly.slice(-1).map((w) => (
              <div key={w.week} className="flex flex-col gap-2">
                <ProgressBar value={w.easyPct} />
                <p className="text-sm tabular-nums leading-relaxed">
                  Easy {w.easyPct}% · Hard {w.hardPct}%
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">No data yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("efTrend")}</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          {benchmarks.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={benchmarks.map((b) => ({
                  date: b.performedOn.toISOString().slice(0, 10),
                  ef: b.efficiencyFactor ? Number(b.efficiencyFactor) : null,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis width={32} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="ef" stroke="var(--primary)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{t("benchmark")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("acwr")}</CardTitle>
          <CardDescription>{t("acwrHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {acwrDaysRemaining > 0 ? (
            <p className="text-sm leading-relaxed">{t("acwrCollecting", { days: acwrDaysRemaining })}</p>
          ) : (
            <p className="text-sm leading-relaxed tabular-nums">—</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
