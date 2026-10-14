import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
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
      ...props
    },
    ref
  ) => {
    const sizeClasses =
      size === "sm" ? "px-3 py-1.5 text-[14px]" : "px-4 py-2 text-[14px]";

    let variantClasses = "";
    if (variant === "primary") {
      // Tombol utama: latar Ink, teks Paper 14px/600, radius 2px, border 1px Ink
      variantClasses =
        "bg-text text-on-ink font-semibold rounded-[2px] border border-text hover:opacity-90 active:opacity-95";
    } else if (variant === "secondary") {
      // Tombol sekunder: transparan, teks Ink, outline 1px Ink inset, radius 4px
      variantClasses =
        "bg-transparent text-text font-[500] outline outline-1 outline-text -outline-offset-1 rounded-[4px] hover:bg-panel";
    } else if (variant === "danger") {
      // Tombol bahaya: teks dan outline Alert Red, radius 4px
      variantClasses =
        "bg-transparent text-danger font-[500] outline outline-1 outline-danger -outline-offset-1 rounded-[4px] hover:bg-panel";
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
