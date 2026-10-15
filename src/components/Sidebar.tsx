"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { EASE, DURATION } from "@/lib/motion";

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

function NavLink({
  item,
  onClick,
}: {
  item: MenuItem;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2 h-9 text-[14px] rounded-[4px] transition-colors ${
        isActive
          ? "font-semibold text-text"
          : "font-[500] text-text hover:bg-panel"
      }`}
    >
      {/* Active pill indicator */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-[4px] outline outline-1 outline-text -outline-offset-1 bg-canvas"
          style={{ zIndex: -1 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        />
      )}
      <Icon className="w-4 h-4 text-text shrink-0" strokeWidth={1.5} />
      <span>{item.name}</span>
    </Link>
  );
}

export function Sidebar({ user }: { user?: SessionUser | null }) {
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
        <motion.button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 text-text rounded-[4px] hover:bg-panel focus:outline-none"
          aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileMenuOpen ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: DURATION.fast }}
              >
                <X className="w-5 h-5 text-text" strokeWidth={1.5} />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ opacity: 0, rotate: 45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -45 }}
                transition={{ duration: DURATION.fast }}
              >
                <Menu className="w-5 h-5 text-text" strokeWidth={1.5} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            className="lg:hidden bg-canvas border-b border-line px-4 py-2 space-y-1 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.base, ease: EASE.decel }}
          >
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

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

        {/* Menu Navigasi */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
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
