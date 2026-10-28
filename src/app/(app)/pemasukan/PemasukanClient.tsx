"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { formatRupiah } from "@/lib/money";
import { TabDariSiswa } from "@/app/(app)/pemasukan/TabDariSiswa";
import { TabDana } from "@/app/(app)/pemasukan/TabDana";
import { FilterIcon } from "@/components/ui/FilterIcon";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";
import { CheckCircle2, RotateCcw, X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import type {
  JenisPemasukanOption,
  SiswaSel,
  PemasukanDanaRow,
  SumberDanaOption,
  RingkasanPemasukan,
} from "@/server/queries/pemasukan";
import type { TahunAjaranOption, KelasOption } from "@/server/queries/anggota";

const BULAN_OPTIONS = [
  { value: "", label: "— Semua Bulan —" },
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

type TabKey = "dari-siswa" | "bantuan" | "donatur";

interface PemasukanClientProps {
  tahunAjaranList: TahunAjaranOption[];
  kelasList: KelasOption[];
  tahunAjaranId: string;
  kelasId: string;
  bulan: string; // "YYYY-MM" or ""
  bulanNomor: string; // "01"-"12" or ""
  dari: string; // "YYYY-MM-DD" or ""
  sampai: string; // "YYYY-MM-DD" or ""
  jenisId: string; // ID JenisPemasukan atau SumberDana
  tab: TabKey;
  ringkasan: RingkasanPemasukan;
  siswaData: { jenisOptions: JenisPemasukanOption[]; siswaRows: SiswaSel[] };
  bantuanRows: PemasukanDanaRow[];
  donaturRows: PemasukanDanaRow[];
  bantuanSumber: SumberDanaOption[];
  donaturSumber: SumberDanaOption[];
  allJenisOptions: JenisPemasukanOption[];
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "dari-siswa", label: "Pembayaran Siswa" },
  { key: "bantuan", label: "Bantuan Lembaga / Pemerintah" },
  { key: "donatur", label: "Donatur & Dana Hibah" },
];

export function PemasukanClient({
  tahunAjaranList,
  kelasList,
  tahunAjaranId,
  kelasId,
  bulanNomor,
  dari,
  sampai,
  jenisId,
  tab,
  ringkasan,
  siswaData,
  bantuanRows,
  donaturRows,
  bantuanSumber,
  donaturSumber,
  allJenisOptions,
}: PemasukanClientProps) {
  const router = useRouter();
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);

  // Hitung jumlah filter aktif (selain tab)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (tahunAjaranId && tahunAjaranId !== "all") {
      const activeTa = tahunAjaranList.find((t) => t.aktif);
      if (tahunAjaranId !== activeTa?.id) count++;
    }
    if (kelasId) count++;
    if (bulanNomor) count++;
    if (dari) count++;
    if (sampai) count++;
    if (jenisId) count++;
    return count;
  }, [tahunAjaranId, kelasId, bulanNomor, dari, sampai, jenisId, tahunAjaranList]);

  // URL builder untuk export Excel dan filter navigation
  const buildExportUrl = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("tab", tab);
    if (tahunAjaranId) sp.set("tahunAjaran", tahunAjaranId);
    if (kelasId) sp.set("kelas", kelasId);
    if (bulanNomor) sp.set("bulan", bulanNomor);
    if (dari) sp.set("dari", dari);
    if (sampai) sp.set("sampai", sampai);
    if (jenisId) sp.set("jenis", jenisId);
    return `/api/export/pemasukan?${sp.toString()}`;
  }, [tab, tahunAjaranId, kelasId, bulanNomor, dari, sampai, jenisId]);

  const removeFilter = useCallback(
    (key: "tahunAjaran" | "kelas" | "bulan" | "tanggal" | "jenis") => {
      const sp = new URLSearchParams(window.location.search);
      if (key === "tahunAjaran") sp.delete("tahunAjaran");
      if (key === "kelas") sp.delete("kelas");
      if (key === "bulan") sp.delete("bulan");
      if (key === "tanggal") {
        sp.delete("dari");
        sp.delete("sampai");
      }
      if (key === "jenis") sp.delete("jenis");
      sp.set("tab", tab);
      router.push(`/pemasukan?${sp.toString()}`);
    },
    [router, tab]
  );

  const handleResetFilter = useCallback(() => {
    router.push(`/pemasukan?tab=${tab}`);
  }, [router, tab]);

  const activeTa = tahunAjaranList.find((t) => t.aktif);

  const kelasOptions = [
    { value: "", label: "— Semua Kelas —" },
    { value: "guru", label: "Guru" },
    ...kelasList.map((k) => ({ value: k.id, label: k.nama })),
  ];

  // Options jenis pembayaran dinamis berdasarkan tab yang sedang aktif
  const jenisOptionsForTab = useMemo(() => {
    if (tab === "dari-siswa") {
      return [
        { value: "", label: "— Semua Jenis Pembayaran —" },
        ...allJenisOptions.map((j) => ({
          value: j.id,
          label: `${j.nama}${j.bulanan ? " (Bulanan)" : ""}`,
        })),
      ];
    }
    if (tab === "bantuan") {
      return [
        { value: "", label: "— Semua Jenis Bantuan —" },
        ...bantuanSumber.map((s) => ({ value: s.id, label: s.nama })),
      ];
    }
    return [
      { value: "", label: "— Semua Jenis Donatur —" },
      ...donaturSumber.map((s) => ({ value: s.id, label: s.nama })),
    ];
  }, [tab, allJenisOptions, bantuanSumber, donaturSumber]);

  // Label periode dinamis
  const namaBulanTerpilih = bulanNomor
    ? BULAN_OPTIONS.find((b) => b.value === bulanNomor)?.label
    : null;

  let labelPeriode = "Jumlah Pemasukan Periode Ini";
  if (dari && sampai) {
    labelPeriode = `Jumlah Pemasukan (${dari} s/d ${sampai})`;
  } else if (namaBulanTerpilih) {
    labelPeriode = `Jumlah Pemasukan Bulan ${namaBulanTerpilih}`;
  }

  // Label nama jenis aktif untuk filter summary
  const activeJenisNama = useMemo(() => {
    if (!jenisId) return null;
    const found = jenisOptionsForTab.find((o) => o.value === jenisId);
    return found ? found.label : null;
  }, [jenisId, jenisOptionsForTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="pb-5 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] lg:text-[26px] font-semibold text-text tracking-tight">
              Pencatatan Pemasukan Sekolah
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[13px] text-text-3">
                Pantau penerimaan dana sekolah dari SPP siswa, bantuan pemerintah, dan donatur hibah.
              </span>
              {activeTa && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-income-soft border border-income-border text-income">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tahun Ajaran Aktif: {activeTa.nama}
                </span>
              )}
            </div>
          </div>

          {/* Quick Excel Export button */}
          <div className="shrink-0">
            <ExportExcelButton
              exportUrl={buildExportUrl}
              defaultFilename={`pemasukan_${tab}.xlsx`}
              label="Export Excel (.xlsx)"
            />
          </div>
        </div>
      </BlurReveal>

      {/* Ringkasan dengan warna Pemasukan (Hijau) */}
      <div className="space-y-3">
        <StaggerGroup blur={8} duration={0.75} className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.08}>
          <StaggerItem>
            <div className="bg-surface p-5 lg:p-6 border border-line rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-income" />
              <div>
                <div className="text-[12px] font-medium text-text-3 uppercase tracking-wider mb-2">
                  {labelPeriode}
                </div>
                <div className="text-[26px] lg:text-[30px] font-semibold text-text leading-tight num">
                  <AnimatedNumber
                    value={ringkasan.jumlahBulanIni}
                    format={formatRupiah}
                    duration={0.6}
                  />
                </div>
              </div>
              <div className="mt-3 text-[12px] text-text-3">
                Kumulatif penerimaan seluruh sumber yang cocok dengan kriteria filter aktif
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-surface p-5 lg:p-6 border border-line rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand" />
              <div>
                <div className="text-[12px] font-medium text-text-3 uppercase tracking-wider mb-2">
                  Total Pemasukan Per Tahun (Seluruh Sumber)
                </div>
                <div className="text-[26px] lg:text-[30px] font-semibold text-text leading-tight num">
                  <AnimatedNumber
                    value={ringkasan.totalPerTahun}
                    format={formatRupiah}
                    duration={0.65}
                  />
                </div>
              </div>
              <div className="mt-3 text-[12px] text-text-3">
                Total penerimaan sekolah satu tahun ajaran penuh (identik dengan Dashboard)
              </div>
            </div>
          </StaggerItem>
        </StaggerGroup>

        {/* Baris rincian per jenis */}
        {ringkasan.perJenis.length > 0 && (
          <BlurReveal blur={6} delay={0.1} duration={0.6}>
            <div className="bg-surface border border-line rounded-[12px] px-4 py-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                <span className="font-mono text-[11px] font-medium text-text-3 uppercase tracking-wider">
                  Rincian Jenis:
                </span>
                {ringkasan.perJenis.map((item) => (
                  <span key={item.nama} className="flex gap-1.5 items-center px-2.5 py-1 rounded-[6px] bg-income-soft border border-income-border text-[12px]">
                    <span className="text-text-3 font-normal">{item.nama}:</span>
                    <span className="font-semibold text-income num">{item.totalFormatted}</span>
                  </span>
                ))}
              </div>
            </div>
          </BlurReveal>
        )}
      </div>

      {/* Advanced Filter Toolbar */}
      <BlurReveal blur={6} delay={0.14} duration={0.65}>
        <div className="bg-surface border border-line rounded-[12px] shadow-xs overflow-hidden">
          {/* Header Toolbar Filter */}
          <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel/30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterPanelOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] border border-line bg-surface text-text hover:bg-surface-soft hover:border-brand/40 text-[13px] font-medium transition-colors cursor-pointer"
                aria-expanded={filterPanelOpen}
                aria-label="Buka atau tutup panel filter pencarian"
              >
                <FilterIcon className="w-4 h-4 text-income" />
                <span>Filter Lanjutan</span>
                {activeFiltersCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-full bg-income text-white">
                    {activeFiltersCount}
                  </span>
                )}
                {filterPanelOpen ? (
                  <ChevronUp className="w-4 h-4 text-text-3 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-3 ml-1" />
                )}
              </button>

              <span className="text-[12px] text-text-3 hidden sm:inline">
                Saring data berdasarkan tahun ajaran, kelas, bulan, rentang tanggal, & jenis
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilter}
                  title="Reset semua filter ke kondisi awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </Button>
              )}
            </div>
          </div>

          {/* Form Filter Panel */}
          {filterPanelOpen && (
            <div className="p-4 border-b border-line">
              <form method="GET" action="/pemasukan" className="space-y-4">
                <input type="hidden" name="tab" value={tab} />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {/* Filter Tahun Ajaran */}
                  <div>
                    <Select
                      name="tahunAjaran"
                      label="Tahun Ajaran"
                      defaultValue={tahunAjaranId || "all"}
                      options={[
                        { value: "all", label: "— Semua Tahun Ajaran —" },
                        ...tahunAjaranList.map((ta) => ({
                          value: ta.id,
                          label: ta.aktif ? `${ta.nama} (Aktif)` : ta.nama,
                        })),
                      ]}
                    />
                  </div>

                  {/* Filter Kelas (Hanya untuk tab Dari Siswa) */}
                  <div>
                    <Select
                      name="kelas"
                      label="Kelas Siswa"
                      defaultValue={kelasId}
                      options={kelasOptions}
                      disabled={tab !== "dari-siswa"}
                    />
                  </div>

                  {/* Filter Bulan Transaksi */}
                  <div>
                    <Select
                      name="bulan"
                      label="Bulan Transaksi"
                      defaultValue={bulanNomor}
                      options={BULAN_OPTIONS}
                    />
                  </div>

                  {/* Filter Tanggal Mulai */}
                  <div>
                    <label htmlFor="filter-dari-pemasukan" className="block text-[12px] font-medium text-text-2 mb-1.5">
                      Tanggal Mulai
                    </label>
                    <input
                      id="filter-dari-pemasukan"
                      type="date"
                      name="dari"
                      defaultValue={dari}
                      className="w-full bg-surface border border-line text-text text-[13px] px-3 py-2 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-income/20 focus:border-income transition-colors"
                    />
                  </div>

                  {/* Filter Tanggal Akhir */}
                  <div>
                    <label htmlFor="filter-sampai-pemasukan" className="block text-[12px] font-medium text-text-2 mb-1.5">
                      Tanggal Akhir
                    </label>
                    <input
                      id="filter-sampai-pemasukan"
                      type="date"
                      name="sampai"
                      defaultValue={sampai}
                      className="w-full bg-surface border border-line text-text text-[13px] px-3 py-2 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-income/20 focus:border-income transition-colors"
                    />
                  </div>

                  {/* Filter Jenis Pembayaran / Sumber Dana */}
                  <div>
                    <Select
                      name="jenis"
                      label="Jenis Pembayaran"
                      defaultValue={jenisId}
                      options={jenisOptionsForTab}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-text-3">
                    Catatan: Filter rentang tanggal inklusif dan memfilter transaksi berdasarkan tanggal transaksi.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="submit" variant="outline-brand" size="md">
                      <Filter className="w-4 h-4" />
                      <span>Terapkan Filter</span>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Chips / Pills Ringkasan Filter Aktif */}
          {activeFiltersCount > 0 && (
            <div className="px-4 py-2.5 bg-panel/20 flex flex-wrap items-center gap-2 text-[12px]">
              <span className="text-text-3 font-medium">Filter Aktif:</span>

              {tahunAjaranId && tahunAjaranId !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-surface border border-line text-text">
                  <span>TA: {tahunAjaranList.find((t) => t.id === tahunAjaranId)?.nama}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter("tahunAjaran")}
                    className="hover:text-expense cursor-pointer"
                    aria-label="Hapus filter tahun ajaran"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {kelasId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-surface border border-line text-text">
                  <span>Kelas: {kelasId === "guru" ? "Guru" : kelasList.find((k) => k.id === kelasId)?.nama}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter("kelas")}
                    className="hover:text-expense cursor-pointer"
                    aria-label="Hapus filter kelas"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {bulanNomor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-surface border border-line text-text">
                  <span>Bulan: {namaBulanTerpilih}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter("bulan")}
                    className="hover:text-expense cursor-pointer"
                    aria-label="Hapus filter bulan"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(dari || sampai) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-surface border border-line text-text">
                  <span>
                    Tanggal: {dari || "..."} s/d {sampai || "..."}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFilter("tanggal")}
                    className="hover:text-expense cursor-pointer"
                    aria-label="Hapus filter rentang tanggal"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {jenisId && activeJenisNama && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-surface border border-line text-text">
                  <span>Jenis: {activeJenisNama}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter("jenis")}
                    className="hover:text-expense cursor-pointer"
                    aria-label="Hapus filter jenis pembayaran"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </BlurReveal>

      {/* Tabs & Tab Content */}
      <BlurReveal blur={6} delay={0.18} duration={0.7}>
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  const sp = new URLSearchParams(window.location.search);
                  sp.set("tab", t.key);
                  // Kosongkan jenis jika tab berganti agar tidak tabrakan ID
                  sp.delete("jenis");
                  router.push(`/pemasukan?${sp.toString()}`);
                }}
                className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                  tab === t.key
                    ? "border-income text-income font-semibold"
                    : "border-transparent text-text-3 hover:text-text hover:border-line-strong"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "dari-siswa" && (
            <TabDariSiswa
              jenisOptions={siswaData.jenisOptions}
              siswaRows={siswaData.siswaRows}
              tahunAjaranId={tahunAjaranId}
              onRefresh={() => router.refresh()}
            />
          )}

          {tab === "bantuan" && (
            <TabDana
              kategori="BANTUAN"
              rows={bantuanRows}
              sumberList={bantuanSumber}
              onRefresh={() => router.refresh()}
            />
          )}

          {tab === "donatur" && (
            <TabDana
              kategori="DONATUR"
              rows={donaturRows}
              sumberList={donaturSumber}
              onRefresh={() => router.refresh()}
            />
          )}
        </div>
      </BlurReveal>
    </div>
  );
}
