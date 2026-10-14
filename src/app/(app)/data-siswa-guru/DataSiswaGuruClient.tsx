"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AnggotaRow, TahunAjaranOption, KelasOption } from "@/server/queries/anggota";
import type { SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { InputAnggotaDialog } from "@/components/InputAnggotaDialog";

interface DataSiswaGuruClientProps {
  rows: AnggotaRow[];
  total: number;
  tahunAjaranList: TahunAjaranOption[];
  kelasList: KelasOption[];
  // Filter URL params saat ini
  tahunAjaranId: string;
  kelasId: string;
  page: number;
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
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const totalPages = Math.max(1, Math.ceil(total / 50));

  const handlePageChange = (newPage: number) => {
    const url = buildUrl({ tahunAjaranId, kelasId, page: newPage });
    router.push(url);
  };

  function buildUrl(params: { tahunAjaranId?: string; kelasId?: string; page?: number }) {
    const sp = new URLSearchParams();
    if (params.tahunAjaranId) sp.set("tahunAjaran", params.tahunAjaranId);
    if (params.kelasId) sp.set("kelas", params.kelasId);
    if (params.page && params.page > 1) sp.set("halaman", String(params.page));
    const qs = sp.toString();
    return qs ? `/data-siswa-guru?${qs}` : "/data-siswa-guru";
  }

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Header dan Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line">
        <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25]">
          Data Siswa & Guru
        </h1>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          Input
        </Button>
      </div>

      {/* Form Filter (GET) – Tarik Data */}
      <form
        method="GET"
        action="/data-siswa-guru"
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[180px]">
          <Select
            name="tahunAjaran"
            label="Tahun Ajaran"
            defaultValue={tahunAjaranId}
            options={tahunOptions}
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <Select
            name="kelas"
            label="Kelas"
            defaultValue={kelasId}
            options={kelasOptions}
          />
        </div>
        <div className="pb-0.5">
          <Button type="submit" variant="primary" size="sm">
            Tarik Data
          </Button>
        </div>
      </form>

      {/* Tabel Data */}
      <div className="w-full overflow-x-auto border border-line">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-line-strong bg-canvas">
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-right w-12 sticky left-0 bg-canvas z-10">No</th>
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-left sticky left-12 bg-canvas z-10">
                Nama
              </th>
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-left">Kelas / Jabatan</th>
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-left">Kode UID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-text-3 font-[360]"
                >
                  {tahunAjaranId || kelasId
                    ? "Belum ada data untuk filter yang dipilih."
                    : "Belum ada data siswa atau guru."}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={`${row.id}-${row.kelasId}`}
                  className="border-b border-line h-10 hover:bg-panel"
                >
                  <td className="px-3 py-2 text-right text-text-3 num tabular-nums sticky left-0 bg-canvas z-10">
                    {(page - 1) * 50 + idx + 1}
                  </td>
                  <td className="px-3 py-2 text-text sticky left-12 bg-canvas z-10 font-[360]">
                    {row.nama}
                  </td>
                  <td className="px-3 py-2 text-text-2 font-[360]">
                    {row.kelasNama ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] text-text-2">
                    {row.uid}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginasi */}
      {total > 50 && (
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

      {/* Dialog Tambah Anggota */}
      <InputAnggotaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tahunAjaranList={tahunAjaranList.map((ta) => ({ value: ta.id, label: ta.nama }))}
        kelasList={kelasList.map((k) => ({ value: k.id, label: k.nama }))}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
