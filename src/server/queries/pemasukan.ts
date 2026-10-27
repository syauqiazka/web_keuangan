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

export interface PembayaranSiswaFilterParams {
  tahunAjaranId?: string;
  kelasId?: string;
  bulan?: string; // "YYYY-MM" saat tahun ajaran tertentu dipilih
  bulanNomor?: string; // "1"-"12" untuk semua tahun ajaran
  dari?: string; // "YYYY-MM-DD"
  sampai?: string; // "YYYY-MM-DD"
  jenisId?: string;
}

export interface PemasukanDanaFilterParams {
  kategori: "BANTUAN" | "DONATUR";
  tahunAjaranId?: string;
  bulan?: string; // "YYYY-MM"
  bulanNomor?: string;
  dari?: string;
  sampai?: string;
  sumberDanaId?: string;
}

export interface RingkasanPemasukanFilterParams {
  tahunAjaranId?: string;
  bulan?: string; // "YYYY-MM"
  bulanNomor?: string;
  dari?: string;
  sampai?: string;
  jenisId?: string;
}

// ─── Helper Rentang Tanggal ──────────────────────────────────────

function parseDateRange(dari?: string, sampai?: string) {
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

  return { rangeStart, rangeEnd };
}

// ─── JenisPemasukan ───────────────────────────────────────────────

export async function getJenisPemasukanList(
  tahunAjaranId?: string
): Promise<JenisPemasukanOption[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await db.jenisPemasukan.findMany({
    where: {
      aktif: true,
      ...(tahunAjaranId ? { tahunAjaranId } : {}),
    },
    include: { tahunAjaran: { select: { nama: true } } },
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    urutan: r.urutan,
    bulanan: r.bulanan,
    nominalStandar: r.nominalStandar ? Number(r.nominalStandar) : null,
    aktif: r.aktif,
    tahunAjaranNama: r.tahunAjaran.nama,
  }));
}

// ─── Pembayaran Siswa ─────────────────────────────────────────────

export async function getPembayaranSiswaGrid(
  params: PembayaranSiswaFilterParams
): Promise<{ jenisOptions: JenisPemasukanOption[]; siswaRows: SiswaSel[] }> {
  const user = await getSessionUser();
  if (!user) return { jenisOptions: [], siswaRows: [] };

  const { tahunAjaranId, kelasId, bulan, bulanNomor, dari, sampai, jenisId } = params;
  const { rangeStart, rangeEnd } = parseDateRange(dari, sampai);

  const penempatanWhere = {
    ...(tahunAjaranId ? { tahunAjaranId } : {}),
    ...(kelasId ? { kelasId } : {}),
  };

  const jenisRowsPromise = db.jenisPemasukan.findMany({
    where: {
      aktif: true,
      ...(tahunAjaranId ? { tahunAjaranId } : {}),
      ...(jenisId ? { id: jenisId } : {}),
    },
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
    db.pembayaranSiswa.findMany({
      where: {
        deletedAt: null,
        penempatan: penempatanWhere,
        ...(jenisId ? { jenisPemasukanId: jenisId } : {}),
      },
      include: { petugas: true },
      orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
    }),
  ]);

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

  const cocokDenganRange = (tanggal: Date | null | undefined) => {
    if (!rangeStart && !rangeEnd) return true;
    if (!tanggal) return false;
    if (rangeStart && tanggal < rangeStart) return false;
    if (rangeEnd && tanggal > rangeEnd) return false;
    return true;
  };

  const filteredPembayaran = pembayaranList.filter((p) => {
    const jenis = jenisById.get(p.jenisPemasukanId);
    if (!jenis) return false;

    // Filter bulan: SPP mengikuti bulanTerbayar; sekali bayar mengikuti tanggal transaksi
    const bulanMatch = jenis.bulanan ? cocokDenganBulan(p.bulanTerbayar) : cocokDenganBulan(p.tanggal);
    // Filter rentang tanggal: menyaring berdasarkan tanggal transaksi inklusif
    const rangeMatch = cocokDenganRange(p.tanggal);

    return bulanMatch && rangeMatch;
  });

  // Jika jenis pembayaran spesifik dipilih (misal SPP), hanya jenis tersebut yang tampil.
  // Jika tidak, saat memfilter bulan/range, kolom sekali bayar hanya muncul jika ada transaksi.
  const jenisDenganTransaksiFilter = new Set(filteredPembayaran.map((p) => p.jenisPemasukanId));
  const hasDateFilter = Boolean(bulan || bulanNomor || rangeStart || rangeEnd);

  const visibleJenisRows = jenisId
    ? jenisRows.filter((j) => j.id === jenisId)
    : hasDateFilter
    ? jenisRows.filter((jenis) => jenis.bulanan || jenisDenganTransaksiFilter.has(jenis.id))
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

export async function getPemasukanDanaList(
  params: PemasukanDanaFilterParams
): Promise<PemasukanDanaRow[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const { kategori, tahunAjaranId, bulan, bulanNomor, dari, sampai, sumberDanaId } = params;
  const { rangeStart, rangeEnd } = parseDateRange(dari, sampai);

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

  if (bulan && /^\d{4}-\d{2}$/.test(bulan)) {
    const [y, m] = bulan.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      const bStart = new Date(Date.UTC(y, m - 1, 1));
      const bEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      startDate = startDate ? new Date(Math.max(startDate.getTime(), bStart.getTime())) : bStart;
      endDate = endDate ? new Date(Math.min(endDate.getTime(), bEnd.getTime())) : bEnd;
    }
  }

  if (rangeStart) {
    startDate = startDate ? new Date(Math.max(startDate.getTime(), rangeStart.getTime())) : rangeStart;
  }
  if (rangeEnd) {
    endDate = endDate ? new Date(Math.min(endDate.getTime(), rangeEnd.getTime())) : rangeEnd;
  }

  const rows = await db.pemasukanDana.findMany({
    where: {
      deletedAt: null,
      sumberDana: {
        kategori,
        ...(sumberDanaId ? { id: sumberDanaId } : {}),
      },
      ...(startDate && endDate
        ? { tanggal: { gte: startDate, lte: endDate } }
        : startDate
        ? { tanggal: { gte: startDate } }
        : endDate
        ? { tanggal: { lte: endDate } }
        : {}),
    },
    include: { sumberDana: true, petugas: true },
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
  });

  const filteredRows = !tahunAjaranId && bulanNomor && !bulan && !rangeStart && !rangeEnd
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

export async function getRingkasanPemasukan(
  params: RingkasanPemasukanFilterParams
): Promise<RingkasanPemasukan> {
  const user = await getSessionUser();
  const empty: RingkasanPemasukan = {
    jumlahBulanIni: 0,
    jumlahBulanIniFormatted: formatRupiah(0),
    totalPerTahun: 0,
    totalPerTahunFormatted: formatRupiah(0),
    perJenis: [],
  };
  if (!user) return empty;

  const { tahunAjaranId, bulan, bulanNomor, dari, sampai, jenisId } = params;
  const { rangeStart, rangeEnd } = parseDateRange(dari, sampai);

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

  const [{ totalPerTahun }, jenisGroups, bantuanSum, donaturSum] =
    await Promise.all([
      getTotalPemasukan({ tahunAjaranId }),
      tahunAjaranId
        ? db.pembayaranSiswa.groupBy({
            by: ["jenisPemasukanId"],
            where: filterTahun,
            _sum: { nominal: true },
          })
        : Promise.resolve([]),
      db.pemasukanDana.aggregate({
        where: { ...filterTahun, sumberDana: { kategori: "BANTUAN" } },
        _sum: { nominal: true },
      }),
      db.pemasukanDana.aggregate({
        where: { ...filterTahun, sumberDana: { kategori: "DONATUR" } },
        _sum: { nominal: true },
      }),
    ]);

  // Hitung jumlah periode/filter aktif
  let jumlahBulanIni = 0;

  // Jika rentang tanggal spesifik aktif:
  if (rangeStart || rangeEnd) {
    const dateWhere = {
      ...(rangeStart && rangeEnd
        ? { gte: rangeStart, lte: rangeEnd }
        : rangeStart
        ? { gte: rangeStart }
        : rangeEnd
        ? { lte: rangeEnd }
        : {}),
    };

    const [siswaSum, danaSum] = await Promise.all([
      db.pembayaranSiswa.aggregate({
        where: {
          deletedAt: null,
          tanggal: dateWhere,
          ...(tahunAjaranId ? { penempatan: { tahunAjaranId } } : {}),
          ...(jenisId ? { jenisPemasukanId: jenisId } : {}),
        },
        _sum: { nominal: true },
      }),
      // Dana (bantuan & donatur) hanya jika jenisId bukan jenis siswa atau jika cocok sumber dana
      !jenisId || (await db.sumberDana.count({ where: { id: jenisId } })) > 0
        ? db.pemasukanDana.aggregate({
            where: {
              deletedAt: null,
              tanggal: dateWhere,
              ...(jenisId ? { sumberDanaId: jenisId } : {}),
            },
            _sum: { nominal: true },
          })
        : Promise.resolve({ _sum: { nominal: null } }),
    ]);

    jumlahBulanIni = Number(siswaSum._sum.nominal ?? 0) + Number(danaSum._sum.nominal ?? 0);
  } else {
    // Mode Bulan
    let bulanMulai: Date | undefined;
    let bulanSelesai: Date | undefined;
    let monthNumber: number | undefined;

    if (bulan && /^\d{4}-\d{2}$/.test(bulan)) {
      const [y, m] = bulan.split("-").map(Number);
      monthNumber = m;
      bulanMulai = new Date(Date.UTC(y, m - 1, 1));
      bulanSelesai = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    } else if (!tahunAjaranId && bulanNomor) {
      const m = Number(bulanNomor);
      if (Number.isInteger(m) && m >= 1 && m <= 12) monthNumber = m;
    }

    if (bulanMulai && bulanSelesai) {
      const isSumberDana = jenisId ? (await db.sumberDana.count({ where: { id: jenisId } })) > 0 : false;
      const isJenisSiswa = jenisId ? !isSumberDana : true;

      const [bulanan, sekaliBayar, dana] = await Promise.all([
        isJenisSiswa
          ? db.pembayaranSiswa.aggregate({
              where: {
                deletedAt: null,
                bulanTerbayar: { gte: bulanMulai, lte: bulanSelesai },
                jenisPemasukan: { bulanan: true },
                ...(tahunAjaranId ? { penempatan: { tahunAjaranId } } : {}),
                ...(jenisId ? { jenisPemasukanId: jenisId } : {}),
              },
              _sum: { nominal: true },
            })
          : Promise.resolve({ _sum: { nominal: null } }),
        isJenisSiswa
          ? db.pembayaranSiswa.aggregate({
              where: {
                deletedAt: null,
                tanggal: { gte: bulanMulai, lte: bulanSelesai },
                jenisPemasukan: { bulanan: false },
                ...(tahunAjaranId ? { penempatan: { tahunAjaranId } } : {}),
                ...(jenisId ? { jenisPemasukanId: jenisId } : {}),
              },
              _sum: { nominal: true },
            })
          : Promise.resolve({ _sum: { nominal: null } }),
        !jenisId || isSumberDana
          ? db.pemasukanDana.aggregate({
              where: {
                deletedAt: null,
                tanggal: {
                  gte: tahunAjaranId && startTahun && startTahun > bulanMulai ? startTahun : bulanMulai,
                  lte: tahunAjaranId && endTahun && endTahun < bulanSelesai ? endTahun : bulanSelesai,
                },
                ...(jenisId ? { sumberDanaId: jenisId } : {}),
              },
              _sum: { nominal: true },
            })
          : Promise.resolve({ _sum: { nominal: null } }),
      ]);
      jumlahBulanIni =
        Number(bulanan._sum.nominal ?? 0) +
        Number(sekaliBayar._sum.nominal ?? 0) +
        Number(dana._sum.nominal ?? 0);
    } else if (monthNumber) {
      const isSumberDana = jenisId ? (await db.sumberDana.count({ where: { id: jenisId } })) > 0 : false;
      const isJenisSiswa = jenisId ? !isSumberDana : true;

      const [bulanan, sekaliBayar, dana] = await Promise.all([
        isJenisSiswa
          ? db.pembayaranSiswa.findMany({
              where: {
                deletedAt: null,
                jenisPemasukan: { bulanan: true },
                bulanTerbayar: { not: null },
                ...(jenisId ? { jenisPemasukanId: jenisId } : {}),
              },
              select: { bulanTerbayar: true, nominal: true },
            })
          : Promise.resolve([]),
        isJenisSiswa
          ? db.pembayaranSiswa.findMany({
              where: {
                deletedAt: null,
                jenisPemasukan: { bulanan: false },
                ...(jenisId ? { jenisPemasukanId: jenisId } : {}),
              },
              select: { tanggal: true, nominal: true },
            })
          : Promise.resolve([]),
        !jenisId || isSumberDana
          ? db.pemasukanDana.findMany({
              where: {
                deletedAt: null,
                ...(jenisId ? { sumberDanaId: jenisId } : {}),
              },
              select: { tanggal: true, nominal: true },
            })
          : Promise.resolve([]),
      ]);
      jumlahBulanIni =
        bulanan
          .filter((r) => r.bulanTerbayar && r.bulanTerbayar.getUTCMonth() + 1 === monthNumber)
          .reduce((sum, r) => sum + Number(r.nominal), 0) +
        sekaliBayar
          .filter((r) => r.tanggal.getUTCMonth() + 1 === monthNumber)
          .reduce((sum, r) => sum + Number(r.nominal), 0) +
        dana
          .filter((r) => r.tanggal.getUTCMonth() + 1 === monthNumber)
          .reduce((sum, r) => sum + Number(r.nominal), 0);
    }
  }

  // Resolve rincian jenis
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
