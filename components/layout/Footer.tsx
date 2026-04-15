"use client";

import { Globe, Link, X, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

const socialLinks = [
  { icon: Globe, href: "#", label: "GitHub" },
  { icon: Link, href: "#", label: "LinkedIn" },
  { icon: X, href: "#", label: "Twitter" },
  { icon: Mail, href: "mailto:hello@alexcarter.dev", label: "Email" },
];

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-card px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="text-center md:ltr:text-left md:rtl:text-right">
          <span className="text-lg font-bold text-accent">AC</span>
          <p className="mt-1 text-sm text-text-secondary">{t("tagline")}</p>
        </div>

        <div className="flex gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="rounded-full border border-border p-2.5 text-text-secondary transition-all hover:border-accent hover:text-accent"
              data-cursor-hover
            >
              <social.icon size={18} />
            </a>
          ))}
        </div>

        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Alex Carter. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
