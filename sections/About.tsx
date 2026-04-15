"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { staggerContainer, fadeUp, slideInLeft, slideInRight } from "@/lib/animations";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (prefersReduced) {
      setCount(target);
      return;
    }
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, prefersReduced]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function About() {
  const t = useTranslations("about");

  const stats = [
    { value: 5, suffix: "+", label: t("yearsExp") },
    { value: 50, suffix: "+", label: t("projects") },
    { value: 30, suffix: "+", label: t("happyClients") },
  ];

  const paragraphs = [t("p1"), t("p2"), t("p3")];

  return (
    <SectionWrapper id="about">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid gap-12 md:grid-cols-2 md:items-center"
      >
        {/* Image with rotating gradient border */}
        <motion.div variants={slideInLeft} className="relative">
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            {/* Rotating gradient border */}
            <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
              <div
                className="absolute inset-0 bg-[conic-gradient(from_0deg,var(--accent),var(--accent-light),transparent,var(--accent))]"
                style={{ animation: "rotate-gradient 4s linear infinite" }}
              />
            </div>
            <div className="relative h-full rounded-2xl bg-card flex items-center justify-center m-[2px]">
              <span className="text-6xl font-bold text-accent/30">AC</span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div variants={slideInRight}>
          <motion.h2
            variants={fadeUp}
            className="mb-2 text-sm font-medium uppercase tracking-widest text-accent"
          >
            {t("label")}
          </motion.h2>
          <motion.h3
            variants={fadeUp}
            className="mb-6 text-3xl font-bold md:text-4xl"
          >
            {t("title1")}
            <br />
            {t("title2")}
          </motion.h3>

          {/* Line-by-line text reveal */}
          <div className="space-y-4 text-text-secondary">
            {paragraphs.map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                {text}
              </motion.p>
            ))}
          </div>

          {/* Count-up stats */}
          <motion.div
            variants={fadeUp}
            className="mt-8 grid grid-cols-3 gap-6"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-accent">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
