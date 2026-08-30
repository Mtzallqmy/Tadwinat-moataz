"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export function AnimatedReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 10 }} animate={reduced ? undefined : { opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}>{children}</motion.div>;
}
