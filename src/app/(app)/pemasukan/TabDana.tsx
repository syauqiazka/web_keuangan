"use client";

import { useState, useTransition, useActionState } from "react";
import { Pencil, Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/money";
import {
  tambahPemasukanDanaAction,
  ubahPemasukanDanaAction,
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

// ─── Helper: format tanggal ISO → DD-MM-YYYY ──────────────────────
function fmtTgl(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
}

// ─── Helper: tanggal hari ini DD-MM-YYYY ──────────────────────────
function todayDDMMYYYY(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
}

// ─── Dialog Catat / Ubah PemasukanDana ───────────────────────────
interface DialogDanaProps {
  open: boolean;
  mode: "tambah" | "ubah";
  onClose: () => void;
  onSuccess: () => void;
  kategori: "BANTUAN" | "DONATUR";
  labelKolom: string;
  sumberList: SumberDanaOption[];
  initialRow?: PemasukanDanaRow | null;
}

function DialogDana({
  open,
  mode,
  onClose,
  onSuccess,
  kategori,
  labelKolom,
  sumberList,
  initialRow,
}: DialogDanaProps) {
  const { showToast } = useToast();

  const defaultSumber = initialRow?.sumberDanaId ?? sumberList[0]?.id ?? "";
  const defaultTanggal = initialRow ? fmtTgl(initialRow.tanggal) : todayDDMMYYYY();
  const defaultNominal = initialRow ? String(initialRow.nominal) : "";
  const defaultCatatan = initialRow?.catatan ?? "";

  const action = mode === "ubah" ? ubahPemasukanDanaAction : tambahPemasukanDanaAction;

  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await action(_prev, fd);
      if (result.success) {
        showToast(
          mode === "ubah" ? "Perubahan berhasil disimpan." : `${labelKolom} berhasil dicatat.`,
          "success"
        );
        onSuccess();
        onClose();
      } else if (result.error) {
        showToast(result.error, "error");
      }
      return result;
    },
    null
  );

  const judul =
    mode === "ubah"
      ? `Ubah ${labelKolom}`
      : `Catat ${labelKolom} Baru`;

  return (
    <Dialog open={open} onClose={onClose} title={judul} key={initialRow?.id ?? "baru"}>
      <form action={formAction} className="space-y-4">
        {mode === "ubah" && initialRow && (
          <input type="hidden" name="id" value={initialRow.id} />
        )}
        {mode === "tambah" && (
          <input type="hidden" name="kategori" value={kategori} />
        )}

        <Select
          id="dana-sumber"
          label={labelKolom}
          name="sumberDanaId"
          defaultValue={defaultSumber}
          required
        >
          {sumberList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </Select>

        <Input
          id="dana-tanggal"
          label="Tanggal Penerimaan"
          name="tanggal"
          defaultValue={defaultTanggal}
          placeholder="DD-MM-YYYY"
          required
          autoComplete="off"
        />

        <Input
          id="dana-nominal"
          label="Nominal (Rp)"
          name="nominal"
          type="text"
          inputMode="numeric"
          defaultValue={defaultNominal}
          placeholder="Contoh: 5.000.000"
          required
          autoComplete="off"
        />

        <Input
          id="dana-catatan"
          label="Catatan (opsional)"
          name="catatan"
          defaultValue={defaultCatatan}
          placeholder="Keterangan tambahan"
          autoComplete="off"
        />

        {state?.error && (
          <p className="text-[13px] text-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isPending}>
            {isPending
              ? "Menyimpan…"
              : mode === "ubah"
              ? "Simpan Perubahan"
              : "Catat"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Dialog Konfirmasi Hapus ──────────────────────────────────────
interface DialogHapusProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  row: PemasukanDanaRow | null;
  labelKolom: string;
}

function DialogHapus({ open, onClose, onSuccess, row, labelKolom }: DialogHapusProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleHapus = () => {
    if (!row) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", row.id);
      const res = await hapusPemasukanDanaAction(null, fd);
      if (res.success) {
        showToast(`${labelKolom} berhasil dihapus.`, "success");
        onSuccess();
        onClose();
      } else {
        showToast(res.error ?? "Gagal menghapus data.", "error");
      }
    });
  };

  if (!row) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Hapus ${labelKolom}`}
      actions={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            variant="danger-solid"
            size="sm"
            disabled={isPending}
            onClick={handleHapus}
          >
            <Trash2 className="w-4 h-4" />
            {isPending ? "Menghapus…" : "Hapus Permanen"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-[14px] text-text-2">
          Yakin ingin menghapus entri berikut?
        </p>
        <div className="rounded-[8px] bg-expense-soft border border-expense-border px-4 py-3 text-[13px] space-y-1">
          <div>
            <span className="text-text-3">{labelKolom}: </span>
            <span className="font-medium text-text">{row.sumberNama}</span>
          </div>
          <div>
            <span className="text-text-3">Tanggal: </span>
            <span className="font-medium text-text">{fmtTgl(row.tanggal)}</span>
          </div>
          <div>
            <span className="text-text-3">Nominal: </span>
            <span className="font-semibold text-income-text">{formatRupiah(row.nominal)}</span>
          </div>
        </div>
        <p className="text-[12px] text-danger font-medium">
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>
    </Dialog>
  );
}

// ─── Dialog Tambah Sumber Dana Baru ──────────────────────────────
interface DialogTambahSumberProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newSumber: SumberDanaOption) => void;
  kategori: "BANTUAN" | "DONATUR";
  labelKolom: string;
}

function DialogTambahSumber({
  open,
  onClose,
  onSuccess,
  kategori,
  labelKolom,
}: DialogTambahSumberProps) {
  const { showToast } = useToast();
  const [nama, setNama] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    setIsPending(true);
    const res = await tambahSumberDanaAction({ nama: nama.trim(), kategori });
    setIsPending(false);
    if (res.error) {
      showToast(res.error, "error");
    } else if (res.sumberDanaId) {
      const newSumber: SumberDanaOption = { id: res.sumberDanaId, nama: nama.trim(), kategori };
      showToast(`${labelKolom} "${nama.trim()}" berhasil ditambahkan.`, "success");
      onSuccess(newSumber);
      setNama("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Tambah ${labelKolom} Baru`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="sumber-nama"
          label={`Nama ${labelKolom}`}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder={kategori === "BANTUAN" ? "Contoh: BOSP, BPMU, PIP" : "Contoh: Haji Isam, OTA"}
          required
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending || !nama.trim()}
          >
            {isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Komponen Utama TabDana ───────────────────────────────────────

export function TabDana({
  kategori,
  rows,
  sumberList: initialSumber,
  onRefresh,
}: TabDanaProps) {
  const labelKolom = kategori === "BANTUAN" ? "Jenis Bantuan" : "Nama Donatur";

  const [sumberList, setSumberList] = useState(initialSumber);

  // Dialog state
  const [dialogCatat, setDialogCatat] = useState(false);
  const [dialogUbah, setDialogUbah] = useState<{ open: boolean; row: PemasukanDanaRow | null }>({
    open: false,
    row: null,
  });
  const [dialogHapus, setDialogHapus] = useState<{ open: boolean; row: PemasukanDanaRow | null }>({
    open: false,
    row: null,
  });
  const [dialogTambahSumber, setDialogTambahSumber] = useState(false);

  const totalNominal = rows.reduce((acc, r) => acc + r.nominal, 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-line flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setDialogCatat(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Catat {labelKolom}</span>
          </Button>
          <Button
            type="button"
            variant="outline-brand"
            size="sm"
            onClick={() => setDialogTambahSumber(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah {labelKolom} Baru</span>
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="text-[13px] text-text-2">
            Total: <span className="font-semibold text-income-text">{formatRupiah(totalNominal)}</span>
          </div>
        )}
      </div>

      {/* Tabel Data */}
      <div className="w-full overflow-x-auto bg-surface rounded-[12px] shadow-xs border border-line">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-income-border bg-income-soft text-income-text">
              <th className="px-3 py-2.5 text-right font-semibold text-[12px] w-10">No</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[12px]">{labelKolom}</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[12px]">Tanggal</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[12px]">Nominal</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[12px]">Petugas</th>
              <th className="px-3 py-2.5 text-center font-semibold text-[12px] w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-3 text-[13px]">
                  Belum ada data {labelKolom.toLowerCase()} untuk periode ini.{" "}
                  <button
                    type="button"
                    onClick={() => setDialogCatat(true)}
                    className="text-income font-medium underline underline-offset-2 hover:no-underline cursor-pointer"
                  >
                    Catat sekarang
                  </button>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="border-b border-line last:border-b-0 hover:bg-canvas/40 transition-colors group"
                >
                  <td className="px-3 py-2.5 text-right text-text-3 num tabular-nums text-[13px]">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5 text-text font-[360]">
                    {row.sumberNama}
                    {row.catatan && (
                      <span
                        className="ml-1.5 inline-flex items-center text-text-3 cursor-help"
                        title={row.catatan}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-text-2 num whitespace-nowrap text-[13px]">
                    {fmtTgl(row.tanggal)}
                  </td>
                  <td className="px-3 py-2.5 text-right num whitespace-nowrap">
                    <span className="font-semibold text-income-text">{formatRupiah(row.nominal)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-text-2 text-[13px]">
                    {row.petugasNama || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      {/* Tombol Ubah (emas) */}
                      <button
                        type="button"
                        onClick={() => setDialogUbah({ open: true, row })}
                        className="w-9 h-9 p-2 rounded-[6px] text-gold-text hover:bg-gold-soft transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer"
                        title={`Ubah ${labelKolom} ${row.sumberNama}`}
                        aria-label={`Ubah ${labelKolom} ${row.sumberNama} tanggal ${fmtTgl(row.tanggal)}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {/* Tombol Hapus (merah) */}
                      <button
                        type="button"
                        onClick={() => setDialogHapus({ open: true, row })}
                        className="w-9 h-9 p-2 rounded-[6px] text-danger hover:bg-danger/10 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-danger/30 cursor-pointer"
                        title={`Hapus ${labelKolom} ${row.sumberNama}`}
                        aria-label={`Hapus ${labelKolom} ${row.sumberNama} tanggal ${fmtTgl(row.tanggal)}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Baris total */}
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-income-border bg-income-soft text-income-text font-semibold h-10">
                <td colSpan={3} className="px-3 py-2 text-left text-[13px]">
                  Total {rows.length} entri
                </td>
                <td className="px-3 py-2 text-right num whitespace-nowrap">
                  {formatRupiah(totalNominal)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Dialog Catat Baru */}
      <DialogDana
        open={dialogCatat}
        mode="tambah"
        onClose={() => setDialogCatat(false)}
        onSuccess={onRefresh}
        kategori={kategori}
        labelKolom={labelKolom}
        sumberList={sumberList}
      />

      {/* Dialog Ubah */}
      <DialogDana
        open={dialogUbah.open}
        mode="ubah"
        onClose={() => setDialogUbah({ open: false, row: null })}
        onSuccess={onRefresh}
        kategori={kategori}
        labelKolom={labelKolom}
        sumberList={sumberList}
        initialRow={dialogUbah.row}
      />

      {/* Dialog Hapus */}
      <DialogHapus
        open={dialogHapus.open}
        onClose={() => setDialogHapus({ open: false, row: null })}
        onSuccess={onRefresh}
        row={dialogHapus.row}
        labelKolom={labelKolom}
      />

      {/* Dialog Tambah Sumber Baru */}
      <DialogTambahSumber
        open={dialogTambahSumber}
        onClose={() => setDialogTambahSumber(false)}
        onSuccess={(s) => setSumberList((prev) => [...prev, s])}
        kategori={kategori}
        labelKolom={labelKolom}
      />
    </div>
  );
}
