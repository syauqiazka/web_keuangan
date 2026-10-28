import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "outline-brand"
  | "secondary"
  | "danger"
  | "danger-solid"
  | "ghost";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      disabled,
      children,
      type = "button",
      ...rest
    },
    ref
  ) => {
    // sm minimal 40px untuk target sentuh mobile (aksesibilitas)
    const sizeClasses =
      size === "sm"
        ? "min-h-[40px] px-3 py-1.5 text-[13px] gap-1.5"
        : "min-h-[40px] h-10 px-4 text-[14px] gap-2";

    let variantClasses = "";
    switch (variant) {
      case "primary":
        // Hijau solid (simpan / aksi utama)
        variantClasses =
          "bg-brand text-white font-medium rounded-[8px] border border-brand hover:bg-brand-hover hover:border-brand-hover shadow-xs focus:outline-none focus:ring-2 focus:ring-brand/30";
        break;
      case "accent":
        // Emas solid (mode edit / perhatian), teks WAJIB gelap #151515 (kontras 7,9:1)
        variantClasses =
          "bg-gold text-[#151515] font-semibold rounded-[8px] border border-gold hover:bg-gold-hover hover:border-gold-hover shadow-xs focus:outline-none focus:ring-2 focus:ring-gold/30";
        break;
      case "outline-brand":
        // Garis hijau, teks hijau (tambah baris/kolom, aktifkan kembali, terapkan filter)
        variantClasses =
          "bg-surface text-brand font-medium rounded-[8px] border border-brand/60 hover:bg-surface-soft hover:border-brand shadow-xs focus:outline-none focus:ring-2 focus:ring-brand/30";
        break;
      case "secondary":
        // Netral (batal, export excel, tombol sekunder)
        variantClasses =
          "bg-surface text-text font-medium border border-line-strong rounded-[8px] hover:bg-panel shadow-xs focus:outline-none focus:ring-2 focus:ring-brand/20";
        break;
      case "danger":
        // Garis merah (hapus transaksi, nonaktifkan akun)
        variantClasses =
          "bg-surface text-danger font-medium border border-danger/50 rounded-[8px] hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/20";
        break;
      case "danger-solid":
        // Merah solid (khusus dialog konfirmasi hapus permanen)
        variantClasses =
          "bg-danger text-white font-medium rounded-[8px] border border-danger hover:opacity-90 shadow-xs focus:outline-none focus:ring-2 focus:ring-danger/30";
        break;
      case "ghost":
        // Ghost tanpa border (reset filter)
        variantClasses =
          "bg-transparent text-text-3 font-medium rounded-[8px] border border-transparent hover:bg-panel hover:text-text focus:outline-none focus:ring-2 focus:ring-brand/20";
        break;
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center whitespace-nowrap shrink-0 select-none transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
        {...(rest as HTMLMotionProps<"button">)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

