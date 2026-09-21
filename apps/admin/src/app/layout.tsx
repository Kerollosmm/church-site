import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم الإدارية — كنيسة القديسين بالعصافرة",
    template: "%s | كنيسة القديسين بالعصافرة",
  },
  description:
    "لوحة الإشراف وسكرتارية كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود بالعصافرة",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-100 text-slate-800" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
