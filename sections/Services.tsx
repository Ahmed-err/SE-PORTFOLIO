"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Code, Smartphone, Server, Palette, Zap, Users, Database, LayoutDashboard, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { staggerContainer, fadeUp } from "@/lib/animations";
import type { MouseEvent } from "react";

const iconMap: Record<string, typeof Code> = {
  Code, Smartphone, Server, Palette, Zap, Users, Database, LayoutDashboard, Sparkles,
};

const serviceKeys = [
  { key: "fullstack", icon: "Code" },
  { key: "mobile", icon: "Smartphone" },
  { key: "api", icon: "Server" },
  { key: "uiux", icon: "Palette" },
  { key: "performance", icon: "Zap" },
  { key: "codeReview",  icon: "Users" },
  { key: "systems",    icon: "Database" },
  { key: "saas",       icon: "LayoutDashboard" },
  { key: "ai",         icon: "Sparkles" },
] as const;

function ServiceCard({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: string;
  index: number;
}) {
  const Icon = iconMap[icon] || Code;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-150, 150], [12, -12]);
  const rotateY = useTransform(x, [-150, 150], [-12, 12]);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const glowX = useTransform(x, [-150, 150], [30, 70]);
  const glowY = useTransform(y, [-150, 150], [30, 70]);
  const glowBackground = useTransform(
    [glowX, glowY],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(124,58,237,0.15) 0%, transparent 60%)`
  );

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
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl border border-border bg-card p-8 transition-colors hover:border-accent/50"
      data-cursor-hover
    >
      {/* Accent glow behind card on hover */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: glowBackground }}
      />

      <div className="relative">
        <motion.div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white"
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          transition={{
            scale: { type: "spring", stiffness: 400, damping: 15 },
            rotate: { type: "tween", duration: 0.35, ease: "easeInOut" },
          }}
        >
          <Icon size={24} />
        </motion.div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </motion.div>
  );
}

export default function Services() {
  const t = useTranslations("services");

  return (
    <SectionWrapper id="services" className="bg-card/50">
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
            02
          </span>
          <h2 className="relative mb-2 text-sm font-medium uppercase tracking-widest text-accent">
            {t("label")}
          </h2>
          <h3 className="relative text-3xl font-bold md:text-4xl">{t("title")}</h3>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {serviceKeys.map((s, i) => (
            <ServiceCard
              key={s.key}
              title={t(s.key)}
              description={t(`${s.key}Desc`)}
              icon={s.icon}
              index={i}
            />
          ))}
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
