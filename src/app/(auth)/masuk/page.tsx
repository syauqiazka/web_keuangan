"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { loginAction, type ActionState } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { checkReducedMotion, GSAP_DURATION, GSAP_EASE } from "@/lib/motion";

export default function MasukPage() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    loginAction,
    null
  );
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!cardRef.current) return;
      if (checkReducedMotion()) return;

      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 16, scale: 0.98, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: GSAP_DURATION.blurReveal,
          ease: GSAP_EASE.atmos,
          clearProps: "filter,opacity,transform",
        }
      );
    },
    { scope: cardRef }
  );

  return (
    <main className="min-h-screen bg-canvas text-text flex items-center justify-center p-4 antialiased">
      <div
        ref={cardRef}
        className="w-full max-w-[400px] bg-surface border border-line rounded-[8px] p-6 sm:p-8 shadow-overlay"
      >
        {/* Brand & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-[8px] bg-panel border border-line p-2 mb-3 flex items-center justify-center shadow-xs">
            <Image
              src="/logo-bank-saku-digital.jpeg"
              alt="Logo Bank Saku Digital"
              width={48}
              height={48}
              className="w-10 h-10 object-contain rounded"
              priority
            />
          </div>
          <h1 className="text-[20px] font-semibold text-text tracking-tight">
            Masuk ke Sistem
          </h1>
          <p className="text-[13px] text-text-3 mt-1">
            Pencatatan Keuangan Sekolah | Bank Saku Digital
          </p>
        </div>

        {/* Pesan Error */}
        {state?.error && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-[4px] text-[13px] text-danger border border-danger/30 bg-danger/5"
          >
            {state.error}
          </div>
        )}

        {/* Formulir Login */}
        <form action={formAction} className="space-y-4">
          <div>
            <Input
              id="kode"
              name="kode"
              label="Kode Akun"
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
              label="Kata Sandi"
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
              className="w-full h-10 text-[14px]"
            >
              {isPending ? "Memverifikasi…" : "Masuk"}
            </Button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-line text-center">
          <p className="text-[12px] text-text-3">
            Lupa kata sandi? Hubungi admin sekolah untuk mengatur ulang akun Anda.
          </p>
        </div>
      </div>
    </main>
  );
}
