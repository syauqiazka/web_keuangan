"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PengeluaranRow, RingkasanPengeluaran } from "@/server/queries/pengeluaran";
import type { TahunAjaranOption } from "@/server/queries/anggota";
import { formatRupiah, parseRupiah } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataGrid, type ColumnDef } from "@/components/ui/DataGrid";
import { useToast } from "@/components/ui/Toast";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import {
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
  bulan,
  page,
}: PengeluaranClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const bulanNomor = bulan ? bulan.split("-")[1] ?? "" : "";

  const tahunOptions = [
    { value: "", label: "— Semua Tahun Ajaran —" },
    ...tahunAjaranList.map((t) => ({ value: t.id, label: t.nama })),
  ];

  const totalPages = Math.max(1, Math.ceil(total / 50));

  const handlePageChange = (newPage: number) => {
    const sp = new URLSearchParams();
    if (tahunAjaranId) sp.set("tahunAjaran", tahunAjaranId);
    if (bulanNomor) sp.set("bulan", bulanNomor);
    if (newPage > 1) sp.set("halaman", String(newPage));
    const qs = sp.toString();
    router.push(qs ? `/pengeluaran?${qs}` : "/pengeluaran");
  };

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
        showToast("Semua pengeluaran berhasil disimpan.", "success");
        setIsEditing(false);
        router.refresh();
      }
    });
  };

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
      header: "Tanggal",
      width: "130px",
      align: "left",
      editable: true,
      validate: (val) => {
        if (!val || !String(val).trim()) return { valid: false, error: "Wajib diisi" };
        if (!/^(\d{2})-(\d{2})-(\d{4})$/.test(String(val).trim())) {
          return { valid: false, error: "Gunakan DD-MM-YYYY" };
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
      header: "Nominal",
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
        <span className="num font-semibold text-text">
          {typeof row.nominal === "number"
            ? formatRupiah(row.nominal)
            : row.nominal}
        </span>
      ),
    },
    {
      id: "petugasNama",
      header: "Petugas",
      width: "160px",
      editable: false,
      render: (row) => (
        <span className="text-text-2 text-[13px]">{row.petugasNama || "—"}</span>
      ),
    },
  ];

  // Hitung total nominal di halaman ini untuk tfoot
  const totalNominalHalaman = rows.reduce((acc, curr) => acc + curr.nominal, 0);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line">
          <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25]">
            Pengeluaran
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing((prev) => !prev)}
            >
              {isEditing ? "Batal" : "Input"}
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Ringkasan Pengeluaran: Bulan Ini & Total Per Tahun */}
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.1}>
        <StaggerItem>
          <div className="bg-canvas border border-line rounded-[8px] p-6">
            <p className="font-mono text-[14px] text-label mb-2">
              Jumlah Pengeluaran Bulan Ini
            </p>
            <p className="text-[32px] font-semibold text-text num tabular-nums">
              {ringkasan.jumlahBulanIniFormatted}
            </p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-canvas border border-line rounded-[8px] p-6">
            <p className="font-mono text-[14px] text-label mb-2">
              Total Pengeluaran Per Tahun
            </p>
            <p className="text-[32px] font-semibold text-text num tabular-nums">
              {ringkasan.totalPerTahunFormatted}
            </p>
          </div>
        </StaggerItem>
      </StaggerGroup>

      {/* Filter Form (GET) – Tarik Data */}
      {!isEditing && (
        <form
          method="GET"
          action="/pengeluaran"
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[200px]">
            <Select
              name="tahunAjaran"
              label="Tahun Ajaran"
              defaultValue={tahunAjaranId}
              options={tahunOptions}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
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
      )}

      {/* DataGrid dengan mode baca / edit dan paste Excel */}
      <DataGrid<EditablePengeluaranRow>
        columns={columns}
        data={gridRows}
        keyField={(row, idx) => row.id || `temp-${idx}`}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
        onSave={handleSaveAll}
        isSaving={isSaving}
        showToolbar={isEditing}
        enablePaste={true}
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
            ? `Belum ada pengeluaran pada periode ini.`
            : "Belum ada catatan pengeluaran."
        }
      />

      {/* Paginasi hanya jika tidak sedang edit */}
      {!isEditing && total > 50 && (
        <div className="flex items-center gap-4 text-[14px] text-text-3">
          <span className="num">{total} baris</span>
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
