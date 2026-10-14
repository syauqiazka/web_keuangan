import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Peran, TemaTampilan } from "@/generated/prisma/client";

export const SESSION_COOKIE_NAME = "sesi_token";
export const SESSION_DURATION_HOURS = 12;

export interface SessionUser {
  id: string;
  kode: string;
  nama: string;
  peran: Peran;
  tema: TemaTampilan;
  wajibGantiPassword: boolean;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(penggunaId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await db.sesi.create({
    data: {
      tokenHash,
      penggunaId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    try {
      await db.sesi.deleteMany({
        where: { tokenHash },
      });
    } catch {
      // Abaikan jika database tidak dapat dijangkau
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = hashToken(token);

  try {
    const sesi = await db.sesi.findUnique({
      where: { tokenHash },
      include: {
        pengguna: true,
      },
    });

    if (!sesi) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Periksa kedaluwarsa sesi
    if (new Date() > sesi.expiresAt) {
      await db.sesi.deleteMany({ where: { tokenHash } }).catch(() => {});
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Periksa status pengguna
    if (!sesi.pengguna.aktif) {
      await db.sesi.deleteMany({ where: { tokenHash } }).catch(() => {});
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return {
      id: sesi.pengguna.id,
      kode: sesi.pengguna.kode,
      nama: sesi.pengguna.nama,
      peran: sesi.pengguna.peran,
      tema: sesi.pengguna.tema,
      wajibGantiPassword: sesi.pengguna.wajibGantiPassword,
    };
  } catch (err) {
    console.error("Gagal membaca sesi pengguna:", err);
    return null;
  }
}
