"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction, type ActionState } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function MasukPage() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    loginAction,
    null
  );

  return (
    <main className="min-h-screen bg-canvas text-text flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] flex flex-col items-center">
        {/* Logo 56px */}
        <div className="mb-6">
          <Image
            src="/logo-bank-saku-digital.jpeg"
            alt="Logo Bank Saku Digital"
            width={56}
            height={56}
            className="w-14 h-14 object-contain"
            priority
          />
        </div>

        {/* Judul 32px */}
        <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25] text-center mb-1">
          Masuk
        </h1>
        <p className="text-[14px] text-text-3 font-[360] text-center mb-8">
          Pencatatan Keuangan Sekolah | Bank Saku Digital
        </p>

        {/* Formulir */}
        <form action={formAction} className="w-full space-y-5">
          {state?.error && (
            <div
              role="alert"
              className="p-3 text-[14px] text-danger border border-danger bg-canvas"
            >
              {state.error}
            </div>
          )}

          <div>
            <Input
              id="kode"
              name="kode"
              label="Kode"
              placeholder="Masukkan kode akun"
              autoComplete="username"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <Input
              id="password"
              name="password"
              type="password"
              label="Kata sandi"
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
              required
              disabled={isPending}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="w-full h-10"
            >
              {isPending ? "Memproses…" : "Masuk"}
            </Button>
          </div>
        </form>

        {/* Teks Bantuan */}
        <div className="mt-8 text-center">
          <p className="text-[14px] text-text-3 font-[360]">
            Hubungi admin untuk mengatur ulang kata sandi.
          </p>
        </div>
      </div>
    </main>
  );
}
