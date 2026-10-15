"use server";

import { cookies } from "next/headers";
import { getSessionUser } from "@/server/auth/session";
import { db } from "@/lib/db";
import type { TemaTampilan } from "@/generated/prisma/client";

export async function setTemaAction(tema: TemaTampilan) {
  const cookieStore = await cookies();
  const cookieVal = tema === "GELAP" ? "gelap" : "terang";

  cookieStore.set("tema", cookieVal, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const user = await getSessionUser();
  if (user) {
    try {
      await db.pengguna.update({
        where: { id: user.id },
        data: { tema },
      });
    } catch {
      // Abaikan jika database belum terhubung
    }
  }
}
