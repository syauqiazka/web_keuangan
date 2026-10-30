
"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction, type ActionState } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function MasukPage() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    loginAction,
    null
  );

  return (
    <main className="min-h-screen bg-canvas text-text antialiased flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[360px] bg-surface border border-line rounded-[12px] p-6 sm:p-8 shadow-card">
        {/* Logo 56px */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-[12px] bg-panel flex items-center justify-center border border-line p-1 mb-4 shadow-2xs">
            <Image
              src="/logo-bank-saku-digital.jpeg"
              alt="Logo Bank Saku Digital"
              width={56}
              height={56}
              className="w-full h-full object-contain rounded-[8px]"
              priority
            />
          </div>
          <h1 className="text-[32px] font-semibold text-text tracking-tight text-center leading-none">
            Masuk
          </h1>
          <p className="text-[13px] text-text-3 text-center mt-2">
            Pencatatan Keuangan Sekolah | Bank Saku Digital
          </p>
        </div>

        {/* Galat Login */}
        {state?.error && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-[8px] text-[13px] text-danger border border-danger/25 bg-danger/5 flex items-start gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0 mt-[5px]" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Form Login */}
        <form action={formAction} className="space-y-4">
          <Input
            id="kode"
            name="kode"
            label="Kode"
            placeholder="Masukkan kode akun"
            autoComplete="username"
            required
            disabled={isPending}
          />

          <PasswordInput
            id="password"
            name="password"
            label="Kata sandi"
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            required
            disabled={isPending}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Memverifikasi…" : "Masuk"}
            </Button>
          </div>
        </form>

        {/* Footer info sesuai DESIGN.md */}
        <div className="mt-6 pt-4 border-t border-line text-center">
          <p className="text-[12px] text-text-3">
            Hubungi admin untuk mengatur ulang kata sandi.
          </p>
        </div>
      </div>
    </main>
  );
}
