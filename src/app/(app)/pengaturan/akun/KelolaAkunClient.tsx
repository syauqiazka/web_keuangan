"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { BackLink } from "@/components/ui/BackLink";
import { useToast } from "@/components/ui/Toast";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { Plus, KeyRound, UserX, UserCheck, Trash2, AlertTriangle } from "lucide-react";
import {
  buatAkunAction,
  resetPasswordAction,
  nonaktifkanAkunAction,
  aktifkanAkunAction,
  hapusAkunAction,
  type ActionState,
} from "@/server/actions/akun";
import type { AkunRow } from "@/server/queries/akun";

interface KelolaAkunClientProps {
  akunList: AkunRow[];
  currentUserId: string;
}

// ─── Dialog Buat Akun ─────────────────────────────────────────────

function DialogBuatAkun({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await buatAkunAction(_prev, fd);
      if (result.success) {
        showToast("Akun baru berhasil dibuat.", "success");
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
    <Dialog open={open} title="Buat Akun Baru" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <Input
          id="buat-kode"
          name="kode"
          label="Kode (dipakai untuk login)"
          placeholder="Contoh: reski01"
          required
          error={state?.fieldErrors?.kode}
        />
        <Input
          id="buat-nama"
          name="nama"
          label="Nama Lengkap"
          placeholder="Contoh: Bu Reski"
          required
          error={state?.fieldErrors?.nama}
        />
        <Select
          id="buat-peran"
          name="peran"
          label="Peran"
          options={[
            { value: "PETUGAS", label: "Petugas" },
            { value: "ADMIN", label: "Admin" },
          ]}
          error={state?.fieldErrors?.peran}
        />
        <PasswordInput
          id="buat-password"
          name="password"
          label="Kata Sandi Awal"
          placeholder="Minimal 8 karakter"
          autoComplete="new-password"
          resetVisibilityKey={open}
          required
          minLength={8}
          helperText="Pengguna akan diminta mengganti kata sandi saat pertama login."
          error={state?.fieldErrors?.password}
        />
        {state?.error && !state.fieldErrors && (
          <p className="text-[13px] text-danger">{state.error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Membuat…" : "Buat Akun"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Dialog Reset Password ────────────────────────────────────────

function DialogResetPassword({
  open,
  onClose,
  onSuccess,
  akun,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  akun: AkunRow;
}) {
  const { showToast } = useToast();
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await resetPasswordAction(_prev, fd);
      if (result.success) {
        showToast(`Kata sandi akun ${akun.kode} berhasil diatur ulang.`, "success");
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
    <Dialog open={open} title={`Reset Kata Sandi — ${akun.nama}`} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="penggunaId" value={akun.id} />
        <p className="text-[13px] text-text-3">
          Kata sandi baru akan ditetapkan untuk akun{" "}
          <strong className="text-text font-semibold">{akun.kode}</strong>. Pengguna akan
          diminta mengganti kata sandi saat login berikutnya.
        </p>
        <PasswordInput
          id="reset-password"
          name="passwordBaru"
          label="Kata Sandi Baru"
          placeholder="Minimal 8 karakter"
          autoComplete="new-password"
          resetVisibilityKey={open}
          required
          minLength={8}
        />
        {state?.error && (
          <p className="text-[13px] text-danger">{state.error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Menyimpan…" : "Atur Ulang"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Dialog Hapus Akun (Konfirmasi Ketik Kode) ─────────────────────

function DialogHapusAkun({
  open,
  onClose,
  onSuccess,
  akun,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  akun: AkunRow;
}) {
  const { showToast } = useToast();
  const [konfirmasiKode, setKonfirmasiKode] = useState("");
  const isCodeMatch = konfirmasiKode.trim() === akun.kode;

  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await hapusAkunAction(_prev, fd);
      if (result.success) {
        showToast(`Akun "${akun.nama}" (${akun.kode}) berhasil dihapus permanen.`, "success");
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
    <Dialog open={open} title={`Hapus Akun — ${akun.nama}`} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="penggunaId" value={akun.id} />

        <div className="flex items-start gap-3 p-3.5 rounded-[10px] bg-danger/10 border border-danger/30 text-danger">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
          <div className="text-[13px] leading-relaxed text-text">
            <span className="font-semibold text-danger block mb-0.5">Tindakan ini permanen.</span>
            Apakah Anda yakin ingin menghapus akun <strong className="text-text font-semibold">{akun.nama}</strong> (kode: <span className="font-mono font-medium">{akun.kode}</span>)? Seluruh riwayat sesi login akun ini akan dihapus secara permanen.
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label htmlFor="konfirmasi-kode-hapus" className="text-[13px] font-medium text-text select-none block">
            Ketik kode akun <strong className="text-danger font-mono font-bold select-all">{akun.kode}</strong> untuk mengonfirmasi penghapusan:
          </label>
          <Input
            id="konfirmasi-kode-hapus"
            value={konfirmasiKode}
            onChange={(e) => setKonfirmasiKode(e.target.value)}
            placeholder={`Ketik "${akun.kode}"`}
            autoComplete="off"
            required
            className="font-mono text-[13px]"
          />
        </div>

        {state?.error && (
          <div className="p-3 rounded-[8px] bg-danger/10 border border-danger/30 text-[13px] text-danger">
            {state.error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="danger-solid"
            disabled={!isCodeMatch || isPending}
          >
            {isPending ? "Menghapus…" : "Hapus Akun Permanen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Baris Akun ───────────────────────────────────────────────────

function BarisAkun({
  akun,
  isCurrentUser,
  onMutate,
}: {
  akun: AkunRow;
  isCurrentUser: boolean;
  onMutate: () => void;
}) {
  const { showToast } = useToast();
  const [dialogResetOpen, setDialogResetOpen] = useState(false);
  const [dialogHapusOpen, setDialogHapusOpen] = useState(false);
  const [dialogToggleOpen, setDialogToggleOpen] = useState(false);

  const [, toggleAction, isPendingToggle] = useActionState<
    ActionState | null,
    FormData
  >(
    async (_prev, fd) => {
      const result = akun.aktif
        ? await nonaktifkanAkunAction(_prev, fd)
        : await aktifkanAkunAction(_prev, fd);
      if (result.success) {
        showToast(
          akun.aktif
            ? `Akun ${akun.nama} telah dinonaktifkan.`
            : `Akun ${akun.nama} berhasil diaktifkan kembali.`,
          "success"
        );
        onMutate();
      } else if (result.error) {
        showToast(result.error, "error");
      }
      return result;
    },
    null
  );

  const hasTransactions = akun.totalTransaksi > 0;

  return (
    <tr className={`border-b border-line hover:bg-panel/40 transition-colors ${!akun.aktif ? "opacity-60 bg-panel/20" : ""}`}>
      <td className="px-4 py-3 text-text font-mono text-[13px] font-semibold">{akun.kode}</td>
      <td className="px-4 py-3 text-text font-medium text-[13px]">{akun.nama}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-[4px] tracking-[0.05em] uppercase ${
            akun.peran === "ADMIN"
              ? "bg-setting-soft text-setting-text border border-setting-border"
              : "bg-panel text-text-2 border border-line"
          }`}
        >
          {akun.peran === "ADMIN" ? "Admin" : "Petugas"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-[12px] font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                akun.aktif ? "bg-series-in" : "bg-text-3"
              }`}
            />
            <span className={akun.aktif ? "text-series-in font-semibold" : "text-text-3"}>
              {akun.aktif ? "Aktif" : "Nonaktif"}
            </span>
          </span>
          {akun.wajibGantiPassword && akun.aktif && (
            <span className="text-[11px] font-medium text-gold-text bg-gold-soft border border-gold-border px-1.5 py-0.5 rounded">
              Wajib ganti sandi
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {/* Kolom Aksi dalam satu baris rapi dengan tinggi seragam */}
        <div className="flex items-center gap-2 flex-nowrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDialogResetOpen(true)}
            className="h-8 text-[12px] text-setting-text hover:bg-setting-soft px-2.5 gap-1 shrink-0"
            title="Reset kata sandi petugas"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Sandi</span>
          </Button>

          {isCurrentUser ? (
            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-[6px] bg-panel text-text-3 border border-line shrink-0">
              Akun Anda
            </span>
          ) : (
            <>
              {akun.aktif ? (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="h-8 text-[12px] px-2.5 gap-1 shrink-0"
                  disabled={isPendingToggle}
                  onClick={() => setDialogToggleOpen(true)}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Nonaktifkan</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline-brand"
                  size="sm"
                  className="h-8 text-[12px] px-2.5 gap-1 shrink-0"
                  disabled={isPendingToggle}
                  onClick={() => setDialogToggleOpen(true)}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Aktifkan</span>
                </Button>
              )}

              {/* Dialog Konfirmasi Nonaktifkan / Aktifkan */}
              <Dialog
                open={dialogToggleOpen}
                onClose={() => !isPendingToggle && setDialogToggleOpen(false)}
                title={akun.aktif ? "Nonaktifkan Akun Petugas" : "Aktifkan Kembali Akun"}
              >
                <div className="space-y-4">
                  <p className="text-[14px] text-text-2 leading-relaxed">
                    Apakah Anda yakin ingin {akun.aktif ? "menonaktifkan" : "mengaktifkan kembali"} akun petugas{" "}
                    <strong className="text-text">{akun.nama}</strong> ({akun.kode})?
                  </p>
                  {akun.aktif && (
                    <p className="text-[12px] text-text-3 leading-relaxed">
                      Petugas tidak akan dapat masuk ke sistem selama akun dinonaktifkan. Riwayat transaksi tetap aman tersimpan.
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-2 border-t border-line">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isPendingToggle}
                      onClick={() => setDialogToggleOpen(false)}
                    >
                      Batal
                    </Button>
                    <form
                      action={async (fd) => {
                        await toggleAction(fd);
                        setDialogToggleOpen(false);
                      }}
                    >
                      <input type="hidden" name="penggunaId" value={akun.id} />
                      <Button
                        type="submit"
                        variant={akun.aktif ? "danger-solid" : "primary"}
                        disabled={isPendingToggle}
                      >
                        {isPendingToggle
                          ? "Memproses…"
                          : akun.aktif
                          ? "Nonaktifkan Akun"
                          : "Aktifkan Akun"}
                      </Button>
                    </form>
                  </div>
                </div>
              </Dialog>

              {hasTransactions ? (
                <div
                  className="inline-flex items-center"
                  title={`Punya ${akun.totalTransaksi} transaksi, gunakan Nonaktifkan`}
                >
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled
                    className="h-8 text-[12px] px-2.5 gap-1 opacity-50 cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setDialogHapusOpen(true)}
                  className="h-8 text-[12px] px-2.5 gap-1 shrink-0"
                  title="Hapus akun permanen (belum memiliki transaksi)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </Button>
              )}
            </>
          )}
        </div>

        {dialogResetOpen && (
          <DialogResetPassword
            open={dialogResetOpen}
            onClose={() => setDialogResetOpen(false)}
            onSuccess={onMutate}
            akun={akun}
          />
        )}

        {dialogHapusOpen && (
          <DialogHapusAkun
            open={dialogHapusOpen}
            onClose={() => setDialogHapusOpen(false)}
            onSuccess={onMutate}
            akun={akun}
          />
        )}
      </td>
    </tr>
  );
}

// ─── Komponen Utama ───────────────────────────────────────────────

export function KelolaAkunClient({
  akunList,
  currentUserId,
}: KelolaAkunClientProps) {
  const router = useRouter();
  const [dialogBuatOpen, setDialogBuatOpen] = useState(false);

  const refresh = () => router.refresh();

  return (
    <div className="space-y-6">
      {/* Header dengan BackLink dan Atmos blur-to-sharp reveal */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <div className="mb-2">
              <BackLink href="/pengaturan" label="Kembali ke Pengaturan" />
            </div>
            <div className="flex items-center gap-2 text-[12px] text-text-3 mb-1">
              <Link href="/pengaturan" className="hover:text-text transition-colors">
                Pengaturan
              </Link>
              <span>/</span>
              <span className="text-text font-medium">Kelola Akun</span>
            </div>
            <h1 className="text-[24px] lg:text-[28px] font-semibold text-text tracking-tight">
              Manajemen Akun Petugas
            </h1>
            <p className="text-[13px] text-text-3 mt-1">
              Daftar akun admin dan petugas sekolah yang memiliki akses sistem keuangan.
            </p>
          </div>
          <Button
            type="button"
            variant="outline-brand"
            size="md"
            onClick={() => setDialogBuatOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Buat Akun Baru</span>
          </Button>
        </div>
      </BlurReveal>

      {/* Tabel akun dengan blur reveal */}
      <BlurReveal blur={6} delay={0.12} duration={0.65}>
        <div className="bg-surface border border-line rounded-[12px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <colgroup>
                <col className="w-[120px]" />
                <col />
                <col className="w-[120px]" />
                <col className="w-[180px]" />
                <col className="w-[320px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-setting-border bg-setting-soft/70 text-setting-text">
                  <th className="px-4 py-3 font-semibold text-left">Kode Akun</th>
                  <th className="px-4 py-3 font-semibold text-left">Nama Petugas</th>
                  <th className="px-4 py-3 font-semibold text-left">Peran</th>
                  <th className="px-4 py-3 font-semibold text-left">Status</th>
                  <th className="px-4 py-3 font-semibold text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {akunList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-text-3">
                      Belum ada akun terdaftar.
                    </td>
                  </tr>
                )}
                {akunList.map((akun) => (
                  <BarisAkun
                    key={akun.id}
                    akun={akun}
                    isCurrentUser={akun.id === currentUserId}
                    onMutate={refresh}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </BlurReveal>

      <div className="p-3.5 rounded-[8px] bg-panel/50 border border-line text-[12px] text-text-3 leading-relaxed">
        Akun yang pernah mencatat transaksi tidak dapat dihapus (menjaga integritas audit); gunakan Nonaktifkan. Akun tanpa transaksi dapat dihapus permanen.
      </div>

      {/* Dialog buat akun */}
      <DialogBuatAkun
        open={dialogBuatOpen}
        onClose={() => setDialogBuatOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
