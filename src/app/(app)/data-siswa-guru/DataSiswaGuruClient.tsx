"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AnggotaRow, TahunAjaranOption, KelasOption } from "@/server/queries/anggota";
import type { SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { DataGrid, type ColumnDef } from "@/components/ui/DataGrid";
import { useToast } from "@/components/ui/Toast";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { generateUID } from "@/lib/uid";
import {
  simpanBatchAnggotaAction,
  prosesKenaikanKelasAction,
  type BatchAnggotaInput,
} from "@/server/actions/anggota";
import { GraduationCap, CheckCircle2, AlertCircle, Pencil, Filter } from "lucide-react";

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

  // Kenaikan Kelas modal state
  const [modalNaikKelasOpen, setModalNaikKelasOpen] = useState(false);
  const [targetTaId, setTargetTaId] = useState("");
  const [targetKelasId, setTargetKelasId] = useState("");
  const [isPromoting, startPromoting] = useTransition();

  const activeTa = tahunAjaranList.find((t) => t.aktif);

  // Opsi filter
  const tahunOptions: SelectOption[] = [
    { value: "", label: "— Semua Tahun Ajaran —" },
    ...tahunAjaranList.map((ta) => ({
      value: ta.id,
      label: ta.aktif ? `${ta.nama} (Aktif)` : ta.nama,
    })),
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
        showToast("Perubahan tersimpan", "success");
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

  const siswaList = rows.filter((r) => r.tipe === "SISWA");

  const handleProsesKenaikanKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTaId) {
      showToast("Pilih tahun ajaran tujuan.", "error");
      return;
    }
    if (!targetKelasId) {
      showToast("Pilih kelas tujuan.", "error");
      return;
    }
    if (siswaList.length === 0) {
      showToast("Tidak ada siswa pada filter saat ini untuk dinaikkan kelas.", "error");
      return;
    }

    startPromoting(async () => {
      const res = await prosesKenaikanKelasAction({
        tahunAjaranTujuanId: targetTaId,
        kelasTujuanId: targetKelasId,
        anggotaIds: siswaList.map((s) => s.id),
      });

      if (!res.success) {
        showToast(res.error ?? "Gagal memproses penempatan kelas.", "error");
      } else {
        const targetTaName = tahunAjaranList.find((t) => t.id === targetTaId)?.nama ?? "";
        const targetKelasName = kelasList.find((k) => k.id === targetKelasId)?.nama ?? "";
        showToast(
          `${res.count} siswa berhasil ditempatkan ke ${targetKelasName} pada Tahun Ajaran ${targetTaName}. Riwayat kelas lama tersimpan aman.`,
          "success"
        );
        setModalNaikKelasOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman dengan Atmos blur-to-sharp reveal */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <h1 className="text-[22px] lg:text-[26px] font-semibold text-text tracking-tight">
              Data Siswa & Guru
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[13px] text-text-3">
                Direktori penempatan siswa per kelas dan tenaga pendidik dengan kode UID untuk rekap pembayaran.
              </span>
              {activeTa && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-soft border border-brand/30 text-brand">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tahun Ajaran Aktif: {activeTa.nama}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isEditing ? (
              <>
                {siswaList.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setTargetTaId(tahunAjaranList.find((t) => t.id !== tahunAjaranId)?.id ?? activeTa?.id ?? "");
                      setTargetKelasId(kelasList[0]?.id ?? "");
                      setModalNaikKelasOpen(true);
                    }}
                  >
                    <GraduationCap className="w-4 h-4 mr-1.5" />
                    Naik Kelas / Penempatan Baru
                  </Button>
                )}
                <Button
                  type="button"
                  variant="accent"
                  size="md"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Data Siswa</span>
                </Button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-gold-soft border border-gold-border text-gold-text text-[13px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                Mode Edit Aktif
              </span>
            )}
          </div>
        </div>
      </BlurReveal>

      {/* Form Filter (GET) – Tampilkan Data Siswa */}
      {!isEditing && (
        <BlurReveal blur={6} delay={0.12} duration={0.65}>
          <div className="bg-surface border border-line rounded-[12px] p-4 shadow-xs">
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
                  label="Pilih Kelas / Guru"
                  defaultValue={kelasId}
                  options={kelasOptions}
                />
              </div>
              <div className="pb-0.5">
                <Button type="submit" variant="outline-brand" size="md">
                  <Filter className="w-4 h-4" />
                  <span>Tampilkan Data Siswa</span>
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
        onToggleEdit={() => setIsEditing(true)}
        onCancelEdit={() => setIsEditing(false)}
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
            ? 'Belum ada data siswa atau guru untuk filter ini. Klik tombol "Edit Data Siswa" di atas untuk menambah baris atau tempel daftar nama dari Excel.'
            : "Silakan pilih Tahun Ajaran & Kelas pada filter di atas lalu klik 'Tampilkan Data Siswa'."
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

      {/* Dialog Kenaikan Kelas / Penempatan Siswa ke Periode Baru */}
      <Dialog
        open={modalNaikKelasOpen}
        title="Kenaikan Kelas / Penempatan ke Periode Baru"
        onClose={() => setModalNaikKelasOpen(false)}
      >
        <form onSubmit={handleProsesKenaikanKelas} className="space-y-4">
          <div className="p-3 bg-panel border border-line rounded-[8px] text-[13px] text-text">
            <span>
              Jumlah siswa yang akan ditempatkan: <strong>{siswaList.length} siswa</strong> (berdasarkan filter saat ini).
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-text">
              Pilih Tahun Ajaran Tujuan <span className="text-danger">*</span>
            </label>
            <select
              value={targetTaId}
              onChange={(e) => setTargetTaId(e.target.value)}
              className="w-full bg-surface border border-line rounded-[8px] px-3 py-2 text-[13px] text-text focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              required
            >
              <option value="">— Pilih Tahun Ajaran Tujuan —</option>
              {tahunAjaranList.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama} {ta.aktif ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-text">
              Pilih Kelas Tingkatan Tujuan <span className="text-danger">*</span>
            </label>
            <select
              value={targetKelasId}
              onChange={(e) => setTargetKelasId(e.target.value)}
              className="w-full bg-surface border border-line rounded-[8px] px-3 py-2 text-[13px] text-text focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              required
            >
              <option value="">— Pilih Kelas Tujuan —</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-surface-soft border border-brand/20 rounded-[8px] text-[12px] text-text flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <span>
              <strong>Riwayat historis aman:</strong> Kenaikan kelas ini akan membuat penempatan baru pada tahun ajaran tujuan. Data kelas dan riwayat pembayaran siswa pada tahun ajaran sebelumnya tidak akan berubah atau terhapus.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalNaikKelasOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isPromoting}>
              {isPromoting ? "Memproses…" : "Proses Penempatan Siswa"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
