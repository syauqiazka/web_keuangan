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
    const textSize = tableCell ? "text-[13px]" : "text-[14px]";
    const height = tableCell ? "h-8 px-2 py-1" : "h-9 px-3 py-1.5";

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[13px] font-medium text-text-2 select-none"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-surface border rounded-[4px] text-text ${height} ${textSize} transition-colors focus:outline-none focus:ring-2 focus:border-accent disabled:opacity-50 disabled:bg-panel disabled:cursor-not-allowed ${
            error
              ? "border-danger focus:ring-danger/20 focus:border-danger"
              : "border-line-strong focus:ring-accent/20"
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
        {error && <span className="text-[12px] text-danger">{error}</span>}
        {!error && helperText && (
          <span className="text-[12px] text-text-3">{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
