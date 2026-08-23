import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ProgressCharts } from "@/components/progress/progress-charts";
import { getProgressData } from "@/lib/actions/training";
import { auth } from "@/auth";

export default async function ProgressPage() {
  const t = await getTranslations("progress");
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/login", locale: await getLocale() });

  const data = await getProgressData();

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <h1 className="text-2xl font-semibold leading-relaxed lg:col-span-2">{t("title")}</h1>
      <ProgressCharts weekly={data.weekly} daysLogged={data.daysLogged} benchmarks={data.benchmarks} />
    </div>
  );
}
