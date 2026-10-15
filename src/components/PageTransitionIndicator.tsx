"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageTransitionIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // Track previous path to detect navigation completion
  const prevPathRef = useRef<string>("");

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (prevPathRef.current !== "" && prevPathRef.current !== currentPath) {
      // Navigasi selesai – matikan indikator
      const t = setTimeout(() => setIsNavigating(false), 50);
      return () => clearTimeout(t);
    }
    prevPathRef.current = currentPath;
  }, [pathname, searchParams]);

  // Intersep klik pada link internal untuk menampilkan indikator loading secara instan
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Hanya link internal yang berbeda dari URL saat ini
      if (
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        target.target !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          prevPathRef.current = currentUrl;
          setIsNavigating(true);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-line overflow-hidden pointer-events-none">
      <div className="h-full bg-accent animate-indeterminate-progress w-full" />
    </div>
  );
}
