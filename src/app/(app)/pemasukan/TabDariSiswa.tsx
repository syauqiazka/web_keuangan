"use client";

import { useState, useActionState } from "react";
import { hitungStatusLunas } from "@/lib/status-lunas";
import { formatRupiah } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import {
  tambahPembayaranSiswaAction,
  hapusPembayaranSiswaAction,
  tambahJenisPemasukanAction,
  type ActionState,
} from "@/server/actions/pemasukan";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { JenisPemasukanOption, SiswaSel } from "@/server/queries/pemasukan";

interface TabDariSiswaProps {
  jenisOptions: JenisPemasukanOption[];
  siswaRows: SiswaSel[];
  tahunAjaranId: string;
  onRefresh: () => void;
}

// Format ISO date -> DD-MM-YYYY (UTC)
function formatTanggal(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

// Format ISO date -> bulan (e.g., "Jan 2026")
function formatBulan(iso: string): string {
  const d = new Date(iso);
  const bulanNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  return `${bulanNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const METODE_OPTIONS = [
  { value: "SETOR_TUNAI", label: "ST" },
  { value: "TRANSFER", label: "TF" },
];

// ─── Dialog Tambah Jenis Pemasukan ───────────────────────────────

function DialogTambahJenis({
  tahunAjaranId,
  open,
  onClose,
  onSuccess,
}: {
  tahunAjaranId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await tambahJenisPemasukanAction(_prev, fd);
      if (result.success) { onSuccess(); onClose(); }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} title="Tambah Jenis Pemasukan" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="tahunAjaranId" value={tahunAjaranId} />
        <Input
          id="jenis-nama"
          name="nama"
          label="Nama Jenis"
          placeholder="Contoh: SPP, Daftar Ulang, Uang Gedung"
          required
        />
        <div>
          <label className="block text-[14px] font-[500] text-text mb-1">
            Tipe
          </label>
          <div className="flex gap-4">
            {[
              { value: "false", label: "Satu kali (Daftar Ulang, dll.)" },
              { value: "true", label: "Bulanan (SPP)" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-[14px] text-text cursor-pointer">
                <input
                  type="radio"
                  name="bulanan"
                  value={opt.value}
                  defaultChecked={opt.value === "false"}
                  className="accent-accent"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <Input
          id="jenis-nominal"
          name="nominalStandar"
          label="Nominal Standar (opsional)"
          placeholder="Contoh: 150.000"
          helperText="Kosongkan jika tidak ada patokan lunas."
        />
        {state?.error && (
          <p className="text-[14px] text-danger">{state.error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Dialog Tambah Pembayaran ─────────────────────────────────────

function DialogTambahPembayaran({
  open,
  onClose,
  onSuccess,
  penempatanId,
  namasSiswa,
  jenis: jenisList,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  penempatanId: string;
  namasSiswa: string;
  jenis: JenisPemasukanOption[];
}) {
  const [selectedJenisId, setSelectedJenisId] = useState(jenisList[0]?.id ?? "");
  const selectedJenis = jenisList.find((j) => j.id === selectedJenisId);

  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await tambahPembayaranSiswaAction(_prev, fd);
      if (result.success) { onSuccess(); onClose(); }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} title={`Tambah Pembayaran — ${namasSiswa}`} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="penempatanId" value={penempatanId} />
        <Select
          name="jenisPemasukanId"
          label="Jenis Pemasukan"
          value={selectedJenisId}
          onChange={(e) => setSelectedJenisId(e.target.value)}
          options={jenisList.map((j) => ({ value: j.id, label: j.nama }))}
        />
        <Input
          id="bayar-tanggal"
          name="tanggal"
          label="Tanggal Transaksi"
          placeholder="DD-MM-YYYY"
          required
        />
        {selectedJenis?.bulanan && (
          <Input
            id="bayar-bulan"
            name="bulanTerbayar"
            label="Bulan Terbayar"
            placeholder="YYYY-MM (contoh: 2026-01)"
            required
          />
        )}
        <Select
          name="metode"
          label="Metode"
          options={METODE_OPTIONS}
        />
        <Input
          id="bayar-nominal"
          name="nominal"
          label="Nominal (Rp)"
          placeholder={
            selectedJenis?.nominalStandar
              ? formatRupiah(selectedJenis.nominalStandar)
              : "Contoh: 150.000"
          }
          required
        />
        <Input
          id="bayar-catatan"
          name="catatan"
          label="Catatan (opsional)"
          placeholder=""
        />
        {state?.error && (
          <p className="text-[14px] text-danger">{state.error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Hapus Pembayaran ─────────────────────────────────────────────

function TombolHapusPembayaran({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await hapusPembayaranSiswaAction(_prev, fd);
      if (result.success) onSuccess();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={isPending}
        className="text-[11px] text-text-3 hover:text-danger disabled:opacity-40"
        title="Hapus pembayaran"
      >
        ×
      </button>
      {state?.error && (
        <span className="text-[11px] text-danger ml-1">{state.error}</span>
      )}
    </form>
  );
}

// ─── Tab Utama ────────────────────────────────────────────────────

export function TabDariSiswa({
  jenisOptions,
  siswaRows,
  tahunAjaranId,
  onRefresh,
}: TabDariSiswaProps) {
  const [dialogJenisOpen, setDialogJenisOpen] = useState(false);
  const [dialogBayarState, setDialogBayarState] = useState<{
    open: boolean;
    penempatanId: string;
    namaSiswa: string;
  }>({ open: false, penempatanId: "", namaSiswa: "" });

  if (!tahunAjaranId) {
    return (
      <p className="text-[14px] text-text-3 py-6">
        Pilih Tahun Ajaran untuk melihat data pembayaran siswa.
      </p>
    );
  }

  if (jenisOptions.length === 0) {
    return (
      <div className="space-y-4 py-4">
        <p className="text-[14px] text-text-3">
          Belum ada jenis pemasukan untuk tahun ajaran ini.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setDialogJenisOpen(true)}>
          + Tambah Kolom
        </Button>
        {dialogJenisOpen && (
          <DialogTambahJenis
            tahunAjaranId={tahunAjaranId}
            open={dialogJenisOpen}
            onClose={() => setDialogJenisOpen(false)}
            onSuccess={onRefresh}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tombol aksi */}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setDialogJenisOpen(true)}>
          + Tambah Kolom
        </Button>
      </div>

      {/* Tabel lebar */}
      <div className="w-full overflow-x-auto border border-line">
        <table className="border-collapse text-[13px]" style={{ minWidth: "600px" }}>
          <thead>
            <tr className="border-b border-line-strong bg-canvas">
              <th className="px-3 py-2.5 text-right font-semibold text-text sticky left-0 bg-canvas z-10" style={{ minWidth: "48px" }}>No</th>
              <th className="px-3 py-2.5 text-left font-semibold text-text sticky left-12 bg-canvas z-10" style={{ minWidth: "160px" }}>Nama Siswa</th>
              <th className="px-3 py-2.5 text-left font-semibold text-text sticky left-[208px] bg-canvas z-10 border-r border-line-strong" style={{ minWidth: "100px" }}>Kode UID</th>
              {jenisOptions.map((jenis) => (
                <th
                  key={jenis.id}
                  colSpan={jenis.bulanan ? 3 : 2}
                  className="px-3 py-2 text-center font-semibold text-text border-l border-line-strong"
                >
                  <div>{jenis.nama}</div>
                  {jenis.nominalStandar !== null && (
                    <div className="text-[11px] font-[400] text-text-3 font-mono">
                      {formatRupiah(jenis.nominalStandar)}
                    </div>
                  )}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-semibold text-text border-l border-line-strong" style={{ minWidth: "80px" }}>
                Aksi
              </th>
            </tr>
            {/* Sub-header */}
            <tr className="border-b border-line bg-canvas">
              <th className="sticky left-0 bg-canvas z-10"></th>
              <th className="sticky left-12 bg-canvas z-10"></th>
              <th className="sticky left-[208px] bg-canvas z-10 border-r border-line-strong"></th>
              {jenisOptions.map((jenis) => (
                jenis.bulanan ? (
                  <>
                    <th key={`${jenis.id}-tanggal`} className="px-2 py-1.5 text-[12px] font-[500] text-text-3 text-left border-l border-line-strong">Tanggal</th>
                    <th key={`${jenis.id}-bulan`} className="px-2 py-1.5 text-[12px] font-[500] text-text-3 text-left">Bulan</th>
                    <th key={`${jenis.id}-nominal`} className="px-2 py-1.5 text-[12px] font-[500] text-text-3 text-right">Nominal</th>
                  </>
                ) : (
                  <>
                    <th key={`${jenis.id}-tanggal`} className="px-2 py-1.5 text-[12px] font-[500] text-text-3 text-left border-l border-line-strong">Tanggal</th>
                    <th key={`${jenis.id}-nominal`} className="px-2 py-1.5 text-[12px] font-[500] text-text-3 text-right">Nominal</th>
                  </>
                )
              ))}
              <th className="border-l border-line-strong"></th>
            </tr>
          </thead>
          <tbody>
            {siswaRows.length === 0 && (
              <tr>
                <td colSpan={3 + jenisOptions.reduce((acc, j) => acc + (j.bulanan ? 3 : 2), 0) + 1}
                  className="px-4 py-8 text-center text-text-3">
                  Belum ada siswa pada kelas/tahun ajaran ini.
                </td>
              </tr>
            )}
            {siswaRows.map((siswa, idx) => (
              <tr key={siswa.penempatanId} className="border-b border-line hover:bg-panel">
                <td className="px-3 py-2 text-right text-text-3 num sticky left-0 bg-canvas z-10">{idx + 1}</td>
                <td className="px-3 py-2 text-text sticky left-12 bg-canvas z-10">{siswa.nama}</td>
                <td className="px-3 py-2 font-mono text-[12px] text-text-2 sticky left-[208px] bg-canvas z-10 border-r border-line-strong">
                  {siswa.uid}
                </td>
                {jenisOptions.map((jenis) => {
                  const pembayaran = siswa.pembayaran[jenis.id] ?? [];
                  const status = hitungStatusLunas(
                    pembayaran.map((p) => p.nominal),
                    jenis.nominalStandar
                  );
                  const isKurang = !status.lunas;

                  // Ambil pembayaran terakhir untuk tampilan utama
                  const last = pembayaran[pembayaran.length - 1];

                  return jenis.bulanan ? (
                    <>
                      <td key={`${jenis.id}-tanggal`} className="px-2 py-2 text-text-2 num border-l border-line-strong">
                        {last ? formatTanggal(last.tanggal) : "—"}
                      </td>
                      <td key={`${jenis.id}-bulan`} className="px-2 py-2 text-text-2">
                        {last?.bulanTerbayar ? formatBulan(last.bulanTerbayar) : "—"}
                      </td>
                      <td key={`${jenis.id}-nominal`} className={`px-2 py-2 text-right num ${isKurang ? "text-danger font-[600]" : "text-text"}`}>
                        <div className="flex items-center justify-end gap-1">
                          <span>{pembayaran.length > 0 ? formatRupiah(status.totalTerbayar) : "—"}</span>
                          {last && <TombolHapusPembayaran id={last.id} onSuccess={onRefresh} />}
                        </div>
                        {isKurang && status.teksKekurangan && (
                          <div className="text-[11px] font-[400] text-danger">{status.teksKekurangan}</div>
                        )}
                        {status.isCicilan && pembayaran.length > 1 && (
                          <div className="text-[10px] text-text-3">{pembayaran.length}× cicilan</div>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td key={`${jenis.id}-tanggal`} className="px-2 py-2 text-text-2 num border-l border-line-strong">
                        {last ? formatTanggal(last.tanggal) : "—"}
                      </td>
                      <td key={`${jenis.id}-nominal`} className={`px-2 py-2 text-right num ${isKurang ? "text-danger font-[600]" : "text-text"}`}>
                        <div className="flex items-center justify-end gap-1">
                          <span>{pembayaran.length > 0 ? formatRupiah(status.totalTerbayar) : "—"}</span>
                          {last && <TombolHapusPembayaran id={last.id} onSuccess={onRefresh} />}
                        </div>
                        {isKurang && status.teksKekurangan && (
                          <div className="text-[11px] font-[400] text-danger">{status.teksKekurangan}</div>
                        )}
                      </td>
                    </>
                  );
                })}
                <td className="px-2 py-2 text-center border-l border-line-strong">
                  <button
                    type="button"
                    onClick={() =>
                      setDialogBayarState({
                        open: true,
                        penempatanId: siswa.penempatanId,
                        namaSiswa: siswa.nama,
                      })
                    }
                    className="text-[12px] text-accent hover:underline"
                    title="Tambah pembayaran"
                  >
                    + Bayar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda status */}
      <div className="flex gap-4 text-[12px] text-text-3">
        <span>
          <span className="text-danger font-[600]">Merah</span> = nominal kurang dari standar
        </span>
      </div>

      {/* Dialog tambah jenis */}
      {dialogJenisOpen && (
        <DialogTambahJenis
          tahunAjaranId={tahunAjaranId}
          open={dialogJenisOpen}
          onClose={() => setDialogJenisOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      {/* Dialog tambah pembayaran */}
      {dialogBayarState.open && (
        <DialogTambahPembayaran
          open={dialogBayarState.open}
          onClose={() => setDialogBayarState((s) => ({ ...s, open: false }))}
          onSuccess={onRefresh}
          penempatanId={dialogBayarState.penempatanId}
          namasSiswa={dialogBayarState.namaSiswa}
          jenis={jenisOptions}
        />
      )}
    </div>
  );
}
