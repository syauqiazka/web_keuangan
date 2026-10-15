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
      size === "sm" ? "px-3 py-1.5 text-[14px]" : "px-4 py-2 text-[14px]";

    let variantClasses = "";
    if (variant === "primary") {
      variantClasses =
        "bg-text text-on-ink font-semibold rounded-[2px] border border-text hover:opacity-90 active:opacity-95";
    } else if (variant === "secondary") {
      variantClasses =
        "bg-transparent text-text font-[500] outline outline-1 outline-text -outline-offset-1 rounded-[4px] hover:bg-panel";
    } else if (variant === "danger") {
      variantClasses =
        "bg-transparent text-danger font-[500] outline outline-1 outline-danger -outline-offset-1 rounded-[4px] hover:bg-panel";
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
        className={`inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
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
