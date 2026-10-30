"use client";

/**
 * AnimatedNumber — menampilkan nilai numerik finansial secara langsung,
 * presisi, dan konsisten tanpa jeda ticker animasi.
 */

import * as React from "react";

export interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString("id-ID"),
  className,
}: AnimatedNumberProps) {
  return (
    <span className={className}>
      {format(value)}
    </span>
  );
}
