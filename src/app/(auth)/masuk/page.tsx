"use client";

import Image from "next/image";
import { useActionState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { loginAction, type ActionState } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EASE, DURATION } from "@/lib/motion";

// ─── Variant timeline masuk ─────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, ease: EASE.decel },
  },
};

const logoVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -6 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 22,
      delay: 0.04,
    },
  },
};

const errorVariants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    marginBottom: 0,
    transition: { duration: DURATION.base, ease: EASE.decel },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: DURATION.fast },
  },
};

export default function MasukPage() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    loginAction,
    null
  );

  return (
    <main className="min-h-screen bg-canvas text-text flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elemen dekoratif latar — dua lingkaran blur halus */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      >
        <motion.div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--series-in) 0%, transparent 70%)", opacity: 0.06 }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.06 }}
          transition={{ duration: 1.4, ease: EASE.decel }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--label) 0%, transparent 70%)", opacity: 0.06 }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.06 }}
          transition={{ duration: 1.4, ease: EASE.decel, delay: 0.2 }}
        />
      </div>

      <motion.div
        className="w-full max-w-[360px] flex flex-col items-center relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div className="mb-6" variants={logoVariants}>
          <Image
            src="/logo-bank-saku-digital.jpeg"
            alt="Logo Bank Saku Digital"
            width={56}
            height={56}
            className="w-14 h-14 object-contain"
            priority
          />
        </motion.div>

        {/* Judul */}
        <motion.h1
          className="text-[32px] font-[400] font-display text-text leading-[1.25] text-center mb-1"
          variants={itemVariants}
        >
          Masuk
        </motion.h1>
        <motion.p
          className="text-[14px] text-text-3 font-[360] text-center mb-8"
          variants={itemVariants}
        >
          Pencatatan Keuangan Sekolah | Bank Saku Digital
        </motion.p>

        {/* Formulir */}
        <motion.form
          action={formAction}
          className="w-full space-y-5"
          variants={itemVariants}
        >
          {/* Pesan error — animasi masuk/keluar tanpa reset form */}
          <AnimatePresence mode="wait">
            {state?.error && (
              <motion.div
                key={state.error}
                role="alert"
                className="p-3 text-[14px] text-danger border border-danger bg-canvas overflow-hidden"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {state.error}
              </motion.div>
            )}
          </AnimatePresence>

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
        </motion.form>

        {/* Teks bantuan */}
        <motion.div className="mt-8 text-center" variants={itemVariants}>
          <p className="text-[14px] text-text-3 font-[360]">
            Hubungi admin untuk mengatur ulang kata sandi.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
