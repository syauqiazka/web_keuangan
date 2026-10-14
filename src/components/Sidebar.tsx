"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  Menu,
  X,
} from "lucide-react";
import type { SessionUser } from "@/server/auth/session";

interface MenuItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const MENU_ITEMS: MenuItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Data Siswa & Guru", href: "/data-siswa-guru", icon: Users },
  { name: "Pemasukan", href: "/pemasukan", icon: ArrowDownLeft },
  { name: "Pengeluaran", href: "/pengeluaran", icon: ArrowUpRight },
  { name: "Pengaturan", href: "/pengaturan", icon: Settings },
];

export function Sidebar({ user }: { user?: SessionUser | null }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Bar (< 1024px) */}
      <div className="lg:hidden w-full bg-canvas border-b border-line px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-bank-saku-digital.jpeg"
            alt="Logo Bank Saku Digital"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            priority
          />
          <div>
            <div className="text-[14px] font-semibold text-text leading-tight">
              Pencatatan Keuangan Sekolah
            </div>
            <div className="text-[14px] font-[360] text-text-3 leading-tight">
              Bank Saku Digital
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 text-text rounded-[4px] hover:bg-panel focus:outline-none"
          aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-text" strokeWidth={1.5} />
          ) : (
            <Menu className="w-5 h-5 text-text" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav className="lg:hidden bg-canvas border-b border-line px-4 py-2 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 h-9 text-[14px] rounded-[4px] transition-colors ${
                  isActive
                    ? "font-semibold text-text outline outline-1 outline-text -outline-offset-1 bg-canvas"
                    : "font-[500] text-text hover:bg-panel"
                }`}
              >
                <Icon className="w-4 h-4 text-text shrink-0" strokeWidth={1.5} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Desktop Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 min-h-screen bg-canvas border-r border-line sticky top-0 h-screen">
        {/* Header Identitas */}
        <div className="p-4 border-b border-line flex items-center gap-3">
          <Image
            src="/logo-bank-saku-digital.jpeg"
            alt="Logo Bank Saku Digital"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            priority
          />
          <div className="min-w-0">
            <h1 className="text-[14px] font-semibold text-text leading-tight truncate">
              Pencatatan Keuangan Sekolah
            </h1>
            <p className="text-[14px] font-[360] text-text-3 leading-tight truncate">
              Bank Saku Digital
            </p>
          </div>
        </div>

        {/* Menu Navigasi (Urutan Excel) */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 h-9 text-[14px] rounded-[4px] transition-colors ${
                  isActive
                    ? "font-semibold text-text outline outline-1 outline-text -outline-offset-1 bg-canvas"
                    : "font-[500] text-text hover:bg-panel"
                }`}
              >
                <Icon className="w-4 h-4 text-text shrink-0" strokeWidth={1.5} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profil Singkat di Bawah Sidebar */}
        {user && (
          <div className="p-4 border-t border-line text-[14px]">
            <div className="font-semibold text-text truncate">{user.nama}</div>
            <div className="text-text-3 font-mono text-[12px]">{user.peran}</div>
          </div>
        )}
      </aside>
    </>
  );
}
