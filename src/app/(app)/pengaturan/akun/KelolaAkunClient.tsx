"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import {
  buatAkunAction,
  resetPasswordAction,
  nonaktifkanAkunAction,
  aktifkanAkunAction,
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
    <tr className={`border-b border-line h-10 ${!akun.aktif ? "opacity-50" : ""}`}>
      <td className="px-3 py-2 text-text font-[500]">{akun.kode}</td>
      <td className="px-3 py-2 text-text">{akun.nama}</td>
      <td className="px-3 py-2 text-text-2">
        {akun.peran === "ADMIN" ? "Admin" : "Petugas"}
      </td>
      <td className="px-3 py-2">
        <span
          className={`text-[12px] font-[500] ${
            akun.aktif ? "text-accent" : "text-text-3"
          }`}
        >
          {akun.aktif ? "Aktif" : "Nonaktif"}
        </span>
        {akun.wajibGantiPassword && akun.aktif && (
          <span className="ml-2 text-[11px] text-label">Wajib ganti sandi</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setDialogResetOpen(true)}
            className="text-[12px] text-accent hover:underline"
          >
            Reset Sandi
          </button>
          {!isCurrentUser && (
            <form action={toggleAction} className="inline">
              <input type="hidden" name="penggunaId" value={akun.id} />
              <button
                type="submit"
                disabled={isPendingToggle}
                className={`text-[12px] hover:underline disabled:opacity-40 ${
                  akun.aktif ? "text-danger" : "text-accent"
                }`}
              >
                {akun.aktif ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </form>
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
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-line">
        <Link
          href="/pengaturan"
          className="text-[14px] text-text-3 hover:text-text"
        >
          ← Pengaturan
        </Link>
        <span className="text-text-3">/</span>
        <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25]">
          Kelola Akun
        </h1>
      </div>

      {/* Tombol buat akun */}
      <div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setDialogBuatOpen(true)}
        >
          + Buat Akun
        </Button>
      </div>

      {/* Tabel akun */}
      <div className="border border-line overflow-x-auto">
        <table className="w-full border-collapse text-[14px]">
          <colgroup>
            <col className="w-[120px]" />
            <col />
            <col className="w-[100px]" />
            <col className="w-[160px]" />
            <col className="w-[200px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line-strong bg-canvas">
              <th className="px-3 py-2.5 font-semibold text-text text-left">Kode</th>
              <th className="px-3 py-2.5 font-semibold text-text text-left">Nama</th>
              <th className="px-3 py-2.5 font-semibold text-text text-left">Peran</th>
              <th className="px-3 py-2.5 font-semibold text-text text-left">Status</th>
              <th className="px-3 py-2.5 font-semibold text-text text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {akunList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-3">
                  Belum ada akun.
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

      <p className="text-[13px] text-text-3">
        Akun tidak dapat dihapus permanen. Gunakan &quot;Nonaktifkan&quot; untuk mencabut akses.
      </p>

      {/* Dialog buat akun */}
      <DialogBuatAkun
        open={dialogBuatOpen}
        onClose={() => setDialogBuatOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
