import "server-only";
import { db } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { formatRupiah } from "@/lib/money";
import { getTotalPengeluaran } from "./totals";

export interface PengeluaranRow {
  id: string;
  tanggal: string; // ISO date string (UTC, date-only)
  jenis: string;
  nominal: number;
  nominalFormatted: string;
  petugasId: string;
  petugasNama: string;
  catatan: string | null;
}

export interface RingkasanPengeluaran {
  jumlahBulanIni: number;
  jumlahBulanIniFormatted: string;
  totalPerTahun: number;
  totalPerTahunFormatted: string;
}

export interface PengeluaranFilterParams {
  tahunAjaranId?: string;
  bulan?: string; // format "YYYY-MM"
  dari?: string; // format "YYYY-MM-DD"
  sampai?: string; // format "YYYY-MM-DD"
  jenis?: string;
  page?: number;
  exportAll?: boolean;
}

/**
 * Mengambil daftar jenis pengeluaran unik dari transaksi aktif di database.
 */
export async function getJenisPengeluaranList(): Promise<string[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await db.pengeluaran.findMany({
    where: { deletedAt: null },
    select: { jenis: true },
    distinct: ["jenis"],
    orderBy: { jenis: "asc" },
  });

  return rows.map((r) => r.jenis).filter(Boolean);
}

export async function getPengeluaranList(
  params: PengeluaranFilterParams
): Promise<{ rows: PengeluaranRow[]; total: number; ringkasan: RingkasanPengeluaran }> {
  const user = await getSessionUser();
  if (!user) {
    return {
      rows: [],
      total: 0,
      ringkasan: {
        jumlahBulanIni: 0,
        jumlahBulanIniFormatted: "Rp 0",
        totalPerTahun: 0,
        totalPerTahunFormatted: "Rp 0",
      },
    };
  }

  const { tahunAjaranId, bulan, dari, sampai, jenis, page = 1, exportAll = false } = params;
  const take = 50;

  // Rentang batas tahun ajaran
  let taStart: Date | undefined;
  let taEnd: Date | undefined;
  if (tahunAjaranId) {
    const ta = await db.tahunAjaran.findUnique({ where: { id: tahunAjaranId } });
    if (ta) {
      taStart = ta.mulai;
      const sel = new Date(ta.selesai);
      taEnd = new Date(Date.UTC(sel.getUTCFullYear(), sel.getUTCMonth(), sel.getUTCDate(), 23, 59, 59, 999));
    }
  }

  // Rentang bulan (jika ada)
  let bulanStart: Date | undefined;
  let bulanEnd: Date | undefined;
  if (bulan && /^\d{4}-\d{2}$/.test(bulan)) {
    const [y, m] = bulan.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      bulanStart = new Date(Date.UTC(y, m - 1, 1));
      bulanEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    }
  }

  // Rentang custom tanggal (dari & sampai inklusif)
  let rangeStart: Date | undefined;
  let rangeEnd: Date | undefined;
  if (dari && /^\d{4}-\d{2}-\d{2}$/.test(dari)) {
    const [y, m, d] = dari.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      rangeStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    }
  }
  if (sampai && /^\d{4}-\d{2}-\d{2}$/.test(sampai)) {
    const [y, m, d] = sampai.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      rangeEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    }
  }

  // Tentukan batasan efektif tanggal dengan irisan inklusif
  let effectiveStart: Date | undefined;
  let effectiveEnd: Date | undefined;

  // Prioritas / irisan:
  // Mulai dari yang paling spesifik (range) atau bulan atau tahun ajaran
  const startCandidates = [taStart, bulanStart, rangeStart].filter(Boolean) as Date[];
  if (startCandidates.length > 0) {
    effectiveStart = new Date(Math.max(...startCandidates.map((d) => d.getTime())));
  }

  const endCandidates = [taEnd, bulanEnd, rangeEnd].filter(Boolean) as Date[];
  if (endCandidates.length > 0) {
    effectiveEnd = new Date(Math.min(...endCandidates.map((d) => d.getTime())));
  }

  // Bangun query where yang konsisten untuk data baris dan ringkasan
  const filterWhere: Prisma.PengeluaranWhereInput = {
    deletedAt: null,
    ...(effectiveStart && effectiveEnd
      ? { tanggal: { gte: effectiveStart, lte: effectiveEnd } }
      : effectiveStart
      ? { tanggal: { gte: effectiveStart } }
      : effectiveEnd
      ? { tanggal: { lte: effectiveEnd } }
      : {}),
    ...(jenis ? { jenis } : {}),
  };

  const total = await db.pengeluaran.count({ where: filterWhere });
  const totalPages = Math.max(1, Math.ceil(total / take));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const skip = (safePage - 1) * take;

  const [rows, sumFilterResult, totalsPerTahunResult] = await Promise.all([
    db.pengeluaran.findMany({
      where: filterWhere,
      include: { petugas: true },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      ...(exportAll ? {} : { skip, take }),
    }),
    db.pengeluaran.aggregate({
      where: filterWhere,
      _sum: { nominal: true },
    }),
    getTotalPengeluaran({ tahunAjaranId }),
  ]);

  const jumlahFilter = Number(sumFilterResult._sum.nominal ?? 0);
  const { totalPerTahun } = totalsPerTahunResult;

  return {
    rows: rows.map((r) => ({
      id: r.id,
      tanggal: r.tanggal.toISOString(),
      jenis: r.jenis,
      nominal: Number(r.nominal),
      nominalFormatted: formatRupiah(Number(r.nominal)),
      petugasId: r.petugasId,
      petugasNama: r.petugas.nama,
      catatan: r.catatan,
    })),
    total,
    ringkasan: {
      jumlahBulanIni: jumlahFilter,
      jumlahBulanIniFormatted: formatRupiah(jumlahFilter),
      totalPerTahun,
      totalPerTahunFormatted: formatRupiah(totalPerTahun),
    },
  };
}
