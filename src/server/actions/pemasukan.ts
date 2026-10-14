"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requirePetugas } from "@/server/auth/guards";

export interface ActionState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
  createdId?: string;
}

// ─── Helper: parse tanggal DD-MM-YYYY atau YYYY-MM-DD ────────────
function parseTanggal(raw: string): Date | null {
  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw.trim());
  if (ddmmyyyy) {
    const d = parseInt(ddmmyyyy[1], 10);
    const m = parseInt(ddmmyyyy[2], 10);
    const y = parseInt(ddmmyyyy[3], 10);
    return new Date(Date.UTC(y, m - 1, d));
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (iso) {
    return new Date(Date.UTC(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3])));
  }
  return null;
}

// ─── JenisPemasukan ───────────────────────────────────────────────

const jenisPemasukanSchema = z.object({
  nama: z.string().min(1, "Nama harus diisi.").max(100),
  tahunAjaranId: z.string().min(1, "Tahun ajaran harus diisi."),
  bulanan: z.enum(["true", "false"]).transform((v) => v === "true"),
  nominalStandar: z.string().optional().transform((v) => {
    if (!v || v.trim() === "") return null;
    const cleaned = v.replace(/[Rp\s.]/g, "").replace(",", "");
    const n = parseInt(cleaned, 10);
    return isNaN(n) || n <= 0 ? null : n;
  }),
  urutan: z.string().optional().transform((v) => parseInt(v ?? "0", 10) || 0),
});

export async function tambahJenisPemasukanAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin().catch(() => null);
  if (!user) return { error: "Hanya admin yang dapat mengelola jenis pemasukan." };

  const raw = {
    nama: formData.get("nama"),
    tahunAjaranId: formData.get("tahunAjaranId"),
    bulanan: formData.get("bulanan") ?? "false",
    nominalStandar: formData.get("nominalStandar") || undefined,
    urutan: formData.get("urutan") || undefined,
  };

  const parsed = jenisPemasukanSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", fieldErrors };
  }

  const { nama, tahunAjaranId, bulanan, nominalStandar, urutan } = parsed.data;

  // Cek duplikat nama dalam tahun ajaran yang sama
  const existing = await db.jenisPemasukan.findUnique({
    where: { tahunAjaranId_nama: { tahunAjaranId, nama } },
  });
  if (existing) {
    if (!existing.aktif) {
      // Aktifkan kembali
      await db.jenisPemasukan.update({
        where: { id: existing.id },
        data: { aktif: true, bulanan, nominalStandar, urutan },
      });
      return { success: true, createdId: existing.id };
    }
    return { error: `Jenis pemasukan "${nama}" sudah ada untuk tahun ajaran ini.` };
  }

  const created = await db.jenisPemasukan.create({
    data: { nama, tahunAjaranId, bulanan, nominalStandar, urutan },
  });

  return { success: true, createdId: created.id };
}

export async function ubahJenisPemasukanAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin().catch(() => null);
  if (!user) return { error: "Hanya admin yang dapat mengelola jenis pemasukan." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID tidak ditemukan." };

  const nominalStandarRaw = String(formData.get("nominalStandar") ?? "");
  const nominalStandar = nominalStandarRaw
    ? parseInt(nominalStandarRaw.replace(/[Rp\s.]/g, "").replace(",", ""), 10) || null
    : null;

  await db.jenisPemasukan.update({
    where: { id },
    data: {
      bulanan: formData.get("bulanan") === "true",
      nominalStandar,
    },
  });

  return { success: true };
}

// ─── PembayaranSiswa ──────────────────────────────────────────────

const pembayaranSiswaSchema = z.object({
  penempatanId: z.string().min(1, "Data penempatan tidak ditemukan."),
  jenisPemasukanId: z.string().min(1, "Jenis pemasukan harus dipilih."),
  tanggal: z.string().min(1, "Tanggal harus diisi."),
  bulanTerbayar: z.string().optional(), // "YYYY-MM"
  metode: z.enum(["TRANSFER", "SETOR_TUNAI"], { message: "Metode tidak valid." }),
  nominal: z
    .string()
    .min(1, "Nominal harus diisi.")
    .transform((v) => {
      const cleaned = v.replace(/[Rp\s.]/g, "").replace(",", "");
      return parseInt(cleaned, 10);
    })
    .refine((n) => !isNaN(n) && n > 0, "Nominal harus lebih dari 0."),
  catatan: z.string().max(500).optional(),
});

export async function tambahPembayaranSiswaAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid. Silakan masuk kembali." };

  const raw = {
    penempatanId: formData.get("penempatanId"),
    jenisPemasukanId: formData.get("jenisPemasukanId"),
    tanggal: formData.get("tanggal"),
    bulanTerbayar: formData.get("bulanTerbayar") || undefined,
    metode: formData.get("metode") ?? "SETOR_TUNAI",
    nominal: formData.get("nominal"),
    catatan: formData.get("catatan") || undefined,
  };

  const parsed = pembayaranSiswaSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", fieldErrors };
  }

  const { penempatanId, jenisPemasukanId, tanggal: tanggalStr, bulanTerbayar, metode, nominal, catatan } = parsed.data;

  const tanggalDate = parseTanggal(tanggalStr);
  if (!tanggalDate) return { error: "Format tanggal tidak valid. Gunakan DD-MM-YYYY." };

  // Validasi penempatan dan jenis pemasukan
  const [penempatan, jenis] = await Promise.all([
    db.penempatanKelas.findUnique({ where: { id: penempatanId } }),
    db.jenisPemasukan.findUnique({ where: { id: jenisPemasukanId } }),
  ]);
  if (!penempatan) return { error: "Data penempatan siswa tidak ditemukan." };
  if (!jenis) return { error: "Jenis pemasukan tidak ditemukan." };

  // Invarian: tahun ajaran harus sama
  if (penempatan.tahunAjaranId !== jenis.tahunAjaranId) {
    return { error: "Tahun ajaran penempatan dan jenis pemasukan tidak cocok." };
  }

  // Validasi bulanTerbayar
  let bulanTerbayarDate: Date | null = null;
  if (jenis.bulanan) {
    if (!bulanTerbayar) return { error: "Bulan terbayar harus diisi untuk jenis pemasukan bulanan." };
    const [y, m] = bulanTerbayar.split("-").map(Number);
    if (isNaN(y) || isNaN(m)) return { error: "Format bulan terbayar tidak valid." };
    bulanTerbayarDate = new Date(Date.UTC(y, m - 1, 1));
  }

  const created = await db.pembayaranSiswa.create({
    data: {
      penempatanId,
      jenisPemasukanId,
      tanggal: tanggalDate,
      bulanTerbayar: bulanTerbayarDate,
      metode: metode as "TRANSFER" | "SETOR_TUNAI",
      nominal,
      catatan: catatan ?? null,
      petugasId: user.id,
    },
  });

  return { success: true, createdId: created.id };
}

export async function hapusPembayaranSiswaAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID pembayaran tidak ditemukan." };

  const existing = await db.pembayaranSiswa.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return { error: "Data pembayaran tidak ditemukan." };

  if (user.peran !== "ADMIN" && existing.petugasId !== user.id) {
    return { error: "Anda tidak memiliki izin untuk menghapus data ini." };
  }

  await db.pembayaranSiswa.update({ where: { id }, data: { deletedAt: new Date() } });
  return { success: true };
}

// ─── PemasukanDana (Bantuan + Donatur) ───────────────────────────

const pemasukanDanaSchema = z.object({
  sumberDanaId: z.string().min(1, "Sumber dana harus dipilih."),
  tanggal: z.string().min(1, "Tanggal harus diisi."),
  nominal: z
    .string()
    .min(1, "Nominal harus diisi.")
    .transform((v) => {
      const cleaned = v.replace(/[Rp\s.]/g, "").replace(",", "");
      return parseInt(cleaned, 10);
    })
    .refine((n) => !isNaN(n) && n > 0, "Nominal harus lebih dari 0."),
  catatan: z.string().max(500).optional(),
});

export async function tambahPemasukanDanaAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid. Silakan masuk kembali." };

  const raw = {
    sumberDanaId: formData.get("sumberDanaId"),
    tanggal: formData.get("tanggal"),
    nominal: formData.get("nominal"),
    catatan: formData.get("catatan") || undefined,
  };

  const parsed = pemasukanDanaSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", fieldErrors };
  }

  const { sumberDanaId, tanggal: tanggalStr, nominal, catatan } = parsed.data;

  const tanggalDate = parseTanggal(tanggalStr);
  if (!tanggalDate) return { error: "Format tanggal tidak valid. Gunakan DD-MM-YYYY." };

  const sumber = await db.sumberDana.findUnique({ where: { id: sumberDanaId } });
  if (!sumber) return { error: "Sumber dana tidak ditemukan." };

  const created = await db.pemasukanDana.create({
    data: {
      sumberDanaId,
      tanggal: tanggalDate,
      nominal,
      catatan: catatan ?? null,
      petugasId: user.id,
    },
  });

  return { success: true, createdId: created.id };
}

export async function hapusPemasukanDanaAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID tidak ditemukan." };

  const existing = await db.pemasukanDana.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return { error: "Data pemasukan tidak ditemukan." };

  if (user.peran !== "ADMIN" && existing.petugasId !== user.id) {
    return { error: "Anda tidak memiliki izin untuk menghapus data ini." };
  }

  await db.pemasukanDana.update({ where: { id }, data: { deletedAt: new Date() } });
  return { success: true };
}

// ─── Sumber Dana ─────────────────────────────────────────────────

export async function tambahSumberDanaAction(params: {
  nama: string;
  kategori: "BANTUAN" | "DONATUR";
}): Promise<ActionState & { sumberDanaId?: string }> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid." };

  const cleanNama = params.nama.trim();
  if (!cleanNama) return { error: "Nama sumber dana harus diisi." };

  const existing = await db.sumberDana.findUnique({
    where: { kategori_nama: { kategori: params.kategori, nama: cleanNama } },
  });
  if (existing) return { error: `"${cleanNama}" sudah ada.`, sumberDanaId: existing.id };

  const created = await db.sumberDana.create({
    data: { nama: cleanNama, kategori: params.kategori },
  });
  return { success: true, sumberDanaId: created.id };
}
