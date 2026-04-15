"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, Languages } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { mobileNavContainer, mobileNavItem } from "@/lib/animations";

const navKeys = [
  { key: "about", href: "#about" },
  { key: "services", href: "#services" },
  { key: "projects", href: "#projects" },
  { key: "techStack", href: "#techstack" },
  { key: "testimonials", href: "#testimonials" },
  { key: "contact", href: "#contact" },
] as const;

const sectionIds = ["about", "services", "projects", "techstack", "testimonials", "contact"];

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const updateActiveSection = useCallback(() => {
    const scrollY = window.scrollY + 150;
    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const el = document.getElementById(sectionIds[i]);
      if (el && el.offsetTop <= scrollY) {
        setActiveSection(sectionIds[i]);
        return;
      }
    }
    setActiveSection("");
  }, []);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      updateActiveSection();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [updateActiveSection]);

  const handleClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleLocale = async () => {
    const newLocale = locale === "en" ? "ar" : "en";
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    });
    window.location.reload();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#"
          className="text-xl font-bold text-accent"
          data-cursor-hover
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          AC
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {navKeys.map((link) => {
            const sectionId = link.href.replace("#", "");
            const isActive = activeSection === sectionId;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleClick(link.href);
                }}
                className={`group relative text-sm transition-colors ${
                  isActive ? "text-accent" : "text-text-secondary hover:text-foreground"
                }`}
                data-cursor-hover
              >
                {t(link.key)}
                {/* Animated underline */}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] bg-accent transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            );
          })}

          {/* Theme toggle */}
          {mounted && (
            <motion.button
              onClick={toggleTheme}
              className="rounded-full border border-border p-2 text-text-secondary transition-colors hover:border-accent hover:text-accent"
              data-cursor-hover
              aria-label="Toggle theme"
              whileTap={{ scale: 0.9, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          )}

          {/* Language toggle */}
          <motion.button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
            data-cursor-hover
            aria-label="Toggle language"
            whileTap={{ scale: 0.95 }}
          >
            <Languages size={14} />
            {locale === "en" ? "AR" : "EN"}
          </motion.button>

          <Button size="sm" onClick={() => handleClick("#contact")}>
            {t("hireMe")}
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="rounded-full border border-border p-2 text-text-secondary"
              data-cursor-hover
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          <button
            onClick={toggleLocale}
            className="rounded-full border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary"
            data-cursor-hover
            aria-label="Toggle language"
          >
            {locale === "en" ? "AR" : "EN"}
          </button>

          <button
            className="text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-cursor-hover
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mobileOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile drawer — staggered links */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-b border-border bg-background/95 backdrop-blur-md md:hidden"
          >
            <motion.div
              variants={mobileNavContainer}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-col gap-4 px-6 py-6"
            >
              {navKeys.map((link) => {
                const sectionId = link.href.replace("#", "");
                const isActive = activeSection === sectionId;
                return (
                  <motion.a
                    key={link.href}
                    variants={mobileNavItem}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleClick(link.href);
                    }}
                    className={`transition-colors ${
                      isActive ? "text-accent font-medium" : "text-text-secondary hover:text-foreground"
                    }`}
                    data-cursor-hover
                  >
                    {t(link.key)}
                  </motion.a>
                );
              })}
              <motion.div variants={mobileNavItem}>
                <Button
                  size="sm"
                  className="w-fit"
                  onClick={() => handleClick("#contact")}
                >
                  {t("hireMe")}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
