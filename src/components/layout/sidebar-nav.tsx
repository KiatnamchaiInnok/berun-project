"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, ChartLine, Home, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export function SidebarNav({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");
  const tabs = [
    { href: "/", label: t("today"), icon: Home },
    { href: "/plan", label: t("plan"), icon: CalendarDays },
    { href: "/progress", label: t("progress"), icon: ChartLine },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border lg:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-2 p-4">
        <p className="px-3 text-lg font-semibold text-primary">Berun</p>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm leading-relaxed",
              pathname === tab.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
