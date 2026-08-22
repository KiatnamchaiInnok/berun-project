"use client";

import NiceModal from "@ebay/nice-modal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <NiceModal.Provider>
          {children}
          <Toaster richColors position="top-center" />
        </NiceModal.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
