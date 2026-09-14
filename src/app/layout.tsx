import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QuickActionBar } from "@/components/layout/QuickActionBar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E2A78",
};

export const metadata: Metadata = {
  title: {
    default: "كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود",
    template: "%s | كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى بالعصافرة",
  },
  description:
    "البوابة الرقمية الرسمية لكنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود - العصافرة، الإسكندرية. مواعيد القداسات، المستوصف الخيري، حجز قاعة العزاء، البث المباشر، والتربية الكنسية.",
  keywords: [
    "كنيسة القديسين مكسيموس ودوماديوس",
    "الأنبا موسى الأسود",
    "العصافرة",
    "الإسكندرية",
    "قداسات الإسكندرية",
    "المستوصف الكنسي",
    "قاعة عزاء",
    "بث مباشر كنيسة",
  ],
  authors: [{ name: "كنيسة القديسين بالعصافرة" }],
  openGraph: {
    title: "كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود",
    description: "البوابة الرقمية الرسمية لكنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود - العصافرة، الإسكندرية",
    type: "website",
    locale: "ar_EG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className="antialiased min-h-screen flex flex-col bg-alabasterBg text-slateText-primary font-body selection:bg-copticGold-200 selection:text-copticNavy-900">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <QuickActionBar />
        <Footer />
      </body>
    </html>
  );
}
