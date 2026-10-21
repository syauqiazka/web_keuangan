import * as React from "react";
import { motion } from "motion/react";
import { buttonTap, buttonHover, buttonTransition } from "@/lib/motion";

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
      onClick,
      onFocus,
      onBlur,
      onMouseEnter,
      onMouseLeave,
      onKeyDown,
      onKeyUp,
      onPointerDown,
      onPointerUp,
      type = "button",
      form,
      formAction,
      name,
      value,
      id,
      style,
      "aria-label": ariaLabel,
      "aria-disabled": ariaDisabled,
      ...rest
    },
    ref
  ) => {
    const sizeClasses =
      size === "sm"
        ? "h-8 px-3 text-[13px] gap-1.5"
        : "h-10 px-4 text-[14px] gap-2";

    let variantClasses = "";
    if (variant === "primary") {
      variantClasses =
        "bg-brand text-white font-medium rounded-[8px] border border-brand hover:bg-brand-secondary active:scale-[0.98] shadow-xs focus:outline-none focus:ring-2 focus:ring-brand/30";
    } else if (variant === "secondary") {
      variantClasses =
        "bg-surface text-text font-medium border border-line rounded-[8px] hover:bg-surface-soft active:scale-[0.98] shadow-xs focus:outline-none focus:ring-2 focus:ring-brand/20";
    } else if (variant === "danger") {
      variantClasses =
        "bg-surface text-danger font-medium border border-danger/40 rounded-[8px] hover:bg-danger/10 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-danger/20";
    }

    // Explicit data-* pass-through from rest
    const dataProps = Object.fromEntries(
      Object.entries(rest).filter(([k]) => k.startsWith("data-"))
    );

    return (
      <motion.button
        ref={ref}
        type={type}
        form={form}
        formAction={formAction as string | undefined}
        name={name}
        value={value as string | undefined}
        id={id}
        style={style}
        aria-label={ariaLabel}
        aria-disabled={ariaDisabled}
        disabled={disabled}
        className={`inline-flex items-center justify-center whitespace-nowrap shrink-0 select-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
        whileTap={disabled ? undefined : buttonTap}
        whileHover={disabled ? undefined : buttonHover}
        transition={buttonTransition}
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        {...dataProps}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
