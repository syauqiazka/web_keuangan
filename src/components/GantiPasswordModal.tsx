"use client";

import { useActionState, useEffect } from "react";
import { gantiPasswordAction, type ActionState } from "@/server/actions/auth";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface GantiPasswordModalProps {
  open: boolean;
  isWajib?: boolean;
  onClose?: () => void;
}

export function GantiPasswordModal({
  open,
  isWajib = false,
  onClose,
}: GantiPasswordModalProps) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    gantiPasswordAction,
    null
  );

  const isSuccess = state?.success;

  useEffect(() => {
    if (isSuccess && onClose) {
      onClose();
    }
  }, [isSuccess, onClose]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={isWajib ? undefined : onClose}
      title="Ganti Kata Sandi"
      description={
        isWajib
          ? "Akun Anda memerlukan penggantian kata sandi sebelum dapat melanjutkan."
          : "Perbarui kata sandi akun Anda."
      }
    >
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div
            role="alert"
            className="p-3 rounded-[4px] text-[13px] text-danger border border-danger/30 bg-danger/5"
          >
            {state.error}
          </div>
        )}

        <div>
          <Input
            id="passwordLama"
            name="passwordLama"
            type="password"
            label="Kata sandi saat ini"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Input
            id="passwordBaru"
            name="passwordBaru"
            type="password"
            label="Kata sandi baru (minimal 8 karakter)"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Input
            id="konfirmasiPassword"
            name="konfirmasiPassword"
            type="password"
            label="Konfirmasi kata sandi baru"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          {!isWajib && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Batal
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Menyimpan…" : "Simpan Kata Sandi"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
