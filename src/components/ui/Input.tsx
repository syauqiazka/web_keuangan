import * as React from "react";

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
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

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
            type={type}
            className={`w-full bg-surface border rounded-[10px] text-text ${height} ${textSize} transition-colors placeholder:text-text-3/60 focus:outline-none focus:ring-2 focus:border-brand disabled:opacity-50 disabled:bg-panel disabled:cursor-not-allowed ${
              error
                ? "border-danger focus:ring-danger/20 focus:border-danger"
                : "border-input-border hover:border-line-strong focus:ring-brand/20"
            } ${className}`}
            {...props}
          />
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
