"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { staggerContainer, fadeUp, slideInLeft, slideInRight } from "@/lib/animations";

/* ─── Animated Developer Avatar ─────────────────────────────── */
function AnimatedAvatar() {
  const prefersReduced = useReducedMotion();

  const floats = [
    { text: "</>", x: "6%",  y: "9%"  },
    { text: "{}",  x: "82%", y: "7%"  },
    { text: "=>",  x: "3%",  y: "74%" },
    { text: "[ ]", x: "83%", y: "72%" },
  ];

  return (
    <div className="relative aspect-square w-full max-w-sm mx-auto">
      {/* Rotating gradient border */}
      <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-[conic-gradient(from_0deg,#7c3aed,#a78bfa,transparent,#7c3aed)]"
          style={prefersReduced ? {} : { animation: "rotate-gradient 4s linear infinite" }}
        />
      </div>

      <div className="relative h-full rounded-2xl bg-card overflow-hidden m-[2px]">
        {/* Subtle texture + tint */}
        <div className="absolute inset-0 bg-dot-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-purple-400/5" />

        {/* Orbiting ring */}
        {!prefersReduced && (
          <motion.div
            className="pointer-events-none absolute inset-[12%] rounded-full"
            style={{ border: "1px solid rgba(139,92,246,0.12)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          >
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-accent/70"
              style={{ boxShadow: "0 0 10px rgba(139,92,246,0.9)" }}
            />
          </motion.div>
        )}

        {/* Floating code symbols */}
        {!prefersReduced && floats.map((f, i) => (
          <motion.span
            key={f.text}
            className="pointer-events-none absolute select-none font-mono text-xs font-bold text-accent/50"
            style={{ left: f.x, top: f.y }}
            animate={{ y: [-6, 6, -6], opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2.8 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          >
            {f.text}
          </motion.span>
        ))}

        {/* ── SVG character ── */}
        <svg viewBox="0 0 320 360" className="w-full h-full" aria-hidden="true">
          <defs>
            <linearGradient id="av-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="av-shirt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5b21b6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <radialGradient id="av-glow" cx="50%" cy="42%" r="48%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
            <filter id="av-drop">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#7c3aed" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Background glow */}
          <ellipse cx="160" cy="155" rx="128" ry="118" fill="url(#av-glow)" />

          {/* ── HEAD (floats up/down) ── */}
          <motion.g
            animate={prefersReduced ? {} : { y: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Neck */}
            <rect x="148" y="190" width="24" height="24" rx="8" fill="url(#av-body)" />

            {/* Head */}
            <ellipse cx="160" cy="130" rx="57" ry="63" fill="url(#av-body)" filter="url(#av-drop)" />

            {/* Hair */}
            <path d="M 103 118 Q 106 68 160 60 Q 214 68 217 118 Q 200 90 160 88 Q 120 90 103 118Z" fill="#2e1065" />

            {/* Headphones band */}
            <path d="M 103 124 Q 103 82 160 76 Q 217 82 217 124" fill="none" stroke="#3b0764" strokeWidth="9" strokeLinecap="round" />
            {/* Ear cups */}
            <rect x="95" y="118" width="16" height="24" rx="8" fill="#3b0764" />
            <rect x="96" y="122" width="14" height="16" rx="7" fill="#6d28d9" />
            <rect x="209" y="118" width="16" height="24" rx="8" fill="#3b0764" />
            <rect x="210" y="122" width="14" height="16" rx="7" fill="#6d28d9" />

            {/* Eyes */}
            <ellipse cx="141" cy="130" rx="13" ry="14" fill="white" />
            <ellipse cx="179" cy="130" rx="13" ry="14" fill="white" />
            <circle cx="143" cy="131" r="7.5" fill="#1e1b4b" />
            <circle cx="181" cy="131" r="7.5" fill="#1e1b4b" />
            <circle cx="145" cy="129" r="2.5" fill="white" />
            <circle cx="183" cy="129" r="2.5" fill="white" />

            {/* Eyebrows */}
            <path d="M 129 113 Q 141 107 153 113" stroke="#2e1065" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 167 113 Q 179 107 191 113" stroke="#2e1065" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            {/* Smile */}
            <path d="M 149 157 Q 160 169 171 157" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Cheek blush */}
            <circle cx="128" cy="151" r="11" fill="#a78bfa" opacity="0.18" />
            <circle cx="192" cy="151" r="11" fill="#a78bfa" opacity="0.18" />
          </motion.g>

          {/* ── BODY ── */}
          <path d="M 55 290 Q 55 252 90 242 L 160 234 L 230 242 Q 265 252 265 290 L 265 345 L 55 345 Z" fill="url(#av-shirt)" />

          {/* V-collar */}
          <path d="M 143 234 L 160 260 L 177 234 L 168 234 L 160 248 L 152 234 Z" fill="#3b0764" />

          {/* Arms */}
          <path d="M 55 260 Q 43 277 47 304 Q 50 318 65 320 L 71 296 Q 65 280 71 265 Z" fill="url(#av-body)" />
          <path d="M 265 260 Q 277 277 273 304 Q 270 318 255 320 L 249 296 Q 255 280 249 265 Z" fill="url(#av-body)" />

          {/* ── LAPTOP ── */}
          {/* Screen */}
          <rect x="80" y="252" width="160" height="96" rx="7" fill="#111827" stroke="#7c3aed" strokeWidth="1.5" />
          <rect x="88" y="260" width="144" height="80" rx="4" fill="#080810" />

          {/* Terminal prompt */}
          <text x="96" y="274" fontFamily="monospace" fontSize="8.5" fill="#7c3aed" opacity="0.9">$ npm run dev</text>

          {/* Code lines */}
          <rect x="96"  y="282" width="58"  height="3" rx="1.5" fill="#7c3aed" opacity="0.85" />
          <rect x="96"  y="289" width="98"  height="3" rx="1.5" fill="#a78bfa" opacity="0.65" />
          <rect x="104" y="296" width="74"  height="3" rx="1.5" fill="#7c3aed" opacity="0.6"  />
          <rect x="104" y="303" width="48"  height="3" rx="1.5" fill="#a78bfa" opacity="0.75" />
          <rect x="96"  y="310" width="64"  height="3" rx="1.5" fill="#7c3aed" opacity="0.5"  />
          <rect x="96"  y="317" width="36"  height="3" rx="1.5" fill="#a78bfa" opacity="0.6"  />

          {/* Blinking cursor */}
          <rect
            x="96" y="324" width="7" height="9" rx="1"
            fill="#7c3aed"
            style={{ animation: "blink-cursor 0.8s step-end infinite" }}
          />

          {/* Laptop hinge / base */}
          <path d="M 72 348 Q 160 357 248 348 L 254 362 Q 160 371 66 362 Z" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

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
        {/* Animated avatar */}
        <motion.div variants={slideInLeft} className="relative">
          <AnimatedAvatar />
        </motion.div>

        {/* Content */}
        <motion.div variants={slideInRight} className="relative">
          {/* Section number decoration */}
          <span
            aria-hidden="true"
            className="pointer-events-none select-none absolute ltr:right-0 rtl:left-0 top-0 text-[9rem] font-black leading-none text-foreground/[0.06]"
          >
            01
          </span>
          <motion.h2
            variants={fadeUp}
            className="relative mb-2 text-sm font-medium uppercase tracking-widest text-accent"
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
