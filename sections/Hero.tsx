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

/* ─── Social icons ─────────────────────────────────────────── */
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);
const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const XBrandIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.733-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const socialLinks = [
  { icon: GithubIcon, href: "#", label: "GitHub" },
  { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
  { icon: XBrandIcon, href: "#", label: "Twitter / X" },
  { icon: WhatsAppIcon, href: "https://wa.me/message/your-number", label: "WhatsApp" },
];


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
    <span className="text-accent">
      {text}
      <span
        className="inline-block h-[1em] w-[2px] bg-accent align-middle ltr:ml-0.5 rtl:mr-0.5"
        style={{ animation: "blink-cursor 0.8s step-end infinite" }}
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

        {/* Divider + social links */}
        <motion.div variants={up} className="mt-6 flex flex-col items-center gap-4 sm:mt-8">
          <div className="flex w-full max-w-[200px] items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
              follow
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex items-center gap-3">
            {socialLinks.map((s, i) => (
              <motion.a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="rounded-full border border-border p-2.5 text-text-muted transition-colors duration-300 hover:border-accent hover:bg-accent/10 hover:text-accent"
                data-cursor-hover
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 1.5 + i * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                whileHover={{ scale: 1.12, y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <s.icon />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Animated scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-2.5 sm:bottom-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8 }}
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

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}
