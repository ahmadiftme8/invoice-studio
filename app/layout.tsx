import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn, Nunito } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
    weight: ['400', '600', '700', '800', '900'],
    subsets: ['latin'],
    variable: '--font-nunito',
    display: 'swap',
});

const vazirMatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Invoice Studio",
  description: "سیستم جامع برای طراحی و صدور فاکتور فارسی با Next.js 15",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${geistSans.variable} ${geistMono.variable} ${vazirMatn.variable} antialiased`}
      >
        <AppProviders>
          {/* THE CANVAS */}
          <div className="flex dark:bg-gray-900 h-screen w-full p-4 overflow-hidden gap-2" style={{ backgroundColor: 'var(--white)' }}>
             
             {/* 1. Sidebar Column (Floating on Canvas) */}
             <Sidebar />
             
             {/* 2. Main Container */}
             <main className="flex-1 bg-[var(--wild-sand)] dark:bg-[var(--background)] rounded-[40px] shadow-sm flex flex-col overflow-hidden relative">
                
                {/* Header at Top of Main Container */}
                <div className="shrink-0">
                    <Header title="Good Morning, Fateme" />
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 md:px-8">
                    {children}
                </div>

             </main>
           </div>
        </AppProviders>
      </body>
    </html>
  );
}
