"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ExternalLink, Code2 } from "lucide-react";
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { staggerContainer, fadeUp } from "@/lib/animations";
import type { MouseEvent } from "react";

const projectKeys = [
  { key: "saas", tags: ["React", "Next.js", "Stripe", "PostgreSQL"] },
  { key: "ecommerce", tags: ["Next.js", "Shopify API", "Tailwind"] },
  { key: "chat", tags: ["Socket.io", "Node.js", "Redis"] },
  { key: "ai", tags: ["OpenAI API", "Next.js", "Prisma"] },
] as const;

function ProjectCard({
  title,
  description,
  tags,
  index,
}: {
  title: string;
  description: string;
  tags: string[];
  index: number;
}) {
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

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent/50"
      data-cursor-hover
    >
      {/* Image area with zoom + overlay slide-up */}
      <div className="relative aspect-video overflow-hidden bg-background">
        <div className="flex h-full items-center justify-center transition-transform duration-500 group-hover:scale-105">
          <span className="text-2xl font-bold text-text-muted/30">
            {title}
          </span>
        </div>
        {/* Overlay slides up from bottom */}
        <div className="absolute inset-0 flex items-center justify-center gap-4 bg-accent/90 translate-y-full transition-transform duration-400 ease-out group-hover:translate-y-0">
          <motion.a
            href="#"
            className="rounded-full bg-white p-3 text-accent"
            data-cursor-hover
            aria-label="Live demo"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          >
            <ExternalLink size={18} />
          </motion.a>
          <motion.a
            href="#"
            className="rounded-full bg-white p-3 text-accent"
            data-cursor-hover
            aria-label="GitHub repo"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Code2 size={18} />
          </motion.a>
        </div>
      </div>

      <div className="p-6">
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-text-secondary">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const t = useTranslations("projects");

  return (
    <SectionWrapper id="projects">
      <motion.div
        variants={staggerContainer}
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

        <div className="grid gap-8 md:grid-cols-2">
          {projectKeys.map((p, i) => (
            <ProjectCard
              key={p.key}
              title={t(p.key)}
              description={t(`${p.key}Desc`)}
              tags={[...p.tags]}
              index={i}
            />
          ))}
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
