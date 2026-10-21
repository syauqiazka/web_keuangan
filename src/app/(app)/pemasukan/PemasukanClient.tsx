"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { formatRupiah } from "@/lib/money";
import { TabDariSiswa } from "@/app/(app)/pemasukan/TabDariSiswa";
import { TabDana } from "@/app/(app)/pemasukan/TabDana";
import { CheckCircle2 } from "lucide-react";
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
  tab: TabKey;
  ringkasan: RingkasanPemasukan;
  siswaData: { jenisOptions: JenisPemasukanOption[]; siswaRows: SiswaSel[] };
  bantuanRows: PemasukanDanaRow[];
  donaturRows: PemasukanDanaRow[];
  bantuanSumber: SumberDanaOption[];
  donaturSumber: SumberDanaOption[];
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
  bulan,
  tab,
  ringkasan,
  siswaData,
  bantuanRows,
  donaturRows,
  bantuanSumber,
  donaturSumber,
}: PemasukanClientProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (params: {
      tahunAjaranId?: string;
      kelasId?: string;
      bulan?: string;
      tab?: TabKey;
    }) => {
      const sp = new URLSearchParams();
      if (params.tahunAjaranId) sp.set("tahunAjaran", params.tahunAjaranId);
      if (params.kelasId) sp.set("kelas", params.kelasId);
      if (params.bulan) sp.set("bulan", params.bulan);
      if (params.tab) sp.set("tab", params.tab);
      const qs = sp.toString();
      return qs ? `/pemasukan?${qs}` : "/pemasukan";
    },
    []
  );

  const bulanNomor = bulan ? bulan.split("-")[1] ?? "" : "";

  const kelasOptions = [
    { value: "", label: "— Semua Kelas —" },
    { value: "guru", label: "Guru" },
    ...kelasList.map((k) => ({ value: k.id, label: k.nama })),
  ];

  const namaBulanTerpilih = bulanNomor
    ? BULAN_OPTIONS.find((b) => b.value === bulanNomor)?.label
    : null;
  const labelBulan = namaBulanTerpilih
    ? `Jumlah Pemasukan Bulan ${namaBulanTerpilih}`
    : "Jumlah Pemasukan Bulan Ini";

  const activeTa = tahunAjaranList.find((t) => t.aktif);

  return (
    <div className="space-y-6">
      {/* Header dengan Atmos blur-to-sharp reveal */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="pb-5 border-b border-line">
          <h1 className="text-[22px] lg:text-[26px] font-semibold text-text tracking-tight">
            Pencatatan Pemasukan Sekolah
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[13px] text-text-3">
              Pantau dan kelola penerimaan dana sekolah dari pembayaran siswa (SPP & non-SPP), bantuan pemerintah, dan donatur.
            </span>
            {activeTa && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-soft border border-brand/30 text-brand">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tahun Ajaran Aktif: {activeTa.nama}
              </span>
            )}
          </div>
        </div>
      </BlurReveal>

      {/* Ringkasan dengan blur-to-sharp stagger */}
      <div className="space-y-3">
        <StaggerGroup blur={8} duration={0.75} className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.08}>
          <StaggerItem>
            <div className="bg-surface p-5 lg:p-6 border border-line rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-series-in" />
              <div>
                <div className="text-[12px] font-medium text-text-3 uppercase tracking-wider mb-2">
                  {labelBulan}
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
                Kumulatif SPP, daftar ulang, bantuan & donatur bulan terpilih
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-surface p-5 lg:p-6 border border-line rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand" />
              <div>
                <div className="text-[12px] font-medium text-text-3 uppercase tracking-wider mb-2">
                  Total Pemasukan Per Tahun
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
                Total penerimaan seluruh kelas dan sumber tahun ajaran berjalan
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
                  Rincian:
                </span>
                {ringkasan.perJenis.map((item) => (
                  <span key={item.nama} className="flex gap-1.5 items-center px-2 py-0.5 rounded bg-panel border border-line/60">
                    <span className="text-text-3 font-normal">{item.nama}:</span>
                    <span className="font-semibold text-text num">{item.totalFormatted}</span>
                  </span>
                ))}
              </div>
            </div>
          </BlurReveal>
        )}
      </div>

      {/* Filter Toolbar dengan blur reveal */}
      <BlurReveal blur={6} delay={0.14} duration={0.65}>
        <div className="bg-surface border border-line rounded-[12px] p-4 shadow-xs">
          <form method="GET" action="/pemasukan" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value={tab} />
            <div className="flex-1 min-w-[200px]">
              <Select
                name="tahunAjaran"
                label="Tahun Ajaran"
                defaultValue={tahunAjaranId}
                options={[
                  { value: "", label: "— Semua Tahun Ajaran —" },
                  ...tahunAjaranList.map((ta) => ({
                    value: ta.id,
                    label: ta.aktif ? `${ta.nama} (Aktif)` : ta.nama,
                  })),
                ]}
              />
            </div>
            <div className="min-w-[150px]">
              <Select
                name="kelas"
                label="Filter Kelas Siswa"
                defaultValue={kelasId}
                options={kelasOptions}
              />
            </div>
            <div className="min-w-[140px]">
              <Select
                name="bulan"
                label="Bulan Transaksi"
                defaultValue={bulanNomor}
                options={BULAN_OPTIONS}
              />
            </div>
            <div className="pb-0.5">
              <Button type="submit" variant="primary" size="md">
                Tampilkan Data Pemasukan
              </Button>
            </div>
          </form>
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
                onClick={() =>
                  router.push(
                    buildUrl({ tahunAjaranId, kelasId, bulan: bulanNomor, tab: t.key })
                  )
                }
                className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all -mb-px rounded-t-[4px] ${
                  tab === t.key
                    ? "border-brand text-brand font-semibold bg-surface"
                    : "border-transparent text-text-3 hover:text-text hover:bg-panel/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
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
                key="bantuan"
                kategori="BANTUAN"
                rows={bantuanRows}
                sumberList={bantuanSumber}
                onRefresh={() => router.refresh()}
              />
            )}
            {tab === "donatur" && (
              <TabDana
                key="donatur"
                kategori="DONATUR"
                rows={donaturRows}
                sumberList={donaturSumber}
                onRefresh={() => router.refresh()}
              />
            )}
          </div>
        </div>
      </BlurReveal>
    </div>
  );
}
