"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { fadeUp } from "@/lib/animations";

const testimonialKeys = [
  { key: "sarah", name: "Sarah Mitchell", role: "CTO", company: "NovaTech" },
  { key: "james", name: "James Okafor", role: "Founder", company: "Launchpad" },
  { key: "priya", name: "Priya Nair", role: "Product Manager", company: "Finlo" },
] as const;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export default function Testimonials() {
  const t = useTranslations("testimonials");
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonialKeys.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const item = testimonialKeys[current];

  return (
    <SectionWrapper id="testimonials">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-accent">
            {t("label")}
          </h2>
          <h3 className="text-3xl font-bold md:text-4xl">{t("title")}</h3>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="relative mx-auto max-w-2xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-12">
            {/* Background quote decoration */}
            <Quote
              className="absolute top-4 ltr:right-4 rtl:left-4 text-accent/5"
              size={120}
            />

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative"
              >
                <Quote className="mb-4 text-accent/40" size={32} />
                <p className="mb-8 text-lg text-text-secondary leading-relaxed">
                  &ldquo;{t(item.key)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {item.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-text-muted">
                      {item.role} @ {item.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="mt-6 flex justify-center gap-2">
            {testimonialKeys.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 bg-accent"
                    : "w-2.5 bg-border hover:bg-text-muted"
                }`}
                data-cursor-hover
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
