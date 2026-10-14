import * as React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  tableCell?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      children,
      tableCell = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const textSize = tableCell ? "text-[14px]" : "text-[16px]";
    const padding = tableCell ? "px-2 py-1" : "px-3 py-2";

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[14px] font-[500] text-text select-none"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-canvas border rounded-none text-text ${padding} ${textSize} transition-colors focus:outline-2 focus:outline-accent focus:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-danger" : "border-line-strong"
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-[14px] text-danger">{error}</span>}
        {!error && helperText && (
          <span className="text-[14px] text-text-3">{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
