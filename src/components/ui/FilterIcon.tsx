import * as React from "react";

export const FilterIcon = ({
  width = 20,
  height = 20,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={4}
      d="m6 9l14.4 16.818v12.626L27.6 42V25.818L42 9z"
    />
  </svg>
);
