"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AnggotaRow, TahunAjaranOption, KelasOption } from "@/server/queries/anggota";
import type { SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataGrid, type ColumnDef } from "@/components/ui/DataGrid";
import { useToast } from "@/components/ui/Toast";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { generateUID } from "@/lib/uid";
import {
  simpanBatchAnggotaAction,
  type BatchAnggotaInput,
} from "@/server/actions/anggota";

interface DataSiswaGuruClientProps {
  rows: AnggotaRow[];
  total: number;
  tahunAjaranList: TahunAjaranOption[];
  kelasList: KelasOption[];
  tahunAjaranId: string;
  kelasId: string;
  page: number;
}

interface EditableAnggotaRow {
  id: string; // empty string for new row
  nama: string;
  kelasId: string; // 'guru' or kelas.id
  kelasNama?: string | null;
  uid: string;
  tipe: "SISWA" | "GURU";
}

export function DataSiswaGuruClient({
  rows,
  total,
  tahunAjaranList,
  kelasList,
  tahunAjaranId,
  kelasId,
  page,
}: DataSiswaGuruClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startSaving] = useTransition();

  // Opsi filter
  const tahunOptions: SelectOption[] = [
    { value: "", label: "— Semua Tahun Ajaran —" },
    ...tahunAjaranList.map((ta) => ({ value: ta.id, label: ta.nama })),
  ];
  const kelasOptions: SelectOption[] = [
    { value: "", label: "— Semua Kelas —" },
    { value: "guru", label: "Guru" },
    ...kelasList.map((k) => ({ value: k.id, label: k.nama })),
  ];

  // Opsi pilihan kelas di mode edit (wajib pilih kelas atau Guru)
  const editKelasOptions: SelectOption[] = [
    { value: "guru", label: "Guru" },
    ...kelasList.map((k) => ({ value: k.id, label: k.nama })),
  ];

  const totalPages = Math.max(1, Math.ceil(total / 50));

  const handlePageChange = (newPage: number) => {
    const sp = new URLSearchParams();
    if (tahunAjaranId) sp.set("tahunAjaran", tahunAjaranId);
    if (kelasId) sp.set("kelas", kelasId);
    if (newPage > 1) sp.set("halaman", String(newPage));
    const qs = sp.toString();
    router.push(qs ? `/data-siswa-guru?${qs}` : "/data-siswa-guru");
  };

  // Ubah rows ke format grid lokal
  const gridRows: EditableAnggotaRow[] = rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    kelasId: r.tipe === "GURU" ? "guru" : r.kelasId ?? "",
    kelasNama: r.tipe === "GURU" ? "Guru" : r.kelasNama,
    uid: r.uid,
    tipe: r.tipe,
  }));

  const handleSaveAll = async (updatedRows: EditableAnggotaRow[]) => {
    startSaving(async () => {
      const items: BatchAnggotaInput[] = updatedRows.map((r) => {
        const isGuru = r.kelasId === "guru" || r.tipe === "GURU";
        return {
          id: r.id || undefined,
          nama: r.nama,
          uid: r.uid,
          tipe: isGuru ? "GURU" : "SISWA",
          kelasId: isGuru ? undefined : r.kelasId,
          tahunAjaranId: isGuru ? undefined : tahunAjaranId || undefined,
        };
      });

      const res = await simpanBatchAnggotaAction(items);
      if (!res.success) {
        showToast(res.error ?? "Gagal menyimpan data.", "error");
      } else {
        showToast("Semua perubahan berhasil disimpan.", "success");
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const columns: ColumnDef<EditableAnggotaRow>[] = [
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
      id: "nama",
      header: "Nama",
      width: "260px",
      sticky: true,
      stickyOffset: 48,
      editable: true,
      validate: (val) => (!val || !String(val).trim() ? { valid: false, error: "Wajib diisi" } : { valid: true }),
      render: (row) => <span className="font-[360]">{row.nama}</span>,
    },
    {
      id: "kelasId",
      header: "Kelas / Guru",
      width: "200px",
      editable: true,
      render: (row) => (
        <span className="text-text-2 font-[360]">
          {row.tipe === "GURU" || row.kelasId === "guru"
            ? "Guru"
            : kelasList.find((k) => k.id === row.kelasId)?.nama ?? row.kelasNama ?? "—"}
        </span>
      ),
      renderEdit: (_row, _idx, value, onChange, inputProps) => (
        <select
          data-grid-cell={inputProps["data-grid-cell"]}
          value={typeof value === "string" && value ? value : (kelasId ? kelasId : "guru")}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
          }}
          onKeyDown={inputProps.onKeyDown}
          className="w-full bg-canvas text-[14px] px-2 py-1 border border-line-strong rounded-none outline-none focus:outline-2 focus:outline-accent -outline-offset-1 text-text"
        >
          {editKelasOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      id: "uid",
      header: "Kode UID",
      width: "180px",
      isMono: true,
      editable: true,
      validate: (val) => {
        if (!val || !String(val).trim()) return { valid: true };
        if (!/^[A-Za-z0-9\-_]+$/.test(String(val).trim())) {
          return { valid: false, error: "Huruf, angka, tanda hubung saja" };
        }
        return { valid: true };
      },
      render: (row) => <span className="font-mono text-[13px]">{row.uid}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Halaman dengan Atmos blur-to-sharp reveal */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <h1 className="text-[24px] lg:text-[28px] font-semibold text-text tracking-tight">
              Data Siswa & Guru
            </h1>
            <p className="text-[13px] text-text-3 mt-0.5">
              Direktori siswa per kelas dan tenaga pendidik dengan kode UID unik
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isEditing ? "secondary" : "primary"}
              size="md"
              onClick={() => setIsEditing((prev) => !prev)}
            >
              {isEditing ? "Batal Edit" : "Input Data"}
            </Button>
          </div>
        </div>
      </BlurReveal>

      {/* Form Filter (GET) – Enter */}
      {!isEditing && (
        <BlurReveal blur={6} delay={0.12} duration={0.65}>
          <div className="bg-surface border border-line rounded-[8px] p-4 shadow-xs">
            <form
              method="GET"
              action="/data-siswa-guru"
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
              <div className="flex-1 min-w-[180px]">
                <Select
                  name="kelas"
                  label="Kelas / Guru"
                  defaultValue={kelasId}
                  options={kelasOptions}
                />
              </div>
              <div className="pb-0.5">
                <Button type="submit" variant="primary" size="md">
                  Enter
                </Button>
              </div>
            </form>
          </div>
        </BlurReveal>
      )}

      {/* DataGrid dengan mode baca / edit dan paste Excel */}
      <BlurReveal blur={6} delay={0.18} duration={0.7}>
        <DataGrid<EditableAnggotaRow>
        columns={columns}
        data={gridRows}
        keyField={(row, idx) => row.id || `temp-${idx}`}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
        onSave={handleSaveAll}
        isSaving={isSaving}
        showToolbar={isEditing}
        enablePaste={true}
        createNewRow={() => {
          const tipe = kelasId === "guru" ? "GURU" : "SISWA";
          return {
            id: "",
            nama: "",
            kelasId: kelasId || (kelasList[0]?.id ?? "guru"),
            uid: generateUID(tipe),
            tipe,
          };
        }}
        emptyMessage={
          tahunAjaranId || kelasId
            ? "Belum ada data untuk filter yang dipilih."
            : "Belum ada data siswa atau guru."
        }
      />
      </BlurReveal>

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
