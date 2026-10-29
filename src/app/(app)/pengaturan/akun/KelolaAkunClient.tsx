"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { Plus, KeyRound, UserX, UserCheck, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
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
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await buatAkunAction(_prev, fd);
      if (result.success) { onSuccess(); onClose(); }
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
        <Input
          id="buat-password"
          name="password"
          label="Kata Sandi Awal"
          type="password"
          placeholder="Minimal 8 karakter"
          required
          helperText="Pengguna akan diminta mengganti kata sandi saat pertama login."
          error={state?.fieldErrors?.password}
        />
        {state?.error && !state.fieldErrors && (
          <p className="text-[14px] text-danger">{state.error}</p>
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
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await resetPasswordAction(_prev, fd);
      if (result.success) { onSuccess(); onClose(); }
      return result;
    },
    null
  );

  return (
    <Dialog
      open={open}
      title={`Atur Ulang Kata Sandi — ${akun.nama}`}
      onClose={onClose}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="penggunaId" value={akun.id} />
        <p className="text-[14px] text-text-3">
          Kata sandi baru akan ditetapkan untuk akun{" "}
          <strong className="text-text">{akun.kode}</strong>. Pengguna akan
          diminta mengganti kata sandi saat login berikutnya.
        </p>
        <Input
          id="reset-password"
          name="passwordBaru"
          label="Kata Sandi Baru"
          type="password"
          placeholder="Minimal 8 karakter"
          required
        />
        {state?.error && (
          <p className="text-[14px] text-danger">{state.error}</p>
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

// ─── Dialog Hapus Akun ────────────────────────────────────────────

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
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await hapusAkunAction(_prev, fd);
      if (result.success) {
        onSuccess();
        onClose();
      }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} title={`Hapus Akun — ${akun.nama}`} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="penggunaId" value={akun.id} />
        
        <div className="flex items-start gap-3 p-3.5 rounded-[10px] bg-danger/5 border border-danger/25 text-danger">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
          <div className="text-[13px] leading-relaxed text-text">
            Apakah Anda yakin ingin menghapus akun <strong className="text-text">{akun.nama}</strong> ({akun.kode}) secara permanen?
            <p className="mt-1 text-[12px] text-text-3">
              Catatan: Akun hanya dapat dihapus jika belum memiliki riwayat pencatatan transaksi keuangan. Jika sudah memiliki transaksi, sistem akan meminta Anda untuk menonaktifkannya.
            </p>
          </div>
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
          <Button type="submit" variant="danger-solid" disabled={isPending}>
            {isPending ? "Menghapus…" : "Hapus Akun Permanen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Baris Akun ───────────────────────────────────────────────────

function BahanAkun({
  akun,
  isCurrentUser,
  onMutate,
}: {
  akun: AkunRow;
  isCurrentUser: boolean;
  onMutate: () => void;
}) {
  const [dialogResetOpen, setDialogResetOpen] = useState(false);
  const [dialogHapusOpen, setDialogHapusOpen] = useState(false);

  const [stateToggle, toggleAction, isPendingToggle] = useActionState<
    ActionState | null,
    FormData
  >(
    async (_prev, fd) => {
      const result = akun.aktif
        ? await nonaktifkanAkunAction(_prev, fd)
        : await aktifkanAkunAction(_prev, fd);
      if (result.success) onMutate();
      return result;
    },
    null
  );

  return (
    <tr className={`border-b border-line h-11 hover:bg-panel/40 transition-colors ${!akun.aktif ? "opacity-60 bg-panel/20" : ""}`}>
      <td className="px-4 py-2 text-text font-mono text-[13px] font-medium">{akun.kode}</td>
      <td className="px-4 py-2 text-text font-medium text-[13px]">{akun.nama}</td>
      <td className="px-4 py-2">
        <span
          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-[4px] tracking-[0.05em] uppercase ${
            akun.peran === "ADMIN"
              ? "bg-brand/10 text-brand font-medium border border-brand/20"
              : "bg-panel text-text-2 border border-line"
          }`}
        >
          {akun.peran === "ADMIN" ? "Admin" : "Petugas"}
        </span>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-medium">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                akun.aktif ? "bg-series-in" : "bg-text-3"
              }`}
            />
            <span className={akun.aktif ? "text-series-in" : "text-text-3"}>
              {akun.aktif ? "Aktif" : "Nonaktif"}
            </span>
          </span>
          {akun.wajibGantiPassword && akun.aktif && (
            <span className="text-[11px] text-label bg-label/10 px-1.5 py-0.5 rounded">
              Wajib ganti sandi
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDialogResetOpen(true)}
            className="text-[12px] text-brand hover:bg-brand/10"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Sandi</span>
          </Button>

          {!isCurrentUser && (
            <>
              <form
                action={toggleAction}
                className="inline"
                onSubmit={(e) => {
                  const aksi = akun.aktif ? "menonaktifkan" : "mengaktifkan kembali";
                  if (!window.confirm(`Apakah Anda yakin ingin ${aksi} akun petugas "${akun.nama}" (${akun.kode})?`)) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="penggunaId" value={akun.id} />
                {akun.aktif ? (
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={isPendingToggle}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>{isPendingToggle ? "Memproses…" : "Nonaktifkan"}</span>
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="outline-brand"
                    size="sm"
                    disabled={isPendingToggle}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isPendingToggle ? "Memproses…" : "Aktifkan"}</span>
                  </Button>
                )}
              </form>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDialogHapusOpen(true)}
                className="text-[12px] text-danger hover:bg-danger/10"
                title="Hapus akun"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </Button>
            </>
          )}

          {stateToggle?.error && (
            <span className="text-[11px] text-danger">{stateToggle.error}</span>
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
      {/* Header dengan Atmos blur-to-sharp reveal */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/pengaturan">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-[12px] h-8 px-2.5 font-medium shadow-2xs hover:border-line-strong"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Pengaturan</span>
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-2 text-[12px] text-text-3">
                <Link href="/pengaturan" className="hover:text-text transition-colors">
                  Pengaturan
                </Link>
                <span>/</span>
                <span className="text-text font-medium">Kelola Akun</span>
              </div>
            </div>
            <h1 className="text-[24px] lg:text-[28px] font-semibold text-text tracking-tight">
              Manajemen Akun Petugas
            </h1>
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
                <col className="w-[280px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line bg-panel/60 text-text-2">
                  <th className="px-4 py-2.5 font-semibold text-left">Kode Akun</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Nama Petugas</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Peran</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Aksi</th>
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
                  <BahanAkun
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

      <div className="p-3.5 rounded-[8px] bg-panel/50 border border-line text-[12px] text-text-3 leading-relaxed space-y-1">
        <p>
          <strong className="text-text font-medium">Kebijakan Keamanan Akun:</strong> Akun yang belum pernah mencatat transaksi dapat dihapus secara permanen.
        </p>
        <p>
          Untuk akun yang sudah memiliki riwayat pencatatan transaksi keuangan (SPP, bantuan, donatur, atau pengeluaran), akun tidak dapat dihapus permanen guna menjamin integritas audit data sekolah. Gunakan aksi &quot;Nonaktifkan&quot; untuk mencabut izin akses masuk.
        </p>
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

