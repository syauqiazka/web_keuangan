"use server";

import { z } from "zod";
import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth/guards";

export interface ActionState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

// ─── Buat Akun ────────────────────────────────────────────────────

const buatAkunSchema = z.object({
  kode: z
    .string()
    .min(2, "Kode minimal 2 karakter.")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Kode hanya boleh berisi huruf, angka, underscore, dan tanda hubung."),
  nama: z.string().min(1, "Nama harus diisi.").max(200),
  peran: z.enum(["ADMIN", "PETUGAS"], { message: "Peran harus ADMIN atau PETUGAS." }),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export async function buatAkunAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Hanya admin yang dapat membuat akun." };

  const raw = {
    kode: formData.get("kode"),
    nama: formData.get("nama"),
    peran: formData.get("peran"),
    password: formData.get("password"),
  };

  const parsed = buatAkunSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", fieldErrors };
  }

  const { kode, nama, peran, password } = parsed.data;

  const existing = await db.pengguna.findUnique({ where: { kode } });
  if (existing) return { error: `Kode "${kode}" sudah digunakan.` };

  const passwordHash = await hash(password);

  await db.pengguna.create({
    data: {
      kode,
      nama,
      peran,
      passwordHash,
      wajibGantiPassword: true, // wajib ganti setelah akun dibuat admin
    },
  });

  return { success: true };
}

// ─── Reset Password ───────────────────────────────────────────────

const resetPasswordSchema = z.object({
  penggunaId: z.string().min(1),
  passwordBaru: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export async function resetPasswordAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Hanya admin yang dapat mengatur ulang kata sandi." };

  const parsed = resetPasswordSchema.safeParse({
    penggunaId: formData.get("penggunaId"),
    passwordBaru: formData.get("passwordBaru"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const { penggunaId, passwordBaru } = parsed.data;

  const pengguna = await db.pengguna.findUnique({ where: { id: penggunaId } });
  if (!pengguna) return { error: "Akun tidak ditemukan." };

  const passwordHash = await hash(passwordBaru);

  await db.pengguna.update({
    where: { id: penggunaId },
    data: {
      passwordHash,
      wajibGantiPassword: true,
      gagalLogin: 0,
      terkunciSampai: null,
    },
  });

  return { success: true };
}

// ─── Nonaktifkan Akun ─────────────────────────────────────────────

export async function nonaktifkanAkunAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Hanya admin yang dapat menonaktifkan akun." };

  const penggunaId = String(formData.get("penggunaId") ?? "");
  if (!penggunaId) return { error: "ID akun tidak ditemukan." };

  // Jangan nonaktifkan diri sendiri
  if (penggunaId === admin.id) {
    return { error: "Anda tidak dapat menonaktifkan akun Anda sendiri." };
  }

  const pengguna = await db.pengguna.findUnique({ where: { id: penggunaId } });
  if (!pengguna) return { error: "Akun tidak ditemukan." };

  await db.pengguna.update({
    where: { id: penggunaId },
    data: { aktif: false },
  });

  return { success: true };
}

// ─── Aktifkan Kembali Akun ────────────────────────────────────────

export async function aktifkanAkunAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Hanya admin yang dapat mengaktifkan akun." };

  const penggunaId = String(formData.get("penggunaId") ?? "");
  if (!penggunaId) return { error: "ID akun tidak ditemukan." };

  await db.pengguna.update({
    where: { id: penggunaId },
    data: { aktif: true },
  });

  return { success: true };
}

// ─── Hapus Akun ───────────────────────────────────────────────────

export async function hapusAkunAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Hanya admin yang dapat menghapus akun." };

  const penggunaId = String(formData.get("penggunaId") ?? "");
  if (!penggunaId) return { error: "ID akun tidak ditemukan." };

  // Jangan hapus akun sendiri
  if (penggunaId === admin.id) {
    return { error: "Anda tidak dapat menghapus akun yang sedang Anda gunakan." };
  }

  const pengguna = await db.pengguna.findUnique({
    where: { id: penggunaId },
    include: {
      _count: {
        select: {
          pembayaranSiswa: true,
          pemasukanDana: true,
          pengeluaran: true,
        },
      },
    },
  });

  if (!pengguna) return { error: "Akun tidak ditemukan." };

  const totalTransaksi =
    pengguna._count.pembayaranSiswa +
    pengguna._count.pemasukanDana +
    pengguna._count.pengeluaran;

  if (totalTransaksi > 0) {
    return {
      error: `Akun "${pengguna.nama}" memiliki ${totalTransaksi} riwayat pencatatan transaksi keuangan. Akun tidak dapat dihapus permanen demi menjaga keutuhan laporan audit sekolah. Silakan gunakan opsi Nonaktifkan Akun.`,
    };
  }

  // Jika akun belum pernah mencatat transaksi, hapus sesi dan akun permanen
  await db.$transaction([
    db.sesi.deleteMany({ where: { penggunaId } }),
    db.pengguna.delete({ where: { id: penggunaId } }),
  ]);

  return { success: true };
}

