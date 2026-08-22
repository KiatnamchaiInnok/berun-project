"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { updateProfile } from "@/lib/actions/training";

export function SettingsForm({
  profile,
}: {
  profile: {
    level: string;
    progressionRatePct: number;
    buildWeeks: number;
    hrMax: number | null;
    birthYear: number | null;
    defaultLat: number | null;
    defaultLon: number | null;
  } | null;
}) {
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Label htmlFor="hrMax">{t("hrMax")}</Label>
          <Input id="hrMax" name="hrMax" defaultValue={profile?.hrMax ?? ""} inputMode="numeric" />
        </div>
        <div>
          <Label htmlFor="birthYear">Birth year</Label>
          <Input id="birthYear" name="birthYear" defaultValue={profile?.birthYear ?? ""} inputMode="numeric" />
        </div>
        <div>
          <Label htmlFor="progression">{t("progression")} (%)</Label>
          <Input id="progression" name="progression" defaultValue={profile?.progressionRatePct ?? 10} inputMode="numeric" />
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              try {
                await updateProfile({
                  hrMax: profile?.hrMax ?? undefined,
                  progressionRatePct: profile?.progressionRatePct,
                  buildWeeks: profile?.buildWeeks,
                });
                toast.success(t("save"));
              } catch {
                toast.error("Error");
              }
            });
          }}
        >
          {t("save")}
        </Button>
        <Link href="/glossary" className="text-sm text-primary leading-relaxed">
          {t("glossary")}
        </Link>
      </CardContent>
    </Card>
  );
}
