import { getTranslations } from "next-intl/server";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function SignOutButton() {
  const t = await getTranslations("settings");

  return (
    <form
      className="flex justify-center"
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" variant="ghost" className="text-destructive hover:text-destructive">
        {t("logout")}
      </Button>
    </form>
  );
}
