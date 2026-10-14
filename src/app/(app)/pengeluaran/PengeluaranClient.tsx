"use client";

import {
  useState,
  useRef,
  useCallback,
  useActionState,
} from "react";
import { useRouter } from "next/navigation";
import type { PengeluaranRow, RingkasanPengeluaran } from "@/server/queries/pengeluaran";
import type { TahunAjaranOption } from "@/server/queries/anggota";
import {
  tambahPengeluaranAction,
  hapusPengeluaranAction,
  type ActionState,
} from "@/server/actions/pengeluaran";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

interface DraftRow {
  tanggal: string;
  jenis: string;
  nominal: string;
  catatan: string;
}

const DEFAULT_DRAFT: DraftRow = {
  tanggal: "",
  jenis: "",
  nominal: "",
  catatan: "",
};

interface PengeluaranClientProps {
  rows: PengeluaranRow[];
  total: number;
  ringkasan: RingkasanPengeluaran;
  tahunAjaranList: TahunAjaranOption[];
  tahunAjaranId: string;
  bulan: string;
  page: number;
}

const KOLOM: { id: KolomId; label: string; width: string; required?: boolean; align?: string }[] = [
  { id: "tanggal", label: "Tanggal", width: "w-[130px]", required: true },
  { id: "jenis", label: "Jenis Pengeluaran", width: "flex-1 min-w-[200px]", required: true },
  { id: "nominal", label: "Nominal", width: "w-[160px]", required: true, align: "text-right" },
  { id: "catatan", label: "Catatan", width: "w-[180px]" },
];

type KolomId = "tanggal" | "jenis" | "nominal" | "catatan";

export function PengeluaranClient({
  rows,
  total,
  ringkasan,
  tahunAjaranList,
  tahunAjaranId,
  bulan,
  page,
}: PengeluaranClientProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [activeCol, setActiveCol] = useState<KolomId>("tanggal");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cellRefs = useRef<Record<string, HTMLElement | null>>({});

  const totalPages = Math.max(1, Math.ceil(total / 50));

  const buildUrl = useCallback(
    (params: { tahunAjaranId?: string; bulan?: string; page?: number }) => {
      const sp = new URLSearchParams();
      if (params.tahunAjaranId) sp.set("tahunAjaran", params.tahunAjaranId);
      if (params.bulan) sp.set("bulan", params.bulan);
      if (params.page && params.page > 1) sp.set("halaman", String(params.page));
      const qs = sp.toString();
      return qs ? `/pengeluaran?${qs}` : "/pengeluaran";
    },
    []
  );

  const tambahBaris = useCallback(() => {
    setDraft({ ...DEFAULT_DRAFT });
    setActiveCol("tanggal");
    setSubmitError(null);
    setTimeout(() => {
      const el = cellRefs.current["draft-tanggal"];
      if (el) (el as HTMLInputElement).focus();
    }, 0);
  }, []);

  const batalDraft = useCallback(() => {
    setDraft(null);
    setSubmitError(null);
  }, []);

  const updateDraft = useCallback((field: KolomId, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  // Simpan draft ke server
  const simpanDraft = useCallback(async () => {
    if (!draft) return;
    if (!draft.tanggal.trim() || !draft.jenis.trim() || !draft.nominal.trim()) {
      setSubmitError("Tanggal, Jenis, dan Nominal wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const fd = new FormData();
    fd.set("tanggal", draft.tanggal);
    fd.set("jenis", draft.jenis);
    fd.set("nominal", draft.nominal);
    if (draft.catatan) fd.set("catatan", draft.catatan);

    const result = await tambahPengeluaranAction(null, fd);
    setIsSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    setDraft(null);
    router.refresh();
  }, [draft, router]);

  // Keyboard handler untuk sel draft
  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, colId: KolomId) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Pindah ke kolom berikutnya atau simpan jika sudah di akhir
        const kolomIdx = KOLOM.findIndex((k) => k.id === colId);
        if (kolomIdx < KOLOM.length - 1) {
          const nextKolom = KOLOM[kolomIdx + 1].id;
          setActiveCol(nextKolom);
          const el = cellRefs.current[`draft-${nextKolom}`];
          if (el) (el as HTMLInputElement).focus();
        } else {
          simpanDraft();
        }
      } else if (e.key === "Tab") {
        const kolomIdx = KOLOM.findIndex((k) => k.id === colId);
        if (!e.shiftKey && kolomIdx < KOLOM.length - 1) {
          e.preventDefault();
          const nextKolom = KOLOM[kolomIdx + 1].id;
          setActiveCol(nextKolom);
          const el = cellRefs.current[`draft-${nextKolom}`];
          if (el) (el as HTMLInputElement).focus();
        } else if (e.shiftKey && kolomIdx > 0) {
          e.preventDefault();
          const prevKolom = KOLOM[kolomIdx - 1].id;
          setActiveCol(prevKolom);
          const el = cellRefs.current[`draft-${prevKolom}`];
          if (el) (el as HTMLInputElement).focus();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        batalDraft();
      }
    },
    [simpanDraft, batalDraft]
  );

  // Opsi bulan untuk filter
  const bulanOptions = [
    { value: "", label: "— Semua Bulan —" },
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  // Ekstrak tahun dari filter bulan (format "YYYY-MM")
  const bulanBagian = bulan ? bulan.split("-") : [];
  const bulanNomor = bulanBagian[1] ?? "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line">
        <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25]">
          Pengeluaran
        </h1>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={tambahBaris}
          disabled={draft !== null}
        >
          Tambah Baris
        </Button>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-canvas p-6 border border-line rounded-[8px]">
          <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
            Jumlah Pengeluaran Bulan Ini
          </div>
          <div className="text-[32px] font-[400] font-display text-text leading-[1.25] num">
            {ringkasan.jumlahBulanIniFormatted}
          </div>
        </div>
        <div className="bg-canvas p-6 border border-line rounded-[8px]">
          <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
            Total Pengeluaran Per Tahun
          </div>
          <div className="text-[32px] font-[400] font-display text-text leading-[1.25] num">
            {ringkasan.totalPerTahunFormatted}
          </div>
        </div>
      </div>

      {/* Form Filter (GET) */}
      <form method="GET" action="/pengeluaran" className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <Select
            name="tahunAjaran"
            label="Tahun Ajaran"
            defaultValue={tahunAjaranId}
            options={[
              { value: "", label: "— Semua Tahun Ajaran —" },
              ...tahunAjaranList.map((ta) => ({ value: ta.id, label: ta.nama })),
            ]}
          />
        </div>
        <div className="min-w-[120px]">
          <Select
            name="bulan"
            label="Bulan"
            defaultValue={bulanNomor}
            options={bulanOptions}
          />
        </div>
        <div className="pb-0.5">
          <Button type="submit" variant="primary" size="sm">
            Tarik Data
          </Button>
        </div>
      </form>

      {/* Error submit */}
      {submitError && (
        <div role="alert" className="p-3 text-[14px] text-danger border border-danger">
          {submitError}
        </div>
      )}

      {/* Grid Tabel */}
      <div className="w-full overflow-x-auto border border-line">
        <table className="w-full border-collapse text-[14px]">
          <colgroup>
            <col className="w-12" />
            <col className="w-[130px]" />
            <col />
            <col className="w-[160px]" />
            <col className="w-[180px]" />
            <col className="w-[140px]" />
            <col className="w-[100px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line-strong bg-canvas">
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-right">No</th>
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-left">Tanggal</th>
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-left">Jenis Pengeluaran</th>
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-right">Nominal</th>
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-left">Catatan</th>
              <th className="px-3 py-2.5 h-10 font-semibold text-text text-left">Petugas</th>
              <th className="px-3 py-2.5 h-10"></th>
            </tr>
          </thead>
          <tbody>
            {/* Baris data */}
            {rows.length === 0 && !draft && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-3 font-[360]">
                  {tahunAjaranId || bulan
                    ? "Belum ada data untuk filter yang dipilih."
                    : "Belum ada data pengeluaran."}
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <DataRow
                key={row.id}
                row={row}
                nomor={(page - 1) * 50 + idx + 1}
                onDelete={() => router.refresh()}
              />
            ))}

            {/* Baris draft (input baru) */}
            {draft !== null && (
              <tr className="border-b border-line bg-[var(--color-panel)]">
                <td className="px-3 py-1 text-right text-text-3 num">{rows.length + 1}</td>
                {KOLOM.map((kolom) => (
                  <td key={kolom.id} className={`px-0 py-0 ${kolom.align ?? ""}`}>
                    <input
                      ref={(el) => { cellRefs.current[`draft-${kolom.id}`] = el; }}
                      type="text"
                      value={draft[kolom.id]}
                      onChange={(e) => updateDraft(kolom.id, e.target.value)}
                      onKeyDown={(e) => handleCellKeyDown(e, kolom.id)}
                      onFocus={() => setActiveCol(kolom.id)}
                      placeholder={
                        kolom.id === "tanggal"
                          ? "DD-MM-YYYY"
                          : kolom.id === "nominal"
                          ? "1.000.000"
                          : ""
                      }
                      disabled={isSubmitting}
                      className={`w-full h-10 px-3 py-2 bg-transparent text-[14px] text-text font-[360] border-2 focus:outline-none ${
                        kolom.id === "nominal" ? "text-right num" : ""
                      } ${
                        activeCol === kolom.id
                          ? "border-accent"
                          : "border-transparent"
                      } focus:border-accent`}
                      aria-label={kolom.label}
                    />
                  </td>
                ))}
                <td className="px-0"></td>
                <td className="px-2 py-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={simpanDraft}
                      disabled={isSubmitting}
                      className="px-2 py-1 text-[12px] font-[500] text-accent border border-accent hover:bg-panel disabled:opacity-40"
                      title="Simpan (Enter)"
                    >
                      {isSubmitting ? "…" : "Simpan"}
                    </button>
                    <button
                      type="button"
                      onClick={batalDraft}
                      disabled={isSubmitting}
                      className="px-2 py-1 text-[12px] font-[500] text-text-3 border border-line hover:bg-panel disabled:opacity-40"
                      title="Batal (Esc)"
                    >
                      Batal
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tombol Tambah Baris (di bawah tabel) */}
      {draft === null && (
        <div>
          <button
            type="button"
            onClick={tambahBaris}
            className="text-[14px] text-accent font-[500] hover:underline underline-offset-2"
          >
            + Tambah Baris
          </button>
        </div>
      )}

      {/* Keterangan keyboard */}
      {draft !== null && (
        <p className="text-[13px] text-text-3">
          Enter — pindah sel / simpan &nbsp;·&nbsp; Tab — pindah sel &nbsp;·&nbsp; Esc — batal
        </p>
      )}

      {/* Paginasi */}
      {total > 50 && (
        <div className="flex items-center gap-4 text-[14px] text-text-3 pt-2">
          <span className="num">{total} baris</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => router.push(buildUrl({ tahunAjaranId, bulan, page: page - 1 }))}
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
              onClick={() => router.push(buildUrl({ tahunAjaranId, bulan, page: page + 1 }))}
            >
              Berikutnya →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Baris data read-only ────────────────────────────────────────────────────

function DataRow({
  row,
  nomor,
  onDelete,
}: {
  row: PengeluaranRow;
  nomor: number;
  onDelete: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await hapusPengeluaranAction(_prev, fd);
      if (result.success) onDelete();
      return result;
    },
    null
  );

  // Format tanggal UTC ke dd-mm-yyyy
  const tanggalFormatted = (() => {
    const d = new Date(row.tanggal);
    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  })();

  return (
    <tr className="border-b border-line h-10 hover:bg-panel group">
      <td className="px-3 py-2 text-right text-text-3 num tabular-nums">{nomor}</td>
      <td className="px-3 py-2 text-text-2 num">{tanggalFormatted}</td>
      <td className="px-3 py-2 text-text font-[360]">{row.jenis}</td>
      <td className="px-3 py-2 text-right text-text num">{row.nominalFormatted}</td>
      <td className="px-3 py-2 text-text-3">{row.catatan ?? "—"}</td>
      <td className="px-3 py-2 text-text-2">{row.petugasNama}</td>
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
