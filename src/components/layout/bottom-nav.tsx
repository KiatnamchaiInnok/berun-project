"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, ChartLine, Home, Plus, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export function BottomNav({ onLogClick }: { onLogClick: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: t("today"), icon: Home },
    { href: "/plan", label: t("plan"), icon: CalendarDays },
    { href: "/progress", label: t("progress"), icon: ChartLine },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-safe pt-2">
        {tabs.slice(0, 2).map((tab) => (
          <NavItem key={tab.href} {...tab} active={pathname === tab.href} />
        ))}
        <button
          type="button"
          onClick={onLogClick}
          className="mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          aria-label={t("log")}
        >
          <Plus className="h-7 w-7" />
        </button>
        {tabs.slice(2).map((tab) => (
          <NavItem key={tab.href} {...tab} active={pathname === tab.href} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-1 text-xs leading-relaxed",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
