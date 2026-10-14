"use server";

import { verify, hash } from "@node-rs/argon2";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { loginSchema, gantiPasswordSchema } from "@/lib/validators";
import { createSession, deleteSession, getSessionUser } from "@/server/auth/session";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawKode = formData.get("kode");
  const rawPassword = formData.get("password");

  const validation = loginSchema.safeParse({
    kode: rawKode,
    password: rawPassword,
  });

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }

  const { kode, password } = validation.data;

  const pengguna = await db.pengguna.findUnique({
    where: { kode },
  });

  // Pesan kesalahan generik demi keamanan
  const pesanSalah = "Kode atau kata sandi salah.";

  if (!pengguna || !pengguna.aktif) {
    return { error: pesanSalah };
  }

  // Periksa apakah akun sedang terkunci karena kegagalan berulang
  const now = new Date();
  if (pengguna.terkunciSampai && pengguna.terkunciSampai > now) {
    const sisaMenit = Math.ceil(
      (pengguna.terkunciSampai.getTime() - now.getTime()) / (60 * 1000)
    );
    return {
      error: `Akun terkunci sementara karena percobaan gagal berulang kali. Silakan coba lagi dalam ${sisaMenit} menit.`,
    };
  }

  let isMatch = false;
  try {
    isMatch = await verify(pengguna.passwordHash, password);
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    const gagalBaru = pengguna.gagalLogin + 1;
    const terkunciSampai =
      gagalBaru >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await db.pengguna.update({
      where: { id: pengguna.id },
      data: {
        gagalLogin: gagalBaru,
        terkunciSampai,
      },
    });

    if (terkunciSampai) {
      return {
        error:
          "Akun terkunci sementara karena 5 kali percobaan gagal berturut-turut. Coba lagi dalam 15 menit.",
      };
    }

    return { error: pesanSalah };
  }

  // Berhasil masuk: reset kegagalan login dan terkunciSampai
  await db.pengguna.update({
    where: { id: pengguna.id },
    data: {
      gagalLogin: 0,
      terkunciSampai: null,
    },
  });

  await createSession(pengguna.id);

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/masuk");
}

export async function gantiPasswordAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sesi tidak valid. Silakan masuk kembali." };
  }

  const rawPasswordLama = formData.get("passwordLama");
  const rawPasswordBaru = formData.get("passwordBaru");
  const rawKonfirmasiPassword = formData.get("konfirmasiPassword");

  const validation = gantiPasswordSchema.safeParse({
    passwordLama: rawPasswordLama,
    passwordBaru: rawPasswordBaru,
    konfirmasiPassword: rawKonfirmasiPassword,
  });

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message ?? "Input kata sandi tidak valid.",
    };
  }

  const { passwordLama, passwordBaru } = validation.data;

  const pengguna = await db.pengguna.findUnique({
    where: { id: user.id },
  });

  if (!pengguna) {
    return { error: "Pengguna tidak ditemukan." };
  }

  const isOldMatch = await verify(pengguna.passwordHash, passwordLama);
  if (!isOldMatch) {
    return { error: "Kata sandi saat ini tidak cocok." };
  }

  const newHash = await hash(passwordBaru);

  await db.pengguna.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      wajibGantiPassword: false,
    },
  });

  return { success: true };
}
