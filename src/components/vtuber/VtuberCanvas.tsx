"use client";

/**
 * VtuberCanvas.tsx — Komponen rendering PixiJS v8 + Live2D Cubism 4 Model
 * Dilengkapi lifecycle aman, Strict Mode resilience, ResizeObserver,
 * render-error auto-fallback, dan Interactive Vector Avatar Fallback.
 */

import React, { useEffect, useRef, useState } from "react";
import type { Application } from "pixi.js";
import { GuideState } from "./guide-types";

interface VtuberCanvasProps {
  state: GuideState;
  isSpeaking: boolean;
  onModelLoaded?: (success: boolean) => void;
}

export function VtuberCanvas({
  state,
  isSpeaking,
  onModelLoaded,
}: VtuberCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback animation frame reference
  const animRef = useRef<number | null>(null);
  const isBlinkingRef = useRef<boolean>(false);
  const live2dModelRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    let appInstance: Application | null = null;
    let resizeObserver: ResizeObserver | null = null;
    // Track jumlah error render berturut-turut; jika > threshold, fallback
    let renderErrorCount = 0;
    const RENDER_ERROR_THRESHOLD = 5;

    async function initLive2D() {
      setIsLoading(true);

      // 1. Cek apakah model manifest ada di server
      try {
        const checkRes = await fetch("/live2d/guide/guide.model3.json", {
          method: "HEAD",
        });
        if (!checkRes.ok) {
          if (!cancelled) {
            setUseFallback(true);
            setIsLoading(false);
            onModelLoaded?.(false);
          }
          return;
        }
      } catch {
        if (!cancelled) {
          setUseFallback(true);
          setIsLoading(false);
          onModelLoaded?.(false);
        }
        return;
      }

      // 2. Muat Live2D Cubism Core v4 script jika belum ada di window
      const win =
        typeof window !== "undefined"
          ? (window as unknown as { Live2DCubismCore?: unknown })
          : null;
      if (win && !win.Live2DCubismCore) {
        try {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/live2d/live2dcubismcore.min.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Gagal memuat Live2DCubismCore"));
            document.head.appendChild(script);
          });
        } catch {
          if (!cancelled) {
            setUseFallback(true);
            setIsLoading(false);
            onModelLoaded?.(false);
          }
          return;
        }
      }

      if (cancelled || !containerRef.current) return;

      // 3. Inisialisasi PixiJS v8 & Live2D Model
      try {
        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import(
          "@jannchie/pixi-live2d-display/cubism4"
        );

        // Daftarkan ticker untuk Live2D
        Live2DModel.registerTicker(PIXI.Ticker);

        const container = containerRef.current!;
        const width = container.clientWidth || 240;
        const height = container.clientHeight || 280;

        const app = new PIXI.Application();
        // Gunakan preference 'webgl' agar kompatibel dengan Cubism 4 WebGL renderer
        await app.init({
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          preference: "webgl",
        });
        appInstance = app;

        if (cancelled) {
          app.destroy({ removeView: true }, { children: true });
          return;
        }

        const mount = canvasMountRef.current;
        if (!mount) return;
        mount.innerHTML = "";
        mount.appendChild(app.canvas as HTMLCanvasElement);

        // Muat model Cubism 4
        const model = await Live2DModel.from(
          "/live2d/guide/guide.model3.json",
          {
            autoHitTest: false,
            autoFocus: false,
          }
        );

        if (cancelled) {
          model.destroy();
          app.destroy({ removeView: true }, { children: true });
          return;
        }

        // Atur skala dan posisi agar fokus pada bagian atas karakter (bust-up portrait)
        const scale = Math.min(
          (width * 1.35) / model.width,
          (height * 1.35) / model.height
        );
        model.scale.set(scale);
        model.anchor.set(0.5, 0.28);
        model.x = width / 2;
        model.y = height * 0.15;

        app.stage.addChild(model);
        live2dModelRef.current = model;

        // Tangkap error render callback dari ticker Live2D
        // Error "Cannot read properties of undefined (reading '0')" terjadi di
        // dalam ticker Cubism4 saat shader/buffer tidak kompatibel.
        const originalTick = app.ticker.add.bind(app.ticker);
        const safeErrorHandler = () => {
          renderErrorCount++;
          if (renderErrorCount >= RENDER_ERROR_THRESHOLD && !cancelled) {
            console.warn(
              `[VtuberCanvas] Live2D render gagal ${renderErrorCount}x, beralih ke avatar vektor.`
            );
            cancelled = true;
            try {
              model.destroy();
            } catch {
              // abaikan
            }
            try {
              app.destroy({ removeView: true }, { children: true });
            } catch {
              // abaikan
            }
            appInstance = null;
            if (mount) mount.innerHTML = "";
            setUseFallback(true);
            setIsLoading(false);
            onModelLoaded?.(false);
          }
        };

        // Patch global error handler untuk menangkap error ticker
        const origError = window.onerror;
        const origUnhandledRejection = window.onunhandledrejection;
        void origError;
        void origUnhandledRejection;

        // Metode lebih andal: intercept via error event yang terjadi di ticker
        // PixiJS v8 menangani error di ticker via try/catch internal, lalu
        // melempar ulang ke "error" event pada Ticker.
        const tickerErrorListener = (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("undefined") || msg.includes("reading '0'")) {
            safeErrorHandler();
          }
        };

        // PixiJS v8 Ticker: subscribe ke event "error" jika tersedia
        // Jika tidak ada event 'error', wrap requestAnimationFrame via listener
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ticker = app.ticker as any;
        if (typeof ticker.on === "function") {
          ticker.on("error", tickerErrorListener);
        }

        // Fallback: patch window error untuk catch render callback error
        const windowErrorListener = (event: ErrorEvent) => {
          if (
            event.message &&
            (event.message.includes("reading '0'") ||
              event.message.includes("render callback"))
          ) {
            safeErrorHandler();
          }
        };
        window.addEventListener("error", windowErrorListener);

        // Ticker sudah berjalan via Live2D; error ditangkap oleh windowErrorListener
        void originalTick;

        // ResizeObserver
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width: newW, height: newH } = entry.contentRect;
            if (newW > 0 && newH > 0 && appInstance && !cancelled) {
              appInstance.renderer.resize(newW, newH);
              model.x = newW / 2;
              model.y = newH * 0.15;
              const s = Math.min(
                (newW * 1.35) / model.width,
                (newH * 1.35) / model.height
              );
              model.scale.set(s);
            }
          }
        });
        resizeObserver.observe(container);

        if (!cancelled) {
          setIsLoading(false);
          setUseFallback(false);
          onModelLoaded?.(true);
        }

        // Simpan cleanup untuk windowErrorListener di closure
        const prevCleanup = () => {
          window.removeEventListener("error", windowErrorListener);
          if (typeof ticker.off === "function") {
            ticker.off("error", tickerErrorListener);
          }
        };

        // Simpan untuk diakses di cleanup effect
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (appInstance as any).__vtuberCleanup = prevCleanup;
      } catch (err) {
        console.warn("[VtuberCanvas] Live2D gagal dimuat, fallback ke avatar vektor:", err);
        if (!cancelled) {
          setUseFallback(true);
          setIsLoading(false);
          onModelLoaded?.(false);
        }
      }
    }

    initLive2D();

    const mountNode = canvasMountRef.current;

    return () => {
      cancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      // Jalankan cleanup listener jika ada
      if (
        appInstance &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (appInstance as any).__vtuberCleanup === "function"
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (appInstance as any).__vtuberCleanup();
      }
      if (appInstance) {
        try {
          appInstance.destroy({ removeView: true }, { children: true });
        } catch {
          // Abaikan jika sudah dibersihkan
        }
        appInstance = null;
      }
      if (mountNode) {
        mountNode.innerHTML = "";
      }
    };
  }, [onModelLoaded]);

  // Animasi untuk Fallback Vector Avatar
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blink, setBlink] = useState(false);
  const [breathe, setBreathe] = useState(0);

  useEffect(() => {
    if (!useFallback) return;

    const startTime = Date.now();
    let nextBlinkTime = startTime + 2500 + Math.random() * 2000;

    const loop = () => {
      const now = Date.now();

      // Pernapasan halus (sine wave)
      const b = Math.sin((now - startTime) / 800) * 3;
      setBreathe(b);

      // Kedip mata alami
      if (now > nextBlinkTime && !isBlinkingRef.current) {
        isBlinkingRef.current = true;
        setBlink(true);
        setTimeout(() => {
          isBlinkingRef.current = false;
          setBlink(false);
          nextBlinkTime = Date.now() + 2500 + Math.random() * 2500;
        }, 140);
      }

      // Animasi mulut jika speaking
      if (isSpeaking) {
        const m = (Math.sin(now / 80) + 1) / 2; // 0..1
        setMouthOpen(m);
      } else {
        setMouthOpen(0);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [useFallback, isSpeaking]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center overflow-hidden select-none pointer-events-none"
    >
      {/* Container murni untuk canvas PixiJS agar terisolasi dari React virtual DOM */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-text-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>Memuat karakter...</span>
          </div>
        </div>
      )}

      {useFallback && !isLoading && (
        <div
          className="relative flex flex-col items-center justify-center transition-transform duration-300"
          style={{ transform: `translateY(${breathe}px)` }}
        >
          {/* Interactive Stylized Avatar: Sesuai Design System Modern Treasury */}
          <svg
            width="170"
            height="190"
            viewBox="0 0 170 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            {/* Rambut Belakang */}
            <path
              d="M40 70C40 28 60 12 85 12C110 12 130 28 130 70C130 115 138 140 144 150H26C32 140 40 115 40 70Z"
              fill="var(--color-line-strong, #34413b)"
            />

            {/* Badan / Blazer Sekolah */}
            <path
              d="M32 152C32 140 50 132 85 132C120 132 138 140 138 152V190H32V152Z"
              fill="var(--color-accent, #29735c)"
            />
            {/* Kerah Kemeja Putih */}
            <path d="M72 132L85 148L98 132H72Z" fill="#ffffff" />
            <path d="M83 148H87V175H83V148Z" fill="#ffffff" opacity="0.8" />
            {/* Dasi Hijau Tua / Ink */}
            <path d="M82 146L85 152L88 146L86.5 166H83.5L82 146Z" fill="#151515" />

            {/* Wajah / Kulit */}
            <path
              d="M50 68C50 48 65 38 85 38C105 38 120 48 120 68C120 95 106 118 85 118C64 118 50 95 50 68Z"
              fill="#fbeee3"
            />

            {/* Poni Rambut */}
            <path
              d="M48 60C55 52 70 54 85 48C100 54 115 52 122 60C118 42 105 28 85 28C65 28 52 42 48 60Z"
              fill="var(--color-line-strong, #34413b)"
            />
            <path
              d="M48 60C52 75 58 85 62 88C60 76 56 68 54 62L48 60Z"
              fill="var(--color-line-strong, #34413b)"
            />
            <path
              d="M122 60C118 75 112 85 108 88C110 76 114 68 116 62L122 60Z"
              fill="var(--color-line-strong, #34413b)"
            />

            {/* Alis */}
            <path
              d="M60 62C64 60 70 60 74 62"
              stroke="#2c2a29"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M96 62C100 60 106 60 110 62"
              stroke="#2c2a29"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Mata Kiri */}
            {blink ? (
              <path
                d="M62 73C65 76 71 76 74 73"
                stroke="#151515"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ) : (
              <g>
                <ellipse cx="68" cy="73" rx="5" ry="6.5" fill="#151515" />
                <ellipse cx="68" cy="74" rx="4" ry="5.5" fill="#29735c" />
                <circle cx="66.5" cy="71" r="2" fill="#ffffff" />
                <circle cx="70" cy="75" r="1" fill="#ffffff" />
              </g>
            )}

            {/* Mata Kanan */}
            {blink ? (
              <path
                d="M96 73C99 76 105 76 108 73"
                stroke="#151515"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ) : (
              <g>
                <ellipse cx="102" cy="73" rx="5" ry="6.5" fill="#151515" />
                <ellipse cx="102" cy="74" rx="4" ry="5.5" fill="#29735c" />
                <circle cx="100.5" cy="71" r="2" fill="#ffffff" />
                <circle cx="104" cy="75" r="1" fill="#ffffff" />
              </g>
            )}

            {/* Rona Pipi Lembut */}
            <ellipse cx="62" cy="80" rx="4" ry="2" fill="#f8b4a5" opacity="0.6" />
            <ellipse cx="108" cy="80" rx="4" ry="2" fill="#f8b4a5" opacity="0.6" />

            {/* Hidung Kecil */}
            <circle cx="85" cy="81" r="1.2" fill="#d99980" />

            {/* Mulut dengan Lip-sync dinamis */}
            {mouthOpen > 0.15 ? (
              <path
                d={`M78 90 Q85 ${90 + mouthOpen * 10} 92 90 Q85 ${88 - mouthOpen * 2} 78 90Z`}
                fill="#b84b55"
                stroke="#682025"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M80 90C83 92 87 92 90 90"
                stroke="#9a524b"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}

            {/* Headset Guide / Smart Mic */}
            <path
              d="M48 68C46 68 45 74 46 79C47 83 49 84 51 84"
              stroke="var(--color-accent, #29735c)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M48 76C55 86 64 94 76 94"
              stroke="var(--color-text-3, #706f6f)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="76" cy="94" r="2.8" fill="var(--color-accent, #29735c)" />
          </svg>

          {/* Badge Indikator Status */}
          <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded border border-line bg-panel text-[11px] font-mono text-text-2 tracking-tight">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                state === "speaking"
                  ? "bg-accent animate-pulse"
                  : state === "thinking"
                  ? "bg-series-out animate-ping"
                  : state === "error"
                  ? "bg-danger"
                  : "bg-accent"
              }`}
            />
            <span>
              {state === "speaking"
                ? "Bicara"
                : state === "thinking"
                ? "Menjawab..."
                : state === "tutorial"
                ? "Turguide"
                : state === "greeting"
                ? "Halo!"
                : "Standby"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
