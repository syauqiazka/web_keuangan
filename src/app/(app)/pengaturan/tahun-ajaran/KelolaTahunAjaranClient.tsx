"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { BackLink } from "@/components/ui/BackLink";
import { useToast } from "@/components/ui/Toast";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import type { TahunAjaranItem, KelasItem } from "@/server/queries/tahun-ajaran";
import {
  tambahTahunAjaranAction,
  setTahunAjaranAktifAction,
  tambahMasterKelasAction,
} from "@/server/actions/tahun-ajaran";
import {
  Calendar,
  GraduationCap,
  CheckCircle2,
  Plus,
  Layers,
  Clock,
  Users,
} from "lucide-react";

interface KelolaTahunAjaranClientProps {
  tahunAjaranList: TahunAjaranItem[];
  kelasList: KelasItem[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function KelolaTahunAjaranClient({
  tahunAjaranList,
  kelasList,
}: KelolaTahunAjaranClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Modal Tambah Tahun Ajaran
  const [modalTaOpen, setModalTaOpen] = useState(false);
  const [taNama, setTaNama] = useState("");
  const [taMulai, setTaMulai] = useState("");
  const [taSelesai, setTaSelesai] = useState("");
  const [taAktif, setTaAktif] = useState(false);
  const [taError, setTaError] = useState("");

  // Modal Tambah Kelas
  const [modalKelasOpen, setModalKelasOpen] = useState(false);
  const [kelasNama, setKelasNama] = useState("");
  const [kelasUrutan, setKelasUrutan] = useState("10");
  const [kelasError, setKelasError] = useState("");

  const handleTambahTa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaError("");

    startTransition(async () => {
      const res = await tambahTahunAjaranAction({
        nama: taNama,
        mulai: taMulai,
        selesai: taSelesai,
        aktif: taAktif,
      });

      if (!res.success) {
        setTaError(res.error ?? "Gagal menambahkan tahun ajaran.");
      } else {
        showToast(`Tahun ajaran "${taNama}" berhasil ditambahkan.`, "success");
        setModalTaOpen(false);
        setTaNama("");
        setTaMulai("");
        setTaSelesai("");
        setTaAktif(false);
        router.refresh();
      }
    });
  };

  const handleSetAktif = (ta: TahunAjaranItem) => {
    const confirmSwitch = window.confirm(
      `Apakah Anda yakin ingin menetapkan "${ta.nama}" sebagai Tahun Ajaran Aktif saat ini? Seluruh pencatatan dan filter awal akan dialihkan ke periode ini.`
    );
    if (!confirmSwitch) return;

    startTransition(async () => {
      const res = await setTahunAjaranAktifAction(ta.id);
      if (!res.success) {
        showToast(res.error ?? "Gagal mengaktifkan tahun ajaran.", "error");
      } else {
        showToast(`Tahun ajaran "${ta.nama}" kini berstatus Aktif.`, "success");
        router.refresh();
      }
    });
  };

  const handleTambahKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    setKelasError("");

    startTransition(async () => {
      const urutanNum = parseInt(kelasUrutan, 10) || 0;
      const res = await tambahMasterKelasAction({
        nama: kelasNama,
        urutan: urutanNum,
      });

      if (!res.success) {
        setKelasError(res.error ?? "Gagal menambahkan kelas.");
      } else {
        showToast(`Kelas "${kelasNama}" berhasil ditambahkan.`, "success");
        setModalKelasOpen(false);
        setKelasNama("");
        setKelasUrutan("10");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header + Navigasi Kembali */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <div className="mb-2">
              <BackLink href="/pengaturan" label="Kembali ke Pengaturan" />
            </div>
            <h1 className="text-[22px] lg:text-[26px] font-semibold text-text tracking-tight">
              Pengelolaan Tahun Ajaran & Kelas
            </h1>
            <p className="text-[13px] text-text-3 mt-1">
              Atur periode tahun ajaran aktif, tanggal kalender akademik, dan data master tingkatan kelas sekolah.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setModalTaOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Tahun Ajaran
            </Button>
          </div>
        </div>
      </BlurReveal>

      {/* Bagian 1: Daftar Tahun Ajaran */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand" />
            <h2 className="text-[16px] font-semibold text-text">Daftar Periode Tahun Ajaran</h2>
          </div>
          <span className="text-[12px] text-text-3 font-medium">
            Hanya 1 periode berstatus aktif dalam satu waktu
          </span>
        </div>

        <StaggerGroup blur={6} duration={0.6} className="bg-surface border border-line rounded-[12px] divide-y divide-line shadow-xs overflow-hidden" staggerDelay={0.06}>
          {tahunAjaranList.length === 0 ? (
            <div className="p-8 text-center text-text-3 text-[13px]">
              Belum ada tahun ajaran yang terdaftar. Klik &ldquo;Tambah Tahun Ajaran&rdquo; untuk mulai membuat.
            </div>
          ) : (
            tahunAjaranList.map((ta) => (
              <StaggerItem key={ta.id}>
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-[8px] border flex items-center justify-center shrink-0 mt-0.5 ${
                        ta.aktif
                          ? "bg-brand/10 border-brand/30 text-brand font-semibold"
                          : "bg-panel border-line text-text-3"
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-[15px] font-semibold text-text">
                          Tahun Ajaran {ta.nama}
                        </h3>
                        {ta.aktif ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-soft border border-brand/30 text-brand">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tahun Ajaran Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-panel text-text-3">
                            <Clock className="w-3 h-3" />
                            Periode Riwayat
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[12px] text-text-3 mt-1.5">
                        <span>
                          Mulai: <strong>{formatDate(ta.mulai)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Selesai: <strong>{formatDate(ta.selesai)}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-text-3" />
                          <span>{ta.totalSiswa} siswa terdaftar</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!ta.aktif ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSetAktif(ta)}
                      >
                        Jadikan Tahun Ajaran Aktif
                      </Button>
                    ) : (
                      <span className="text-[12px] font-medium text-brand px-3 py-1 bg-surface-soft rounded-[6px] border border-brand/20">
                        Sedang Digunakan
                      </span>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))
          )}
        </StaggerGroup>
      </div>

      {/* Bagian 2: Data Master Kelas */}
      <div className="space-y-4 pt-4 border-t border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand" />
            <h2 className="text-[16px] font-semibold text-text">Data Master Kelas</h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setModalKelasOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah Kelas Baru
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {kelasList.map((k) => (
            <div
              key={k.id}
              className="bg-surface border border-line rounded-[10px] p-4 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-panel border border-line flex items-center justify-center text-text font-semibold text-[14px]">
                  <Layers className="w-4 h-4 text-text-3" />
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-text">{k.nama}</h4>
                  <p className="text-[11px] text-text-3 mt-0.5">
                    Tingkat urutan: {k.urutan}
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-medium text-text-3 bg-panel px-2.5 py-1 rounded-[6px]">
                {k.totalSiswa} siswa
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog Tambah Tahun Ajaran */}
      <Dialog
        open={modalTaOpen}
        title="Tambah Tahun Ajaran Baru"
        onClose={() => setModalTaOpen(false)}
      >
        <form onSubmit={handleTambahTa} className="space-y-4">
          <Input
            id="ta-nama"
            name="nama"
            label="Nama Periode Tahun Ajaran"
            placeholder="Contoh: 2026/2027 atau 2027/2028"
            value={taNama}
            onChange={(e) => setTaNama(e.target.value)}
            required
            helperText="Format standar umum sekolah: YYYY/YYYY"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="ta-mulai"
              name="mulai"
              label="Tanggal Mulai (YYYY-MM-DD)"
              placeholder="Contoh: 2026-07-01"
              value={taMulai}
              onChange={(e) => setTaMulai(e.target.value)}
              required
            />
            <Input
              id="ta-selesai"
              name="selesai"
              label="Tanggal Selesai (YYYY-MM-DD)"
              placeholder="Contoh: 2027-06-30"
              value={taSelesai}
              onChange={(e) => setTaSelesai(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-surface-soft border border-brand/20 rounded-[8px] flex items-start gap-2.5">
            <input
              type="checkbox"
              id="ta-aktif"
              checked={taAktif}
              onChange={(e) => setTaAktif(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand/30 cursor-pointer"
            />
            <label htmlFor="ta-aktif" className="text-[13px] text-text cursor-pointer leading-snug">
              <strong>Tetapkan langsung sebagai Tahun Ajaran Aktif</strong>
              <span className="block text-text-3 text-[12px] mt-0.5">
                Jika dicentang, sistem akan menonaktifkan tahun ajaran sebelumnya secara otomatis.
              </span>
            </label>
          </div>

          {taError && <p className="text-[13px] text-danger">{taError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalTaOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan Tahun Ajaran"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog Tambah Master Kelas */}
      <Dialog
        open={modalKelasOpen}
        title="Tambah Data Master Kelas"
        onClose={() => setModalKelasOpen(false)}
      >
        <form onSubmit={handleTambahKelas} className="space-y-4">
          <Input
            id="kelas-nama"
            name="nama"
            label="Nama Kelas"
            placeholder="Contoh: Kelas 10, Kelas 10-A, Kelas 11"
            value={kelasNama}
            onChange={(e) => setKelasNama(e.target.value)}
            required
          />
          <Input
            id="kelas-urutan"
            name="urutan"
            label="Nomor Urutan (Angka)"
            placeholder="Contoh: 10, 11, atau 12"
            value={kelasUrutan}
            onChange={(e) => setKelasUrutan(e.target.value)}
            type="number"
            required
            helperText="Digunakan untuk mengurutkan tingkatan kelas di tabel dan filter."
          />

          {kelasError && <p className="text-[13px] text-danger">{kelasError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalKelasOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan Kelas"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
