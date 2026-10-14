"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import {
  tambahPemasukanDanaAction,
  hapusPemasukanDanaAction,
  tambahSumberDanaAction,
  type ActionState,
} from "@/server/actions/pemasukan";
import type { PemasukanDanaRow, SumberDanaOption } from "@/server/queries/pemasukan";

interface TabDanaProps {
  kategori: "BANTUAN" | "DONATUR";
  rows: PemasukanDanaRow[];
  sumberList: SumberDanaOption[];
  onRefresh: () => void;
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function RowItem({
  row,
  nomor,
  onDelete,
}: {
  row: PemasukanDanaRow;
  nomor: number;
  onDelete: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await hapusPemasukanDanaAction(_prev, fd);
      if (result.success) onDelete();
      return result;
    },
    null
  );

  return (
    <tr className="border-b border-line h-10 hover:bg-panel group">
      <td className="px-3 py-2 text-right text-text-3 num">{nomor}</td>
      <td className="px-3 py-2 text-text">{row.sumberNama}</td>
      <td className="px-3 py-2 text-text-2 num">{formatTanggal(row.tanggal)}</td>
      <td className="px-3 py-2 text-right text-text num">{row.nominalFormatted}</td>
      <td className="px-3 py-2 text-text-2">{row.petugasNama}</td>
      <td className="px-3 py-2 text-text-3">{row.catatan ?? "—"}</td>
      <td className="px-3 py-2">
        <form action={formAction}>
          <input type="hidden" name="id" value={row.id} />
          <button
            type="submit"
            disabled={isPending}
            className="text-[12px] text-text-3 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
            title="Hapus"
          >
            Hapus
          </button>
        </form>
        {state?.error && (
          <span className="text-[11px] text-danger">{state.error}</span>
        )}
      </td>
    </tr>
  );
}

// ─── Dialog Tambah Baris Dana ─────────────────────────────────────

function DialogTambahDana({
  kategori,
  sumberList: initialSumber,
  open,
  onClose,
  onSuccess,
}: {
  kategori: "BANTUAN" | "DONATUR";
  sumberList: SumberDanaOption[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [sumberList, setSumberList] = useState(initialSumber);
  const [selectedSumber, setSelectedSumber] = useState(initialSumber[0]?.id ?? "");
  const [showTambahSumber, setShowTambahSumber] = useState(false);
  const [namaSumberBaru, setNamaSumberBaru] = useState("");
  const [errorSumber, setErrorSumber] = useState("");

  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await tambahPemasukanDanaAction(_prev, fd);
      if (result.success) { onSuccess(); onClose(); }
      return result;
    },
    null
  );

  const handleTambahSumber = async () => {
    setErrorSumber("");
    const result = await tambahSumberDanaAction({ nama: namaSumberBaru, kategori });
    if (result.error) { setErrorSumber(result.error); return; }
    if (result.sumberDanaId) {
      const newOpt: SumberDanaOption = { id: result.sumberDanaId, nama: namaSumberBaru.trim(), kategori };
      setSumberList((prev) => [...prev, newOpt]);
      setSelectedSumber(result.sumberDanaId);
      setShowTambahSumber(false);
      setNamaSumberBaru("");
    }
  };

  const labelSumber = kategori === "BANTUAN" ? "Jenis Bantuan" : "Nama Donatur";
  const title = kategori === "BANTUAN" ? "Tambah Bantuan" : "Tambah Donatur";

  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <div>
          <Select
            name="sumberDanaId"
            label={labelSumber}
            value={selectedSumber}
            onChange={(e) => setSelectedSumber(e.target.value)}
            options={sumberList.map((s) => ({ value: s.id, label: s.nama }))}
          />
          <button
            type="button"
            onClick={() => setShowTambahSumber((v) => !v)}
            className="mt-1 text-[12px] text-accent hover:underline"
          >
            {showTambahSumber ? "Batal" : `+ Tambah ${labelSumber} baru`}
          </button>
          {showTambahSumber && (
            <div className="mt-2 flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  id="sumber-baru"
                  label={`Nama ${labelSumber} baru`}
                  value={namaSumberBaru}
                  onChange={(e) => setNamaSumberBaru(e.target.value)}
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleTambahSumber}>
                Tambah
              </Button>
            </div>
          )}
          {errorSumber && <p className="text-[13px] text-danger mt-1">{errorSumber}</p>}
        </div>
        <Input
          id="dana-tanggal"
          name="tanggal"
          label="Tanggal"
          placeholder="DD-MM-YYYY"
          required
        />
        <Input
          id="dana-nominal"
          name="nominal"
          label="Nominal (Rp)"
          placeholder="Contoh: 5.000.000"
          required
        />
        <Input
          id="dana-catatan"
          name="catatan"
          label="Catatan (opsional)"
        />
        {state?.error && (
          <p className="text-[14px] text-danger">{state.error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isPending || sumberList.length === 0}>
            {isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── TabDana Utama ─────────────────────────────────────────────────

export function TabDana({
  kategori,
  rows,
  sumberList,
  onRefresh,
}: TabDanaProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const labelKolom = kategori === "BANTUAN" ? "Jenis Bantuan" : "Nama Donatur";
  const labelEmpty = kategori === "BANTUAN"
    ? "Belum ada data bantuan."
    : "Belum ada data donatur.";

  return (
    <div className="space-y-4">
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>
          + Tambah Baris
        </Button>
      </div>

      <div className="w-full overflow-x-auto border border-line">
        <table className="w-full border-collapse text-[14px]">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-[130px]" />
            <col className="w-[160px]" />
            <col className="w-[140px]" />
            <col className="w-[180px]" />
            <col className="w-[80px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line-strong bg-canvas">
              <th className="px-3 py-2.5 font-semibold text-text text-right">No</th>
              <th className="px-3 py-2.5 font-semibold text-text text-left">{labelKolom}</th>
              <th className="px-3 py-2.5 font-semibold text-text text-left">Tanggal</th>
              <th className="px-3 py-2.5 font-semibold text-text text-right">Nominal</th>
              <th className="px-3 py-2.5 font-semibold text-text text-left">Petugas</th>
              <th className="px-3 py-2.5 font-semibold text-text text-left">Catatan</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-3">
                  {labelEmpty}
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <RowItem
                key={row.id}
                row={row}
                nomor={idx + 1}
                onDelete={onRefresh}
              />
            ))}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <DialogTambahDana
          kategori={kategori}
          sumberList={sumberList}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
