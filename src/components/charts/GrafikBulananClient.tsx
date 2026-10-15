"use client";

/**
 * GrafikBulananClient — wrapper client untuk GrafikBulanan SVG.
 * Menganimasikan batang-batang grafik saat pertama kali terlihat
 * dan saat data berubah (tahun baru dipilih).
 *
 * Grafik SVG murni dirender di sini (server component tidak bisa dipakai
 * di dalam komponen client, jadi kita render ulang logika SVG-nya di client).
 * Data dan nilai akhir tidak diubah — hanya scaleY awal = 0 lalu spring ke 1.
 */

import * as React from "react";
import { motion, useReducedMotion, useInView } from "motion/react";
import type { GrafikBulanData } from "@/server/queries/dashboard";

const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

interface GrafikBulananClientProps {
  data: GrafikBulanData[];
  tahun: number;
}

export function GrafikBulananClient({ data, tahun }: GrafikBulananClientProps) {
  const prefersReduced = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.3 });

  const WIDTH = 780;
  const HEIGHT = 260;
  const PADDING_LEFT = 56;
  const PADDING_RIGHT = 16;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 32;

  const chartW = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartH = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.pemasukan, d.pengeluaran]),
    1
  );

  const maxJuta = Math.ceil(maxVal / 1_000_000);
  const yStep = maxJuta <= 5 ? 1 : maxJuta <= 20 ? 5 : maxJuta <= 50 ? 10 : 50;
  const yMax = Math.ceil(maxJuta / yStep) * yStep;
  const yTicks = Array.from(
    { length: Math.floor(yMax / yStep) + 1 },
    (_, i) => i * yStep
  );

  const colW = chartW / 12;
  const BAR_GAP = 2;
  const BAR_W = (colW - BAR_GAP * 3) / 2;

  function xPos(bulan: number, isOut: boolean): number {
    const colStart = PADDING_LEFT + (bulan - 1) * colW;
    return colStart + BAR_GAP + (isOut ? BAR_W + BAR_GAP : 0);
  }

  function barHeight(val: number): number {
    return (val / (yMax * 1_000_000)) * chartH;
  }

  function barY(val: number): number {
    return PADDING_TOP + chartH - barHeight(val);
  }

  const shouldAnimate = !prefersReduced && inView;

  return (
    <div ref={containerRef}>
      {/* Legenda */}
      <div className="flex gap-4 mb-3 text-[13px] text-text-2">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "var(--series-in)" }}
          />
          Pemasukan
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "var(--series-out)" }}
          />
          Pengeluaran
        </span>
      </div>

      {/* SVG */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width={WIDTH}
          height={HEIGHT}
          aria-label={`Grafik pemasukan dan pengeluaran bulanan tahun ${tahun}`}
          role="img"
          style={{ maxWidth: "100%", height: "auto", display: "block" }}
        >
          {/* Garis kisi horizontal */}
          {yTicks.map((tick) => {
            const y = PADDING_TOP + chartH - (tick / yMax) * chartH;
            return (
              <g key={tick}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
                <text
                  x={PADDING_LEFT - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--text-3)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Label sumbu Y */}
          <text
            x={8}
            y={PADDING_TOP + chartH / 2}
            fontSize={10}
            fill="var(--text-3)"
            textAnchor="middle"
            transform={`rotate(-90, 8, ${PADDING_TOP + chartH / 2})`}
          >
            Juta Rp
          </text>

          {/* Batang dan label sumbu X */}
          {data.map((d, i) => {
            const inH = Math.max(0, barHeight(d.pemasukan));
            const outH = Math.max(0, barHeight(d.pengeluaran));
            const inX = xPos(d.bulan, false);
            const outX = xPos(d.bulan, true);
            const midX = PADDING_LEFT + (d.bulan - 0.5) * colW;
            const delay = i * 0.04;

            return (
              <g key={d.bulan}>
                {/* Batang Pemasukan */}
                <motion.rect
                  x={inX}
                  y={barY(d.pemasukan)}
                  width={BAR_W}
                  height={inH}
                  fill="var(--series-in)"
                  style={{ transformOrigin: `${inX + BAR_W / 2}px ${PADDING_TOP + chartH}px` }}
                  initial={shouldAnimate ? { scaleY: 0, opacity: 0 } : false}
                  animate={
                    shouldAnimate
                      ? {
                          scaleY: 1,
                          opacity: 1,
                          transition: {
                            scaleY: { type: "spring", stiffness: 260, damping: 22, delay },
                            opacity: { duration: 0.2, delay },
                          },
                        }
                      : {}
                  }
                />
                {/* Batang Pengeluaran */}
                <motion.rect
                  x={outX}
                  y={barY(d.pengeluaran)}
                  width={BAR_W}
                  height={outH}
                  fill="var(--series-out)"
                  style={{ transformOrigin: `${outX + BAR_W / 2}px ${PADDING_TOP + chartH}px` }}
                  initial={shouldAnimate ? { scaleY: 0, opacity: 0 } : false}
                  animate={
                    shouldAnimate
                      ? {
                          scaleY: 1,
                          opacity: 1,
                          transition: {
                            scaleY: { type: "spring", stiffness: 260, damping: 22, delay: delay + 0.02 },
                            opacity: { duration: 0.2, delay: delay + 0.02 },
                          },
                        }
                      : {}
                  }
                />
                {/* Label bulan di sumbu X */}
                <text
                  x={midX}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--text-3)"
                >
                  {BULAN_SINGKAT[d.bulan - 1]}
                </text>
              </g>
            );
          })}

          {/* Garis sumbu X */}
          <line
            x1={PADDING_LEFT}
            y1={PADDING_TOP + chartH}
            x2={WIDTH - PADDING_RIGHT}
            y2={PADDING_TOP + chartH}
            stroke="var(--line)"
            strokeWidth={1}
          />
        </svg>
      </div>

      {/* Alternatif teks aksesibilitas */}
      <details className="mt-2">
        <summary className="text-[13px] text-text-3 cursor-pointer hover:text-text-2">
          Lihat sebagai tabel
        </summary>
        <div className="overflow-x-auto mt-2">
          <table className="text-[13px] border-collapse w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="py-1.5 px-3 text-left font-[500] text-text-2">Bulan</th>
                <th className="py-1.5 px-3 text-right font-[500] text-text-2">Pemasukan (Juta)</th>
                <th className="py-1.5 px-3 text-right font-[500] text-text-2">Pengeluaran (Juta)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.bulan} className="border-b border-line">
                  <td className="py-1.5 px-3 text-text-2">{BULAN_SINGKAT[d.bulan - 1]} {tahun}</td>
                  <td className="py-1.5 px-3 text-right num text-text">
                    {(d.pemasukan / 1_000_000).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-3 text-right num text-text">
                    {(d.pengeluaran / 1_000_000).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
