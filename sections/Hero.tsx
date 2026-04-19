"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { wordReveal, wordRevealChild } from "@/lib/animations";


/* ─── Spring-smoothed gradient mesh ────────────────────────── */
function GradientMesh() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const sx = useSpring(rawX, { stiffness: 40, damping: 25 });
  const sy = useSpring(rawY, { stiffness: 40, damping: 25 });

  const b1x = useTransform(sx, [-600, 600], [-50, 50]);
  const b1y = useTransform(sy, [-600, 600], [-50, 50]);
  const b2x = useTransform(sx, [-600, 600], [35, -35]);
  const b2y = useTransform(sy, [-600, 600], [35, -35]);
  const b3x = useTransform(sx, [-600, 600], [-22, 22]);
  const b3y = useTransform(sy, [-600, 600], [22, -22]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX - window.innerWidth / 2);
      rawY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/4 top-1/4 h-[650px] w-[650px] rounded-full bg-accent/10 blur-[130px]"
        style={{ x: b1x, y: b1y }}
        animate={{ scale: [1, 1.08, 0.93, 1.04, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-accent-light/8 blur-[110px]"
        style={{ x: b2x, y: b2y }}
        animate={{ scale: [1, 0.92, 1.07, 0.96, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/3 ltr:left-1/3 rtl:right-1/3 h-[380px] w-[380px] rounded-full bg-purple-600/6 blur-[90px]"
        style={{ x: b3x, y: b3y }}
        animate={{ scale: [1, 1.14, 0.86, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      {/* Static warm centre glow */}
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px]" />
    </div>
  );
}

/* ─── Sonar pulse rings ─────────────────────────────────────── */
function PulseRings() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-accent/[0.07]"
          animate={{
            width: ["160px", "900px"],
            height: ["160px", "900px"],
            opacity: [0.55, 0],
          }}
          transition={{
            duration: 5.5,
            delay: i * 1.8,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Typewriter ────────────────────────────────────────────── */
function Typewriter({ roles }: { roles: string[] }) {
  const [roleIndex, setRoleIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const current = roles[roleIndex];
    if (!deleting && text === current) {
      timerRef.current = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && text === "") {
      setDeleting(false);
      setRoleIndex((p) => (p + 1) % roles.length);
    } else {
      timerRef.current = setTimeout(
        () => setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1)),
        deleting ? 38 : 75
      );
    }
    return () => clearTimeout(timerRef.current);
  }, [text, deleting, roleIndex]);

  return (
    <span className="inline-flex items-center">
      <span
        className="font-semibold text-foreground"
        style={{
          textShadow:
            "0 0 18px rgba(139,92,246,0.65), 0 0 40px rgba(139,92,246,0.25)",
        }}
      >
        {text}
      </span>
      <span
        className="inline-block w-[3px] rounded-[1px] bg-accent align-middle ltr:ml-1 rtl:mr-1"
        style={{
          height: "1.1em",
          animation: "blink-cursor 0.8s step-end infinite",
          boxShadow:
            "0 0 8px rgba(139,92,246,0.9), 0 0 18px rgba(139,92,246,0.45)",
        }}
      />
    </span>
  );
}

/* ─── Split-word heading with shimmer name ──────────────────── */
function SplitWordHeading({ greeting, name }: { greeting: string; name: string }) {
  return (
    <motion.h1
      variants={wordReveal}
      className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-7xl lg:text-8xl"
      style={{ perspective: 600 }}
    >
      {greeting.split(" ").map((word, i) => (
        <motion.span
          key={`g-${i}`}
          variants={wordRevealChild}
          className="inline-block ltr:mr-[0.22em] rtl:ml-[0.22em]"
        >
          {word}
        </motion.span>
      ))}
      <br className="hidden sm:block" />
      <motion.span
        variants={wordRevealChild}
        className="inline bg-gradient-to-r from-accent via-accent-light to-accent bg-[length:200%_auto] bg-clip-text text-transparent"
        style={{ animation: "text-shimmer 4s linear infinite" }}
      >
        {name}
      </motion.span>
    </motion.h1>
  );
}

/* ─── Main component ────────────────────────────────────────── */
export default function Hero() {
  const t = useTranslations("hero");
  const prefersReduced = useReducedMotion();
  const roles = [t("role1"), t("role2"), t("role3"), t("role4")];

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.14 } },
  };

  /* Shared fade-up used for most blocks */
  const up = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
  };

  /* Badge gets a subtle scale-in */
  const badge = {
    hidden: { opacity: 0, scale: prefersReduced ? 1 : 0.82, y: prefersReduced ? 0 : 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] as const },
    },
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pt-20 pb-16 sm:px-6 md:pb-20"
    >
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30" />

      {!prefersReduced && <GradientMesh />}
      {!prefersReduced && <PulseRings />}

      {/* Content */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-4xl text-center"
      >
        {/* Availability badge */}
        <motion.div variants={badge} className="mb-7 flex justify-center sm:mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent backdrop-blur-sm sm:text-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {t("available")}
          </span>
        </motion.div>

        {/* Typewriter role */}
        <motion.div
          variants={up}
          className="mb-3 text-base font-medium text-text-secondary sm:text-lg md:text-xl"
        >
          <Typewriter roles={roles} />
        </motion.div>

        {/* Main heading */}
        <SplitWordHeading greeting={t("greeting")} name={t("name")} />

        {/* Description */}
        <motion.p
          variants={up}
          className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base md:max-w-2xl md:text-lg lg:text-xl"
        >
          {t("description")}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={up}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4"
        >
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() =>
              document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {t("viewWork")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() =>
              document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {t("getInTouch")}
          </Button>
        </motion.div>

        {/* Scroll indicator — inline below buttons */}
        <motion.div
          variants={up}
          className="mt-10 flex flex-col items-center gap-2.5"
        >
          <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-text-muted sm:text-[10px]">
            scroll
          </span>
          <div className="relative h-12 w-px overflow-hidden rounded-full bg-border/50 sm:h-14">
            <motion.div
              className="absolute inset-x-0 rounded-full bg-gradient-to-b from-accent to-accent-light"
              animate={{ top: ["-40%", "140%"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 0.4,
              }}
              style={{ height: "40%" }}
            />
          </div>
        </motion.div>

      </motion.div>

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}
