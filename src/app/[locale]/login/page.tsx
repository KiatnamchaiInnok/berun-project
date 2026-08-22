import { getTranslations } from "next-intl/server";
import { auth, signIn } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (session?.user) {
    redirect({ href: "/", locale });
  }

  const t = await getTranslations("login");
  const ta = await getTranslations("app");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{ta("name")}</CardTitle>
          <CardDescription>{ta("tagline")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: `/${locale}` });
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
