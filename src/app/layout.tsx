import { Inter, Noto_Sans_Thai } from "next/font/google";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning className={`${inter.variable} ${notoSansThai.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-app)] antialiased">{children}</body>
    </html>
  );
}
