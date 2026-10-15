"use client";

import { useActionState, useRef } from "react";
import { tambahAnggotaAction, type ActionState } from "@/server/actions/anggota";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";

interface InputAnggotaDialogProps {
  open: boolean;
  onClose: () => void;
  tahunAjaranList: SelectOption[];
  kelasList: SelectOption[];
  onSuccess: () => void;
}

export function InputAnggotaDialog({
  open,
  onClose,
  tahunAjaranList,
  kelasList,
  onSuccess,
}: InputAnggotaDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (_prev, fd) => {
      const result = await tambahAnggotaAction(_prev, fd);
      if (result.success) {
        formRef.current?.reset();
        onSuccess();
        onClose();
      }
      return result;
    },
    null
  );

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onClose}
      title="Tambah Anggota"
      description="Isi data siswa atau guru baru."
    >
      <form ref={formRef} action={formAction} className="space-y-4">
        {state?.error && (
          <div role="alert" className="p-3 text-[14px] text-danger border border-danger">
            {state.error}
          </div>
        )}

        <Select
          id="tipe"
          name="tipe"
          label="Tipe"
          error={state?.fieldErrors?.tipe}
          options={[
            { value: "SISWA", label: "Siswa" },
            { value: "GURU", label: "Guru" },
          ]}
          disabled={isPending}
        />

        <Input
          id="nama"
          name="nama"
          label="Nama"
          placeholder="Nama lengkap"
          required
          error={state?.fieldErrors?.nama}
          disabled={isPending}
        />

        <Input
          id="uid"
          name="uid"
          label="Kode UID"
          placeholder="Otomatis jika dikosongkan"
          helperText="Kosongkan untuk pembuatan otomatis (mis. SW-1234)"
          error={state?.fieldErrors?.uid}
          disabled={isPending}
          className="font-mono"
        />

        {tahunAjaranList.length > 0 && (
          <Select
            id="tahunAjaranId"
            name="tahunAjaranId"
            label="Tahun Ajaran (wajib untuk siswa)"
            options={[{ value: "", label: "— Pilih Tahun Ajaran —" }, ...tahunAjaranList]}
            disabled={isPending}
          />
        )}

        {kelasList.length > 0 && (
          <Select
            id="kelasId"
            name="kelasId"
            label="Kelas (wajib untuk siswa)"
            options={[{ value: "", label: "— Pilih Kelas —" }, ...kelasList]}
            disabled={isPending}
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
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
