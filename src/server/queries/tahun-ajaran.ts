import "server-only";
import { db } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";

export interface TahunAjaranItem {
  id: string;
  nama: string;
  mulai: string; // ISO
  selesai: string; // ISO
  aktif: boolean;
  totalSiswa: number;
  totalJenisPemasukan: number;
}

export interface KelasItem {
  id: string;
  nama: string;
  urutan: number;
  totalSiswa: number;
}

export async function getDaftarTahunAjaranLengkap(): Promise<TahunAjaranItem[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await db.tahunAjaran.findMany({
    orderBy: [{ mulai: "desc" }],
    include: {
      _count: {
        select: {
          penempatan: true,
          jenisPemasukan: true,
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    mulai: r.mulai.toISOString(),
    selesai: r.selesai.toISOString(),
    aktif: r.aktif,
    totalSiswa: r._count.penempatan,
    totalJenisPemasukan: r._count.jenisPemasukan,
  }));
}

export async function getDaftarKelasLengkap(): Promise<KelasItem[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await db.kelas.findMany({
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    include: {
      _count: {
        select: {
          penempatan: true,
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    urutan: r.urutan,
    totalSiswa: r._count.penempatan,
  }));
}
