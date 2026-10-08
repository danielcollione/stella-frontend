"use client";

import type { ReactNode } from "react";
import { ViewTransition } from "react";
import { useSelectedLayoutSegment } from "next/navigation";

export function PublicPageTransition({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  if (segment === "(workspace)") return children;
  return <ViewTransition enter="stella-page" exit="stella-page" default="none">{children}</ViewTransition>;
}