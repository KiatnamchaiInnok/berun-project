import { Inter, Noto_Sans_Thai } from "next/font/google";
import type { Viewport } from "next";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-thai",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale =
    cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])
      ? cookieLocale
      : routing.defaultLocale;

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${notoSansThai.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-app)] antialiased">{children}</body>
    </html>
  );
}
