"use client";

/**
 * VtuberGuideWrapper.tsx — Dynamic client loader untuk VtuberGuide
 * Memastikan rendering hanya di browser tanpa SSR mismatch.
 */

import dynamic from "next/dynamic";

export const VtuberGuideWrapper = dynamic(
  () => import("./VtuberGuide").then((mod) => mod.VtuberGuide),
  { ssr: false }
);
