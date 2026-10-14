import "server-only";
import { getSessionUser, type SessionUser } from "./session";

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Sesi tidak valid atau telah berakhir. Silakan masuk kembali.");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.peran !== "ADMIN") {
    throw new Error("Hanya admin yang memiliki akses untuk tindakan ini.");
  }
  return user;
}

export async function requirePetugas(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.peran !== "ADMIN" && user.peran !== "PETUGAS") {
    throw new Error("Akses tidak diizinkan.");
  }
  return user;
}
