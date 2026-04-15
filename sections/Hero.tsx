"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { wordReveal, wordRevealChild } from "@/lib/animations";
// heroFadeUp is defined locally to support useReducedMotion

const typewriterRoles = [
  "Full-Stack Developer",
  "UI/UX Engineer",
  "Open Source Contributor",
  "Problem Solver",
];

function GradientMesh() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const blob1X = useTransform(mouseX, [-400, 400], [-30, 30]);
  const blob1Y = useTransform(mouseY, [-400, 400], [-30, 30]);
  const blob2X = useTransform(mouseX, [-400, 400], [20, -20]);
  const blob2Y = useTransform(mouseY, [-400, 400], [20, -20]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[100px]"
        style={{ x: blob1X, y: blob1Y }}
        animate={{
          scale: [1, 1.05, 0.95, 1.02, 1],
          x: [0, 30, -20, 20, 0],
          y: [0, -30, 20, 10, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-light/6 blur-[100px]"
        style={{ x: blob2X, y: blob2Y }}
        animate={{
          scale: [1, 0.95, 1.05, 0.98, 1],
          x: [0, -20, 30, -10, 0],
          y: [0, 20, -20, 30, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[80px]"
        animate={{
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function Typewriter() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const currentRole = typewriterRoles[roleIndex];

    if (!deleting && text === currentRole) {
      timerRef.current = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && text === "") {
      setDeleting(false);
      setRoleIndex((prev) => (prev + 1) % typewriterRoles.length);
    } else {
      timerRef.current = setTimeout(
        () => {
          setText(
            deleting
              ? currentRole.slice(0, text.length - 1)
              : currentRole.slice(0, text.length + 1)
          );
        },
        deleting ? 40 : 80
      );
    }

    return () => clearTimeout(timerRef.current);
  }, [text, deleting, roleIndex]);

  return (
    <span className="text-accent">
      {text}
      <span
        className="inline-block w-[2px] h-[1em] bg-accent align-middle ltr:ml-0.5 rtl:mr-0.5"
        style={{ animation: "blink-cursor 0.8s step-end infinite" }}
      />
    </span>
  );
}

function SplitWordHeading({ greeting, name }: { greeting: string; name: string }) {
  const allWords = greeting.split(" ");

  return (
    <motion.h1
      variants={wordReveal}
      className="mb-6 text-5xl font-bold leading-tight md:text-7xl lg:text-8xl"
      style={{ perspective: 400 }}
    >
      {allWords.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={wordRevealChild}
          className="inline-block ltr:mr-[0.25em] rtl:ml-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
      <br className="hidden sm:block" />
      {name.split(" ").map((word, i) => (
        <motion.span
          key={`name-${word}-${i}`}
          variants={wordRevealChild}
          className="inline-block bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent ltr:mr-[0.25em] rtl:ml-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}

export default function Hero() {
  const t = useTranslations("hero");
  const prefersReduced = useReducedMotion();

  const stagger = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReduced ? 0 : 0.12 },
    },
  };

  const heroFadeUp = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
    >
      {!prefersReduced && <GradientMesh />}

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center"
      >
        <motion.div variants={heroFadeUp} className="mb-4">
          <Typewriter />
        </motion.div>

        <SplitWordHeading greeting={t("greeting")} name={t("name")} />

        <motion.p
          variants={heroFadeUp}
          className="mx-auto mb-10 max-w-xl text-lg text-text-secondary md:text-xl"
        >
          {t("description")}
        </motion.p>

        <motion.div
          variants={heroFadeUp}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button
            size="lg"
            onClick={() =>
              document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {t("viewWork")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {t("getInTouch")}
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <span className="text-xs uppercase tracking-widest text-text-muted">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="text-text-muted" size={20} />
        </motion.div>
      </motion.div>
    </section>
  );
}
