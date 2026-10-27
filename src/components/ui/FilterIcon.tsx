import * as React from "react";

export const FilterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="4"
      d="m6 9l14.4 16.818v12.626L27.6 42V25.818L42 9z"
    />
  </svg>
);
