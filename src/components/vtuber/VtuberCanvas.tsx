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

interface Live2DLipSyncControls {
  startLipSync?: () => void;
  setLipSyncValue?: (value: number) => void;
  stopLipSync?: () => void;
}

type CubismWindow = Window & { Live2DCubismCore?: unknown };

let cubismCoreLoadPromise: Promise<void> | null = null;

function ensureCubismCoreLoaded(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Live2D hanya dapat dimuat di browser."));
  }

  const browserWindow = window as CubismWindow;
  if (browserWindow.Live2DCubismCore) return Promise.resolve();
  if (cubismCoreLoadPromise) return cubismCoreLoadPromise;

  cubismCoreLoadPromise = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-live2d-cubism-core="true"]'
    );

    const handleLoad = () => {
      if (browserWindow.Live2DCubismCore) {
        resolve();
      } else {
        reject(new Error("Live2DCubismCore termuat, tetapi tidak terinisialisasi."));
      }
    };
    const handleError = () => {
      if (script?.isConnected) script.remove();
      reject(new Error("Gagal memuat Live2DCubismCore."));
    };

    if (script?.dataset.loaded === "true") {
      handleLoad();
      return;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = "/live2d/live2dcubismcore.min.js";
      script.async = true;
      script.dataset.live2dCubismCore = "true";
    }

    script.addEventListener(
      "load",
      () => {
        script!.dataset.loaded = "true";
        handleLoad();
      },
      { once: true }
    );
    script.addEventListener("error", handleError, { once: true });

    if (!script.isConnected) document.head.appendChild(script);
  }).catch((error: unknown) => {
    cubismCoreLoadPromise = null;
    throw error;
  });

  return cubismCoreLoadPromise;
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
  const live2dModelRef = useRef<Live2DLipSyncControls | null>(null);

  useEffect(() => {
    let cancelled = false;
    let appInstance: Application | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let modelLoadTimer: ReturnType<typeof setTimeout> | undefined;
    let modelLoadAbandoned = false;
    // Track jumlah error render berturut-turut; jika > threshold, fallback
    let renderErrorCount = 0;
    const RENDER_ERROR_THRESHOLD = 5;

    async function initLive2D() {
      setIsLoading(true);
      setUseFallback(false);

      // Muat Core sekali saja agar React Strict Mode tidak menyisipkan script ganda.
      try {
        await ensureCubismCoreLoaded();
      } catch (error) {
        console.error("[VtuberCanvas] Runtime Live2D gagal dimuat:", error);
        if (!cancelled) {
          setUseFallback(true);
          setIsLoading(false);
          onModelLoaded?.(false);
        }
        return;
      }

      if (cancelled || !containerRef.current) return;

      // Inisialisasi PixiJS v8 & model Live2D. Jika aset atau WebGL gagal,
      // tangani melalui catch dan tampilkan avatar fallback.
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
          backgroundColor: 0x000000,
          clearBeforeRender: true,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          preference: "webgl",
        });

        // Background Pixi dan elemen canvas wajib transparan. Tanpa ini,
        // browser dapat menampilkan bidang putih di belakang karakter.
        app.renderer.background.alpha = 0;
        app.renderer.background.clearBeforeRender = true;
        const canvas = app.canvas as HTMLCanvasElement;
        canvas.style.background = "transparent";
        canvas.style.backgroundColor = "transparent";
        canvas.style.display = "block";
        canvas.style.position = "absolute";
        canvas.style.inset = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        appInstance = app;

        if (cancelled) {
          app.destroy({ removeView: true }, { children: true });
          return;
        }

        const mount = canvasMountRef.current;
        if (!mount) return;
        mount.style.background = "transparent";
        mount.innerHTML = "";
        mount.appendChild(canvas);

        // Hindari spinner/canvas putih yang menggantung tanpa batas bila model
        // atau salah satu aset Live2D gagal dijawab oleh server.
        modelLoadAbandoned = false;
        const modelPromise = Live2DModel.from(
          "/live2d/guide/guide.model3.json",
          {
            autoHitTest: false,
            autoFocus: false,
            // Gunakan ticker milik aplikasi yang sama agar pembaruan model
            // tersinkron dengan siklus render PixiJS v8.
            ticker: app.ticker,
          }
        );

        // Jika model baru selesai setelah timeout/unmount, jangan biarkan
        // resource terlantar atau canvas lama menutupi avatar fallback.
        void modelPromise.then((lateModel) => {
          if (modelLoadAbandoned || cancelled) {
            try {
              lateModel.destroy();
            } catch {
              // Model tidak lagi dipakai.
            }
          }
        }).catch(() => {
          // Ditangani oleh Promise.race di bawah.
        });

        const model = await Promise.race([
          modelPromise,
          new Promise<never>((_, reject) => {
            modelLoadTimer = setTimeout(() => {
              modelLoadAbandoned = true;
              reject(new Error("Model Live2D tidak selesai dimuat dalam 12 detik."));
            }, 12000);
          }),
        ]);
        if (modelLoadTimer) clearTimeout(modelLoadTimer);

        if (cancelled) {
          // Cleanup effect sudah menghancurkan Application bila komponen dilepas.
          model.destroy();
          return;
        }

        // Fit seluruh model ke area transparan agar kepala/badan tidak terpotong.
        // Sisakan ruang kecil di sekeliling karakter untuk efek mengambang.
        const scale = Math.min(
          (width * 0.92) / model.width,
          (height * 0.92) / model.height
        );
        model.scale.set(scale);
        model.anchor.set(0.5, 0.04);
        model.x = width / 2;
        model.y = height * 0.04;

        app.stage.addChild(model);
        live2dModelRef.current = model as unknown as Live2DLipSyncControls;

        // Tangkap error WebGL/Live2D yang lolos dari lifecycle inisialisasi.
        let removeRenderErrorListener = () => {};
        const safeErrorHandler = () => {
          renderErrorCount++;
          if (renderErrorCount < RENDER_ERROR_THRESHOLD || cancelled) return;

          console.error(
            `[VtuberCanvas] Render Live2D gagal ${renderErrorCount} kali. Avatar fallback diaktifkan.`
          );
          cancelled = true;
          removeRenderErrorListener();
          live2dModelRef.current?.stopLipSync?.();
          live2dModelRef.current?.setLipSyncValue?.(0);
          live2dModelRef.current = null;

          try {
            model.destroy();
          } catch {
            // Model mungkin sudah dihancurkan oleh renderer.
          }
          try {
            app.destroy({ removeView: true }, { children: true });
          } catch {
            // Renderer mungkin sudah dihancurkan.
          }
          appInstance = null;
          if (mount) mount.innerHTML = "";
          setUseFallback(true);
          setIsLoading(false);
          onModelLoaded?.(false);
        };

        const windowErrorListener = (event: ErrorEvent) => {
          const message = event.message || "";
          if (
            message.includes("reading '0'") ||
            message.includes("render callback") ||
            message.toLowerCase().includes("webgl context")
          ) {
            safeErrorHandler();
          }
        };
        window.addEventListener("error", windowErrorListener);
        removeRenderErrorListener = () =>
          window.removeEventListener("error", windowErrorListener);

        // ResizeObserver
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width: newW, height: newH } = entry.contentRect;
            if (newW > 0 && newH > 0 && appInstance && !cancelled) {
              appInstance.renderer.resize(newW, newH);
              model.x = newW / 2;
              model.y = newH * 0.04;
              const s = Math.min(
                (newW * 0.92) / model.width,
                (newH * 0.92) / model.height
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

        // Simpan cleanup listener agar tidak bocor ketika halaman dilepas.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (appInstance as any).__vtuberCleanup = removeRenderErrorListener;
      } catch (err) {
        console.error("[VtuberCanvas] Live2D gagal dimuat, avatar transparan fallback diaktifkan:", err);
        live2dModelRef.current?.stopLipSync?.();
        live2dModelRef.current?.setLipSyncValue?.(0);
        live2dModelRef.current = null;

        // Bersihkan renderer jika model gagal dimuat setelah Application dibuat.
        if (appInstance) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cleanup = (appInstance as any).__vtuberCleanup;
          if (typeof cleanup === "function") cleanup();
          try {
            appInstance.destroy({ removeView: true }, { children: true });
          } catch {
            // Renderer mungkin sudah dihancurkan saat cleanup.
          }
          appInstance = null;
        }
        if (modelLoadTimer) {
          clearTimeout(modelLoadTimer);
          modelLoadTimer = undefined;
        }
        if (canvasMountRef.current) canvasMountRef.current.innerHTML = "";

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
      if (modelLoadTimer) {
        clearTimeout(modelLoadTimer);
        modelLoadTimer = undefined;
        modelLoadAbandoned = true;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      live2dModelRef.current?.stopLipSync?.();
      live2dModelRef.current?.setLipSyncValue?.(0);
      live2dModelRef.current = null;
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

  // Lip-sync model Live2D: parameter mulut bergerak hanya ketika TTS aktif.
  useEffect(() => {
    const model = live2dModelRef.current;
    if (!model || useFallback || isLoading) return;

    if (!isSpeaking) {
      model.stopLipSync?.();
      model.setLipSyncValue?.(0);
      return;
    }

    model.startLipSync?.();
    let frameId = 0;
    const startedAt = performance.now();

    const animateMouth = (now: number) => {
      const wave = (Math.sin((now - startedAt) / 95) + 1) / 2;
      model.setLipSyncValue?.(0.08 + wave * 0.78);
      frameId = requestAnimationFrame(animateMouth);
    };

    frameId = requestAnimationFrame(animateMouth);
    return () => {
      cancelAnimationFrame(frameId);
      model.stopLipSync?.();
      model.setLipSyncValue?.(0);
    };
  }, [isSpeaking, isLoading, useFallback]);

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
      className="w-full h-full relative flex items-end justify-center overflow-visible select-none pointer-events-none bg-transparent"
    >
      {/* Container murni untuk canvas PixiJS agar terisolasi dari React virtual DOM */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full pointer-events-none flex items-end justify-center bg-transparent"
      />

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-transparent text-xs text-text-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>Memuat karakter...</span>
          </div>
        </div>
      )}

      {useFallback && !isLoading && (
        <div
          className="relative z-10 flex flex-col items-center justify-end transition-transform duration-300 bg-transparent"
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

          {state === "speaking" && (
            <span className="mt-0.5 text-[10px] font-medium text-text-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.18)]">
              Sedang berbicara
            </span>
          )}
        </div>
      )}
    </div>
  );
}
