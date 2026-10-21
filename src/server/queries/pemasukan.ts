import "server-only";
import { db } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";
import { formatRupiah } from "@/lib/money";
import { getTotalPemasukan } from "./totals";

// ─── Types ───────────────────────────────────────────────────────

export interface JenisPemasukanOption {
  id: string;
  nama: string;
  urutan: number;
  bulanan: boolean;
  nominalStandar: number | null;
  aktif: boolean;
}

export interface PembayaranSel {
  id: string;
  tanggal: string; // ISO date (UTC)
  bulanTerbayar: string | null; // ISO date (UTC), hari pertama bulan
  metode: "TRANSFER" | "SETOR_TUNAI";
  nominal: number;
  nominalFormatted: string;
  petugasNama: string;
  catatan: string | null;
}

export interface SiswaSel {
  penempatanId: string;
  anggotaId: string;
  nama: string;
  uid: string;
  // keyed by jenisPemasukanId
  pembayaran: Record<string, PembayaranSel[]>;
}

export interface PemasukanDanaRow {
  id: string;
  sumberDanaId: string;
  sumberNama: string;
  tanggal: string;
  nominal: number;
  nominalFormatted: string;
  petugasNama: string;
  catatan: string | null;
}

export interface SumberDanaOption {
  id: string;
  nama: string;
  kategori: "BANTUAN" | "DONATUR";
}

export interface RingkasanPemasukan {
  jumlahBulanIni: number;
  jumlahBulanIniFormatted: string;
  totalPerTahun: number;
  totalPerTahunFormatted: string;
  perJenis: { nama: string; total: number; totalFormatted: string }[];
}

// ─── JenisPemasukan ───────────────────────────────────────────────

export async function getJenisPemasukanList(
  tahunAjaranId: string
): Promise<JenisPemasukanOption[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await db.jenisPemasukan.findMany({
    where: { tahunAjaranId, aktif: true },
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    urutan: r.urutan,
    bulanan: r.bulanan,
    nominalStandar: r.nominalStandar ? Number(r.nominalStandar) : null,
    aktif: r.aktif,
  }));
}

// ─── Pembayaran Siswa ─────────────────────────────────────────────

export async function getPembayaranSiswaGrid(params: {
  tahunAjaranId: string;
  kelasId?: string;
}): Promise<{ jenisOptions: JenisPemasukanOption[]; siswaRows: SiswaSel[] }> {
  const user = await getSessionUser();
  if (!user) return { jenisOptions: [], siswaRows: [] };

  const { tahunAjaranId, kelasId } = params;

  const [jenisOptions, penempatan, pembayaranList] = await Promise.all([
    getJenisPemasukanList(tahunAjaranId),
    db.penempatanKelas.findMany({
      where: {
        tahunAjaranId,
        ...(kelasId ? { kelasId } : {}),
      },
      include: { anggota: true },
      orderBy: [{ anggota: { nama: "asc" } }],
    }),
    db.pembayaranSiswa.findMany({
      where: {
        deletedAt: null,
        penempatan: {
          tahunAjaranId,
          ...(kelasId ? { kelasId } : {}),
        },
      },
      include: { petugas: true },
    }),
  ]);

  // Index pembayaran by penempatanId + jenisPemasukanId
  const pembayaranByKey: Record<string, PembayaranSel[]> = {};
  for (const p of pembayaranList) {
    const key = `${p.penempatanId}__${p.jenisPemasukanId}`;
    if (!pembayaranByKey[key]) pembayaranByKey[key] = [];
    pembayaranByKey[key].push({
      id: p.id,
      tanggal: p.tanggal.toISOString(),
      bulanTerbayar: p.bulanTerbayar ? p.bulanTerbayar.toISOString() : null,
      metode: p.metode as "TRANSFER" | "SETOR_TUNAI",
      nominal: Number(p.nominal),
      nominalFormatted: formatRupiah(Number(p.nominal)),
      petugasNama: p.petugas.nama,
      catatan: p.catatan,
    });
  }

  const siswaRows: SiswaSel[] = penempatan.map((pnm) => {
    const pembayaran: Record<string, PembayaranSel[]> = {};
    for (const jenis of jenisOptions) {
      const key = `${pnm.id}__${jenis.id}`;
      pembayaran[jenis.id] = pembayaranByKey[key] ?? [];
    }
    return {
      penempatanId: pnm.id,
      anggotaId: pnm.anggota.id,
      nama: pnm.anggota.nama,
      uid: pnm.anggota.uid,
      pembayaran,
    };
  });

  return { jenisOptions, siswaRows };
}

// ─── Pemasukan Dana (Bantuan + Donatur) ──────────────────────────

export async function getPemasukanDanaList(params: {
  kategori: "BANTUAN" | "DONATUR";
  tahunAjaranId?: string;
  bulan?: string; // "YYYY-MM"
}): Promise<PemasukanDanaRow[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const { kategori, tahunAjaranId, bulan } = params;

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (tahunAjaranId) {
    const ta = await db.tahunAjaran.findUnique({ where: { id: tahunAjaranId } });
    if (ta) {
      startDate = ta.mulai;
      const sel = new Date(ta.selesai);
      endDate = new Date(Date.UTC(sel.getUTCFullYear(), sel.getUTCMonth(), sel.getUTCDate(), 23, 59, 59, 999));
    }
  }

  if (bulan) {
    const [y, m] = bulan.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      startDate = new Date(Date.UTC(y, m - 1, 1));
      endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    }
  }

  const rows = await db.pemasukanDana.findMany({
    where: {
      deletedAt: null,
      sumberDana: { kategori },
      ...(startDate && endDate ? { tanggal: { gte: startDate, lte: endDate } } : {}),
    },
    include: { sumberDana: true, petugas: true },
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    sumberDanaId: r.sumberDanaId,
    sumberNama: r.sumberDana.nama,
    tanggal: r.tanggal.toISOString(),
    nominal: Number(r.nominal),
    nominalFormatted: formatRupiah(Number(r.nominal)),
    petugasNama: r.petugas.nama,
    catatan: r.catatan,
  }));
}

export async function getSumberDanaList(
  kategori: "BANTUAN" | "DONATUR"
): Promise<SumberDanaOption[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await db.sumberDana.findMany({
    where: { kategori, aktif: true },
    orderBy: [{ nama: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    kategori: r.kategori as "BANTUAN" | "DONATUR",
  }));
}

// ─── Ringkasan Pemasukan ──────────────────────────────────────────

export async function getRingkasanPemasukan(params: {
  tahunAjaranId?: string;
  bulan?: string; // "YYYY-MM"
}): Promise<RingkasanPemasukan> {
  const user = await getSessionUser();
  const empty: RingkasanPemasukan = {
    jumlahBulanIni: 0,
    jumlahBulanIniFormatted: formatRupiah(0),
    totalPerTahun: 0,
    totalPerTahunFormatted: formatRupiah(0),
    perJenis: [],
  };
  if (!user) return empty;

  const { tahunAjaranId, bulan } = params;

  let startTahun: Date | undefined;
  let endTahun: Date | undefined;

  if (tahunAjaranId) {
    const ta = await db.tahunAjaran.findUnique({ where: { id: tahunAjaranId } });
    if (ta) {
      startTahun = ta.mulai;
      const sel = new Date(ta.selesai);
      endTahun = new Date(Date.UTC(sel.getUTCFullYear(), sel.getUTCMonth(), sel.getUTCDate(), 23, 59, 59, 999));
    }
  }

  const filterTahun = {
    deletedAt: null as null,
    ...(startTahun && endTahun ? { tanggal: { gte: startTahun, lte: endTahun } } : {}),
  };

  const filterDanaTahun = {
    deletedAt: null as null,
    ...(startTahun && endTahun ? { tanggal: { gte: startTahun, lte: endTahun } } : {}),
  };

  const [{ totalBulanIni: jumlahBulanIni, totalPerTahun }, jenisGroups, bantuanSum, donaturSum] =
    await Promise.all([
      getTotalPemasukan({ tahunAjaranId, bulan }),
      // Per jenis pemasukan (hanya siswa)
      tahunAjaranId
        ? db.pembayaranSiswa.groupBy({
            by: ["jenisPemasukanId"],
            where: filterTahun,
            _sum: { nominal: true },
          })
        : Promise.resolve([]),
      db.pemasukanDana.aggregate({
        where: { ...filterDanaTahun, sumberDana: { kategori: "BANTUAN" } },
        _sum: { nominal: true },
      }),
      db.pemasukanDana.aggregate({
        where: { ...filterDanaTahun, sumberDana: { kategori: "DONATUR" } },
        _sum: { nominal: true },
      }),
    ]);

  // Resolve jenis names
  let perJenis: { nama: string; total: number; totalFormatted: string }[] = [];
  if (Array.isArray(jenisGroups) && jenisGroups.length > 0) {
    const jenisIds = jenisGroups.map((g) => g.jenisPemasukanId);
    const jenisList = await db.jenisPemasukan.findMany({
      where: { id: { in: jenisIds } },
      select: { id: true, nama: true },
    });
    const jenisMap = Object.fromEntries(jenisList.map((j) => [j.id, j.nama]));
    perJenis = jenisGroups.map((g) => {
      const total = Number(g._sum.nominal ?? 0);
      return { nama: jenisMap[g.jenisPemasukanId] ?? "—", total, totalFormatted: formatRupiah(total) };
    });
  }

  const totalBantuan = Number(bantuanSum._sum.nominal ?? 0);
  if (totalBantuan > 0) {
    perJenis.push({ nama: "Bantuan", total: totalBantuan, totalFormatted: formatRupiah(totalBantuan) });
  }

  const totalDonatur = Number(donaturSum._sum.nominal ?? 0);
  if (totalDonatur > 0) {
    perJenis.push({ nama: "Donatur", total: totalDonatur, totalFormatted: formatRupiah(totalDonatur) });
  }

  return {
    jumlahBulanIni,
    jumlahBulanIniFormatted: formatRupiah(jumlahBulanIni),
    totalPerTahun,
    totalPerTahunFormatted: formatRupiah(totalPerTahun),
    perJenis,
  };
}
