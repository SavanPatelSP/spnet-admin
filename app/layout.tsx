import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} Admin`,
    template: `%s | ${APP_NAME} Admin`,
  },
  description: `${APP_NAME} - ${APP_DESCRIPTION}`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
