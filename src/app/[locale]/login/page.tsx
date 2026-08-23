import { getTranslations, getLocale } from "next-intl/server";
import { auth, signIn } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect({ href: "/", locale: await getLocale() });
  }

  const t = await getTranslations("login");
  const ta = await getTranslations("app");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{ta("name")}</CardTitle>
          <CardDescription>{ta("tagline")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" size="lg" className="w-full">
              {t("google")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
