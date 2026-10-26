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
  tahunAjaranNama?: string;
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
  tahunAjaranId?: string;
  kelasId?: string;
  bulan?: string; // "YYYY-MM" saat tahun ajaran tertentu dipilih
  bulanNomor?: string; // "1"-"12" untuk semua tahun ajaran
}): Promise<{ jenisOptions: JenisPemasukanOption[]; siswaRows: SiswaSel[] }> {
  const user = await getSessionUser();
  if (!user) return { jenisOptions: [], siswaRows: [] };

  const { tahunAjaranId, kelasId, bulan, bulanNomor } = params;
  const penempatanWhere = {
    ...(tahunAjaranId ? { tahunAjaranId } : {}),
    ...(kelasId ? { kelasId } : {}),
  };

  const jenisRowsPromise = db.jenisPemasukan.findMany({
    where: { ...(tahunAjaranId ? { tahunAjaranId, aktif: true } : {}) },
    include: { tahunAjaran: { select: { nama: true, mulai: true } } },
    orderBy: tahunAjaranId
      ? [{ urutan: "asc" }, { nama: "asc" }]
      : [{ tahunAjaran: { mulai: "desc" } }, { urutan: "asc" }, { nama: "asc" }],
  });

  const [jenisRows, penempatan, pembayaranList] = await Promise.all([
    jenisRowsPromise,
    db.penempatanKelas.findMany({
      where: penempatanWhere,
      include: { anggota: true },
      orderBy: [{ anggota: { nama: "asc" } }],
    }),
    // Ambil semua transaksi dalam penempatan terpilih. Filter bulan dilakukan
    // setelah jenis pembayaran diketahui: SPP memakai bulanTerbayar, sedangkan
    // jenis non-bulanan memakai tanggal transaksi.
    db.pembayaranSiswa.findMany({
      where: {
        deletedAt: null,
        penempatan: penempatanWhere,
      },
      include: { petugas: true },
      orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  // Bulanan mengikuti bulan yang dibayar; sekali bayar mengikuti tanggal transaksi.
  const jenisById = new Map(jenisRows.map((jenis) => [jenis.id, jenis]));
  const cocokDenganBulan = (tanggal: Date | null | undefined) => {
    if (!bulan && !bulanNomor) return true;
    if (!tanggal) return false;
    const month = tanggal.getUTCMonth() + 1;
    const year = tanggal.getUTCFullYear();
    if (bulan && /^\d{4}-\d{2}$/.test(bulan)) {
      const [filterYear, filterMonth] = bulan.split("-").map(Number);
      return year === filterYear && month === filterMonth;
    }
    if (bulanNomor) return month === Number(bulanNomor);
    return true;
  };
  const filteredPembayaran = pembayaranList.filter((p) => {
    const jenis = jenisById.get(p.jenisPemasukanId);
    return jenis?.bulanan ? cocokDenganBulan(p.bulanTerbayar) : cocokDenganBulan(p.tanggal);
  });
  // Saat memfilter bulan, kolom sekali bayar hanya muncul jika ada transaksi jenis itu pada bulan tersebut.
  const jenisDenganTransaksiBulanIni = new Set(filteredPembayaran.map((p) => p.jenisPemasukanId));
  const visibleJenisRows = (bulan || bulanNomor)
    ? jenisRows.filter((jenis) => jenis.bulanan || jenisDenganTransaksiBulanIni.has(jenis.id))
    : jenisRows;

  const jenisOptions: JenisPemasukanOption[] = visibleJenisRows.map((r) => ({
    id: r.id,
    nama: r.nama,
    urutan: r.urutan,
    bulanan: r.bulanan,
    nominalStandar: r.nominalStandar ? Number(r.nominalStandar) : null,
    aktif: r.aktif,
    tahunAjaranNama: r.tahunAjaran.nama,
  }));

  const pembayaranByKey: Record<string, PembayaranSel[]> = {};
  for (const p of filteredPembayaran) {
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
  bulanNomor?: string;
}): Promise<PemasukanDanaRow[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const { kategori, tahunAjaranId, bulan, bulanNomor } = params;

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

  const filteredRows = !tahunAjaranId && bulanNomor
    ? rows.filter((r) => r.tanggal.getUTCMonth() + 1 === Number(bulanNomor))
    : rows;

  return filteredRows.map((r) => ({
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
  bulanNomor?: string; // bulan transaksi lintas tahun saat Semua Tahun dipilih
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

  const { tahunAjaranId, bulan, bulanNomor } = params;

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

  const [{ totalBulanIni: totalBulanIniAwal, totalPerTahun }, jenisGroups, bantuanSum, donaturSum] =
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

  let jumlahBulanIni = totalBulanIniAwal;
  if (!tahunAjaranId && bulanNomor) {
    const m = Number(bulanNomor);
    if (Number.isInteger(m) && m >= 1 && m <= 12) {
      const [pembayaranBulan, danaBulan] = await Promise.all([
        db.pembayaranSiswa.findMany({ where: { deletedAt: null }, select: { tanggal: true, nominal: true } }),
        db.pemasukanDana.findMany({ where: { deletedAt: null }, select: { tanggal: true, nominal: true } }),
      ]);
      jumlahBulanIni =
        pembayaranBulan.filter((r) => r.tanggal.getUTCMonth() + 1 === m).reduce((sum, r) => sum + Number(r.nominal), 0) +
        danaBulan.filter((r) => r.tanggal.getUTCMonth() + 1 === m).reduce((sum, r) => sum + Number(r.nominal), 0);
    }
  }

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
