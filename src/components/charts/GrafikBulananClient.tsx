"use client";

/**
 * GrafikBulananClient — visualisasi arus kas bulanan berbasis SVG murni
 * dengan animasi entrance GSAP berurutan per bulan (Atmos wave style).
 * Nilai data tidak diubah. Menghormati prefers-reduced-motion.
 */

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { formatRupiah } from "@/lib/money";
import { checkReducedMotion, GSAP_EASE } from "@/lib/motion";
import type { GrafikBulanData } from "@/server/queries/dashboard";

const BULAN_LENGKAP = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

interface GrafikBulananClientProps {
  data: GrafikBulanData[];
  tahun: number;
}

export function GrafikBulananClient({ data, tahun }: GrafikBulananClientProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [inView, setInView] = React.useState(false);
  const [hoveredBulan, setHoveredBulan] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!containerRef.current || checkReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const shouldAnimate = inView || checkReducedMotion();

  const WIDTH = 780;
  const HEIGHT = 260;
  const PADDING_LEFT = 56;
  const PADDING_RIGHT = 16;
  const PADDING_TOP = 24;
  const PADDING_BOTTOM = 36;

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
  const BAR_W = Math.max(4, (colW - BAR_GAP * 3) / 2);

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

  useGSAP(
    () => {
      if (!svgRef.current || !shouldAnimate) return;
      if (checkReducedMotion()) {
        gsap.set(".chart-bar-in, .chart-bar-out", { scaleY: 1, opacity: 1 });
        return;
      }

      const tl = gsap.timeline();

      tl.fromTo(
        ".chart-bar-in",
        { scaleY: 0, opacity: 0 },
        {
          scaleY: 1,
          opacity: 1,
          duration: 0.65,
          stagger: 0.03,
          ease: GSAP_EASE.atmos,
        }
      ).fromTo(
        ".chart-bar-out",
        { scaleY: 0, opacity: 0 },
        {
          scaleY: 1,
          opacity: 1,
          duration: 0.65,
          stagger: 0.03,
          ease: GSAP_EASE.atmos,
        },
        "<0.04"
      );
    },
    { dependencies: [data, shouldAnimate], scope: svgRef }
  );

  const hoveredData = hoveredBulan ? data.find((d) => d.bulan === hoveredBulan) : null;

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Legenda & Quick Hover Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-text-2">
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-[2px] bg-network-green inline-block"
            />
            Pemasukan
          </span>
          <span className="flex items-center gap-1.5 font-medium text-text-2">
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-[2px] bg-ledger-blue inline-block"
            />
            Pengeluaran
          </span>
        </div>

        {/* Hover detail pill */}
        <div className="h-6 flex items-center">
          {hoveredData ? (
            <div className="text-[12px] flex items-center gap-3 px-2.5 py-1 rounded bg-panel border border-line text-text animate-in fade-in zoom-in-95 duration-150">
              <span className="font-semibold text-text">{BULAN_LENGKAP[hoveredData.bulan - 1]}</span>
              <span className="text-network-green font-medium num">Masuk: {formatRupiah(hoveredData.pemasukan)}</span>
              <span className="text-ledger-blue font-medium num">Keluar: {formatRupiah(hoveredData.pengeluaran)}</span>
            </div>
          ) : (
            <span className="text-[12px] text-text-3 font-normal">Arahkan kursor pada batang untuk rincian nominal</span>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto pb-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width={WIDTH}
          height={HEIGHT}
          aria-label={`Grafik pemasukan dan pengeluaran bulanan tahun ${tahun}`}
          role="img"
          className="w-full max-w-full h-auto select-none"
          onMouseLeave={() => setHoveredBulan(null)}
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
                  x={PADDING_LEFT - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--text-3)"
                  className="font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Label sumbu Y */}
          <text
            x={10}
            y={PADDING_TOP + chartH / 2}
            fontSize={10}
            fill="var(--text-3)"
            textAnchor="middle"
            transform={`rotate(-90, 10, ${PADDING_TOP + chartH / 2})`}
            className="font-mono uppercase tracking-wider"
          >
            Juta Rp
          </text>

          {/* Batang dan label sumbu X */}
          {data.map((d) => {
            const inH = Math.max(0, barHeight(d.pemasukan));
            const outH = Math.max(0, barHeight(d.pengeluaran));
            const inX = xPos(d.bulan, false);
            const outX = xPos(d.bulan, true);
            const midX = PADDING_LEFT + (d.bulan - 0.5) * colW;
            const isHovered = hoveredBulan === d.bulan;

            return (
              <g
                key={d.bulan}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredBulan(d.bulan)}
              >
                {/* Background hover column highlight */}
                {isHovered && (
                  <rect
                    x={PADDING_LEFT + (d.bulan - 1) * colW}
                    y={PADDING_TOP}
                    width={colW}
                    height={chartH}
                    fill="var(--panel)"
                    opacity={0.6}
                  />
                )}

                {/* Batang Pemasukan */}
                <rect
                  className="chart-bar-in"
                  x={inX}
                  y={barY(d.pemasukan)}
                  width={BAR_W}
                  height={inH}
                  rx={2}
                  fill="var(--series-in)"
                  opacity={isHovered || !hoveredBulan ? 1 : 0.65}
                  style={{
                    transformOrigin: `${inX + BAR_W / 2}px ${PADDING_TOP + chartH}px`,
                  }}
                />

                {/* Batang Pengeluaran */}
                <rect
                  className="chart-bar-out"
                  x={outX}
                  y={barY(d.pengeluaran)}
                  width={BAR_W}
                  height={outH}
                  rx={2}
                  fill="var(--series-out)"
                  opacity={isHovered || !hoveredBulan ? 1 : 0.65}
                  style={{
                    transformOrigin: `${outX + BAR_W / 2}px ${PADDING_TOP + chartH}px`,
                  }}
                />

                {/* Label bulan di sumbu X */}
                <text
                  x={midX}
                  y={HEIGHT - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={isHovered ? 600 : 400}
                  fill={isHovered ? "var(--text)" : "var(--text-3)"}
                  className="transition-colors"
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
      <details className="pt-2 border-t border-line">
        <summary className="text-[12px] font-medium text-text-3 cursor-pointer hover:text-text transition-colors">
          Lihat sebagai tabel data (12 bulan)
        </summary>
        <div className="overflow-x-auto mt-2 border border-line rounded-[4px]">
          <table className="text-[12px] border-collapse w-full">
            <thead>
              <tr className="bg-panel border-b border-line text-text-2">
                <th className="py-2 px-3 text-left font-semibold">Bulan</th>
                <th className="py-2 px-3 text-right font-semibold text-network-green">Pemasukan</th>
                <th className="py-2 px-3 text-right font-semibold text-ledger-blue">Pengeluaran</th>
                <th className="py-2 px-3 text-right font-semibold">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((d) => {
                const selisih = d.pemasukan - d.pengeluaran;
                return (
                  <tr key={d.bulan} className="hover:bg-panel/50 transition-colors">
                    <td className="py-1.5 px-3 font-medium text-text-2">{BULAN_LENGKAP[d.bulan - 1]} {tahun}</td>
                    <td className="py-1.5 px-3 text-right num text-text">
                      {formatRupiah(d.pemasukan)}
                    </td>
                    <td className="py-1.5 px-3 text-right num text-text">
                      {formatRupiah(d.pengeluaran)}
                    </td>
                    <td className={`py-1.5 px-3 text-right num font-medium ${selisih >= 0 ? "text-network-green" : "text-danger"}`}>
                      {formatRupiah(selisih)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
