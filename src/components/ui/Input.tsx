import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  tableCell?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      tableCell = false,
      className = "",
      id,
      type,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const [showPassword, setShowPassword] = React.useState(false);

    const isPassword = type === "password";
    const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

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
            type={resolvedType}
            className={`w-full bg-surface border rounded-[10px] text-text ${height} ${textSize} ${
              isPassword ? "pr-10" : ""
            } transition-colors placeholder:text-text-3/60 focus:outline-none focus:ring-2 focus:border-brand disabled:opacity-50 disabled:bg-panel disabled:cursor-not-allowed ${
              error
                ? "border-danger focus:ring-danger/20 focus:border-danger"
                : "border-line hover:border-line-strong focus:ring-brand/20"
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-3 hover:text-text rounded-[6px] focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-text-2" />
              ) : (
                <Eye className="w-4 h-4 text-text-3" />
              )}
            </button>
          )}
        </div>
        {error && <span className="text-[12px] text-danger">{error}</span>}
        {!error && helperText && (
          <span className="text-[12px] text-text-3">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
