"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { DataGrid, type ColumnDef } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, parseRupiah } from "@/lib/money";
import {
  simpanBatchPemasukanDanaAction,
  tambahSumberDanaAction,
  type BatchPemasukanDanaInput,
} from "@/server/actions/pemasukan";
import type { PemasukanDanaRow, SumberDanaOption } from "@/server/queries/pemasukan";

interface TabDanaProps {
  kategori: "BANTUAN" | "DONATUR";
  rows: PemasukanDanaRow[];
  sumberList: SumberDanaOption[];
  onRefresh: () => void;
}

interface EditableDanaRow {
  id: string;
  sumberDanaId: string;
  sumberNama: string;
  tanggal: string; // DD-MM-YYYY
  nominal: number | string;
  petugasNama: string;
  catatan?: string;
}

export function TabDana({
  kategori,
  rows,
  sumberList: initialSumber,
  onRefresh,
}: TabDanaProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const [sumberList, setSumberList] = useState(initialSumber);
  const [showTambahSumber, setShowTambahSumber] = useState(false);
  const [namaSumberBaru, setNamaSumberBaru] = useState("");
  const [isAddingSumber, setIsAddingSumber] = useState(false);

  const labelKolom = kategori === "BANTUAN" ? "Jenis Bantuan" : "Nama Donatur";

  // Tanggal hari ini DD-MM-YYYY
  const today = new Date();
  const defaultTodayStr = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${today.getFullYear()}`;

  const gridRows: EditableDanaRow[] = rows.map((r) => {
    const d = new Date(r.tanggal);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return {
      id: r.id,
      sumberDanaId: r.sumberDanaId,
      sumberNama: r.sumberNama,
      tanggal: `${dd}-${mm}-${yyyy}`,
      nominal: r.nominal,
      petugasNama: r.petugasNama,
      catatan: r.catatan ?? "",
    };
  });

  const handleSaveAll = async (updatedRows: EditableDanaRow[]) => {
    startSaving(async () => {
      const items: BatchPemasukanDanaInput[] = updatedRows.map((r) => {
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
          sumberDanaId: r.sumberDanaId,
          tanggal: r.tanggal,
          nominal: nom,
          catatan: r.catatan || undefined,
          kategori,
        };
      });

      const res = await simpanBatchPemasukanDanaAction(items);
      if (!res.success) {
        showToast(res.error ?? "Gagal menyimpan data.", "error");
      } else {
        showToast("Semua data berhasil disimpan.", "success");
        setIsEditing(false);
        onRefresh();
      }
    });
  };

  const handleTambahSumberBaru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSumberBaru.trim()) return;

    setIsAddingSumber(true);
    const res = await tambahSumberDanaAction({
      nama: namaSumberBaru.trim(),
      kategori,
    });
    setIsAddingSumber(false);

    if (res.error) {
      showToast(res.error, "error");
    } else if (res.sumberDanaId) {
      const newOption = {
        id: res.sumberDanaId,
        nama: namaSumberBaru.trim(),
        kategori,
      };
      setSumberList((prev) => [...prev, newOption]);
      setShowTambahSumber(false);
      setNamaSumberBaru("");
      showToast(`${labelKolom} "${newOption.nama}" berhasil ditambahkan.`, "success");
    }
  };

  const columns: ColumnDef<EditableDanaRow>[] = [
    {
      id: "no",
      header: "No",
      width: "48px",
      align: "right",
      sticky: true,
      render: (_row, idx) => (
        <span className="text-text-3 num tabular-nums">{idx + 1}</span>
      ),
    },
    {
      id: "sumberDanaId",
      header: labelKolom,
      width: "240px",
      editable: true,
      validate: (val) => (!val ? { valid: false, error: "Wajib dipilih" } : { valid: true }),
      render: (row) => (
        <span className="font-[360]">
          {sumberList.find((s) => s.id === row.sumberDanaId)?.nama ?? row.sumberNama}
        </span>
      ),
      renderEdit: (_row, _idx, value, onChange, inputProps) => (
        <select
          data-grid-cell={inputProps["data-grid-cell"]}
          value={typeof value === "string" && value ? value : (sumberList[0]?.id ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={inputProps.onKeyDown}
          className="w-full bg-canvas text-[14px] px-2 py-1 border border-line-strong rounded-none outline-none focus:outline-2 focus:outline-accent -outline-offset-1 text-text"
        >
          {sumberList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
      ),
    },
    {
      id: "tanggal",
      header: "Tanggal",
      width: "130px",
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
          {typeof row.nominal === "number" ? formatRupiah(row.nominal) : row.nominal}
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

  const totalNominal = rows.reduce((acc, curr) => acc + curr.nominal, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? "Batal" : "Input"}
          </Button>

          {isEditing && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowTambahSumber(true)}
            >
              + {labelKolom} Baru
            </Button>
          )}
        </div>
      </div>

      <DataGrid<EditableDanaRow>
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
          nominal: totalNominal,
        }}
        createNewRow={() => ({
          id: "",
          sumberDanaId: sumberList[0]?.id ?? "",
          sumberNama: sumberList[0]?.nama ?? "",
          tanggal: defaultTodayStr,
          nominal: "",
          petugasNama: "Anda (saat simpan)",
          catatan: "",
        })}
        emptyMessage={`Belum ada data ${labelKolom.toLowerCase()}.`}
      />

      {/* Dialog Tambah Sumber Baru */}
      <Dialog
        open={showTambahSumber}
        title={`Tambah ${labelKolom} Baru`}
        onClose={() => setShowTambahSumber(false)}
      >
        <form onSubmit={handleTambahSumberBaru} className="space-y-4">
          <Input
            id="sumber-nama"
            label={`Nama ${labelKolom}`}
            value={namaSumberBaru}
            onChange={(e) => setNamaSumberBaru(e.target.value)}
            placeholder={kategori === "BANTUAN" ? "Contoh: BOSP, BPMU, PIP" : "Contoh: Haji Isam, OTA"}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowTambahSumber(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isAddingSumber || !namaSumberBaru.trim()}
            >
              {isAddingSumber ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
