"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { checkReducedMotion, GSAP_EASE } from "@/lib/motion";
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

/**
 * NavLink — Green and Gold sidebar navigation item.
 * Active  : subtle gold-tinted active background, gold indicator bar, gold text & icon.
 * Inactive: soft sage muted text, smooth hover state with crisp contrast.
 * Motion  : hover background glides with spring, active pill slides in with AnimatePresence.
 */
function NavLink({
  item,
  onClick,
}: {
  item: MenuItem;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
  const Icon = item.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-[8px] ${
        isActive
          ? "text-sidebar-active-text font-semibold border border-sidebar-active-border shadow-xs"
          : "text-sidebar-text-muted font-medium border border-transparent"
      }`}
    >
      {/* Animated background pill — active bg atau hover bg */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            key="active-bg"
            layoutId={`sidebar-active-bg-${item.href}`}
            className="absolute inset-0 bg-sidebar-active-bg rounded-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            aria-hidden="true"
          />
        )}
        {!isActive && isHovered && (
          <motion.span
            key="hover-bg"
            className="absolute inset-0 bg-sidebar-hover-bg rounded-[8px]"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Gold indicator bar for active item */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            key="indicator"
            className="absolute left-0 top-2 bottom-2 w-1 bg-sidebar-gold rounded-r"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            style={{ transformOrigin: "center" }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.span
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative z-10 shrink-0"
      >
        <Icon
          className={`w-4 h-4 transition-colors ${
            isActive
              ? "text-sidebar-gold"
              : item.href === "/pemasukan"
              ? "text-[#7fe0b5] group-hover:text-sidebar-hover-text"
              : item.href === "/pengeluaran"
              ? "text-[#f28f85] group-hover:text-sidebar-hover-text"
              : item.href === "/pengaturan"
              ? "text-[#8fbdee] group-hover:text-sidebar-hover-text"
              : "text-sidebar-text-muted group-hover:text-sidebar-hover-text"
          }`}
          strokeWidth={isActive ? 2.25 : 1.75}
        />
      </motion.span>
      <span className={`relative z-10 transition-colors ${
        !isActive && isHovered ? "text-sidebar-hover-text" : ""
      }`}>{item.name}</span>
    </Link>
  );
}

function MobileDrawer({
  isOpen,
  onClose,
  user,
  initials,
}: {
  isOpen: boolean;
  onClose: () => void;
  user?: SessionUser | null;
  initials: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isOpen || !containerRef.current) return;
      if (checkReducedMotion()) return;

      const tl = gsap.timeline();
      tl.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.out" }
      ).fromTo(
        menuRef.current,
        { y: -14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.26, ease: GSAP_EASE.atmos },
        "<0.04"
      );
    },
    { dependencies: [isOpen], scope: containerRef }
  );

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="lg:hidden fixed inset-0 z-40">
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        className="fixed top-[57px] left-0 right-0 bg-sidebar-bg border-b border-sidebar-border shadow-overlay p-4 space-y-4 max-h-[calc(100vh-57px)] overflow-y-auto"
      >
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>
        {user && (
          <div className="pt-3 border-t border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-sidebar-active-bg text-sidebar-gold font-semibold text-[11px] flex items-center justify-center border border-sidebar-active-border">
                {initials}
              </div>
              <div>
                <div className="text-[13px] font-medium text-sidebar-text leading-tight">
                  {user.nama}
                </div>
                <div className="text-[11px] font-semibold text-sidebar-text-muted uppercase tracking-[0.06em]">
                  {user.peran}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user?: SessionUser | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile drawer on route change
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const initials = user?.nama
    ? user.nama
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      {/* ── Mobile Top Bar (< 1024px) ── */}
      <div className="lg:hidden w-full bg-sidebar-bg border-b border-sidebar-border px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-surface flex items-center justify-center border border-sidebar-border p-0.5">
            <Image
              src="/logo-bank-saku-digital.jpeg"
              alt="Logo Bank Saku Digital"
              width={28}
              height={28}
              className="w-7 h-7 object-contain rounded-[4px]"
              priority
            />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white leading-tight">
              Pencatatan Keuangan Sekolah
            </div>
            <div className="text-[11px] text-sidebar-text-muted leading-tight">
              Bank Saku Digital
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 text-sidebar-text rounded-[8px] border border-sidebar-border hover:bg-sidebar-hover-bg focus:outline-none transition-colors"
          aria-label={mobileMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="w-4 h-4 text-sidebar-text" strokeWidth={1.75} />
          ) : (
            <Menu className="w-4 h-4 text-sidebar-text" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        initials={initials}
      />

      {/* ── Desktop Sidebar (>= 1024px) ── */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 min-h-screen bg-sidebar-bg sticky top-0 h-screen select-none border-r border-sidebar-border shadow-xs">
        {/* Brand header */}
        <div className="px-4 py-5 border-b border-sidebar-divider flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-surface flex items-center justify-center shrink-0 border border-sidebar-divider p-1">
            <Image
              src="/logo-bank-saku-digital.jpeg"
              alt="Logo Bank Saku Digital"
              width={32}
              height={32}
              className="w-7 h-7 object-contain rounded-[4px]"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] font-semibold text-sidebar-text leading-tight truncate">
              Pencatatan Keuangan
            </h1>
            <p className="text-[11px] text-sidebar-text-muted leading-tight truncate">
              Bank Saku Digital
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User profile footer */}
        {user && (
          <div className="px-3.5 py-4 border-t border-sidebar-divider">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-sidebar-active-bg text-sidebar-gold font-semibold text-[12px] flex items-center justify-center shrink-0 border border-sidebar-active-border">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-sidebar-text truncate leading-tight">
                  {user.nama}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-[4px] bg-sidebar-hover-bg text-sidebar-gold leading-none border border-sidebar-divider tracking-[0.06em]">
                    {user.peran}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
