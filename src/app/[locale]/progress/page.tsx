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
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold leading-relaxed">{t("title")}</h1>
      <ProgressCharts weekly={data.weekly} daysLogged={data.daysLogged} benchmarks={data.benchmarks} />
    </div>
  );
}
