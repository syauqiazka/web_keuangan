import type { Metadata } from "next";
import { cookies } from "next/headers";
import { manrope, inter, plexMono } from "./fonts";
import { ToastProvider } from "@/components/ui/Toast";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pencatatan Keuangan Sekolah | Bank Saku Digital",
  description: "Aplikasi internal pencatatan keuangan sekolah Bank Saku Digital",
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
    >
      <body>
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}

