"use client";

import { usePathname } from "@/i18n/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageContainer } from "@/components/layout/page-container";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { showLogModal } from "@/components/log/log-run-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = pathname === "/login" || pathname === "/onboarding";

  if (hideShell) {
    return <PageContainer variant="auth">{children}</PageContainer>;
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <SidebarNav pathname={pathname} />
      <div className="flex min-h-dvh flex-1 flex-col">
        <PageContainer variant="app">{children}</PageContainer>
        <BottomNav onLogClick={() => showLogModal()} />
      </div>
    </div>
  );
}
