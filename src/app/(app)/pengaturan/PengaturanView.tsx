"use client";

import { useState } from "react";
import Link from "next/link";
import { setTemaAction } from "@/server/actions/theme";
import { logoutAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { GantiPasswordModal } from "@/components/GantiPasswordModal";
import type { SessionUser } from "@/server/auth/session";
import type { TemaTampilan } from "@/generated/prisma/client";

export function PengaturanView({ user }: { user: SessionUser }) {
  const [modalGantiPasswordOpen, setModalGantiPasswordOpen] = useState(false);
  const [tema, setTema] = useState<TemaTampilan>(user.tema === "GELAP" ? "GELAP" : "TERANG");
  const [isUpdatingTema, setIsUpdatingTema] = useState(false);

  const handleTemaChange = async (selectedTema: TemaTampilan) => {
    setTema(selectedTema);
    setIsUpdatingTema(true);
    try {
      await setTemaAction(selectedTema);
      // Terapkan data-theme langsung ke <html> agar responsif tanpa refresh
      document.documentElement.setAttribute(
        "data-theme",
        selectedTema === "GELAP" ? "dark" : "light"
      );
    } finally {
      setIsUpdatingTema(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-line">
        <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25]">
          Pengaturan
        </h1>
      </div>

      <div className="divide-y divide-line border-t border-b border-line">
        {/* Baris 1: Ganti Kata Sandi */}
        <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold text-text">Kata Sandi</h2>
            <p className="text-[14px] text-text-3 font-[360]">
              Perbarui kata sandi akun Anda secara berkala.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setModalGantiPasswordOpen(true)}
          >
            Ganti Kata Sandi
          </Button>
        </div>

        <div className="py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold text-text">Mode Tampilan</h2>
            <p className="text-[14px] text-text-3 font-[360]">
              Pilih tampilan tema antarmuka aplikasi.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-1">
            {(["TERANG", "GELAP"] as const).map((t) => (
              <label
                key={t}
                className="flex items-center gap-2 text-[14px] text-text cursor-pointer select-none"
              >
                <input
                  type="radio"
                  name="tema"
                  value={t}
                  checked={tema === t}
                  disabled={isUpdatingTema}
                  onChange={() => handleTemaChange(t)}
                  className="accent-accent w-4 h-4"
                />
                <span>
                  {t === "TERANG" ? "Terang" : "Gelap"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Baris Kelola Akun (Hanya Admin) */}
        {user.peran === "ADMIN" && (
          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-text">Kelola Akun</h2>
              <p className="text-[14px] text-text-3 font-[360]">
                Kelola daftar akun pengguna dan atur ulang kata sandi petugas.
              </p>
            </div>
            <Link href="/pengaturan/akun">
              <Button type="button" variant="secondary">
                Buka Kelola Akun
              </Button>
            </Link>
          </div>
        )}

        {/* Baris 3: Keluar */}
        <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold text-text">Sesi</h2>
            <p className="text-[14px] text-text-3 font-[360]">
              Keluar dari akun Anda pada perangkat ini.
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="secondary">
              Keluar
            </Button>
          </form>
        </div>
      </div>

      <GantiPasswordModal
        open={modalGantiPasswordOpen}
        onClose={() => setModalGantiPasswordOpen(false)}
      />
    </div>
  );
}
