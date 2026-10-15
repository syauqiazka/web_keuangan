"use client";

import * as React from "react";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";
import { formatRupiah } from "@/lib/money";
import type { DashboardRingkasan } from "@/server/queries/dashboard";

interface DashboardClientProps {
  tahun: number;
  tahunOptions: number[];
  ringkasan: DashboardRingkasan;
  grafikData: unknown[];
  GrafikComponent: React.ReactNode;
}

export function DashboardClient({
  tahun,
  tahunOptions,
  ringkasan,
  GrafikComponent,
}: DashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Header + filter tahun */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25]">
            Dashboard
          </h1>
          <form method="GET" action="/dashboard">
            <label className="flex items-center gap-2 text-[14px] text-text-2">
              Tahun
              <select
                name="tahun"
                defaultValue={String(tahun)}
                className="bg-canvas border border-line-strong text-text text-[14px] px-2 py-1 rounded-none focus:outline-2 focus:outline-accent focus:outline-offset-2"
                onChange={(e) => {
                  (e.target.form as HTMLFormElement)?.submit();
                }}
              >
                {tahunOptions.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
              <motion.button
                type="submit"
                className="px-3 py-1 text-[13px] font-[500] text-text border border-line-strong hover:bg-panel"
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 600, damping: 30 }}
              >
                Terapkan
              </motion.button>
            </label>
          </form>
        </div>
      </FadeIn>

      {/* Tiga blok ringkasan — stagger */}
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4" staggerDelay={0.09}>
        {/* Total Saldo */}
        <StaggerItem>
          <div className="sm:col-span-1 bg-panel p-6 rounded-[8px] h-full">
            <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
              Total Saldo Dana Sekolah
            </div>
            <div className="text-[47px] font-[450] font-display text-text leading-[1.25] num">
              <AnimatedNumber
                value={ringkasan.totalSaldo}
                format={formatRupiah}
                duration={0.7}
              />
            </div>
            <div className="mt-1 text-[13px] text-text-3 font-[360]">
              Tahun {tahun}
            </div>
          </div>
        </StaggerItem>

        {/* Pemasukan */}
        <StaggerItem>
          <div className="bg-canvas p-6 border border-line rounded-[8px] h-full">
            <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
              Pemasukan
            </div>
            <div className="text-[32px] font-[400] font-display text-text leading-[1.25] num">
              <AnimatedNumber
                value={ringkasan.totalPemasukan}
                format={formatRupiah}
                duration={0.65}
              />
            </div>
            <div className="mt-1 text-[13px] text-text-3 font-[360]">
              Tahun {tahun}
            </div>
          </div>
        </StaggerItem>

        {/* Pengeluaran */}
        <StaggerItem>
          <div className="bg-canvas p-6 border border-line rounded-[8px] h-full">
            <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
              Pengeluaran
            </div>
            <div className="text-[32px] font-[400] font-display text-text leading-[1.25] num">
              <AnimatedNumber
                value={ringkasan.totalPengeluaran}
                format={formatRupiah}
                duration={0.65}
              />
            </div>
            <div className="mt-1 text-[13px] text-text-3 font-[360]">
              Tahun {tahun}
            </div>
          </div>
        </StaggerItem>
      </StaggerGroup>

      {/* Grafik bulanan */}
      <Reveal threshold={0.1}>
        <div>
          <h2 className="text-[21px] font-[400] font-display text-text leading-[1.3] mb-4">
            Pemasukan vs Pengeluaran — {tahun}
          </h2>
          {GrafikComponent}
        </div>
      </Reveal>
    </div>
  );
}
