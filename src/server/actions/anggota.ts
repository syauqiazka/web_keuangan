"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePetugas } from "@/server/auth/guards";

import { generateUID } from "@/lib/uid";

export interface ActionState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

// ─── Skema Validasi ─────────────────────────────────────────────

const anggotaSchema = z.object({
  nama: z.string().min(1, "Nama harus diisi.").max(200),
  uid: z.string().min(1).max(50),
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

  const rawTipe = (formData.get("tipe") || "SISWA") as "SISWA" | "GURU";
  let rawUid = String(formData.get("uid") || "").trim();
  if (!rawUid) {
    rawUid = generateUID(rawTipe);
  }

  const raw = {
    nama: formData.get("nama"),
    uid: rawUid,
    tipe: rawTipe,
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

// ─── Batch Simpan Anggota (Mode Edit Grid) ─────────────────────────

export interface BatchAnggotaInput {
  id?: string;
  nama: string;
  uid?: string;
  tipe: "SISWA" | "GURU";
  kelasId?: string;
  tahunAjaranId?: string;
}

const batchItemSchema = z.object({
  id: z.string().optional(),
  nama: z.string().trim().min(1, "Nama tidak boleh kosong.").max(200),
  uid: z.string().trim().max(50).optional(),
  tipe: z.enum(["SISWA", "GURU"]),
  kelasId: z.string().optional(),
  tahunAjaranId: z.string().optional(),
});

export async function simpanBatchAnggotaAction(
  items: BatchAnggotaInput[]
): Promise<ActionState> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid. Silakan masuk kembali." };

  if (!items || items.length === 0) {
    return { error: "Tidak ada data untuk disimpan." };
  }

  // 1. Validasi setiap baris dengan Zod & isi UID otomatis jika kosong
  const validatedItems: Array<Required<Pick<BatchAnggotaInput, "nama" | "tipe">> & { id?: string; uid: string; kelasId?: string; tahunAjaranId?: string }> = [];
  const uidsInBatch = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const parsed = batchItemSchema.safeParse(item);
    if (!parsed.success) {
      return {
        error: `Baris ${i + 1}: ${parsed.error.issues[0]?.message ?? "Data tidak valid."}`,
      };
    }

    let finalUid = parsed.data.uid;
    if (!finalUid) {
      let candidate = generateUID(parsed.data.tipe);
      while (uidsInBatch.has(candidate.toLowerCase())) {
        candidate = generateUID(parsed.data.tipe);
      }
      finalUid = candidate;
    }

    const uidLower = finalUid.toLowerCase();
    if (uidsInBatch.has(uidLower)) {
      return { error: `Kode UID ganda dalam batch: "${finalUid}".` };
    }
    uidsInBatch.add(uidLower);
    validatedItems.push({
      ...parsed.data,
      uid: finalUid,
    });
  }

  // 2. Jalankan semua penyimpanan dalam satu transaksi DB
  try {
    await db.$transaction(async (tx) => {
      for (const row of validatedItems) {
        // Cek apakah UID sudah dipakai oleh anggota lain
        const existingUid = await tx.anggota.findUnique({
          where: { uid: row.uid },
        });

        if (row.id) {
          // Update anggota yang ada
          if (existingUid && existingUid.id !== row.id) {
            throw new Error(`Kode UID "${row.uid}" sudah digunakan anggota lain.`);
          }

          await tx.anggota.update({
            where: { id: row.id },
            data: {
              nama: row.nama,
              uid: row.uid,
              tipe: row.tipe,
              aktif: true,
            },
          });

          // Jika siswa, perbarui penempatan kelas jika ada tahunAjaranId & kelasId
          if (row.tipe === "SISWA" && row.tahunAjaranId && row.kelasId && row.kelasId !== "guru") {
            const existingPenempatan = await tx.penempatanKelas.findFirst({
              where: { anggotaId: row.id, tahunAjaranId: row.tahunAjaranId },
            });

            if (existingPenempatan) {
              await tx.penempatanKelas.update({
                where: { id: existingPenempatan.id },
                data: { kelasId: row.kelasId },
              });
            } else {
              await tx.penempatanKelas.create({
                data: {
                  anggotaId: row.id,
                  tahunAjaranId: row.tahunAjaranId,
                  kelasId: row.kelasId,
                },
              });
            }
          }
        } else {
          // Baris baru
          if (existingUid) {
            throw new Error(`Kode UID "${row.uid}" sudah digunakan anggota lain.`);
          }

          const created = await tx.anggota.create({
            data: {
              nama: row.nama,
              uid: row.uid,
              tipe: row.tipe,
              aktif: true,
            },
          });

          if (row.tipe === "SISWA" && row.tahunAjaranId && row.kelasId && row.kelasId !== "guru") {
            await tx.penempatanKelas.create({
              data: {
                anggotaId: created.id,
                tahunAjaranId: row.tahunAjaranId,
                kelasId: row.kelasId,
              },
            });
          }
        }
      }
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan data.";
    return { error: msg };
  }
}

// ─── Proses Kenaikan Kelas / Penempatan Siswa ke Tahun Ajaran Baru ───

export async function prosesKenaikanKelasAction(params: {
  tahunAjaranTujuanId: string;
  kelasTujuanId: string;
  anggotaIds: string[];
}): Promise<ActionState & { count?: number }> {
  const user = await requirePetugas().catch(() => null);
  if (!user) return { error: "Sesi tidak valid. Silakan masuk kembali." };

  const { tahunAjaranTujuanId, kelasTujuanId, anggotaIds } = params;

  if (!tahunAjaranTujuanId) return { error: "Tahun ajaran tujuan wajib dipilih." };
  if (!kelasTujuanId) return { error: "Kelas tujuan wajib dipilih." };
  if (!anggotaIds || anggotaIds.length === 0) {
    return { error: "Pilih setidaknya satu siswa untuk dinaikkan/ditempatkan kelas." };
  }

  // Validasi tahun ajaran dan kelas tujuan ada di database
  const [taTujuan, kltujuan] = await Promise.all([
    db.tahunAjaran.findUnique({ where: { id: tahunAjaranTujuanId } }),
    db.kelas.findUnique({ where: { id: kelasTujuanId } }),
  ]);

  if (!taTujuan) return { error: "Tahun ajaran tujuan tidak ditemukan." };
  if (!kltujuan) return { error: "Kelas tujuan tidak ditemukan." };

  try {
    let count = 0;
    await db.$transaction(async (tx) => {
      for (const anggotaId of anggotaIds) {
        // Pastikan anggota adalah SISWA
        const anggota = await tx.anggota.findUnique({ where: { id: anggotaId } });
        if (!anggota || anggota.tipe !== "SISWA") continue;

        // Cek apakah penempatan di tahun ajaran tujuan sudah ada
        const existing = await tx.penempatanKelas.findUnique({
          where: {
            anggotaId_tahunAjaranId: {
              anggotaId,
              tahunAjaranId: tahunAjaranTujuanId,
            },
          },
        });

        if (existing) {
          // Update ke kelas tujuan jika sudah ada penempatan di tahun ajaran tersebut
          await tx.penempatanKelas.update({
            where: { id: existing.id },
            data: { kelasId: kelasTujuanId },
          });
        } else {
          // Buat penempatan baru di tahun ajaran tujuan.
          // Penempatan tahun ajaran sebelumnya tidak diubah atau dihapus, menjaga riwayat historis!
          await tx.penempatanKelas.create({
            data: {
              anggotaId,
              tahunAjaranId: tahunAjaranTujuanId,
              kelasId: kelasTujuanId,
            },
          });
        }
        count++;
      }
    });

    return { success: true, count };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memproses penempatan kelas.";
    return { error: msg };
  }
}


