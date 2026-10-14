"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePetugas } from "@/server/auth/guards";

export interface ActionState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
  createdId?: string;
}

// Tangani string tanggal "DD-MM-YYYY" atau "YYYY-MM-DD"
function parseTanggal(raw: string): Date | null {
  // coba format dd-mm-yyyy
  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw.trim());
  if (ddmmyyyy) {
    const d = parseInt(ddmmyyyy[1], 10);
    const m = parseInt(ddmmyyyy[2], 10);
    const y = parseInt(ddmmyyyy[3], 10);
    return new Date(Date.UTC(y, m - 1, d));
  }
  // coba format yyyy-mm-dd (dari input[type=date])
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (isoDate) {
    const y = parseInt(isoDate[1], 10);
    const m = parseInt(isoDate[2], 10);
    const d = parseInt(isoDate[3], 10);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return null;
}

const pengeluaranSchema = z.object({
  tanggal: z.string().min(1, "Tanggal harus diisi."),
  jenis: z.string().min(1, "Jenis pengeluaran harus diisi.").max(200),
  nominal: z
    .string()
    .min(1, "Nominal harus diisi.")
    .transform((v) => {
      // Terima "1.000.000" atau "Rp 1.000.000"
      const cleaned = v.replace(/[Rp\s.]/g, "").replace(",", "");
      const n = parseInt(cleaned, 10);
      return n;
    })
    .refine((n) => !isNaN(n) && n > 0, "Nominal harus lebih dari 0."),
  catatan: z.string().max(500).optional(),
  tahunAjaranId: z.string().optional(),
});

export async function tambahPengeluaranAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid. Silakan masuk kembali." };

  const raw = {
    tanggal: formData.get("tanggal"),
    jenis: formData.get("jenis"),
    nominal: formData.get("nominal"),
    catatan: formData.get("catatan") || undefined,
    tahunAjaranId: formData.get("tahunAjaranId") || undefined,
  };

  const parsed = pengeluaranSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", fieldErrors };
  }

  const { jenis, nominal, catatan } = parsed.data;

  const tanggalDate = parseTanggal(String(formData.get("tanggal")));
  if (!tanggalDate) {
    return { error: "Format tanggal tidak valid. Gunakan DD-MM-YYYY.", fieldErrors: { tanggal: "Format tidak valid." } };
  }

  const created = await db.pengeluaran.create({
    data: {
      tanggal: tanggalDate,
      jenis,
      nominal,
      catatan: catatan ?? null,
      petugasId: user.id,
    },
  });

  return { success: true, createdId: created.id };
}

export async function ubahPengeluaranAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID pengeluaran tidak ditemukan." };

  const existing = await db.pengeluaran.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return { error: "Data pengeluaran tidak ditemukan." };

  // Petugas biasa hanya boleh ubah miliknya sendiri
  if (user.peran !== "ADMIN" && existing.petugasId !== user.id) {
    return { error: "Anda tidak memiliki izin untuk mengubah data ini." };
  }

  const raw = {
    tanggal: formData.get("tanggal"),
    jenis: formData.get("jenis"),
    nominal: formData.get("nominal"),
    catatan: formData.get("catatan") || undefined,
  };

  const parsed = pengeluaranSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", fieldErrors };
  }

  const { jenis, nominal, catatan } = parsed.data;
  const tanggalDate = parseTanggal(String(formData.get("tanggal")));
  if (!tanggalDate) {
    return { error: "Format tanggal tidak valid." };
  }

  await db.pengeluaran.update({
    where: { id },
    data: { tanggal: tanggalDate, jenis, nominal, catatan: catatan ?? null },
  });

  return { success: true };
}

export async function hapusPengeluaranAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID pengeluaran tidak ditemukan." };

  const existing = await db.pengeluaran.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return { error: "Data pengeluaran tidak ditemukan." };

  // Petugas biasa hanya boleh hapus miliknya sendiri
  if (user.peran !== "ADMIN" && existing.petugasId !== user.id) {
    return { error: "Anda tidak memiliki izin untuk menghapus data ini." };
  }

  await db.pengeluaran.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { success: true };
}
