import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GlossaryPage() {
  const t = await getTranslations("glossary");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold leading-relaxed">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">RPE</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">{t("rpe")}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ACWR</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">{t("acwr")}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">EF</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">{t("ef")}</CardContent>
      </Card>
    </div>
  );
}
