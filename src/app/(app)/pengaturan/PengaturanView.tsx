"use client";

import { useState } from "react";
import Link from "next/link";
import { setTemaAction } from "@/server/actions/theme";
import { logoutAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { GantiPasswordModal } from "@/components/GantiPasswordModal";
import type { SessionUser } from "@/server/auth/session";
import type { TemaTampilan } from "@/generated/prisma/client";

import { useToast } from "@/components/ui/Toast";
import { Sun, Moon, Key, Users, LogOut } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";

export function PengaturanView({ user }: { user: SessionUser }) {
  const { showToast } = useToast();
  const [modalGantiPasswordOpen, setModalGantiPasswordOpen] = useState(false);
  const [tema, setTema] = useState<TemaTampilan>(user.tema === "GELAP" ? "GELAP" : "TERANG");
  const [isUpdatingTema, setIsUpdatingTema] = useState(false);

  const handleTemaChange = async (selectedTema: TemaTampilan) => {
    if (selectedTema === tema || isUpdatingTema) return;
    const prevTema = tema;
    const prevAttr = typeof document !== "undefined" ? document.documentElement.getAttribute("data-theme") : null;

    // Optimistic UI update
    setTema(selectedTema);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute(
        "data-theme",
        selectedTema === "GELAP" ? "dark" : "light"
      );
    }
    setIsUpdatingTema(true);

    try {
      await setTemaAction(selectedTema);
      showToast(
        selectedTema === "GELAP"
          ? "Mode tampilan diubah ke Gelap."
          : "Mode tampilan diubah ke Terang.",
        "success"
      );
    } catch {
      // Rollback ke state sebelumnya jika gagal disimpan ke server/cookie
      setTema(prevTema);
      if (typeof document !== "undefined" && prevAttr) {
        document.documentElement.setAttribute("data-theme", prevAttr);
      }
      showToast("Gagal menyimpan preferensi tema. Perubahan dibatalkan.", "error");
    } finally {
      setIsUpdatingTema(false);
    }
  };


  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="pb-5 border-b border-line">
          <h1 className="text-[24px] lg:text-[28px] font-semibold text-text tracking-tight">
            Pengaturan
          </h1>
          <p className="text-[13px] text-text-3 mt-0.5">
            Kelola preferensi akun, tampilan tema, dan manajemen hak akses
          </p>
        </div>
      </FadeIn>

      <StaggerGroup className="bg-surface border border-line rounded-[8px] divide-y divide-line shadow-xs overflow-hidden" staggerDelay={0.06}>
        {/* Baris 1: Ganti Kata Sandi */}
        <StaggerItem>
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded bg-panel border border-line flex items-center justify-center shrink-0 mt-0.5">
                <Key className="w-4 h-4 text-text-2" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Kata Sandi Akun</h2>
                <p className="text-[13px] text-text-3 mt-0.5">
                  Perbarui kata sandi secara berkala untuk menjaga keamanan akun Anda.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalGantiPasswordOpen(true)}
            >
              Ganti Kata Sandi
            </Button>
          </div>
        </StaggerItem>

        {/* Baris 2: Mode Tampilan */}
        <StaggerItem>
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded bg-panel border border-line flex items-center justify-center shrink-0 mt-0.5">
                <Sun className="w-4 h-4 text-text-2" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Mode Tampilan</h2>
                <p className="text-[13px] text-text-3 mt-0.5">
                  Sesuaikan tema tampilan antarmuka antara mode terang atau gelap.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-panel p-1 rounded-[6px] border border-line">
              <button
                type="button"
                disabled={isUpdatingTema}
                onClick={() => handleTemaChange("TERANG")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[4px] transition-all ${
                  tema === "TERANG"
                    ? "bg-surface text-text font-semibold shadow-xs border border-line"
                    : "text-text-3 hover:text-text border border-transparent"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Terang</span>
              </button>
              <button
                type="button"
                disabled={isUpdatingTema}
                onClick={() => handleTemaChange("GELAP")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[4px] transition-all ${
                  tema === "GELAP"
                    ? "bg-surface text-text font-semibold shadow-xs border border-line"
                    : "text-text-3 hover:text-text border border-transparent"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Gelap</span>
              </button>
            </div>
          </div>
        </StaggerItem>

        {/* Baris Kelola Akun (Hanya Admin) */}
        {user.peran === "ADMIN" && (
          <StaggerItem>
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-semibold text-text">Kelola Akun Petugas</h2>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-accent/10 text-accent uppercase">
                      Admin
                    </span>
                  </div>
                  <p className="text-[13px] text-text-3 mt-0.5">
                    Daftarkan akun baru, atur ulang kata sandi, dan kelola status aktif petugas.
                  </p>
                </div>
              </div>
              <Link href="/pengaturan/akun">
                <Button type="button" variant="secondary" size="sm">
                  Buka Kelola Akun
                </Button>
              </Link>
            </div>
          </StaggerItem>
        )}

        {/* Baris Keluar */}
        <StaggerItem>
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded bg-panel border border-line flex items-center justify-center shrink-0 mt-0.5">
                <LogOut className="w-4 h-4 text-text-2" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Sesi Masuk</h2>
                <p className="text-[13px] text-text-3 mt-0.5">
                  Keluar dari sistem dan akhiri sesi login pada peramban ini.
                </p>
              </div>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" size="sm">
                Keluar Akun
              </Button>
            </form>
          </div>
        </StaggerItem>
      </StaggerGroup>

      <GantiPasswordModal
        open={modalGantiPasswordOpen}
        onClose={() => setModalGantiPasswordOpen(false)}
      />
    </div>
  );
}
