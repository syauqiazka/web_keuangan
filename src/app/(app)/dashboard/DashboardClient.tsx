"use client";

import * as React from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { BlurReveal } from "@/components/motion/BlurReveal";
import { Reveal } from "@/components/motion/Reveal";
import { formatRupiah } from "@/lib/money";
import type { DashboardRingkasan } from "@/server/queries/dashboard";
import { TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";

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
    <div className="space-y-6">
      {/* Header + filter tahun dengan Atmos blur-to-sharp entrance */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <h1 className="text-[24px] lg:text-[28px] font-semibold text-text tracking-tight">
              Dashboard Keuangan
            </h1>
            <p className="text-[13px] text-text-3 mt-0.5">
              Ringkasan transaksi dan arus kas sekolah tahun kalender {tahun}
            </p>
          </div>
          <form method="GET" action="/dashboard" className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-text-3 absolute left-3 pointer-events-none" />
              <select
                name="tahun"
                defaultValue={String(tahun)}
                aria-label="Pilih tahun dashboard"
                className="bg-surface border border-line text-text text-[13px] font-medium pl-8 pr-8 py-1.5 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors cursor-pointer"
                onChange={(e) => {
                  (e.target.form as HTMLFormElement)?.submit();
                }}
              >
                {tahunOptions.map((y) => (
                  <option key={y} value={String(y)}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-9 px-4 text-[13px] font-medium text-brand bg-surface border border-line rounded-[10px] hover:bg-panel hover:border-line-strong active:scale-[0.98] transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              Terapkan
            </button>
          </form>
        </div>
      </BlurReveal>

      {/* Tiga kartu ringkasan keuangan dengan blur-to-sharp stagger */}
      <StaggerGroup blur={8} duration={0.75} className="grid grid-cols-1 sm:grid-cols-3 gap-4" staggerDelay={0.08}>
        {/* Total Saldo */}
        <StaggerItem>
          <div className="bg-surface p-5 lg:p-6 border border-line rounded-[14px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-medium text-text-3 uppercase tracking-wider">
                  Total Saldo Dana Sekolah
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-brand/10 text-brand flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[28px] lg:text-[34px] font-semibold text-text leading-tight tracking-tight num">
                <AnimatedNumber
                  value={ringkasan.totalSaldo}
                  format={formatRupiah}
                  duration={0.6}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[12px] text-text-3">
              <span>Pemasukan − Pengeluaran</span>
              <span className="font-medium text-text-2">Tahun {tahun}</span>
            </div>
          </div>
        </StaggerItem>

        {/* Pemasukan */}
        <StaggerItem>
          <div className="bg-surface p-5 lg:p-6 border border-line rounded-[14px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-series-in" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-medium text-text-3 uppercase tracking-wider">
                  Total Pemasukan
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-series-in/10 text-series-in flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[26px] lg:text-[30px] font-semibold text-text leading-tight tracking-tight num">
                <AnimatedNumber
                  value={ringkasan.totalPemasukan}
                  format={formatRupiah}
                  duration={0.55}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[12px] text-text-3">
              <span>Siswa + Bantuan + Donatur</span>
              <span className="font-medium text-network-green">Positif</span>
            </div>
          </div>
        </StaggerItem>

        {/* Pengeluaran */}
        <StaggerItem>
          <div className="bg-surface p-5 lg:p-6 border border-line rounded-[14px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-series-out" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-medium text-text-3 uppercase tracking-wider">
                  Total Pengeluaran
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-series-out/10 text-series-out flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[26px] lg:text-[30px] font-semibold text-text leading-tight tracking-tight num">
                <AnimatedNumber
                  value={ringkasan.totalPengeluaran}
                  format={formatRupiah}
                  duration={0.55}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[12px] text-text-3">
              <span>Operasional & Gaji</span>
              <span className="font-medium text-ledger-blue">Tahun {tahun}</span>
            </div>
          </div>
        </StaggerItem>
      </StaggerGroup>

      {/* Grafik bulanan */}
      <Reveal blur={8} threshold={0.1}>
        <div className="bg-surface border border-line rounded-[14px] p-5 lg:p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-[16px] font-semibold text-text leading-tight">
              Arus Kas Bulanan
            </h2>
            <p className="text-[13px] text-text-3 mt-0.5">
              Grafik perbandingan penerimaan dan pengeluaran per bulan tahun {tahun}
            </p>
          </div>
          {GrafikComponent}
        </div>
      </Reveal>
    </div>
  );
}
