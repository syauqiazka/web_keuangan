"use client";

/**
 * BlurReveal — pembungkus komponen yang menyajikan konten secara langsung
 * tanpa efek blur berat atau jeda yang memperlambat akses data finansial.
 */

import * as React from "react";

export interface BlurRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  blur?: number;
  distance?: number;
  direction?: "up" | "down" | "none";
  as?: keyof React.JSX.IntrinsicElements;
  stagger?: number;
}

export function BlurReveal({
  children,
  className,
  as: Component = "div",
}: BlurRevealProps) {
  return React.createElement(
    Component,
    { className },
    children
  );
}

export function BlurItem({
  children,
  className,
  as: Component = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  return React.createElement(
    Component,
    { className },
    children
  );
}
