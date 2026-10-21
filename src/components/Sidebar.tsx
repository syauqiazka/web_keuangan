"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
 * NavLink — Light, calm, and professional navigation link.
 * Active  : bg-surface-soft (#E5EFE8), text-brand (#245746), font-semibold, subtle border.
 * Inactive: text-text-3 (#647168), hover:text-text (#26352D), hover:bg-canvas (#F4F6F3).
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

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-[8px] transition-all duration-150 ${
        isActive
          ? "bg-surface-soft text-brand font-semibold border border-line/70 shadow-xs"
          : "text-text-3 font-medium hover:text-text hover:bg-canvas border border-transparent"
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 transition-colors ${
          isActive ? "text-brand" : "text-text-3 group-hover:text-text"
        }`}
        strokeWidth={isActive ? 2.25 : 1.75}
      />
      <span>{item.name}</span>
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
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        className="fixed top-[57px] left-0 right-0 bg-surface border-b border-line shadow-overlay p-4 space-y-4 max-h-[calc(100vh-57px)] overflow-y-auto"
      >
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>
        {user && (
          <div className="pt-3 border-t border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-surface-soft text-brand font-semibold text-[11px] flex items-center justify-center border border-line">
                {initials}
              </div>
              <div>
                <div className="text-[13px] font-medium text-text leading-tight">
                  {user.nama}
                </div>
                <div className="text-[11px] font-mono text-text-3">
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
      <div className="lg:hidden w-full bg-surface border-b border-line px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-surface-soft flex items-center justify-center border border-line">
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
            <div className="text-[13px] font-semibold text-text leading-tight">
              Pencatatan Keuangan Sekolah
            </div>
            <div className="text-[11px] text-text-3 leading-tight">
              Bank Saku Digital
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 text-text-2 rounded-[8px] border border-line hover:bg-canvas focus:outline-none transition-colors"
          aria-label={mobileMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="w-4 h-4 text-text" strokeWidth={1.75} />
          ) : (
            <Menu className="w-4 h-4 text-text" strokeWidth={1.75} />
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
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 min-h-screen bg-surface sticky top-0 h-screen select-none border-r border-line shadow-xs">
        {/* Brand header */}
        <div className="px-4 py-5 border-b border-line flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-surface-soft flex items-center justify-center shrink-0 border border-line">
            <Image
              src="/logo-bank-saku-digital.jpeg"
              alt="Logo Bank Saku Digital"
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-[6px]"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] font-semibold text-text leading-tight truncate">
              Pencatatan Keuangan
            </h1>
            <p className="text-[11px] text-text-3 leading-tight truncate">
              Bank Saku Digital
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User profile footer */}
        {user && (
          <div className="px-3.5 py-4 border-t border-line">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-surface-soft text-brand font-semibold text-[12px] flex items-center justify-center shrink-0 border border-line">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-text truncate leading-tight">
                  {user.nama}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-[4px] bg-canvas text-text-3 leading-none border border-line">
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
