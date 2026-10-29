import "server-only";
import { db } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";

export interface AkunRow {
  id: string;
  kode: string;
  nama: string;
  peran: "ADMIN" | "PETUGAS";
  aktif: boolean;
  wajibGantiPassword: boolean;
  totalTransaksi: number;
  createdAt: string;
}

export async function getAkunList(): Promise<AkunRow[]> {
  const user = await getSessionUser();
  if (!user || user.peran !== "ADMIN") return [];

  const rows = await db.pengguna.findMany({
    orderBy: [{ createdAt: "asc" }],
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

  return rows.map((r) => ({
    id: r.id,
    kode: r.kode,
    nama: r.nama,
    peran: r.peran as "ADMIN" | "PETUGAS",
    aktif: r.aktif,
    wajibGantiPassword: r.wajibGantiPassword,
    totalTransaksi:
      (r._count?.pembayaranSiswa ?? 0) +
      (r._count?.pemasukanDana ?? 0) +
      (r._count?.pengeluaran ?? 0),
    createdAt: r.createdAt.toISOString(),
  }));
}
