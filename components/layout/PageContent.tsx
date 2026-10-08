"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";

interface PageContentProps {
  children: ReactNode;
  className?: string;
  contentKey?: string | number;
  fadeOnly?: boolean;
  stagger?: boolean;
}

function ContentFrame({ children, className = "", fadeOnly, stagger }: PageContentProps) {
  const reducedMotion = useReducedMotion();
  const present = useIsPresent();
  const offset = reducedMotion || fadeOnly ? 0 : 8;

  return (
    <motion.div
      className={`stella-content ${stagger ? "stella-stagger" : ""} ${className}`}
      initial={{ opacity: reducedMotion ? 1 : 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: reducedMotion ? 1 : 0, y: offset ? -4 : 0, transition: { duration: reducedMotion ? 0 : 0.12 } }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      inert={!present}
      aria-hidden={!present || undefined}
    >
      {children}
    </motion.div>
  );
}

export function PageContent({ contentKey = "content", ...props }: PageContentProps) {
  return (
    <AnimatePresence mode="wait">
      <ContentFrame key={contentKey} {...props} />
    </AnimatePresence>
  );
}