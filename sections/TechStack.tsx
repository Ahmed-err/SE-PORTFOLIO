"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { fadeUp } from "@/lib/animations";

const row1Skills = [
  "React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion",
  "Node.js", "Python", "Express", "FastAPI", "GraphQL",
];
const row2Skills = [
  "PostgreSQL", "MongoDB", "Redis", "Prisma", "Docker",
  "AWS", "Vercel", "GitHub Actions", "Nginx", "Git",
];

function MarqueeRow({
  skills,
  direction,
}: {
  skills: string[];
  direction: "left" | "right";
}) {
  const doubled = [...skills, ...skills];
  const animName = direction === "left" ? "marquee-left" : "marquee-right";

  return (
    <div className="group relative overflow-hidden py-3">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent" />

      <div
        className="flex w-max gap-4 group-hover:[animation-play-state:paused]"
        style={{
          animation: `${animName} 30s linear infinite`,
        }}
      >
        {doubled.map((skill, i) => (
          <span
            key={`${skill}-${i}`}
            className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-text-secondary transition-all duration-200 hover:scale-110 hover:border-accent hover:text-accent hover:bg-accent/10"
            data-cursor-hover
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TechStack() {
  const t = useTranslations("techStack");

  return (
    <SectionWrapper id="techstack" className="bg-card/50">
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

        <motion.div variants={fadeUp} className="space-y-4">
          <MarqueeRow skills={row1Skills} direction="left" />
          <MarqueeRow skills={row2Skills} direction="right" />
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
