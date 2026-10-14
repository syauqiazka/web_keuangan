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
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const textSize = tableCell ? "text-[14px]" : "text-[16px]";
    const padding = tableCell ? "px-2 py-1" : "px-3 py-2";

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[14px] font-[500] text-text select-none"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-canvas border rounded-none text-text ${padding} ${textSize} transition-colors focus:outline-2 focus:outline-accent focus:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-danger" : "border-line-strong"
          } ${className}`}
          {...props}
        />
        {error && <span className="text-[14px] text-danger">{error}</span>}
        {!error && helperText && (
          <span className="text-[14px] text-text-3">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
