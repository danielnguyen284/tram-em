import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import WelcomeScreens from "@/components/ui/WelcomeScreens";

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Trạm Êm — Ốc Đảo Chữa Lành Tâm Hồn",
  description: "Nơi cảm xúc được lắng nghe, thấu hiểu và chữa lành mỗi ngày qua âm thanh thiên nhiên, thiền định và cộng đồng tích cực.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trạm Êm",
  },
};

export const viewport: Viewport = {
  themeColor: "#8B6AAD",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className={nunito.variable}>
        <WelcomeScreens />
        {children}
      </body>
    </html>
  );
}
