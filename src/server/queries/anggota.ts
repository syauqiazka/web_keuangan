import "server-only";
import { db } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";

export interface AnggotaRow {
  id: string;
  uid: string;
  nama: string;
  tipe: "SISWA" | "GURU";
  aktif: boolean;
  kelasId: string | null;
  kelasNama: string | null;
  tahunAjaranId: string | null;
}

export interface TahunAjaranOption {
  id: string;
  nama: string;
  aktif: boolean;
  mulai: string;
  selesai: string;
}

export interface KelasOption {
  id: string;
  nama: string;
  urutan: number;
}

export async function getTahunAjaranList(): Promise<TahunAjaranOption[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await db.tahunAjaran.findMany({
    orderBy: [{ mulai: "desc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    aktif: r.aktif,
    mulai: r.mulai.toISOString(),
    selesai: r.selesai.toISOString(),
  }));
}

export async function getKelasList(): Promise<KelasOption[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await db.kelas.findMany({
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
  });
  return rows;
}

export async function getAnggotaList(params: {
  tahunAjaranId?: string;
  kelasId?: string | "guru";
  page?: number;
}): Promise<{ rows: AnggotaRow[]; total: number }> {
  const user = await getSessionUser();
  if (!user) return { rows: [], total: 0 };

  const { tahunAjaranId, kelasId, page = 1 } = params;
  const take = 50;
  const skip = (page - 1) * take;

  // Filter "Guru": hanya tampilkan anggota dengan tipe GURU
  if (kelasId === "guru") {
    const [rows, total] = await Promise.all([
      db.anggota.findMany({
        where: { tipe: "GURU", aktif: true },
        orderBy: [{ nama: "asc" }],
        skip,
        take,
      }),
      db.anggota.count({ where: { tipe: "GURU", aktif: true } }),
    ]);
    return {
      rows: rows.map((r) => ({
        id: r.id,
        uid: r.uid,
        nama: r.nama,
        tipe: r.tipe as "GURU",
        aktif: r.aktif,
        kelasId: null,
        kelasNama: "Guru",
        tahunAjaranId: null,
      })),
      total,
    };
  }

  // Filter berdasarkan tahun ajaran + kelas (siswa)
  if (tahunAjaranId && kelasId && kelasId !== "guru") {
    const [penempatan, total] = await Promise.all([
      db.penempatanKelas.findMany({
        where: { tahunAjaranId, kelasId },
        include: { anggota: true, kelas: true },
        skip,
        take,
        orderBy: [{ anggota: { nama: "asc" } }],
      }),
      db.penempatanKelas.count({ where: { tahunAjaranId, kelasId } }),
    ]);
    return {
      rows: penempatan.map((p) => ({
        id: p.anggota.id,
        uid: p.anggota.uid,
        nama: p.anggota.nama,
        tipe: "SISWA" as const,
        aktif: p.anggota.aktif,
        kelasId: p.kelas.id,
        kelasNama: p.kelas.nama,
        tahunAjaranId: p.tahunAjaranId,
      })),
      total,
    };
  }

  // Filter hanya tahun ajaran (semua kelas)
  if (tahunAjaranId) {
    const [penempatan, total] = await Promise.all([
      db.penempatanKelas.findMany({
        where: { tahunAjaranId },
        include: { anggota: true, kelas: true },
        skip,
        take,
        orderBy: [{ kelas: { urutan: "asc" } }, { anggota: { nama: "asc" } }],
      }),
      db.penempatanKelas.count({ where: { tahunAjaranId } }),
    ]);
    return {
      rows: penempatan.map((p) => ({
        id: p.anggota.id,
        uid: p.anggota.uid,
        nama: p.anggota.nama,
        tipe: "SISWA" as const,
        aktif: p.anggota.aktif,
        kelasId: p.kelas.id,
        kelasNama: p.kelas.nama,
        tahunAjaranId: p.tahunAjaranId,
      })),
      total,
    };
  }

  // Tanpa filter: tampilkan semua siswa aktif (default)
  const [penempatan, total] = await Promise.all([
    db.penempatanKelas.findMany({
      include: { anggota: true, kelas: true, tahunAjaran: true },
      skip,
      take,
      orderBy: [{ tahunAjaran: { mulai: "desc" } }, { kelas: { urutan: "asc" } }, { anggota: { nama: "asc" } }],
    }),
    db.penempatanKelas.count(),
  ]);
  return {
    rows: penempatan.map((p) => ({
      id: p.anggota.id,
      uid: p.anggota.uid,
      nama: p.anggota.nama,
      tipe: "SISWA" as const,
      aktif: p.anggota.aktif,
      kelasId: p.kelas.id,
      kelasNama: p.kelas.nama,
      tahunAjaranId: p.tahunAjaranId,
    })),
    total,
  };
}
