import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect({ href: "/login", locale: await getLocale() });

  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:max-w-lg">
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
                hrMaxSource: profile.hrMaxSource,
                defaultLat: profile.defaultLat ? Number(profile.defaultLat) : null,
                defaultLon: profile.defaultLon ? Number(profile.defaultLon) : null,
              }
            : null
        }
      />

      <SignOutButton />
    </div>
  );
}
