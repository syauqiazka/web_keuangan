"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePetugas } from "@/server/auth/guards";

export interface ActionState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

// ─── Skema Validasi ─────────────────────────────────────────────

const anggotaSchema = z.object({
  nama: z.string().min(1, "Nama harus diisi.").max(200),
  uid: z
    .string()
    .min(1, "Kode UID harus diisi.")
    .max(50)
    .regex(/^[A-Za-z0-9\-_]+$/, "Kode UID hanya boleh berisi huruf, angka, dan tanda hubung."),
  tipe: z.enum(["SISWA", "GURU"], { message: "Tipe harus SISWA atau GURU." }),
  tahunAjaranId: z.string().optional(),
  kelasId: z.string().optional(),
});

const hapusAnggotaSchema = z.object({
  anggotaId: z.string().min(1),
});

// ─── Tambah Anggota (Siswa/Guru) ────────────────────────────────

export async function tambahAnggotaAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid. Silakan masuk kembali." };

  const raw = {
    nama: formData.get("nama"),
    uid: formData.get("uid"),
    tipe: formData.get("tipe"),
    tahunAjaranId: formData.get("tahunAjaranId") || undefined,
    kelasId: formData.get("kelasId") || undefined,
  };

  const parsed = anggotaSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", fieldErrors };
  }

  const { nama, uid, tipe, tahunAjaranId, kelasId } = parsed.data;

  // Cek uid sudah ada
  const existing = await db.anggota.findUnique({ where: { uid } });
  if (existing) {
    return { error: `Kode UID "${uid}" sudah digunakan oleh anggota lain.` };
  }

  // Guru tidak perlu penempatan kelas
  if (tipe === "GURU") {
    await db.anggota.create({
      data: { uid, nama, tipe: "GURU" },
    });
    return { success: true };
  }

  // Siswa wajib punya tahun ajaran dan kelas
  if (!tahunAjaranId || !kelasId) {
    return { error: "Tahun Ajaran dan Kelas wajib diisi untuk siswa." };
  }

  // Validasi tahun ajaran dan kelas ada
  const [tahunAjaran, kelas] = await Promise.all([
    db.tahunAjaran.findUnique({ where: { id: tahunAjaranId } }),
    db.kelas.findUnique({ where: { id: kelasId } }),
  ]);
  if (!tahunAjaran) return { error: "Tahun Ajaran tidak ditemukan." };
  if (!kelas) return { error: "Kelas tidak ditemukan." };

  // Buat anggota + penempatan dalam satu transaksi
  await db.$transaction(async (tx) => {
    const anggota = await tx.anggota.create({
      data: { uid, nama, tipe: "SISWA" },
    });
    await tx.penempatanKelas.create({
      data: { anggotaId: anggota.id, tahunAjaranId, kelasId },
    });
  });

  return { success: true };
}

// ─── Hapus Lunak Anggota ─────────────────────────────────────────
// (Admin saja yang boleh menonaktifkan)
export async function nonaktifkanAnggotaAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid." };

  const parsed = hapusAnggotaSchema.safeParse({ anggotaId: formData.get("anggotaId") });
  if (!parsed.success) return { error: "Data tidak valid." };

  await db.anggota.update({
    where: { id: parsed.data.anggotaId },
    data: { aktif: false },
  });

  return { success: true };
}

// ─── Tambah Kelas ──────────────────────────────────────────────────

export async function tambahKelasAction(
  nama: string
): Promise<ActionState & { kelasId?: string }> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid." };

  const cleanNama = nama.trim();
  if (!cleanNama) return { error: "Nama kelas harus diisi." };

  const existing = await db.kelas.findUnique({ where: { nama: cleanNama } });
  if (existing) return { error: `Kelas "${cleanNama}" sudah ada.`, kelasId: existing.id };

  const kelas = await db.kelas.create({ data: { nama: cleanNama } });
  return { success: true, kelasId: kelas.id };
}

// ─── Tambah Tahun Ajaran ────────────────────────────────────────

export async function tambahTahunAjaranAction(params: {
  nama: string;
  mulai: string;
  selesai: string;
}): Promise<ActionState & { tahunAjaranId?: string }> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid." };

  const { nama, mulai, selesai } = params;
  if (!nama.trim()) return { error: "Nama tahun ajaran harus diisi." };

  const existing = await db.tahunAjaran.findUnique({ where: { nama: nama.trim() } });
  if (existing) return { error: `Tahun Ajaran "${nama}" sudah ada.`, tahunAjaranId: existing.id };

  const mulaiDate = new Date(mulai);
  const selesaiDate = new Date(selesai);
  if (isNaN(mulaiDate.getTime()) || isNaN(selesaiDate.getTime())) {
    return { error: "Tanggal mulai atau selesai tidak valid." };
  }

  const ta = await db.tahunAjaran.create({
    data: { nama: nama.trim(), mulai: mulaiDate, selesai: selesaiDate },
  });

  return { success: true, tahunAjaranId: ta.id };
}
