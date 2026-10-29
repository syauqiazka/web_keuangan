import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface BackLinkProps {
  href: string;
  label: string;
  className?: string;
}

export function BackLink({ href, label, className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 min-h-[40px] px-2 -ml-2 rounded-[8px] text-[13px] font-medium text-text-3 hover:text-text hover:bg-panel transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0 text-text-3 group-hover:text-text" />
      <span>{label}</span>
    </Link>
  );
}
