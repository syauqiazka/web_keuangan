"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth/guards";
import { parseTanggalInput, createUTCDate } from "@/lib/dates";

export interface ActionState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

// ─── Skema Validasi Tahun Ajaran ──────────────────────────────────

const tahunAjaranInputSchema = z.object({
  nama: z.string().trim().min(1, "Nama tahun ajaran harus diisi.").max(50),
  mulai: z.string().trim().min(1, "Tanggal mulai harus diisi."),
  selesai: z.string().trim().min(1, "Tanggal selesai harus diisi."),
  aktif: z.boolean().optional(),
});

function parseDateValue(val: string): Date | null {
  const trimmed = val.trim();
  // Mendukung format DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return parseTanggalInput(trimmed);
  }
  // Mendukung format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return createUTCDate(y, m, d);
    }
  }
  const dt = new Date(trimmed);
  return isNaN(dt.getTime()) ? null : dt;
}

// ─── Tambah Tahun Ajaran ─────────────────────────────────────────

export async function tambahTahunAjaranAction(params: {
  nama: string;
  mulai: string;
  selesai: string;
  aktif?: boolean;
}): Promise<ActionState & { tahunAjaranId?: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Akses ditolak. Hanya administrator yang dapat mengelola tahun ajaran." };

  const parsed = tahunAjaranInputSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const { nama, mulai, selesai, aktif = false } = parsed.data;

  const mulaiDate = parseDateValue(mulai);
  const selesaiDate = parseDateValue(selesai);

  if (!mulaiDate) return { error: "Format tanggal mulai tidak valid. Gunakan YYYY-MM-DD atau DD-MM-YYYY." };
  if (!selesaiDate) return { error: "Format tanggal selesai tidak valid. Gunakan YYYY-MM-DD atau DD-MM-YYYY." };

  if (mulaiDate.getTime() > selesaiDate.getTime()) {
    return { error: "Tanggal mulai tidak boleh melebihi tanggal selesai." };
  }

  const existing = await db.tahunAjaran.findUnique({ where: { nama } });
  if (existing) {
    return { error: `Tahun ajaran "${nama}" sudah terdaftar.` };
  }

  try {
    const created = await db.$transaction(async (tx) => {
      // Jika dijadikan aktif, nonaktifkan seluruh tahun ajaran lain dalam satu transaksi aman
      if (aktif) {
        await tx.tahunAjaran.updateMany({
          data: { aktif: false },
        });
      }

      const ta = await tx.tahunAjaran.create({
        data: {
          nama,
          mulai: mulaiDate,
          selesai: selesaiDate,
          aktif,
        },
      });

      // Siapkan default kolom SPP untuk tahun ajaran baru jika belum ada
      const existingSpp = await tx.jenisPemasukan.findUnique({
        where: {
          tahunAjaranId_nama: {
            tahunAjaranId: ta.id,
            nama: "SPP",
          },
        },
      });

      if (!existingSpp) {
        await tx.jenisPemasukan.create({
          data: {
            tahunAjaranId: ta.id,
            nama: "SPP",
            bulanan: true,
            urutan: 1,
            nominalStandar: 250000,
            aktif: true,
          },
        });
      }

      return ta;
    });

    return { success: true, tahunAjaranId: created.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menambahkan tahun ajaran.";
    return { error: msg };
  }
}

// ─── Set Tahun Ajaran Aktif ───────────────────────────────────────

export async function setTahunAjaranAktifAction(
  tahunAjaranId: string
): Promise<ActionState> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Akses ditolak. Hanya administrator yang dapat mengganti tahun ajaran aktif." };

  if (!tahunAjaranId) return { error: "ID tahun ajaran tidak valid." };

  const target = await db.tahunAjaran.findUnique({ where: { id: tahunAjaranId } });
  if (!target) return { error: "Tahun ajaran tidak ditemukan." };

  try {
    await db.$transaction(async (tx) => {
      // 1. Nonaktifkan semua tahun ajaran lain
      await tx.tahunAjaran.updateMany({
        data: { aktif: false },
      });
      // 2. Aktifkan tahun ajaran target
      await tx.tahunAjaran.update({
        where: { id: tahunAjaranId },
        data: { aktif: true },
      });
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengaktifkan tahun ajaran.";
    return { error: msg };
  }
}

// ─── Ubah Tahun Ajaran ───────────────────────────────────────────

export async function ubahTahunAjaranAction(params: {
  id: string;
  nama: string;
  mulai: string;
  selesai: string;
}): Promise<ActionState> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Akses ditolak. Hanya administrator yang dapat mengubah data tahun ajaran." };

  const { id, nama, mulai, selesai } = params;
  if (!id) return { error: "ID tahun ajaran tidak valid." };

  const cleanNama = nama.trim();
  if (!cleanNama) return { error: "Nama tahun ajaran harus diisi." };

  const mulaiDate = parseDateValue(mulai);
  const selesaiDate = parseDateValue(selesai);

  if (!mulaiDate) return { error: "Tanggal mulai tidak valid." };
  if (!selesaiDate) return { error: "Tanggal selesai tidak valid." };

  if (mulaiDate.getTime() > selesaiDate.getTime()) {
    return { error: "Tanggal mulai tidak boleh melebihi tanggal selesai." };
  }

  // Cek nama kembar
  const existing = await db.tahunAjaran.findUnique({ where: { nama: cleanNama } });
  if (existing && existing.id !== id) {
    return { error: `Nama tahun ajaran "${cleanNama}" sudah digunakan periode lain.` };
  }

  try {
    await db.tahunAjaran.update({
      where: { id },
      data: {
        nama: cleanNama,
        mulai: mulaiDate,
        selesai: selesaiDate,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui tahun ajaran.";
    return { error: msg };
  }
}

// ─── Tambah Master Kelas ─────────────────────────────────────────

export async function tambahMasterKelasAction(params: {
  nama: string;
  urutan?: number;
}): Promise<ActionState & { kelasId?: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { error: "Akses ditolak. Hanya administrator yang dapat mengelola data kelas." };

  const cleanNama = params.nama.trim();
  if (!cleanNama) return { error: "Nama kelas harus diisi." };

  const existing = await db.kelas.findUnique({ where: { nama: cleanNama } });
  if (existing) {
    return { error: `Kelas "${cleanNama}" sudah ada.`, kelasId: existing.id };
  }

  try {
    const created = await db.kelas.create({
      data: {
        nama: cleanNama,
        urutan: params.urutan ?? 0,
      },
    });

    return { success: true, kelasId: created.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menambahkan kelas.";
    return { error: msg };
  }
}
