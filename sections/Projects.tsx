"use client";

import { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { ExternalLink, Code2, BookOpen, X, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { staggerContainer, fadeUp } from "@/lib/animations";
import type { MouseEvent } from "react";

const projectKeys = [
  { key: "electroerp", tags: ["Next.js", "PostgreSQL", "Prisma", "NextAuth"],        live: "https://himmat.store",       github: "https://github.com/Ahmed-err/ecommerce-accounting-system" },
  { key: "printshop",  tags: ["React", "Express.js", "MongoDB", "Paymob"],            live: "https://harfoushprint.com",  github: "https://github.com/Ahmed-err/Print-Shop" },
  { key: "tajdera",    tags: ["React", "TypeScript", "Vite", "Framer Motion"],        live: null,                         github: "https://github.com/Ahmed-err/tajdera" },
  { key: "sarmadax",  tags: ["Next.js", "TypeScript", "next-intl", "Framer Motion"], live: null,                         github: "https://github.com/Ahmed-err/sarmadax" },
] as const;

type ProjectKey = (typeof projectKeys)[number]["key"];

/* ─── Case Study Modal ──────────────────────────────────────── */
function CaseStudyModal({
  projectKey,
  title,
  description,
  tags,
  live,
  github,
  onClose,
}: {
  projectKey: ProjectKey;
  title: string;
  description: string;
  tags: readonly string[];
  live: string | null;
  github: string;
  onClose: () => void;
}) {
  const t = useTranslations("projects");
  const ct = t as (key: string) => string;
  const k = projectKey;

  const features = [1, 2, 3, 4].map((n) => ct(`${k}Feature${n}`));
  const results  = [1, 2, 3].map((n)    => ct(`${k}Result${n}`));

  /* Lock body scroll while modal is open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-card border border-border shadow-2xl"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-5 pb-4 bg-card/95 backdrop-blur-sm border-b border-border">
          {/* Mobile drag handle */}
          <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-border" />
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
              <BookOpen size={14} className="text-accent" />
            </span>
            <h2 className="text-base font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-muted hover:bg-border hover:text-foreground transition-colors"
            aria-label="Close case study"
            data-cursor-hover
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-6 pb-8 pt-6 space-y-7">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {tag}
              </span>
            ))}
          </div>

          {/* Overview */}
          <p className="text-text-secondary leading-relaxed">{description}</p>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Challenge */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
              <span className="h-px w-4 bg-accent" />
              {ct("challenge")}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">{ct(`${k}Challenge`)}</p>
          </div>

          {/* Solution */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
              <span className="h-px w-4 bg-accent" />
              {ct("solution")}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">{ct(`${k}Solution`)}</p>
          </div>

          {/* Features */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
              <span className="h-px w-4 bg-accent" />
              {ct("features")}
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Results */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
              <span className="h-px w-4 bg-accent" />
              {ct("results")}
            </h3>
            <ul className="space-y-2.5">
              {results.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" />
                  <span className="text-text-secondary">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            {live && (
              <a
                href={live}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/85"
                data-cursor-hover
              >
                <ExternalLink size={14} />
                {ct("liveDemo")}
              </a>
            )}
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
              data-cursor-hover
            >
              <Code2 size={14} />
              {ct("sourceCode")}
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Project Card ──────────────────────────────────────────── */
function ProjectCard({
  title,
  description,
  tags,
  index,
  live,
  github,
  onCaseStudy,
}: {
  title: string;
  description: string;
  tags: readonly string[];
  index: number;
  live: string | null;
  github: string;
  onCaseStudy: () => void;
}) {
  const t = useTranslations("projects");
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-150, 150], [8, -8]);
  const rotateY = useTransform(x, [-150, 150], [-8, 8]);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent/50"
      data-cursor-hover
    >
      {/* Image / preview area */}
      <div className="relative aspect-video overflow-hidden bg-background">
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-card to-background transition-transform duration-500 group-hover:scale-105">
          <div className="absolute inset-0 bg-dot-grid opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-accent-light/5" />
          <span className="relative text-xl font-bold text-text-muted/40">{title}</span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-4 bg-accent/90 translate-y-full transition-transform duration-[400ms] ease-out group-hover:translate-y-0">
          {live && (
            <motion.a
              href={live} target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-white p-3 text-accent"
              aria-label="Live demo"
              data-cursor-hover
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink size={18} />
            </motion.a>
          )}
          <motion.a
            href={github} target="_blank" rel="noopener noreferrer"
            className="rounded-full bg-white p-3 text-accent"
            aria-label="GitHub repo"
            data-cursor-hover
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Code2 size={18} />
          </motion.a>
        </div>
      </div>

      {/* Card body */}
      <div className="p-6">
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-text-secondary">{description}</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {tag}
            </span>
          ))}
        </div>

        {/* Case Study trigger */}
        <button
          onClick={onCaseStudy}
          className="group/cs inline-flex items-center gap-2 text-xs font-medium text-text-muted transition-colors hover:text-accent"
          data-cursor-hover
        >
          <BookOpen size={13} className="transition-colors group-hover/cs:text-accent" />
          {t("viewCaseStudy")}
          <span className="transition-transform group-hover/cs:translate-x-0.5 ltr:inline rtl:hidden">→</span>
          <span className="transition-transform group-hover/cs:-translate-x-0.5 ltr:hidden rtl:inline">←</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Section ───────────────────────────────────────────────── */
export default function Projects() {
  const t = useTranslations("projects");
  const [activeKey, setActiveKey] = useState<ProjectKey | null>(null);

  const activeProject = activeKey ? projectKeys.find((p) => p.key === activeKey) : null;

  return (
    <SectionWrapper id="projects">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={fadeUp} className="relative mb-12 text-center">
          <span
            aria-hidden="true"
            className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2 -top-6 text-[9rem] font-black leading-none text-foreground/[0.06]"
          >
            03
          </span>
          <h2 className="relative mb-2 text-sm font-medium uppercase tracking-widest text-accent">
            {t("label")}
          </h2>
          <h3 className="relative text-3xl font-bold md:text-4xl">{t("title")}</h3>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {projectKeys.map((p, i) => (
            <ProjectCard
              key={p.key}
              title={t(p.key)}
              description={t(`${p.key}Desc`)}
              tags={p.tags}
              index={i}
              live={p.live}
              github={p.github}
              onCaseStudy={() => setActiveKey(p.key)}
            />
          ))}
        </div>
      </motion.div>

      {/* Case Study Modal */}
      <AnimatePresence>
        {activeProject && (
          <CaseStudyModal
            projectKey={activeProject.key}
            title={t(activeProject.key)}
            description={t(`${activeProject.key}Desc`)}
            tags={activeProject.tags}
            live={activeProject.live}
            github={activeProject.github}
            onClose={() => setActiveKey(null)}
          />
        )}
      </AnimatePresence>
    </SectionWrapper>
  );
}
