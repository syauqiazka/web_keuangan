"use client";

import * as React from "react";
import { useState, useActionState } from "react";
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
        {/* Kolom baru selalu tidak bulanan (3 sub-kolom) sesuai AGENTS.md 4.4 */}
        <input type="hidden" name="bulanan" value="false" />

        <Input
          id="kolom-nama"
          name="nama"
          label="Nama Jenis Pembayaran"
          placeholder="Contoh: Uang Gedung, Ujian Praktik, Seragam"
          required
          helperText="Jenis baru yang ditambahkan bersifat non-bulanan (3 sub-kolom: Tanggal, Metode, Nominal)."
        />
        <Input
          id="kolom-nominal"
          name="nominalStandar"
          label="Nominal Patokan Standar (Rp, opsional)"
          placeholder="Contoh: 200.000 (kosongkan jika fleksibel)"
          helperText="Jika diisi, pembayaran siswa yang kurang dari angka ini akan ditandai belum lunas."
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
        className="text-[11px] px-1 py-0.5 rounded text-danger hover:bg-danger/10 disabled:opacity-40 font-medium transition-colors"
        title="Hapus catatan pembayaran ini"
        aria-label="Hapus pembayaran"
      >
        {isPending ? "…" : "Hapus"}
      </button>
      {state?.error && <span className="text-[11px] text-danger">{state.error}</span>}
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

  if (!tahunAjaranId) {
    return (
      <div className="p-6 rounded-[8px] bg-surface border border-line text-text-3 text-[14px]">
        Pilih Tahun Ajaran pada filter di atas lalu klik <strong>&ldquo;Tampilkan Data Pemasukan&rdquo;</strong> untuk melihat data pembayaran siswa.
      </div>
    );
  }

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
          variant="primary"
          size="sm"
          onClick={() => setDialogKolomOpen(true)}
        >
          + Tambah Jenis Pembayaran Pertama
        </Button>
        {dialogKolomOpen && (
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
      {/* Toolbar Aksi Tab */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isEditing ? "secondary" : "primary"}
            size="sm"
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? "Selesai Edit" : "Edit Pembayaran Siswa"}
          </Button>

          {isEditing && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDialogKolomOpen(true)}
            >
              + Tambah Jenis Pembayaran (Kolom Baru)
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 text-[12px] text-text-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-series-in inline-block" />
            <span className="text-text font-medium">✓ Lunas</span> = mencapai patokan standar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger inline-block" />
            <span className="text-danger font-medium">⚠️ Kurang</span> = di bawah patokan
          </span>
        </div>
      </div>

      {/* Grid Tabel Lebar */}
      <div className="w-full overflow-x-auto border border-line bg-surface rounded-[12px] shadow-xs">
        <table className="border-collapse text-[13px] w-full" style={{ minWidth: "900px" }}>
          <thead>
            {/* Header Grup Pemasukan */}
            <tr className="border-b border-line bg-panel/70 text-text">
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-right font-semibold sticky left-0 bg-surface z-20 border-r border-line"
                style={{ width: "48px" }}
              >
                No
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-left font-semibold sticky left-12 bg-surface z-20 border-r border-line"
                style={{ minWidth: "160px" }}
              >
                Nama Siswa
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-left font-semibold sticky left-[208px] bg-surface z-20 border-r border-line"
                style={{ width: "110px" }}
              >
                Kode UID
              </th>

              {/* Kolom Grup Jenis Pemasukan */}
              {sortedJenis.map((jenis) => {
                // SPP: 4 sub-kolom (Tanggal Transaksi, Bulan Terbayar, Metode, Petugas/Nominal)
                // Jenis lain: 3 sub-kolom (Tanggal Transaksi, Metode, Petugas/Nominal)
                const colSpanCount = jenis.bulanan ? 4 : 3;

                return (
                  <th
                    key={jenis.id}
                    colSpan={colSpanCount}
                    className="px-3 py-2 text-center font-semibold border-r border-line last:border-r-0"
                  >
                    <div className="font-semibold text-[13px]">{jenis.nama}</div>
                    {jenis.nominalStandar !== null ? (
                      <div className="text-[11px] font-normal text-text-3 font-mono mt-0.5">
                        Standar: {formatRupiah(jenis.nominalStandar)}
                      </div>
                    ) : (
                      <div className="text-[11px] font-normal text-text-3 italic mt-0.5">
                        Tanpa patokan lunas
                      </div>
                    )}
                  </th>
                );
              })}

              {isEditing && (
                <th
                  rowSpan={2}
                  className="px-3 py-2 text-center font-semibold text-text-2 border-l border-line"
                  style={{ width: "100px" }}
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
                    <th className="px-2 py-1.5 text-[11px] font-medium text-left border-r border-line">
                      Tanggal
                    </th>
                    <th className="px-2 py-1.5 text-[11px] font-medium text-left border-r border-line">
                      Bulan Terbayar
                    </th>
                    <th className="px-2 py-1.5 text-[11px] font-medium text-center border-r border-line w-16">
                      Metode
                    </th>
                    <th className="px-2 py-1.5 text-[11px] font-medium text-right border-r border-line">
                      Nominal & Petugas
                    </th>
                  </React.Fragment>
                ) : (
                  // Jenis lain: 3 sub-kolom
                  <React.Fragment key={`${jenis.id}-subheaders`}>
                    <th className="px-2 py-1.5 text-[11px] font-medium text-left border-r border-line">
                      Tanggal
                    </th>
                    <th className="px-2 py-1.5 text-[11px] font-medium text-center border-r border-line w-16">
                      Metode
                    </th>
                    <th className="px-2 py-1.5 text-[11px] font-medium text-right border-r border-line">
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
                  <td className="px-3 py-2 text-right text-text-3 num sticky left-0 bg-surface z-10 border-r border-line">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 text-text sticky left-12 bg-surface z-10 border-r border-line font-medium">
                    {siswa.nama}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px] text-text-2 sticky left-[208px] bg-surface z-10 border-r border-line">
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
                          <td className="px-2 py-2 text-text-2 num border-r border-line text-left">
                            {last ? formatTanggal(last.tanggal) : "—"}
                          </td>
                          <td className="px-2 py-2 text-text-2 border-r border-line text-left">
                            {last?.bulanTerbayar ? formatBulan(last.bulanTerbayar) : "—"}
                          </td>
                          <td className="px-2 py-2 text-center text-text-2 border-r border-line font-mono text-[12px]">
                            {last ? (last.metode === "TRANSFER" ? "TF" : "ST") : "—"}
                          </td>
                          <td className="px-2 py-2 text-right border-r border-line-strong">
                            {pembayaranList.length === 0 ? (
                              <span className="text-text-3">—</span>
                            ) : (
                              <div>
                                <div
                                  className={`num font-semibold flex items-center justify-end gap-1 ${
                                    isBelumLunas ? "text-danger" : "text-text"
                                  }`}
                                >
                                  <span>{formatRupiah(status.totalTerbayar)}</span>
                                  {isEditing && last && (
                                    <TombolHapusPembayaran id={last.id} onSuccess={onRefresh} />
                                  )}
                                </div>
                                {jenis.nominalStandar && status.lunas && (
                                  <div className="text-[10px] font-medium text-series-in mt-0.5">
                                    ✓ Lunas
                                  </div>
                                )}
                                {isBelumLunas && status.teksKekurangan && (
                                  <div className="text-[11px] font-[400] text-danger mt-0.5">
                                    ⚠️ {status.teksKekurangan}
                                  </div>
                                )}
                                {last?.petugasNama && (
                                  <div className="text-[10px] text-text-3">
                                    oleh {last.petugasNama}
                                  </div>
                                )}
                                {status.isCicilan && (
                                  <div className="text-[10px] text-label font-mono">
                                    {pembayaranList.length}x cicilan
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
                        <td className="px-2 py-2 text-text-2 num border-r border-line text-left">
                          {last ? formatTanggal(last.tanggal) : "—"}
                        </td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-line font-mono text-[12px]">
                          {last ? (last.metode === "TRANSFER" ? "TF" : "ST") : "—"}
                        </td>
                        <td className="px-2 py-2 text-right border-r border-line-strong">
                          {pembayaranList.length === 0 ? (
                            <span className="text-text-3">—</span>
                          ) : (
                            <div>
                              <div
                                className={`num font-semibold flex items-center justify-end gap-1 ${
                                  isBelumLunas ? "text-danger" : "text-text"
                                }`}
                              >
                                <span>{formatRupiah(status.totalTerbayar)}</span>
                                {isEditing && last && (
                                  <TombolHapusPembayaran id={last.id} onSuccess={onRefresh} />
                                )}
                              </div>
                              {jenis.nominalStandar && status.lunas && (
                                <div className="text-[10px] font-medium text-series-in mt-0.5">
                                  ✓ Lunas
                                </div>
                              )}
                              {isBelumLunas && status.teksKekurangan && (
                                <div className="text-[11px] font-[400] text-danger mt-0.5">
                                  ⚠️ {status.teksKekurangan}
                                </div>
                              )}
                              {last?.petugasNama && (
                                <div className="text-[10px] text-text-3">
                                  oleh {last.petugasNama}
                                </div>
                              )}
                              {status.isCicilan && (
                                <div className="text-[10px] text-label font-mono">
                                  {pembayaranList.length}x cicilan
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {isEditing && (
                    <td className="px-2 py-2 text-center border-l border-line-strong">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setDialogBayarState({
                            open: true,
                            penempatanId: siswa.penempatanId,
                            namaSiswa: siswa.nama,
                          })
                        }
                      >
                        + Catat Bayar
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
      {dialogBayarState.open && (
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
