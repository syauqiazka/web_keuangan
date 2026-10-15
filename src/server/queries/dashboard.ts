import "server-only";
import { db } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";
import { formatRupiah } from "@/lib/money";

export interface DashboardRingkasan {
  totalSaldo: number;
  totalSaldoFormatted: string;
  totalPemasukan: number;
  totalPemasukanFormatted: string;
  totalPengeluaran: number;
  totalPengeluaranFormatted: string;
}

export interface GrafikBulanData {
  bulan: number; // 1-12
  pemasukan: number; // rupiah
  pengeluaran: number;
}

import { getTotalPemasukan, getTotalPengeluaran } from "./totals";

export async function getDashboardRingkasan(
  tahun: number
): Promise<DashboardRingkasan> {
  const user = await getSessionUser();
  const empty: DashboardRingkasan = {
    totalSaldo: 0,
    totalSaldoFormatted: formatRupiah(0),
    totalPemasukan: 0,
    totalPemasukanFormatted: formatRupiah(0),
    totalPengeluaran: 0,
    totalPengeluaranFormatted: formatRupiah(0),
  };
  if (!user) return empty;

  const [{ totalPerTahun: totalPemasukan }, { totalPerTahun: totalPengeluaran }] =
    await Promise.all([
      getTotalPemasukan({ tahun }),
      getTotalPengeluaran({ tahun }),
    ]);

  const totalSaldo = totalPemasukan - totalPengeluaran;

  return {
    totalSaldo,
    totalSaldoFormatted: formatRupiah(totalSaldo),
    totalPemasukan,
    totalPemasukanFormatted: formatRupiah(totalPemasukan),
    totalPengeluaran,
    totalPengeluaranFormatted: formatRupiah(totalPengeluaran),
  };
}

export async function getGrafikBulanan(
  tahun: number
): Promise<GrafikBulanData[]> {
  const user = await getSessionUser();
  if (!user) return [];

  // Satu query $queryRaw dengan date_trunc('month', tanggal) untuk agregasi per bulan
  type MonthlyAggRow = {
    bulan_num: number;
    pemasukan: string | number;
    pengeluaran: string | number;
  };

  const rows = await db.$queryRaw<MonthlyAggRow[]>`
    SELECT 
      EXTRACT(MONTH FROM date_trunc('month', tanggal))::int AS bulan_num,
      COALESCE(SUM(pemasukan), 0)::numeric AS pemasukan,
      COALESCE(SUM(pengeluaran), 0)::numeric AS pengeluaran
    FROM (
      SELECT tanggal, nominal AS pemasukan, 0 AS pengeluaran
      FROM pembayaran_siswa
      WHERE "deletedAt" IS NULL
        AND EXTRACT(YEAR FROM tanggal) = ${tahun}
      UNION ALL
      SELECT tanggal, nominal AS pemasukan, 0 AS pengeluaran
      FROM pemasukan_dana
      WHERE "deletedAt" IS NULL
        AND EXTRACT(YEAR FROM tanggal) = ${tahun}
      UNION ALL
      SELECT tanggal, 0 AS pemasukan, nominal AS pengeluaran
      FROM pengeluaran
      WHERE "deletedAt" IS NULL
        AND EXTRACT(YEAR FROM tanggal) = ${tahun}
    ) AS gabungan
    GROUP BY 1
    ORDER BY 1
  `;

  const mapPemasukan: Record<number, number> = {};
  const mapPengeluaran: Record<number, number> = {};

  for (const r of rows) {
    mapPemasukan[r.bulan_num] = Number(r.pemasukan);
    mapPengeluaran[r.bulan_num] = Number(r.pengeluaran);
  }

  return Array.from({ length: 12 }, (_, i) => ({
    bulan: i + 1,
    pemasukan: mapPemasukan[i + 1] ?? 0,
    pengeluaran: mapPengeluaran[i + 1] ?? 0,
  }));
}
