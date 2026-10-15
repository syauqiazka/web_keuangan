import "server-only";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";

export interface TotalQueryResult {
  totalPerTahun: number;
  totalPerTahunFormatted: string;
  totalBulanIni: number;
  totalBulanIniFormatted: string;
}

export interface TotalQueryParams {
  tahun?: number; // Tahun kalender (misal 2026 untuk Dashboard)
  tahunAjaranId?: string; // ID TahunAjaran (untuk halaman Pemasukan / Pengeluaran)
  bulan?: string; // Format "YYYY-MM"
}

async function resolveDateRange(params: TotalQueryParams) {
  let startTahun: Date | undefined;
  let endTahun: Date | undefined;
  let startBulan: Date | undefined;
  let endBulan: Date | undefined;

  if (params.tahunAjaranId) {
    const ta = await db.tahunAjaran.findUnique({
      where: { id: params.tahunAjaranId },
    });
    if (ta) {
      startTahun = ta.mulai;
      endTahun = ta.selesai;
    }
  } else if (params.tahun) {
    startTahun = new Date(Date.UTC(params.tahun, 0, 1));
    endTahun = new Date(Date.UTC(params.tahun, 11, 31, 23, 59, 59, 999));
  }

  if (params.bulan) {
    const [y, m] = params.bulan.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      startBulan = new Date(Date.UTC(y, m - 1, 1));
      // Hari terakhir di bulan m (UTC)
      endBulan = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    }
  }

  return { startTahun, endTahun, startBulan, endBulan };
}

/**
 * Fungsi query bersama untuk total pemasukan (siswa + bantuan + donatur).
 * Dipakai oleh Dashboard, Pemasukan, dan Ringkasan agar nilainya identik.
 * Tidak pernah difilter berdasarkan kelas.
 */
export async function getTotalPemasukan(
  params: TotalQueryParams
): Promise<TotalQueryResult> {
  const { startTahun, endTahun, startBulan, endBulan } = await resolveDateRange(params);

  const filterTahun = {
    deletedAt: null,
    ...(startTahun && endTahun ? { tanggal: { gte: startTahun, lte: endTahun } } : {}),
  };

  const filterBulan = startBulan && endBulan
    ? { deletedAt: null, tanggal: { gte: startBulan, lte: endBulan } }
    : undefined;

  const [sumSiswaTahun, sumDanaTahun, sumSiswaBulan, sumDanaBulan] =
    await Promise.all([
      db.pembayaranSiswa.aggregate({
        where: filterTahun,
        _sum: { nominal: true },
      }),
      db.pemasukanDana.aggregate({
        where: filterTahun,
        _sum: { nominal: true },
      }),
      filterBulan
        ? db.pembayaranSiswa.aggregate({
            where: filterBulan,
            _sum: { nominal: true },
          })
        : Promise.resolve({ _sum: { nominal: null } }),
      filterBulan
        ? db.pemasukanDana.aggregate({
            where: filterBulan,
            _sum: { nominal: true },
          })
        : Promise.resolve({ _sum: { nominal: null } }),
    ]);

  const totalPerTahun =
    Number(sumSiswaTahun._sum.nominal ?? 0) +
    Number(sumDanaTahun._sum.nominal ?? 0);

  const totalBulanIni = filterBulan
    ? Number(sumSiswaBulan._sum.nominal ?? 0) +
      Number(sumDanaBulan._sum.nominal ?? 0)
    : 0;

  return {
    totalPerTahun,
    totalPerTahunFormatted: formatRupiah(totalPerTahun),
    totalBulanIni,
    totalBulanIniFormatted: formatRupiah(totalBulanIni),
  };
}

/**
 * Fungsi query bersama untuk total pengeluaran.
 * Dipakai oleh Dashboard, Pengeluaran, dan Ringkasan agar nilainya identik.
 */
export async function getTotalPengeluaran(
  params: TotalQueryParams
): Promise<TotalQueryResult> {
  const { startTahun, endTahun, startBulan, endBulan } = await resolveDateRange(params);

  const filterTahun = {
    deletedAt: null,
    ...(startTahun && endTahun ? { tanggal: { gte: startTahun, lte: endTahun } } : {}),
  };

  const filterBulan = startBulan && endBulan
    ? { deletedAt: null, tanggal: { gte: startBulan, lte: endBulan } }
    : undefined;

  const [sumTahun, sumBulan] = await Promise.all([
    db.pengeluaran.aggregate({
      where: filterTahun,
      _sum: { nominal: true },
    }),
    filterBulan
      ? db.pengeluaran.aggregate({
          where: filterBulan,
          _sum: { nominal: true },
        })
      : Promise.resolve({ _sum: { nominal: null } }),
  ]);

  const totalPerTahun = Number(sumTahun._sum.nominal ?? 0);
  const totalBulanIni = filterBulan ? Number(sumBulan._sum.nominal ?? 0) : 0;

  return {
    totalPerTahun,
    totalPerTahunFormatted: formatRupiah(totalPerTahun),
    totalBulanIni,
    totalBulanIniFormatted: formatRupiah(totalBulanIni),
  };
}
