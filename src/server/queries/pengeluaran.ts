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

export async function getPengeluaranList(params: {
  tahunAjaranId?: string;
  bulan?: string; // format "YYYY-MM"
  page?: number;
}): Promise<{ rows: PengeluaranRow[]; total: number; ringkasan: RingkasanPengeluaran }> {
  const user = await getSessionUser();
  if (!user) return {
    rows: [],
    total: 0,
    ringkasan: {
      jumlahBulanIni: 0,
      jumlahBulanIniFormatted: "Rp 0",
      totalPerTahun: 0,
      totalPerTahunFormatted: "Rp 0",
    },
  };

  const { tahunAjaranId, bulan, page = 1 } = params;
  const take = 50;

  // Bangun filter rentang tanggal
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let startBulan: Date | undefined;
  let endBulan: Date | undefined;

  if (tahunAjaranId) {
    const ta = await db.tahunAjaran.findUnique({ where: { id: tahunAjaranId } });
    if (ta) {
      startDate = ta.mulai;
      const sel = new Date(ta.selesai);
      endDate = new Date(Date.UTC(sel.getUTCFullYear(), sel.getUTCMonth(), sel.getUTCDate(), 23, 59, 59, 999));
    }
  }

  if (bulan) {
    // bulan format: "YYYY-MM"
    const [y, m] = bulan.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      startBulan = new Date(Date.UTC(y, m - 1, 1));
      // Akhir bulan sampai milidetik terakhir hari itu
      endBulan = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    }
  }

  const filterTanggal: Prisma.PengeluaranWhereInput = {
    deletedAt: null,
    ...(startBulan && endBulan
      ? { tanggal: { gte: startBulan, lte: endBulan } }
      : startDate && endDate
      ? { tanggal: { gte: startDate, lte: endDate } }
      : {}),
  };

  const total = await db.pengeluaran.count({ where: filterTanggal });
  const totalPages = Math.max(1, Math.ceil(total / take));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const skip = (safePage - 1) * take;

  const [rows, totalsResult] = await Promise.all([
    db.pengeluaran.findMany({
      where: filterTanggal,
      include: { petugas: true },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    getTotalPengeluaran({ tahunAjaranId, bulan }),
  ]);


  const { totalBulanIni: jumlahBulanIni, totalPerTahun } = totalsResult;

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
      jumlahBulanIni,
      jumlahBulanIniFormatted: formatRupiah(jumlahBulanIni),
      totalPerTahun,
      totalPerTahunFormatted: formatRupiah(totalPerTahun),
    },
  };
}
