import { getTranslations } from "next-intl/server";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function SignOutButton() {
  const t = await getTranslations("settings");

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" variant="outline" className="min-h-12 w-full">
        {t("logout")}
      </Button>
    </form>
  );
}
