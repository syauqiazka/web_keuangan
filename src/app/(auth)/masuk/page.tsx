"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { loginAction, type ActionState } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { checkReducedMotion, GSAP_DURATION, GSAP_EASE } from "@/lib/motion";
import {
  ShieldCheck,
  BarChart3,
  Users,
  LockKeyhole,
} from "lucide-react";

export default function MasukPage() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    loginAction,
    null
  );
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (checkReducedMotion()) return;

      // Animate hero panel left → right
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0, x: -24 },
          {
            opacity: 1,
            x: 0,
            duration: GSAP_DURATION.blurReveal,
            ease: GSAP_EASE.atmos,
          }
        );
        // Stagger child items
        gsap.fromTo(
          heroRef.current.querySelectorAll(".hero-item"),
          { opacity: 0, y: 12, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.65,
            stagger: 0.1,
            delay: 0.25,
            ease: GSAP_EASE.atmos,
            clearProps: "filter",
          }
        );
      }

      // Animate form card
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { opacity: 0, y: 20, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: GSAP_DURATION.blurReveal,
            delay: 0.1,
            ease: GSAP_EASE.atmos,
            clearProps: "filter,opacity,transform",
          }
        );
      }
    },
    {}
  );

  return (
    <main className="min-h-screen bg-canvas text-text antialiased flex">
      {/* ── Left: Brand panel (hidden on mobile) ── */}
      <div
        ref={heroRef}
        className="hidden lg:flex flex-col justify-between w-[45%] xl:w-[42%] min-h-screen bg-brand p-10 xl:p-14 text-white"
        aria-hidden="true"
      >
        {/* Logo + Nama */}
        <div className="hero-item flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0 border border-white/25">
            <Image
              src="/logo-bank-saku-digital.jpeg"
              alt="Logo Bank Saku Digital"
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-[6px]"
              priority
            />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-white leading-tight">
              Pencatatan Keuangan Sekolah
            </div>
            <div className="text-[12px] text-white/80 leading-tight">
              Bank Saku Digital
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-8">
          <div className="hero-item">
            <h1 className="text-[32px] xl:text-[38px] font-display font-medium text-white leading-[1.2] tracking-tight">
              Keuangan sekolah yang{" "}
              <span className="text-gold font-semibold underline decoration-gold/60 underline-offset-4">
                tertata,
              </span>{" "}
              akurat, dan transparan.
            </h1>
            <p className="mt-4 text-[15px] text-white/90 leading-relaxed max-w-sm">
              Sistem pencatatan internal untuk admin dan petugas. Pantau arus kas,
              pemasukan siswa, bantuan, dan pengeluaran dari satu tempat.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              {
                icon: BarChart3,
                title: "Dashboard ringkas",
                desc: "Saldo, pemasukan, dan pengeluaran satu layar",
              },
              {
                icon: Users,
                title: "Data siswa & guru",
                desc: "Terhubung langsung ke rekap pembayaran",
              },
              {
                icon: ShieldCheck,
                title: "Aman & berbasis peran",
                desc: "Akses dikontrol oleh admin sekolah",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="hero-item flex items-start gap-3 p-3.5 rounded-[12px] bg-white/10 border border-white/20 hover:border-gold/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-[8px] bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white leading-tight">
                    {title}
                  </div>
                  <div className="text-[12px] text-white/85 mt-0.5 leading-snug">
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer label */}
        <div className="hero-item text-[11px] text-white/70 font-mono uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold" />
          <span>Sistem Internal — Hanya untuk Petugas Resmi</span>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-5 sm:p-8 bg-canvas">
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-surface-soft flex items-center justify-center border border-line">
            <Image
              src="/logo-bank-saku-digital.jpeg"
              alt="Logo Bank Saku Digital"
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-[6px]"
              priority
            />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-text leading-tight">
              Pencatatan Keuangan Sekolah
            </div>
            <div className="text-[12px] text-text-3 leading-tight">
              Bank Saku Digital
            </div>
          </div>
        </div>

        {/* Form card with subtle gold top accent */}
        <div
          ref={formRef}
          className="w-full max-w-[420px] bg-surface border border-line rounded-[14px] p-7 sm:p-9 shadow-card relative overflow-hidden"
        >
          {/* Subtle gold line accent */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold" />

          {/* Heading */}
          <div className="mb-7 pt-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-[8px] bg-gold-soft border border-gold-border flex items-center justify-center">
                <LockKeyhole className="w-4 h-4 text-gold-text" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-mono font-medium text-gold-text uppercase tracking-wider">
                Masuk ke Sistem
              </span>
            </div>
            <h2 className="text-[22px] font-semibold text-text tracking-tight leading-snug">
              Selamat datang kembali
            </h2>
            <p className="text-[14px] text-text-3 mt-1.5 leading-relaxed">
              Masukkan kode akun dan kata sandi Anda untuk melanjutkan.
            </p>
          </div>

          {/* Error */}
          {state?.error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-[10px] text-[13px] text-danger border border-danger/25 bg-danger/5 flex items-start gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0 mt-[5px]" />
              {state.error}
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <Input
              id="kode"
              name="kode"
              label="Kode Akun Petugas"
              placeholder="Contoh: admin atau kode_petugas"
              autoComplete="username"
              required
              disabled={isPending}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Kata Sandi"
              placeholder="Masukkan kata sandi akun Anda"
              autoComplete="current-password"
              required
              disabled={isPending}
            />

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Memverifikasi akun…" : "Masuk ke Sistem Keuangan"}
              </Button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-line text-center">
            <p className="text-[12px] text-text-3 leading-relaxed">
              Lupa kata sandi? Hubungi admin sekolah untuk mengatur ulang akun Anda.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
