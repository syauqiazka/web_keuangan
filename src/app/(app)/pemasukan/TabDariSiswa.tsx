"use client";

import * as React from "react";
import { useState, useActionState, useTransition } from "react";
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
  ubahPembayaranSiswaAction,
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
  const { showToast } = useToast();
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await tambahJenisPemasukanAction(_prev, fd);
      if (result.success) {
        showToast("Jenis pembayaran baru berhasil ditambahkan.", "success");
        onSuccess();
        onClose();
      } else if (result.error) {
        showToast(result.error, "error");
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
        {state?.error && <p className="text-[13px] text-danger">{state.error}</p>}
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

// ─── Dialog Pembayaran (Tambah & Ubah) ─────────────────────────────

interface DialogPembayaranProps {
  open: boolean;
  mode: "tambah" | "ubah";
  onClose: () => void;
  onSuccess: () => void;
  penempatanId: string;
  namaSiswa: string;
  jenisList: JenisPemasukanOption[];
  initialJenisId?: string;
  initialPembayaran?: PembayaranSel | null;
}

function DialogPembayaran({
  open,
  mode,
  onClose,
  onSuccess,
  penempatanId,
  namaSiswa,
  jenisList,
  initialJenisId,
  initialPembayaran,
}: DialogPembayaranProps) {
  const { showToast } = useToast();
  const [selectedJenisId, setSelectedJenisId] = useState(
    initialJenisId || (initialPembayaran ? jenisList[0]?.id ?? "" : jenisList[0]?.id ?? "")
  );
  const selectedJenis = jenisList.find((j) => j.id === selectedJenisId);

  const today = new Date();
  const defaultToday = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${today.getFullYear()}`;

  let defaultTanggal = defaultToday;
  let defaultBulan = String(today.getMonth() + 1);
  let defaultMetode = "SETOR_TUNAI";
  let defaultNominal = selectedJenis?.nominalStandar ? String(selectedJenis.nominalStandar) : "";
  let defaultCatatan = "";

  if (mode === "ubah" && initialPembayaran) {
    const d = new Date(initialPembayaran.tanggal);
    defaultTanggal = `${String(d.getUTCDate()).padStart(2, "0")}-${String(
      d.getUTCMonth() + 1
    ).padStart(2, "0")}-${d.getUTCFullYear()}`;
    if (initialPembayaran.bulanTerbayar) {
      defaultBulan = String(new Date(initialPembayaran.bulanTerbayar).getUTCMonth() + 1);
    }
    defaultMetode = initialPembayaran.metode;
    defaultNominal = String(initialPembayaran.nominal);
    defaultCatatan = initialPembayaran.catatan ?? "";
  }

  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result =
        mode === "ubah"
          ? await ubahPembayaranSiswaAction(_prev, fd)
          : await tambahPembayaranSiswaAction(_prev, fd);
      if (result.success) {
        showToast(
          mode === "ubah" ? "Pembayaran diperbarui." : "Pembayaran berhasil dicatat.",
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

  const dialogTitle =
    mode === "ubah"
      ? `Ubah Pembayaran — ${namaSiswa} · ${selectedJenis?.nama ?? "Pembayaran"}`
      : `Catat Pembayaran — ${namaSiswa}`;

  return (
    <Dialog
      key={initialPembayaran?.id ? `ubah-${initialPembayaran.id}` : `tambah-${selectedJenisId}-${penempatanId}`}
      open={open}
      title={dialogTitle}
      onClose={onClose}
    >
      <form action={formAction} className="space-y-4">
        {mode === "ubah" ? (
          <>
            <input type="hidden" name="id" value={initialPembayaran?.id} />
            <div className="p-3 bg-panel rounded-[8px] text-[13px] border border-line flex flex-wrap items-center justify-between gap-2">
              <span>
                Siswa: <strong className="font-semibold text-text">{namaSiswa}</strong>
              </span>
              <span>
                Jenis: <strong className="font-semibold text-text">{selectedJenis?.nama}</strong>
              </span>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

        <Input
          id="bayar-tanggal"
          name="tanggal"
          label="Tanggal Transaksi (DD-MM-YYYY)"
          defaultValue={defaultTanggal}
          placeholder="DD-MM-YYYY"
          required
          helperText="Format: tanggal-bulan-tahun (contoh: 26-10-2026)"
        />

        {selectedJenis?.bulanan && (
          <Select
            name="bulanTerbayar"
            label="Bulan yang Dibayar (SPP)"
            defaultValue={defaultBulan}
            options={BULAN_DAFTAR}
          />
        )}

        <Select
          name="metode"
          label="Metode Pembayaran"
          defaultValue={defaultMetode}
          options={[
            { value: "SETOR_TUNAI", label: "Setor Tunai (ST)" },
            { value: "TRANSFER", label: "Transfer Bank (TF)" },
          ]}
        />

        <Input
          id="bayar-nominal"
          name="nominal"
          label="Nominal Pembayaran (Rp)"
          defaultValue={defaultNominal}
          placeholder="Contoh: 150000 atau 150.000"
          required
          helperText="Ketik nominal rupiah utuh tanpa desimal."
        />

        <Input
          id="bayar-catatan"
          name="catatan"
          label="Catatan Tambahan (opsional)"
          defaultValue={defaultCatatan}
          placeholder="Contoh: Titipan orang tua, cicilan ke-1"
        />

        {state?.error && <p className="text-[13px] text-danger">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending
              ? "Menyimpan…"
              : mode === "ubah"
              ? "Simpan Perubahan"
              : "Simpan Pembayaran"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Tombol Hapus Jenis Pembayaran ─────────────────────────────────

function TombolHapusJenisPembayaran({
  id,
  nama,
  onSuccess,
}: {
  id: string;
  nama: string;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await hapusJenisPemasukanAction(_prev, fd);
      if (result.success) {
        showToast(`Jenis pembayaran "${nama}" berhasil dihapus.`, "success");
        setConfirmOpen(false);
        onSuccess();
      } else if (result.error) {
        showToast(result.error, "error");
      }
      return result;
    },
    null
  );

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[4px] border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-40 font-medium transition-colors cursor-pointer"
        title={`Hapus jenis ${nama}`}
        aria-label={`Hapus jenis ${nama}`}
      >
        <Trash2 className="w-3 h-3 text-danger" />
        <span>Hapus jenis</span>
      </button>

      <Dialog
        open={confirmOpen}
        onClose={() => !isPending && setConfirmOpen(false)}
        title="Hapus Jenis Pembayaran"
      >
        <div className="space-y-4">
          <p className="text-[14px] text-text-2 leading-relaxed">
            Hapus jenis pembayaran <strong className="text-text">{nama}</strong>? Jenis ini akan disembunyikan dari tahun ajaran aktif; riwayat transaksinya tetap tersimpan.
          </p>
          {state?.error && (
            <p className="text-[12px] text-danger font-medium">{state.error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <form action={formAction}>
              <input type="hidden" name="id" value={id} />
              <Button
                type="submit"
                variant="danger-solid"
                disabled={isPending}
              >
                {isPending ? "Menghapus…" : "Hapus Jenis"}
              </Button>
            </form>
          </div>
        </div>
      </Dialog>
    </>
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
  const [isDeletingPayment, startDeletingPayment] = useTransition();

  // State dialog pembayaran (tambah atau ubah)
  const [dialogBayar, setDialogBayar] = useState<{
    open: boolean;
    mode: "tambah" | "ubah";
    penempatanId: string;
    namaSiswa: string;
    initialJenisId?: string;
    initialPembayaran?: PembayaranSel | null;
  }>({
    open: false,
    mode: "tambah",
    penempatanId: "",
    namaSiswa: "",
  });

  // ATURAN: SPP selalu grup pertama (dan satu-satunya yang bulanan)
  const sortedJenis = [...jenisOptions].sort((a, b) => {
    if (a.bulanan && !b.bulanan) return -1;
    if (!a.bulanan && b.bulanan) return 1;
    return a.urutan - b.urutan;
  });

  const openTambahDialog = (penempatanId: string, namaSiswa: string, jenisId?: string) => {
    setDialogBayar({
      open: true,
      mode: "tambah",
      penempatanId,
      namaSiswa,
      initialJenisId: jenisId,
      initialPembayaran: null,
    });
  };

  const openUbahDialog = (
    penempatanId: string,
    namaSiswa: string,
    jenisId: string,
    pembayaran: PembayaranSel
  ) => {
    setDialogBayar({
      open: true,
      mode: "ubah",
      penempatanId,
      namaSiswa,
      initialJenisId: jenisId,
      initialPembayaran: pembayaran,
    });
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    nominal: number;
    tanggal: string;
  } | null>(null);

  const handleDeletePembayaran = (pembayaranId: string, nominal: number, tanggal: string) => {
    setDeleteConfirm({
      open: true,
      id: pembayaranId,
      nominal,
      tanggal,
    });
  };

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
            Mode edit aktif. Catat pembayaran langsung di dalam sel, ubah nominal/tanggal, atau tambah kolom jenis pembayaran baru. Klik <strong>Selesai Edit</strong> bila sudah selesai.
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
                  showToast("Mode edit ditutup.", "default");
                }}
              >
                <Check className="w-4 h-4" />
                <span>Selesai Edit</span>
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

      {/* Grid Tabel Lebar Scroller Dua Arah dengan Scrollbar Bertema */}
      <div
        className={`w-full max-h-[calc(100dvh-16rem)] overflow-auto bg-surface rounded-[12px] shadow-xs transition-all ${
          isEditing
            ? "border border-gold-border ring-1 ring-gold-border"
            : "border border-line"
        }`}
      >
        <table className="border-collapse text-[13px] w-full" style={{ minWidth: "1100px" }}>
          <thead>
            {/* Header Grup Pemasukan (Sticky Top 0) */}
            <tr className="border-b border-income-border bg-income-soft text-income-text sticky top-0 z-20">
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-right font-semibold border-r border-income-border w-[48px] min-w-[48px] max-w-[48px] sticky left-0 bg-income-soft z-30"
              >
                No
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-left font-semibold border-r-2 border-income-border w-[190px] min-w-[190px] max-w-[190px] sticky left-[48px] bg-income-soft z-30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]"
              >
                Nama Siswa
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-left font-semibold border-r-2 border-income-border w-[110px] min-w-[110px] max-w-[110px] bg-income-soft"
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
                    className="px-3 py-2 text-center font-semibold border-r border-income-border last:border-r-0"
                  >
                    <div className="font-semibold text-[14px]">
                      {jenis.nama}
                      {!tahunAjaranId && jenis.tahunAjaranNama ? ` · ${jenis.tahunAjaranNama}` : ""}
                    </div>
                    {isEditing && !!tahunAjaranId && (
                      <TombolHapusJenisPembayaran
                        id={jenis.id}
                        nama={jenis.nama}
                        onSuccess={onRefresh}
                      />
                    )}
                    {jenis.nominalStandar !== null ? (
                      <div className="text-[12px] font-normal text-income-text/80 font-mono mt-0.5">
                        Standar: {formatRupiah(jenis.nominalStandar)}
                      </div>
                    ) : (
                      <div className="text-[12px] font-normal text-income-text/70 italic mt-0.5">
                        Tanpa patokan lunas
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>

            {/* Sub-Header Kolom (Sticky Top 41px) */}
            <tr className="border-b border-income-border bg-income-soft/95 text-income-text sticky top-[41px] z-20">
              {sortedJenis.map((jenis) =>
                jenis.bulanan ? (
                  // SPP: 4 sub-kolom
                  <React.Fragment key={`${jenis.id}-subheaders`}>
                    <th className="px-3 py-2 text-[12px] font-semibold text-left border-r border-income-border/70 min-w-[110px]">
                      Tgl. Transaksi
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-left border-r border-line min-w-[120px]">
                      Bulan Terbayar
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-center border-r border-line min-w-[70px]">
                      Metode
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-right border-r border-line min-w-[280px] whitespace-nowrap">
                      Nominal & Petugas
                    </th>
                  </React.Fragment>
                ) : (
                  // Jenis lain: 3 sub-kolom
                  <React.Fragment key={`${jenis.id}-subheaders`}>
                    <th className="px-3 py-2 text-[12px] font-medium text-left border-r border-line min-w-[110px]">
                      Tanggal
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-center border-r border-line min-w-[70px]">
                      Metode
                    </th>
                    <th className="px-3 py-2 text-[12px] font-medium text-right border-r border-line min-w-[280px] whitespace-nowrap">
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
                    sortedJenis.reduce((acc, j) => acc + (j.bulanan ? 4 : 3), 0)
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
                  className="border-b border-line bg-surface hover:bg-panel/20 transition-colors"
                >
                  <td className="px-3 py-2.5 text-right text-text-3 num border-r border-line w-[48px] min-w-[48px] max-w-[48px] sticky left-0 bg-surface z-10">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5 text-text border-r-2 border-line-strong font-medium w-[190px] min-w-[190px] max-w-[190px] sticky left-[48px] bg-surface z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-medium text-text text-[13px]" title={siswa.nama}>
                        {siswa.nama}
                      </span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => openTambahDialog(siswa.penempatanId, siswa.nama, sortedJenis[0]?.id)}
                          className="p-1 rounded text-income hover:bg-income-soft shrink-0 transition-colors cursor-pointer"
                          title={`Catat pembayaran untuk ${siswa.nama}`}
                          aria-label={`Catat pembayaran untuk ${siswa.nama}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-text-2 border-r-2 border-line w-[110px] min-w-[110px] max-w-[110px]">
                    <div className="truncate">{siswa.uid}</div>
                  </td>

                  {sortedJenis.map((jenis) => {
                    const pembayaranList: PembayaranSel[] = siswa.pembayaran[jenis.id] ?? [];
                    const status = hitungStatusLunas(
                      pembayaranList.map((p) => p.nominal),
                      jenis.nominalStandar
                    );

                    const isBelumLunas = !status.lunas;

                    if (jenis.bulanan) {
                      // SPP: 4 sub-kolom
                      return (
                        <React.Fragment key={`${siswa.penempatanId}-${jenis.id}`}>
                          <td className="px-3 py-2.5 text-text-2 num border-r border-line text-left align-top">
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
                          <td className="px-3 py-2.5 text-text-2 border-r border-line text-left align-top">
                            {pembayaranList.length ? (
                              <div className="space-y-1">
                                {pembayaranList.map((p) => (
                                  <div key={p.id} className="whitespace-nowrap text-[12px]">
                                    {p.bulanTerbayar ? formatBulan(p.bulanTerbayar) : "—"}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center text-text-2 border-r border-line font-mono text-[12px] align-top">
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
                          <td
                            className={`px-3 py-2 text-right border-r border-line-strong align-top transition-colors ${
                              isEditing ? "hover:bg-gold-soft/30 cursor-pointer" : ""
                            }`}
                            onClick={
                              isEditing
                                ? (e) => {
                                    if ((e.target as HTMLElement).closest("button, form, a")) return;
                                    openTambahDialog(siswa.penempatanId, siswa.nama, jenis.id);
                                  }
                                : undefined
                            }
                          >
                            <div className="space-y-1.5">
                              {/* Satu baris nominal total + chip status kecil */}
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <span
                                  className={`num font-semibold text-[14px] whitespace-nowrap ${
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
                              </div>

                              {/* Rincian per transaksi dengan tombol Ubah dan Hapus langsung di dalam sel */}
                              {pembayaranList.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={
                                    isEditing
                                      ? (e) => {
                                          e.stopPropagation();
                                          openUbahDialog(siswa.penempatanId, siswa.nama, jenis.id, p);
                                        }
                                      : undefined
                                  }
                                  className={`p-1.5 rounded-[6px] border border-line/60 bg-surface flex items-center justify-between gap-2 text-left transition-all ${
                                    isEditing
                                      ? "hover:border-gold hover:bg-gold-soft/40 cursor-pointer shadow-2xs"
                                      : ""
                                  }`}
                                  title={isEditing ? `Klik untuk mengubah pembayaran ini` : undefined}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-[13px] text-text tabular-nums whitespace-nowrap num">
                                        {formatRupiah(p.nominal)}
                                      </span>
                                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-panel border border-line text-text-2">
                                        {p.metode === "TRANSFER" ? "TF" : "ST"}
                                      </span>
                                      <span className="text-[11px] text-text-3 whitespace-nowrap">
                                        {formatTanggal(p.tanggal)}
                                      </span>
                                      {p.catatan && (
                                        <span title={`Catatan: ${p.catatan}`} className="inline-flex text-text-3">
                                          <Info className="w-3 h-3 text-text-3" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-text-3 mt-0.5">
                                      oleh {p.petugasNama}
                                    </div>
                                  </div>

                                  {/* Tombol Ubah (emas) & Hapus (merah) */}
                                  {isEditing && (
                                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openUbahDialog(siswa.penempatanId, siswa.nama, jenis.id, p)
                                        }
                                        className="w-9 h-9 p-2 rounded-[6px] text-gold-text hover:bg-gold-soft hover:text-gold-hover transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/40 cursor-pointer"
                                        title={`Ubah pembayaran ${formatRupiah(p.nominal)} tanggal ${formatTanggal(p.tanggal)}`}
                                        aria-label={`Ubah pembayaran ${formatRupiah(p.nominal)} tanggal ${formatTanggal(p.tanggal)}`}
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isDeletingPayment}
                                        onClick={() =>
                                          handleDeletePembayaran(p.id, p.nominal, p.tanggal)
                                        }
                                        className="w-9 h-9 p-2 rounded-[6px] text-danger hover:bg-danger/10 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-danger/30 cursor-pointer"
                                        title={`Hapus pembayaran ${formatRupiah(p.nominal)} tanggal ${formatTanggal(p.tanggal)}`}
                                        aria-label={`Hapus pembayaran ${formatRupiah(p.nominal)} tanggal ${formatTanggal(p.tanggal)}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Tombol Catat di dalam sel (Mode Edit) */}
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTambahDialog(siswa.penempatanId, siswa.nama, jenis.id);
                                  }}
                                  className="w-full mt-1 py-1 px-2 text-[12px] font-medium text-income border border-dashed border-income-border rounded-[6px] hover:bg-income-soft flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  title={`Catat pembayaran baru untuk ${jenis.nama}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Catat</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </React.Fragment>
                      );
                    }

                    // Jenis Lain: 3 sub-kolom
                    return (
                      <React.Fragment key={`${siswa.penempatanId}-${jenis.id}`}>
                        <td className="px-3 py-2.5 text-text-2 num border-r border-line text-left align-top">
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
                        <td className="px-3 py-2.5 text-center text-text-2 border-r border-line font-mono text-[12px] align-top">
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
                        <td
                          className={`px-3 py-2 text-right border-r border-line-strong align-top transition-colors ${
                            isEditing ? "hover:bg-gold-soft/30 cursor-pointer" : ""
                          }`}
                          onClick={
                            isEditing
                              ? (e) => {
                                  if ((e.target as HTMLElement).closest("button, form, a")) return;
                                  openTambahDialog(siswa.penempatanId, siswa.nama, jenis.id);
                                }
                              : undefined
                          }
                        >
                          <div className="space-y-1.5">
                            {/* Satu baris nominal total + chip status kecil */}
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <span
                                className={`num font-semibold text-[14px] whitespace-nowrap ${
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
                            </div>

                            {/* Rincian per transaksi */}
                            {pembayaranList.map((p) => (
                              <div
                                key={p.id}
                                onClick={
                                  isEditing
                                    ? (e) => {
                                        e.stopPropagation();
                                        openUbahDialog(siswa.penempatanId, siswa.nama, jenis.id, p);
                                      }
                                    : undefined
                                }
                                className={`p-1.5 rounded-[6px] border border-line/60 bg-surface flex items-center justify-between gap-2 text-left transition-all ${
                                  isEditing
                                    ? "hover:border-gold hover:bg-gold-soft/40 cursor-pointer shadow-2xs"
                                    : ""
                                }`}
                                title={isEditing ? `Klik untuk mengubah pembayaran ini` : undefined}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-[13px] text-text tabular-nums whitespace-nowrap num">
                                      {formatRupiah(p.nominal)}
                                    </span>
                                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-panel border border-line text-text-2">
                                      {p.metode === "TRANSFER" ? "TF" : "ST"}
                                    </span>
                                    <span className="text-[11px] text-text-3 whitespace-nowrap">
                                      {formatTanggal(p.tanggal)}
                                    </span>
                                    {p.catatan && (
                                      <span title={`Catatan: ${p.catatan}`} className="inline-flex text-text-3">
                                        <Info className="w-3 h-3 text-text-3" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-text-3 mt-0.5">
                                    oleh {p.petugasNama}
                                  </div>
                                </div>

                                {/* Tombol Ubah (emas) & Hapus (merah) */}
                                {isEditing && (
                                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openUbahDialog(siswa.penempatanId, siswa.nama, jenis.id, p)
                                      }
                                      className="w-9 h-9 p-2 rounded-[6px] text-gold-text hover:bg-gold-soft hover:text-gold-hover transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/40 cursor-pointer"
                                      title={`Ubah pembayaran ${formatRupiah(p.nominal)} tanggal ${formatTanggal(p.tanggal)}`}
                                      aria-label={`Ubah pembayaran ${formatRupiah(p.nominal)} tanggal ${formatTanggal(p.tanggal)}`}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isDeletingPayment}
                                      onClick={() =>
                                        handleDeletePembayaran(p.id, p.nominal, p.tanggal)
                                      }
                                      className="w-9 h-9 p-2 rounded-[6px] text-danger hover:bg-danger/10 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-danger/30 cursor-pointer"
                                      title={`Hapus pembayaran ${formatRupiah(p.nominal)} tanggal ${formatTanggal(p.tanggal)}`}
                                      aria-label={`Hapus pembayaran ${formatRupiah(p.nominal)} tanggal ${formatTanggal(p.tanggal)}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Tombol Catat di dalam sel (Mode Edit) */}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTambahDialog(siswa.penempatanId, siswa.nama, jenis.id);
                                }}
                                className="w-full mt-1 py-1 px-2 text-[12px] font-medium text-income border border-dashed border-income-border rounded-[6px] hover:bg-income-soft flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title={`Catat pembayaran baru untuk ${jenis.nama}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Catat</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog Tambah Kolom Baru */}
      {dialogKolomOpen && !!tahunAjaranId && (
        <DialogTambahKolom
          tahunAjaranId={tahunAjaranId}
          open={dialogKolomOpen}
          onClose={() => setDialogKolomOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      {/* Dialog Pembayaran Siswa (Tambah / Ubah) */}
      {dialogBayar.open && (
        <DialogPembayaran
          open={dialogBayar.open}
          mode={dialogBayar.mode}
          onClose={() => setDialogBayar((s) => ({ ...s, open: false }))}
          onSuccess={onRefresh}
          penempatanId={dialogBayar.penempatanId}
          namaSiswa={dialogBayar.namaSiswa}
          jenisList={sortedJenis}
          initialJenisId={dialogBayar.initialJenisId}
          initialPembayaran={dialogBayar.initialPembayaran}
        />
      )}

      {/* Dialog Konfirmasi Hapus Pembayaran */}
      <Dialog
        open={Boolean(deleteConfirm?.open)}
        onClose={() => !isDeletingPayment && setDeleteConfirm(null)}
        title="Hapus Catatan Pembayaran"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-[14px] text-text-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan pembayaran sebesar{" "}
              <strong className="text-text">{formatRupiah(deleteConfirm.nominal)}</strong>{" "}
              pada tanggal{" "}
              <strong className="text-text">{formatTanggal(deleteConfirm.tanggal)}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button
                type="button"
                variant="secondary"
                disabled={isDeletingPayment}
                onClick={() => setDeleteConfirm(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger-solid"
                disabled={isDeletingPayment}
                onClick={() => {
                  startDeletingPayment(async () => {
                    const fd = new FormData();
                    fd.append("id", deleteConfirm.id);
                    const res = await hapusPembayaranSiswaAction(null, fd);
                    if (res.success) {
                      showToast("Pembayaran berhasil dihapus.", "success");
                      setDeleteConfirm(null);
                      onRefresh();
                    } else {
                      showToast(res.error ?? "Gagal menghapus pembayaran.", "error");
                    }
                  });
                }}
              >
                {isDeletingPayment ? "Menghapus…" : "Hapus Pembayaran"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
