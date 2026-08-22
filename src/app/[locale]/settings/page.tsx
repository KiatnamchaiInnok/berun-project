import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("settings");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect({ href: "/login", locale });

  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold leading-relaxed">{t("title")}</h1>
      <SettingsForm
        profile={
          profile
            ? {
                level: profile.level,
                progressionRatePct: profile.progressionRatePct,
                buildWeeks: profile.buildWeeks,
                hrMax: profile.hrMax,
                birthYear: profile.birthYear,
                defaultLat: profile.defaultLat ? Number(profile.defaultLat) : null,
                defaultLon: profile.defaultLon ? Number(profile.defaultLon) : null,
              }
            : null
        }
      />
    </div>
  );
}
