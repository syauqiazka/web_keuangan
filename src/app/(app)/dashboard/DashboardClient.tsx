"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header + filter tahun */}
      <BlurReveal blur={10} duration={0.75}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <h1 className="text-[22px] lg:text-[26px] font-semibold text-text tracking-tight">
              Ringkasan Keuangan Sekolah
            </h1>
            <p className="text-[13px] text-text-3 mt-1">
              Pantau total saldo, arus kas masuk dan keluar, serta akses transaksi sekolah tahun kalender {tahun}.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <label htmlFor="filter-tahun-dashboard" className="text-[13px] font-medium text-text-3 whitespace-nowrap">
              Tahun Kalender:
            </label>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-text-3 absolute left-3 pointer-events-none" />
              <select
                id="filter-tahun-dashboard"
                value={String(tahun)}
                aria-label="Pilih tahun kalender untuk ringkasan keuangan"
                className="bg-surface border border-line text-text text-[13px] font-medium pl-9 pr-8 py-2 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors cursor-pointer shadow-xs"
                onChange={(e) => {
                  router.push(`/dashboard?tahun=${e.target.value}`);
                }}
              >
                {tahunOptions.map((y) => (
                  <option key={y} value={String(y)}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </BlurReveal>

      {/* Tiga kartu ringkasan keuangan: Saldo → Pemasukan → Pengeluaran */}
      <StaggerGroup blur={8} duration={0.75} className="grid grid-cols-1 sm:grid-cols-3 gap-4" staggerDelay={0.08}>
        {/* Total Saldo */}
        <StaggerItem>
          <div className="bg-surface p-5 lg:p-6 border border-line rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-balance" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-medium text-text-3 uppercase tracking-wider">
                  Total Saldo Sekolah
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-balance-soft text-balance flex items-center justify-center border border-balance-border">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[26px] lg:text-[32px] font-semibold text-text leading-tight tracking-tight num">
                <AnimatedNumber
                  value={ringkasan.totalSaldo}
                  format={formatRupiah}
                  duration={0.6}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[12px] text-text-3">
              <span>Pemasukan − Pengeluaran</span>
              <span className="font-semibold text-balance">Tahun {tahun}</span>
            </div>
          </div>
        </StaggerItem>

        {/* Pemasukan */}
        <StaggerItem>
          <div className="bg-surface p-5 lg:p-6 border border-line rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-income" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-medium text-text-3 uppercase tracking-wider">
                  Total Pemasukan
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-income-soft text-income flex items-center justify-center border border-income-border">
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
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[12px] text-text-3">
              <span>Siswa + Bantuan + Donatur</span>
              <span className="font-semibold text-income">Tahun {tahun}</span>
            </div>
          </div>
        </StaggerItem>

        {/* Pengeluaran */}
        <StaggerItem>
          <div className="bg-surface p-5 lg:p-6 border border-line rounded-[12px] shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-expense" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-medium text-text-3 uppercase tracking-wider">
                  Total Pengeluaran
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-expense-soft text-expense flex items-center justify-center border border-expense-border">
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
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[12px] text-text-3">
              <span>Operasional & Gaji Guru</span>
              <span className="font-semibold text-expense">Tahun {tahun}</span>
            </div>
          </div>
        </StaggerItem>
      </StaggerGroup>

      {/* Aksi Cepat untuk Petugas & Bendahara Awam */}
      <div className="bg-surface border border-line rounded-[12px] p-5 shadow-xs">
        <div className="mb-3">
          <h2 className="text-[14px] font-semibold text-text leading-tight">
            Aksi Cepat Transaksi
          </h2>
          <p className="text-[12px] text-text-3 mt-0.5">
            Pintasan cepat untuk mencatat data keuangan dan mengelola administrasi sekolah
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <a
            href="/pemasukan"
            className="flex items-center gap-3 p-3 rounded-[8px] border border-line hover:border-income/50 hover:bg-income-soft transition-all group"
          >
            <div className="w-8 h-8 rounded-[6px] bg-income-soft text-income flex items-center justify-center shrink-0 border border-income-border group-hover:bg-income group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text group-hover:text-income transition-colors">
                Catat Pemasukan
              </div>
              <div className="text-[11px] text-text-3 truncate">
                SPP, bantuan & donatur
              </div>
            </div>
          </a>

          <a
            href="/pengeluaran"
            className="flex items-center gap-3 p-3 rounded-[8px] border border-line hover:border-expense/50 hover:bg-expense-soft transition-all group"
          >
            <div className="w-8 h-8 rounded-[6px] bg-expense-soft text-expense flex items-center justify-center shrink-0 border border-expense-border group-hover:bg-expense group-hover:text-white transition-colors">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text group-hover:text-expense transition-colors">
                Catat Pengeluaran
              </div>
              <div className="text-[11px] text-text-3 truncate">
                Gaji & operasional kas
              </div>
            </div>
          </a>

          <a
            href="/data-siswa-guru"
            className="flex items-center gap-3 p-3 rounded-[8px] border border-line hover:border-balance/50 hover:bg-balance-soft transition-all group"
          >
            <div className="w-8 h-8 rounded-[6px] bg-balance-soft text-balance flex items-center justify-center shrink-0 border border-balance-border group-hover:bg-balance group-hover:text-white transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text group-hover:text-balance transition-colors">
                Kelola Siswa & Guru
              </div>
              <div className="text-[11px] text-text-3 truncate">
                Daftar kelas & data UID
              </div>
            </div>
          </a>

          <a
            href="/pengaturan"
            className="flex items-center gap-3 p-3 rounded-[8px] border border-line hover:border-line-strong hover:bg-panel transition-all group"
          >
            <div className="w-8 h-8 rounded-[6px] bg-panel text-text-2 flex items-center justify-center shrink-0 border border-line/60 group-hover:bg-text-2 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text group-hover:text-text transition-colors">
                Pengaturan Sistem
              </div>
              <div className="text-[11px] text-text-3 truncate">
                Akun petugas & sandi
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Grafik bulanan */}
      <Reveal blur={8} threshold={0.1}>
        <div className="bg-surface border border-line rounded-[12px] p-5 lg:p-6 shadow-xs">
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
