"use client";

import { usePathname } from "@/i18n/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { showLogModal } from "@/components/log/log-run-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = pathname === "/login" || pathname === "/onboarding";

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav pathname={pathname} />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-6 lg:max-w-5xl lg:pb-8 lg:pt-8">
          {children}
        </main>
        <BottomNav onLogClick={() => showLogModal()} />
      </div>
    </div>
  );
}
