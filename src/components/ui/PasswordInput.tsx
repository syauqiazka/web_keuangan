"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import type { InputProps } from "@/components/ui/Input";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  resetVisibilityKey?: string | number | boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      helperText,
      tableCell = false,
      className = "",
      id,
      resetVisibilityKey,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const [showPassword, setShowPassword] = React.useState(false);

    // Reset visibility when reset key changes (e.g. form submit success or modal close/open)
    React.useEffect(() => {
      setShowPassword(false);
    }, [resetVisibilityKey]);

    const textSize = tableCell ? "text-[13px]" : "text-[14px]";
    const height = tableCell ? "h-8 px-2.5 py-1" : "h-10 px-3.5 py-2";

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-text select-none"
          >
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            disabled={disabled}
            className={`w-full bg-surface border rounded-[10px] text-text ${height} ${textSize} pr-11 transition-colors placeholder:text-text-3/60 focus:outline-none focus:ring-2 focus:border-brand disabled:opacity-50 disabled:bg-panel disabled:cursor-not-allowed ${
              error
                ? "border-danger focus:ring-danger/20 focus:border-danger"
                : "border-input-border hover:border-line-strong focus:ring-brand/20"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            className="absolute right-0 top-0 bottom-0 min-w-[40px] min-h-[40px] px-2.5 flex items-center justify-center text-text-3 hover:text-text focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-inset rounded-r-[10px] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showPassword}
            title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-text-2" />
            ) : (
              <Eye className="w-4 h-4 text-text-3" />
            )}
          </button>
        </div>
        {error && <span className="text-[12px] text-danger">{error}</span>}
        {!error && helperText && (
          <span className="text-[12px] text-text-3">{helperText}</span>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
