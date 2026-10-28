"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { PengeluaranRow, RingkasanPengeluaran } from "@/server/queries/pengeluaran";
import type { TahunAjaranOption } from "@/server/queries/anggota";
import { formatRupiah, parseRupiah } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataGrid, type ColumnDef } from "@/components/ui/DataGrid";
import { useToast } from "@/components/ui/Toast";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { FilterIcon } from "@/components/ui/FilterIcon";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";
import { RotateCcw, X, ChevronDown, ChevronUp, Pencil, Trash2, Filter } from "lucide-react";
import {
  hapusPengeluaranAction,
  simpanBatchPengeluaranAction,
  type BatchPengeluaranInput,
} from "@/server/actions/pengeluaran";

interface PengeluaranClientProps {
  rows: PengeluaranRow[];
  total: number;
  ringkasan: RingkasanPengeluaran;
  tahunAjaranList: TahunAjaranOption[];
  tahunAjaranId: string;
  bulan: string; // "YYYY-MM"
  bulanNomor: string; // "01"-"12"
  dari: string; // "YYYY-MM-DD"
  sampai: string; // "YYYY-MM-DD"
  jenis: string;
  jenisList: string[];
  page: number;
}

interface EditablePengeluaranRow {
  id: string; // empty string for new row
  tanggal: string; // DD-MM-YYYY
  jenis: string;
  nominal: number | string;
  petugasNama: string;
  catatan?: string;
}

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

export function PengeluaranClient({
  rows,
  total,
  ringkasan,
  tahunAjaranList,
  tahunAjaranId,
  bulanNomor,
  dari,
  sampai,
  jenis,
  jenisList,
  page,
}: PengeluaranClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);

  // Hitung jumlah filter aktif
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (tahunAjaranId) {
      const activeTa = tahunAjaranList.find((t) => t.aktif);
      if (tahunAjaranId !== activeTa?.id) count++;
    }
    if (bulanNomor) count++;
    if (dari) count++;
    if (sampai) count++;
    if (jenis) count++;
    return count;
  }, [tahunAjaranId, bulanNomor, dari, sampai, jenis, tahunAjaranList]);

  // URL untuk export Excel
  const buildExportUrl = useMemo(() => {
    const sp = new URLSearchParams();
    if (tahunAjaranId) sp.set("tahunAjaran", tahunAjaranId);
    if (bulanNomor) sp.set("bulan", bulanNomor);
    if (dari) sp.set("dari", dari);
    if (sampai) sp.set("sampai", sampai);
    if (jenis) sp.set("jenis", jenis);
    return `/api/export/pengeluaran?${sp.toString()}`;
  }, [tahunAjaranId, bulanNomor, dari, sampai, jenis]);

  const handlePageChange = (newPage: number) => {
    const sp = new URLSearchParams();
    if (tahunAjaranId) sp.set("tahunAjaran", tahunAjaranId);
    if (bulanNomor) sp.set("bulan", bulanNomor);
    if (dari) sp.set("dari", dari);
    if (sampai) sp.set("sampai", sampai);
    if (jenis) sp.set("jenis", jenis);
    if (newPage > 1) sp.set("halaman", String(newPage));
    const qs = sp.toString();
    router.push(qs ? `/pengeluaran?${qs}` : "/pengeluaran");
  };

  const removeFilter = useCallback(
    (key: "tahunAjaran" | "bulan" | "tanggal" | "jenis") => {
      const sp = new URLSearchParams(window.location.search);
      if (key === "tahunAjaran") sp.delete("tahunAjaran");
      if (key === "bulan") sp.delete("bulan");
      if (key === "tanggal") {
        sp.delete("dari");
        sp.delete("sampai");
      }
      if (key === "jenis") sp.delete("jenis");
      sp.delete("halaman");
      router.push(`/pengeluaran?${sp.toString()}`);
    },
    [router]
  );

  const handleResetFilter = useCallback(() => {
    router.push("/pengeluaran");
  }, [router]);

  const tahunOptions = [
    { value: "", label: "— Semua Tahun Ajaran —" },
    ...tahunAjaranList.map((t) => ({
      value: t.id,
      label: t.aktif ? `${t.nama} (Aktif)` : t.nama,
    })),
  ];

  const jenisOptions = [
    { value: "", label: "— Semua Jenis Pengeluaran —" },
    ...jenisList.map((j) => ({ value: j, label: j })),
  ];

  const totalPages = Math.max(1, Math.ceil(total / 50));

  // Default tanggal hari ini dalam format DD-MM-YYYY
  const today = new Date();
  const defaultTodayStr = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${today.getFullYear()}`;

  const gridRows: EditablePengeluaranRow[] = rows.map((r) => {
    const d = new Date(r.tanggal);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return {
      id: r.id,
      tanggal: `${dd}-${mm}-${yyyy}`,
      jenis: r.jenis,
      nominal: r.nominal,
      petugasNama: r.petugasNama,
      catatan: r.catatan ?? "",
    };
  });

  const handleSaveAll = async (updatedRows: EditablePengeluaranRow[]) => {
    startSaving(async () => {
      const items: BatchPengeluaranInput[] = updatedRows.map((r) => {
        let nom: number = 0;
        if (typeof r.nominal === "number") {
          nom = r.nominal;
        } else {
          try {
            nom = parseRupiah(r.nominal);
          } catch {
            const cleaned = String(r.nominal).replace(/[Rp\s.]/g, "").replace(",", "");
            nom = parseInt(cleaned, 10) || 0;
          }
        }

        return {
          id: r.id || undefined,
          tanggal: r.tanggal,
          jenis: r.jenis,
          nominal: nom,
          catatan: r.catatan || undefined,
        };
      });

      const res = await simpanBatchPengeluaranAction(items);
      if (!res.success) {
        showToast(res.error ?? "Gagal menyimpan pengeluaran.", "error");
      } else {
        showToast("Perubahan tersimpan", "success");
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleDelete = async (row: EditablePengeluaranRow) => {
    if (isEditing) {
      showToast("Selesaikan atau batalkan mode edit sebelum menghapus transaksi.", "error");
      return;
    }
    if (!row.id) {
      showToast("Baris baru yang belum disimpan tidak bisa dihapus dengan tombol ini.", "error");
      return;
    }
    if (!window.confirm(`Hapus transaksi pengeluaran "${row.jenis}" sebesar ${formatRupiah(typeof row.nominal === "number" ? row.nominal : parseRupiah(String(row.nominal)))}? Data akan disembunyikan dari laporan.`)) {
      return;
    }

    const formData = new FormData();
    formData.set("id", row.id);
    startSaving(async () => {
      const result = await hapusPengeluaranAction(null, formData);
      if (!result.success) {
        showToast(result.error ?? "Gagal menghapus pengeluaran.", "error");
        return;
      }
      showToast("Transaksi pengeluaran berhasil dihapus.", "success");
      router.refresh();
    });
  };

  const totalNominalHalaman = rows.reduce((sum, r) => sum + r.nominal, 0);

  const columns: ColumnDef<EditablePengeluaranRow>[] = [
    {
      id: "no",
      header: "No",
      width: "48px",
      align: "right",
      sticky: true,
      render: (_row, idx) => (
        <span className="text-text-3 num tabular-nums">
          {(page - 1) * 50 + idx + 1}
        </span>
      ),
    },
    {
      id: "tanggal",
      header: "Tanggal Transaksi",
      width: "140px",
      align: "left",
      editable: true,
      validate: (val) => {
        if (!val || !String(val).trim()) return { valid: false, error: "Wajib diisi" };
        if (!/^(\d{2})-(\d{2})-(\d{4})$/.test(String(val).trim())) {
          return { valid: false, error: "Gunakan format DD-MM-YYYY" };
        }
        return { valid: true };
      },
      render: (row) => <span className="num">{row.tanggal}</span>,
    },
    {
      id: "jenis",
      header: "Jenis Pengeluaran",
      width: "280px",
      editable: true,
      validate: (val) => (!val || !String(val).trim() ? { valid: false, error: "Wajib diisi" } : { valid: true }),
      render: (row) => <span className="font-[360]">{row.jenis}</span>,
    },
    {
      id: "nominal",
      header: "Nominal (Rp)",
      width: "180px",
      align: "right",
      isMoney: true,
      editable: true,
      validate: (val) => {
        if (!val) return { valid: false, error: "Wajib diisi" };
        try {
          const n = typeof val === "number" ? val : parseRupiah(String(val));
          return n > 0 ? { valid: true } : { valid: false, error: "Harus > 0" };
        } catch {
          return { valid: false, error: "Nominal tidak valid" };
        }
      },
      render: (row) => (
        <span className="num font-semibold text-expense-text">
          {typeof row.nominal === "number"
            ? formatRupiah(row.nominal)
            : row.nominal}
        </span>
      ),
    },
    {
      id: "petugasNama",
      header: "Petugas Pencatat",
      width: "170px",
      editable: false,
      render: (row) => (
        <span className="text-text-2 text-[13px]">{row.petugasNama || "—"}</span>
      ),
    },
    {
      id: "catatan",
      header: "Catatan",
      editable: true,
      render: (row) => (
        <span className="text-text-3 text-[12px] italic">
          {row.catatan ? String(row.catatan) : "—"}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      width: "110px",
      editable: false,
      render: (row) => (
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={isEditing || isSaving || !row.id}
          onClick={() => void handleDelete(row)}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </Button>
      ),
    },
  ];

  // Label periode dinamis
  const namaBulanTerpilih = bulanNomor
    ? BULAN_OPTIONS.find((b) => b.value === bulanNomor)?.label
    : null;

  let labelPeriode = "Jumlah Pengeluaran Periode Ini";
  if (dari && sampai) {
    labelPeriode = `Jumlah Pengeluaran (${dari} s/d ${sampai})`;
  } else if (namaBulanTerpilih) {
    labelPeriode = `Jumlah Pengeluaran Bulan ${namaBulanTerpilih}`;
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <h1 className="text-[22px] lg:text-[26px] font-semibold text-text tracking-tight">
              Pencatatan Pengeluaran Sekolah
            </h1>
            <p className="text-[13px] text-text-3 mt-1">
              Catat dan pantau transaksi operasional kas sekolah, belanja kebutuhan, serta gaji guru & staf.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <ExportExcelButton
              exportUrl={buildExportUrl}
              defaultFilename="pengeluaran.xlsx"
              label="Export Excel (.xlsx)"
            />
            {!isEditing ? (
              <Button
                type="button"
                variant="accent"
                size="md"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Data Pengeluaran</span>
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-gold-soft border border-gold-border text-gold-text text-[13px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                Mode Edit Aktif
              </span>
            )}
          </div>
        </div>
      </BlurReveal>

      {/* Ringkasan Pengeluaran: Periode Terpilih & Total Per Tahun (Area Merah) */}
      <StaggerGroup blur={8} duration={0.75} className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.08}>
        <StaggerItem>
          <div className="bg-expense-soft p-5 lg:p-6 border border-expense-border rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-expense" />
            <div>
              <p className="text-[12px] font-semibold text-expense-text uppercase tracking-wider mb-2">
                {labelPeriode}
              </p>
              <div className="text-[26px] lg:text-[30px] font-semibold text-expense-text num tabular-nums">
                <AnimatedNumber
                  value={ringkasan.jumlahBulanIni}
                  format={formatRupiah}
                  duration={0.6}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-expense-border/70 bg-expense-border/20 -mx-5 lg:-mx-6 -mb-5 lg:-mb-6 px-5 lg:px-6 py-2.5 text-[12px] text-expense-text">
              Total beban kas hasil penyaringan kriteria filter aktif
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-expense-soft p-5 lg:p-6 border border-expense-border rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-expense" />
            <div>
              <p className="text-[12px] font-semibold text-expense-text uppercase tracking-wider mb-2">
                Total Pengeluaran Per Tahun (Seluruh Beban)
              </p>
              <div className="text-[26px] lg:text-[30px] font-semibold text-expense-text num tabular-nums">
                <AnimatedNumber
                  value={ringkasan.totalPerTahun}
                  format={formatRupiah}
                  duration={0.65}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-expense-border/70 bg-expense-border/20 -mx-5 lg:-mx-6 -mb-5 lg:-mb-6 px-5 lg:px-6 py-2.5 text-[12px] text-expense-text">
              Akumulasi seluruh pengeluaran tahun ajaran berjalan (identik dengan Dashboard)
            </div>
          </div>
        </StaggerItem>
      </StaggerGroup>

      {/* Advanced Filter Toolbar */}
      {!isEditing && (
        <BlurReveal blur={6} delay={0.12} duration={0.65}>
          <div className="bg-surface border border-line rounded-[12px] shadow-xs overflow-hidden">
            <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel/30">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFilterPanelOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] border border-line bg-surface text-text hover:bg-surface-soft hover:border-brand/40 text-[13px] font-medium transition-colors cursor-pointer"
                  aria-expanded={filterPanelOpen}
                  aria-label="Buka atau tutup panel filter pencarian pengeluaran"
                >
                  <FilterIcon className="w-4 h-4 text-expense" />
                  <span>Filter Pengeluaran</span>
                  {activeFiltersCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-full bg-expense text-white">
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
                  Saring berdasarkan tahun ajaran, bulan, rentang tanggal, & jenis belanja kas
                </span>
              </div>

              {activeFiltersCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilter}
                  title="Reset semua filter ke kondisi default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </Button>
              )}
            </div>

            {filterPanelOpen && (
              <div className="p-4 border-b border-line">
                <form method="GET" action="/pengeluaran" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <Select
                        name="tahunAjaran"
                        label="Tahun Ajaran"
                        defaultValue={tahunAjaranId}
                        options={tahunOptions}
                      />
                    </div>
                    <div>
                      <Select
                        name="bulan"
                        label="Bulan Transaksi"
                        defaultValue={bulanNomor}
                        options={BULAN_OPTIONS}
                      />
                    </div>
                    <div>
                      <label htmlFor="filter-dari-pengeluaran" className="block text-[12px] font-medium text-text-2 mb-1.5">
                        Tanggal Mulai
                      </label>
                      <input
                        id="filter-dari-pengeluaran"
                        type="date"
                        name="dari"
                        defaultValue={dari}
                        className="w-full bg-surface border border-line-strong text-text text-[13px] px-3 py-2 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="filter-sampai-pengeluaran" className="block text-[12px] font-medium text-text-2 mb-1.5">
                        Tanggal Akhir
                      </label>
                      <input
                        id="filter-sampai-pengeluaran"
                        type="date"
                        name="sampai"
                        defaultValue={sampai}
                        className="w-full bg-surface border border-line-strong text-text text-[13px] px-3 py-2 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                      />
                    </div>
                    <div>
                      <Select
                        name="jenis"
                        label="Jenis Pengeluaran"
                        defaultValue={jenis}
                        options={jenisOptions}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-[11px] text-text-3">
                      Catatan: Filter rentang tanggal bersifat inklusif terhadap tanggal transaksi.
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

            {/* Chips filter aktif */}
            {activeFiltersCount > 0 && (
              <div className="px-4 py-2.5 bg-panel/20 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="text-text-3 font-medium">Filter Aktif:</span>

                {tahunAjaranId && (
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

                {jenis && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-surface border border-line text-text">
                    <span>Jenis: {jenis}</span>
                    <button
                      type="button"
                      onClick={() => removeFilter("jenis")}
                      className="hover:text-expense cursor-pointer"
                      aria-label="Hapus filter jenis pengeluaran"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </BlurReveal>
      )}

      {/* DataGrid dengan mode baca / edit dan paste Excel */}
      <BlurReveal blur={6} delay={0.18} duration={0.7}>
        <DataGrid<EditablePengeluaranRow>
          columns={columns}
          data={gridRows}
          keyField={(row, idx) => row.id || `temp-${idx}`}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(true)}
          onCancelEdit={() => setIsEditing(false)}
          onSave={handleSaveAll}
          isSaving={isSaving}
          showToolbar={isEditing}
          enablePaste={true}
          areaTheme="expense"
          totals={{
            nominal: totalNominalHalaman,
          }}
          createNewRow={() => ({
            id: "",
            tanggal: defaultTodayStr,
            jenis: "",
            nominal: "",
            petugasNama: "Anda (saat simpan)",
            catatan: "",
          })}
          emptyMessage={
            bulanNomor
              ? `Belum ada transaksi pengeluaran untuk periode ${BULAN_OPTIONS.find((b) => b.value === bulanNomor)?.label ?? ""}. Klik tombol "Edit Data Pengeluaran" di atas untuk mulai mencatat transaksi.`
              : 'Belum ada catatan pengeluaran untuk kriteria ini. Klik tombol "Edit Data Pengeluaran" di atas untuk mulai mencatat transaksi.'
          }
        />
      </BlurReveal>

      {/* Paginasi hanya jika tidak sedang edit */}
      {!isEditing && total > 50 && (
        <div className="flex items-center gap-4 text-[14px] text-text-3">
          <span className="num">{total} total baris</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              ← Sebelumnya
            </Button>
            <span className="px-2 py-1 text-text num">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Berikutnya →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
