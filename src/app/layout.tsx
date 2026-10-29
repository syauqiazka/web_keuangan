import type { Metadata } from "next";
import { cookies } from "next/headers";
import { manrope, inter, plexMono } from "./fonts";
import { ToastProvider } from "@/components/ui/Toast";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pencatatan Keuangan Sekolah | Bank Saku Digital",
  description: "Aplikasi internal pencatatan keuangan sekolah Bank Saku Digital",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon-32.png",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const temaCookie = cookieStore.get("tema")?.value;
  const dataTheme =
    temaCookie === "gelap" || temaCookie === "dark" ? "dark" : undefined;

  return (
    <html
      lang="id"
      data-theme={dataTheme}
      className={`${manrope.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}

