"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/*
  Two-layer entry animation:

  1. motion.section — fades in quickly (0.25 s) using string variants so
     "hidden" / "visible" propagates down the tree to staggerContainer and
     its fadeUp children. Section is fully opaque before children start,
     eliminating the double-opacity multiplication problem.

  2. inner motion.div — slides up 52 px independently (object animation,
     no opacity) giving the "content arriving from below" feel.

  3. accent line — scales in from centre as the section enters view.

  4. animated blob — a soft radial glow that drifts slowly, alternating
     left/right side per section so adjacent sections contrast visually.
*/

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

/* Section order determines which side the blob appears on */
const sectionOrder = ["about", "services", "projects", "techstack", "testimonials", "contact"];

export default function SectionWrapper({
  id,
  children,
  className,
}: SectionWrapperProps) {
  const idx = sectionOrder.indexOf(id);
  const isRight = idx % 2 === 0; // even → right, odd → left

  return (
    <motion.section
      id={id}
      className={cn(
        "relative overflow-x-hidden px-6 py-24 md:px-12 lg:px-24",
        className
      )}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {/* Animated ambient blob — outer fades in, inner floats */}
      <motion.div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2",
          isRight ? "ltr:-right-32 rtl:-left-32" : "ltr:-left-32 rtl:-right-32"
        )}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className={cn(
            "h-[500px] w-[500px] rounded-full blur-[120px]",
            isRight ? "bg-accent/[0.07]" : "bg-accent-light/[0.06]"
          )}
          animate={{ y: [0, -30, 15, -10, 0], scale: [1, 1.06, 0.96, 1.03, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Gradient accent line that sweeps in from the centre */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px origin-center bg-gradient-to-r from-transparent via-accent/40 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Content lifts up after the section fades in */}
      <motion.div
        className="mx-auto max-w-6xl"
        initial={{ y: 52 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
}
