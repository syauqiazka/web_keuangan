"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { TabDariSiswa } from "@/app/(app)/pemasukan/TabDariSiswa";
import { TabDana } from "@/app/(app)/pemasukan/TabDana";
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
  { key: "dari-siswa", label: "Dari Siswa" },
  { key: "bantuan", label: "Bantuan" },
  { key: "donatur", label: "Donatur" },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="pb-4 border-b border-line">
          <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25]">
            Pemasukan
          </h1>
        </div>
      </FadeIn>

      {/* Ringkasan */}
      <div className="space-y-3">
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.1}>
          <StaggerItem>
            <div className="bg-canvas p-6 border border-line rounded-[8px]">
              <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
                {labelBulan}
              </div>
              <div className="text-[32px] font-[400] font-display text-text leading-[1.25] num">
                {ringkasan.jumlahBulanIniFormatted}
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-canvas p-6 border border-line rounded-[8px]">
              <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
                Total Pemasukan Per Tahun
              </div>
              <div className="text-[32px] font-[400] font-display text-text leading-[1.25] num">
                {ringkasan.totalPerTahunFormatted}
              </div>
            </div>
          </StaggerItem>
        </StaggerGroup>

        {/* Baris rincian per jenis berupa daftar label-angka (DESIGN.md bagian 8) */}
        {ringkasan.perJenis.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[13px] text-text-2 py-2 px-1">
            <span className="font-mono text-[12px] text-label uppercase tracking-[0.06em]">
              Rincian:
            </span>
            {ringkasan.perJenis.map((item) => (
              <span key={item.nama} className="flex gap-1.5 items-center">
                <span className="text-text-3 font-[360]">{item.nama}:</span>
                <span className="font-[500] text-text num">{item.totalFormatted}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filter */}
      <form method="GET" action="/pemasukan" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="tab" value={tab} />
        <div className="flex-1 min-w-[180px]">
          <Select
            name="tahunAjaran"
            label="Tahun Ajaran"
            defaultValue={tahunAjaranId}
            options={[
              { value: "", label: "— Semua Tahun Ajaran —" },
              ...tahunAjaranList.map((ta) => ({ value: ta.id, label: ta.nama })),
            ]}
          />
        </div>
        <div className="min-w-[140px]">
          <Select
            name="kelas"
            label="Kelas"
            defaultValue={kelasId}
            options={kelasOptions}
          />
        </div>
        <div className="min-w-[120px]">
          <Select
            name="bulan"
            label="Bulan"
            defaultValue={bulanNomor}
            options={BULAN_OPTIONS}
          />
        </div>
        <div className="pb-0.5">
          <Button type="submit" variant="primary" size="sm">
            Tarik Data
          </Button>
        </div>
      </form>

      {/* Tabs */}
      <div>
        <div className="flex gap-6 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() =>
                router.push(
                  buildUrl({ tahunAjaranId, kelasId, bulan: bulanNomor, tab: t.key })
                )
              }
              className={`pb-2 text-[14px] font-[500] border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? "border-text text-text font-[600]"
                  : "border-transparent text-text-3 hover:text-text-2"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pt-4">
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
    </div>
  );
}
