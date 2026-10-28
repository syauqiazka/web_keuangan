"use client";

import * as React from "react";
import { useState, useActionState } from "react";
import {
  Pencil,
  Check,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { hitungStatusLunas } from "@/lib/status-lunas";
import { formatRupiah } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import {
  tambahJenisPemasukanAction,
  tambahPembayaranSiswaAction,
  hapusPembayaranSiswaAction,
  hapusJenisPemasukanAction,
  type ActionState,
} from "@/server/actions/pemasukan";
import type { JenisPemasukanOption, SiswaSel, PembayaranSel } from "@/server/queries/pemasukan";

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

// Format ISO date -> nama bulan (contoh: "Oktober 2026")
function formatBulan(iso: string): string {
  const d = new Date(iso);
  const bulanNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${bulanNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const BULAN_DAFTAR = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

// ─── Dialog Tambah Jenis Pemasukan (Tambah Kolom) ─────────────────

function DialogTambahKolom({
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
      if (result.success) {
        onSuccess();
        onClose();
      }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} title="Tambah Jenis Pembayaran Baru" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="tahunAjaranId" value={tahunAjaranId} />
        <Select
          name="bulanan"
          label="Pola Pembayaran"
          defaultValue="false"
          options={[
            { value: "true", label: "Berulang setiap bulan (contoh: SPP)" },
            { value: "false", label: "Sekali bayar / tidak berulang (contoh: uang gedung)" },
          ]}
        />

        <Input
          id="kolom-nama"
          name="nama"
          label="Nama Jenis Pembayaran"
          placeholder="Contoh: Uang Gedung, Ujian Praktik, Seragam"
          required
          helperText="Pilih apakah kewajiban ini muncul setiap bulan atau hanya sekali pada tahun ajaran."
        />
        <Input
          id="kolom-nominal"
          name="nominalStandar"
          label="Nominal Patokan Standar (Rp, opsional)"
          placeholder="Contoh: 200.000 (kosongkan jika fleksibel)"
          helperText="Nominal kewajiban. Untuk jenis bulanan, ini berlaku per bulan; untuk sekali bayar, berlaku per tahun ajaran."
        />
        {state?.error && <p className="text-[14px] text-danger">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Menambahkan…" : "Tambah Jenis Pembayaran"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Dialog Tambah Pembayaran Siswa ───────────────────────────────

function DialogTambahPembayaran({
  open,
  onClose,
  onSuccess,
  penempatanId,
  namaSiswa,
  jenisList,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  penempatanId: string;
  namaSiswa: string;
  jenisList: JenisPemasukanOption[];
}) {
  const [selectedJenisId, setSelectedJenisId] = useState(jenisList[0]?.id ?? "");
  const selectedJenis = jenisList.find((j) => j.id === selectedJenisId);

  const today = new Date();
  const defaultToday = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${today.getFullYear()}`;

  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await tambahPembayaranSiswaAction(_prev, fd);
      if (result.success) {
        onSuccess();
        onClose();
      }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} title={`Catat Pembayaran — ${namaSiswa}`} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="penempatanId" value={penempatanId} />
        <Select
          name="jenisPemasukanId"
          label="Pilih Jenis Pembayaran"
          value={selectedJenisId}
          onChange={(e) => setSelectedJenisId(e.target.value)}
          options={jenisList.map((j) => ({
            value: j.id,
            label: `${j.nama}${j.nominalStandar ? ` (Standar: ${formatRupiah(j.nominalStandar)})` : ""}`,
          }))}
        />
        <Input
          id="bayar-tanggal"
          name="tanggal"
          label="Tanggal Transaksi (DD-MM-YYYY)"
          defaultValue={defaultToday}
          placeholder="DD-MM-YYYY"
          required
          helperText="Format: tanggal-bulan-tahun"
        />
        {selectedJenis?.bulanan && (
          <Select
            name="bulanTerbayar"
            label="Bulan yang Dibayar (SPP)"
            defaultValue={String(today.getMonth() + 1)}
            options={BULAN_DAFTAR}
          />
        )}
        <Select
          name="metode"
          label="Metode Pembayaran"
          options={[
            { value: "SETOR_TUNAI", label: "Setor Tunai (ST)" },
            { value: "TRANSFER", label: "Transfer Bank (TF)" },
          ]}
        />
        <Input
          id="bayar-nominal"
          name="nominal"
          label="Nominal Pembayaran (Rp)"
          defaultValue={
            selectedJenis?.nominalStandar ? String(selectedJenis.nominalStandar) : ""
          }
          placeholder="Contoh: 150000 atau 150.000"
          required
          helperText="Ketik nominal rupiah yang dibayarkan siswa."
        />
        <Input
          id="bayar-catatan"
          name="catatan"
          label="Catatan Tambahan (opsional)"
          placeholder="Contoh: Titipan orang tua, cicilan ke-1"
        />
        {state?.error && <p className="text-[14px] text-danger">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Menyimpan pembayaran…" : "Simpan Pembayaran"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Tombol Hapus Pembayaran ──────────────────────────────────────

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
    <form
      action={formAction}
      className="inline ml-1"
      onSubmit={(e) => {
        if (!window.confirm("Hapus catatan transaksi pembayaran siswa ini dari database?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1 text-[12px] px-1.5 py-0.5 rounded-[4px] border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-40 font-medium transition-colors cursor-pointer"
        title="Hapus catatan pembayaran ini"
        aria-label="Hapus pembayaran"
      >
        <Trash2 className="w-3 h-3 text-danger" />
        <span>{isPending ? "…" : "Hapus"}</span>
      </button>
      {state?.error && <span className="text-[12px] text-danger">{state.error}</span>}
    </form>
  );
}

// ─── Tombol Hapus Jenis Pembayaran ─────────────────────────────────
function TombolHapusJenisPembayaran({ id, nama, onSuccess }: { id: string; nama: string; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await hapusJenisPemasukanAction(_prev, fd);
      if (result.success) onSuccess();
      return result;
    },
    null
  );
  return (
    <form action={formAction} className="mt-1.5" onSubmit={(e) => {
      if (!window.confirm(`Hapus jenis pembayaran "${nama}"? Jenis ini akan disembunyikan dari tahun ajaran aktif; riwayat transaksinya tetap tersimpan.`)) e.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={isPending} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[4px] border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-40 font-medium transition-colors cursor-pointer">
        <Trash2 className="w-3 h-3 text-danger" />
        <span>{isPending ? "Menghapus…" : "Hapus jenis"}</span>
      </button>
      {state?.error && <p className="mt-1 max-w-[150px] text-[11px] text-danger font-normal">{state.error}</p>}
    </form>
  );
}

// ─── Komponen Utama TabDariSiswa ──────────────────────────────────

export function TabDariSiswa({
  jenisOptions,
  siswaRows,
  tahunAjaranId,
  onRefresh,
}: TabDariSiswaProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [dialogKolomOpen, setDialogKolomOpen] = useState(false);
  const [dialogBayarState, setDialogBayarState] = useState<{
    open: boolean;
    penempatanId: string;
    namaSiswa: string;
  }>({ open: false, penempatanId: "", namaSiswa: "" });

  // ATURAN: SPP selalu grup pertama (dan satu-satunya yang bulanan)
  const sortedJenis = [...jenisOptions].sort((a, b) => {
    if (a.bulanan && !b.bulanan) return -1;
    if (!a.bulanan && b.bulanan) return 1;
    return a.urutan - b.urutan;
  });

  if (sortedJenis.length === 0) {
    return (
      <div className="space-y-4 p-6 rounded-[8px] bg-surface border border-line">
        <p className="text-[14px] text-text-3">
          Belum ada jenis pembayaran (kolom pemasukan) untuk tahun ajaran ini. Tambahkan kolom seperti SPP, Uang Gedung, atau Daftar Ulang.
        </p>
        <Button
          type="button"
          variant="outline-brand"
          size="sm"
          onClick={() => setDialogKolomOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jenis Pembayaran Pertama</span>
        </Button>
        {dialogKolomOpen && !!tahunAjaranId && (
          <DialogTambahKolom
            tahunAjaranId={tahunAjaranId}
            open={dialogKolomOpen}
            onClose={() => setDialogKolomOpen(false)}
            onSuccess={onRefresh}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner Mode Edit Aktif Emas-Lembut */}
      {isEditing && (
        <div className="p-3.5 rounded-[8px] bg-gold-soft border border-gold-border text-gold-text text-[13px] flex items-center gap-2.5 font-medium shadow-xs">
          <Info className="w-4 h-4 shrink-0 text-gold-text" />
          <span>
            Mode edit aktif. Catat transaksi pembayaran siswa atau tambah jenis pembayaran baru. Klik <strong>Simpan Perubahan</strong> untuk selesai.
          </span>
        </div>
      )}

      {/* Toolbar Aksi Tab */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={!tahunAjaranId}
              onClick={() => tahunAjaranId && setIsEditing(true)}
            >
              <Pencil className="w-4 h-4" />
              <span>{!tahunAjaranId ? "Pilih tahun ajaran untuk mengedit" : "Edit Pembayaran Siswa"}</span>
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  showToast("Perubahan tersimpan", "success");
                }}
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </Button>

              {!!tahunAjaranId && (
                <Button
                  type="button"
                  variant="outline-brand"
                  size="sm"
                  onClick={() => setDialogKolomOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Jenis Pembayaran</span>
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[12px] text-text-3 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-income-soft text-income border border-income-border text-[11px] font-semibold tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5 text-income shrink-0" />
              <span>LUNAS</span>
            </span>
            <span>= mencapai patokan standar</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-danger/10 text-danger border border-danger/25 text-[11px] font-semibold tracking-wide">
              <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" />
              <span>KURANG</span>
            </span>
            <span>= di bawah patokan</span>
          </span>
        </div>
      </div>

      {/* Grid Tabel Lebar dengan Garis Emas saat Mode Edit */}
      <div
        className={`w-full overflow-x-auto bg-surface rounded-[12px] shadow-xs transition-all ${
          isEditing
            ? "border border-gold-border ring-1 ring-gold-border"
            : "border border-line"
        }`}
      >
        <table className="border-collapse text-[14px] w-full" style={{ minWidth: "1000px" }}>
          <thead>
            {/* Header Grup Pemasukan */}
            <tr className="border-b border-line bg-panel/70 text-text">
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-right font-semibold sticky left-0 bg-surface z-20 border-r border-line w-12 min-w-[48px]"
              >
                No
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-left font-semibold sticky left-12 bg-surface z-20 border-r border-line min-w-[190px]"
              >
                Nama Siswa
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-left font-semibold sticky left-[238px] bg-surface z-20 border-r border-line min-w-[120px]"
              >
                Kode UID
              </th>

              {/* Kolom Grup Jenis Pemasukan */}
              {sortedJenis.map((jenis) => {
                const colSpanCount = jenis.bulanan ? 4 : 3;

                return (
                  <th
                    key={jenis.id}
                    colSpan={colSpanCount}
                    className="px-3 py-2 text-center font-semibold border-r border-line last:border-r-0"
                  >
                    <div className="font-semibold text-[14px]">
                      {jenis.nama}
                      {!tahunAjaranId && jenis.tahunAjaranNama ? ` · ${jenis.tahunAjaranNama}` : ""}
                    </div>
                    {isEditing && !!tahunAjaranId && (
                      <TombolHapusJenisPembayaran
                        id={jenis.id}
                        nama={jenis.nama}
                        onSuccess={() => {
                          showToast("Jenis pembayaran berhasil dihapus.", "success");
                          onRefresh();
                        }}
                      />
                    )}
                    {jenis.nominalStandar !== null ? (
                      <div className="text-[12px] font-normal text-text-3 font-mono mt-0.5">
                        Standar: {formatRupiah(jenis.nominalStandar)}
                      </div>
                    ) : (
                      <div className="text-[12px] font-normal text-text-3 italic mt-0.5">
                        Tanpa patokan lunas
                      </div>
                    )}
                  </th>
                );
              })}

              {isEditing && (
                <th
                  rowSpan={2}
                  className="px-3 py-2 text-center font-semibold text-text-2 border-l border-line min-w-[130px]"
                >
                  Aksi
                </th>
              )}
            </tr>

            {/* Sub-Header Kolom */}
            <tr className="border-b border-line bg-panel/50 text-text-3">
              {sortedJenis.map((jenis) =>
                jenis.bulanan ? (
                  // SPP: 4 sub-kolom
                  <React.Fragment key={`${jenis.id}-subheaders`}>
                    <th className="px-3 py-2 text-[12px] font-medium text-left border-r border-line min-w-[120px]">
                      Tgl. Transaksi
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-left border-r border-line min-w-[130px]">
                      Bulan Terbayar
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-center border-r border-line min-w-[80px]">
                      Metode
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-right border-r border-line min-w-[240px] whitespace-nowrap">
                      Nominal & Petugas
                    </th>
                  </React.Fragment>
                ) : (
                  // Jenis lain: 3 sub-kolom
                  <React.Fragment key={`${jenis.id}-subheaders`}>
                    <th className="px-3 py-2 text-[12px] font-medium text-left border-r border-line min-w-[120px]">
                      Tanggal
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-center border-r border-line min-w-[80px]">
                      Metode
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-right border-r border-line min-w-[240px] whitespace-nowrap">
                      Nominal & Petugas
                    </th>
                  </React.Fragment>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {siswaRows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    3 +
                    sortedJenis.reduce((acc, j) => acc + (j.bulanan ? 4 : 3), 0) +
                    (isEditing ? 1 : 0)
                  }
                  className="px-4 py-12 text-center text-text-3 font-normal"
                >
                  Belum ada data siswa pada filter yang dipilih.
                </td>
              </tr>
            ) : (
              siswaRows.map((siswa, idx) => (
                <tr
                  key={siswa.penempatanId}
                  className="hover:bg-panel/40 transition-colors"
                >
                  <td className="px-3 py-2.5 text-right text-text-3 num sticky left-0 bg-surface z-10 border-r border-line">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5 text-text sticky left-12 bg-surface z-10 border-r border-line font-medium">
                    {siswa.nama}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] text-text-2 sticky left-[238px] bg-surface z-10 border-r border-line">
                    {siswa.uid}
                  </td>

                  {sortedJenis.map((jenis) => {
                    const pembayaranList: PembayaranSel[] = siswa.pembayaran[jenis.id] ?? [];
                    const status = hitungStatusLunas(
                      pembayaranList.map((p) => p.nominal),
                      jenis.nominalStandar
                    );

                    const isBelumLunas = !status.lunas;
                    const last = pembayaranList[pembayaranList.length - 1];

                    if (jenis.bulanan) {
                      // SPP: 4 sub-kolom
                      return (
                        <React.Fragment key={`${siswa.penempatanId}-${jenis.id}`}>
                          <td className="px-3 py-2.5 text-text-2 num border-r border-line text-left">
                            {pembayaranList.length ? (
                              <div className="space-y-1">
                                {pembayaranList.map((p) => (
                                  <div
                                    key={p.id}
                                    className="inline-block rounded-[4px] border border-line bg-panel px-1.5 py-0.5 text-[12px] leading-tight whitespace-nowrap tabular-nums"
                                  >
                                    {formatTanggal(p.tanggal)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-text-2 border-r border-line text-left">
                            {pembayaranList.length ? (
                              <div className="space-y-1">
                                {pembayaranList.map((p) => (
                                  <div key={p.id} className="whitespace-nowrap text-[13px]">
                                    {p.bulanTerbayar ? formatBulan(p.bulanTerbayar) : "—"}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center text-text-2 border-r border-line font-mono text-[13px]">
                            {pembayaranList.length ? (
                              <div className="space-y-1">
                                {pembayaranList.map((p) => (
                                  <div key={p.id}>{p.metode === "TRANSFER" ? "TF" : "ST"}</div>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right border-r border-line-strong">
                            {pembayaranList.length === 0 && !jenis.bulanan ? (
                              <span className="text-text-3">—</span>
                            ) : (
                              <div>
                                {/* Satu baris nominal + chip status kecil */}
                                <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                                  <span
                                    className={`num font-semibold text-[14px] ${
                                      isBelumLunas ? "text-danger" : "text-text"
                                    }`}
                                  >
                                    {formatRupiah(status.totalTerbayar)}
                                  </span>

                                  {jenis.nominalStandar !== null && (
                                    status.lunas ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-income-soft text-income border border-income-border text-[11px] font-semibold tracking-wide whitespace-nowrap">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-income shrink-0" />
                                        <span>LUNAS</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-danger/10 text-danger border border-danger/25 text-[11px] font-semibold tracking-wide whitespace-nowrap">
                                        <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" />
                                        <span>KURANG {formatRupiah(status.kekurangan)}</span>
                                      </span>
                                    )
                                  )}

                                  {isEditing && !!tahunAjaranId && last && (
                                    <TombolHapusPembayaran id={last.id} onSuccess={onRefresh} />
                                  )}
                                </div>

                                {/* Rincian pembayaran */}
                                {pembayaranList.map((p) => (
                                  <div
                                    key={p.id}
                                    className="mt-1.5 border-t border-line/50 pt-1 text-[12px] leading-tight text-text-3"
                                  >
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="font-medium text-text-2">
                                        {formatRupiah(p.nominal)} ({p.metode === "TRANSFER" ? "TF" : "ST"})
                                      </span>
                                      <span className="text-text-3">· {formatTanggal(p.tanggal)}</span>
                                    </div>
                                    <div className="text-[12px] text-text-3 mt-0.5">
                                      oleh {p.petugasNama}
                                    </div>
                                  </div>
                                ))}

                                {status.isCicilan && (
                                  <div className="text-[12px] text-text-3 font-mono mt-0.5">
                                    Total {pembayaranList.length} transaksi
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    }

                    // Jenis Lain: 3 sub-kolom
                    return (
                      <React.Fragment key={`${siswa.penempatanId}-${jenis.id}`}>
                        <td className="px-3 py-2.5 text-text-2 num border-r border-line text-left">
                          {pembayaranList.length ? (
                            <div className="space-y-1">
                              {pembayaranList.map((p) => (
                                <div
                                  key={p.id}
                                  className="inline-block rounded-[4px] border border-line bg-panel px-1.5 py-0.5 text-[12px] leading-tight whitespace-nowrap tabular-nums"
                                >
                                  {formatTanggal(p.tanggal)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center text-text-2 border-r border-line font-mono text-[13px]">
                          {pembayaranList.length ? (
                            <div className="space-y-1">
                              {pembayaranList.map((p) => (
                                <div key={p.id}>{p.metode === "TRANSFER" ? "TF" : "ST"}</div>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right border-r border-line-strong">
                          {pembayaranList.length === 0 && !jenis.nominalStandar ? (
                            <span className="text-text-3">—</span>
                          ) : (
                            <div>
                              {/* Satu baris nominal + chip status kecil */}
                              <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                                <span
                                  className={`num font-semibold text-[14px] ${
                                    isBelumLunas ? "text-danger" : "text-text"
                                  }`}
                                >
                                  {formatRupiah(status.totalTerbayar)}
                                </span>

                                {jenis.nominalStandar !== null && (
                                  status.lunas ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-income-soft text-income border border-income-border text-[11px] font-semibold tracking-wide whitespace-nowrap">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-income shrink-0" />
                                      <span>LUNAS</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-danger/10 text-danger border border-danger/25 text-[11px] font-semibold tracking-wide whitespace-nowrap">
                                      <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" />
                                      <span>KURANG {formatRupiah(status.kekurangan)}</span>
                                    </span>
                                  )
                                )}

                                {isEditing && last && (
                                  <TombolHapusPembayaran id={last.id} onSuccess={onRefresh} />
                                )}
                              </div>

                              {/* Rincian pembayaran */}
                              {pembayaranList.map((p) => (
                                <div
                                  key={p.id}
                                  className="mt-1.5 border-t border-line/50 pt-1 text-[12px] leading-tight text-text-3"
                                >
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="font-medium text-text-2">
                                      {formatRupiah(p.nominal)} ({p.metode === "TRANSFER" ? "TF" : "ST"})
                                    </span>
                                    <span className="text-text-3">· {formatTanggal(p.tanggal)}</span>
                                  </div>
                                  <div className="text-[12px] text-text-3 mt-0.5">
                                    oleh {p.petugasNama}
                                  </div>
                                </div>
                              ))}

                              {status.isCicilan && (
                                <div className="text-[12px] text-text-3 font-mono mt-0.5">
                                  Total {pembayaranList.length} transaksi
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {isEditing && (
                    <td className="px-3 py-2.5 text-center border-l border-line-strong">
                      <Button
                        type="button"
                        variant="outline-brand"
                        size="sm"
                        onClick={() =>
                          setDialogBayarState({
                            open: true,
                            penempatanId: siswa.penempatanId,
                            namaSiswa: siswa.nama,
                          })
                        }
                      >
                        <Plus className="w-4 h-4" />
                        <span>Catat Bayar</span>
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog Tambah Kolom Baru */}
      {dialogKolomOpen && (
        <DialogTambahKolom
          tahunAjaranId={tahunAjaranId}
          open={dialogKolomOpen}
          onClose={() => setDialogKolomOpen(false)}
          onSuccess={() => {
            showToast("Kolom pemasukan baru berhasil ditambahkan.", "success");
            onRefresh();
          }}
        />
      )}

      {/* Dialog Tambah Pembayaran Siswa */}
      {dialogBayarState.open && !!tahunAjaranId && (
        <DialogTambahPembayaran
          open={dialogBayarState.open}
          onClose={() => setDialogBayarState((s) => ({ ...s, open: false }))}
          onSuccess={() => {
            showToast("Pembayaran berhasil dicatat.", "success");
            onRefresh();
          }}
          penempatanId={dialogBayarState.penempatanId}
          namaSiswa={dialogBayarState.namaSiswa}
          jenisList={sortedJenis}
        />
      )}
    </div>
  );
}
