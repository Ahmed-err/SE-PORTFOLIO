"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, Clock, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { staggerContainer, fadeUp } from "@/lib/animations";

function FloatingInput({
  type = "text",
  label,
  value,
  onChange,
  required,
  textarea,
}: {
  type?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  textarea?: boolean;
}) {
  const baseClass =
    "floating-label-input peer w-full rounded-xl border border-border bg-background px-4 pt-5 pb-2 text-foreground placeholder-transparent focus:border-accent focus:outline-none transition-colors";

  return (
    <div className="relative">
      {textarea ? (
        <textarea
          placeholder={label}
          required={required}
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          placeholder={label}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      )}
      <label className="floating-label pointer-events-none absolute top-3.5 ltr:left-4 rtl:right-4 text-text-muted text-sm transition-all duration-200 peer-focus:translate-y-[-1.75rem] peer-focus:scale-[0.85] peer-focus:text-accent peer-[:not(:placeholder-shown)]:translate-y-[-1.75rem] peer-[:not(:placeholder-shown)]:scale-[0.85] peer-[:not(:placeholder-shown)]:text-accent origin-left rtl:origin-right">
        {label}
      </label>
    </div>
  );
}

export default function Contact() {
  const t = useTranslations("contact");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const contactInfo = [
    { icon: Mail, label: t("email"), hasPulse: false },
    { icon: MapPin, label: t("location"), hasPulse: false },
    { icon: Clock, label: t("availability"), hasPulse: true },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      if (res.ok) {
        setStatus("sent");
        setFormState({ name: "", email: "", message: "" });
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <SectionWrapper id="contact" className="bg-card/50">
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

        <div className="grid gap-12 md:grid-cols-2">
          {/* Contact info */}
          <motion.div variants={fadeUp} className="space-y-8">
            <p className="text-text-secondary">{t("description")}</p>

            <div className="space-y-4">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <item.icon size={18} />
                    {item.hasPulse && (
                      <span className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 flex h-3 w-3">
                        <span
                          className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                          style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                        />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                      </span>
                    )}
                  </div>
                  <span className="text-text-secondary">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            variants={fadeUp}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <FloatingInput
              label={t("namePlaceholder")}
              value={formState.name}
              onChange={(val) => setFormState({ ...formState, name: val })}
              required
            />
            <FloatingInput
              type="email"
              label={t("emailPlaceholder")}
              value={formState.email}
              onChange={(val) => setFormState({ ...formState, email: val })}
              required
            />
            <FloatingInput
              label={t("messagePlaceholder")}
              value={formState.message}
              onChange={(val) => setFormState({ ...formState, message: val })}
              required
              textarea
            />

            <motion.button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className={`shimmer-btn inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-medium text-white transition-all duration-300 w-full sm:w-auto ${
                status === "sent"
                  ? "bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  : "bg-accent hover:bg-accent-light shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
              } disabled:opacity-70`}
              data-cursor-hover
              whileTap={{ scale: 0.97 }}
            >
              {status === "sending" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("sending")}
                </>
              ) : status === "sent" ? (
                <motion.span
                  className="flex items-center gap-2"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Check size={18} />
                  {t("sent")}
                </motion.span>
              ) : (
                <>
                  {t("send")}
                  <Send size={16} />
                </>
              )}
            </motion.button>

            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400"
              >
                {t("error")}
              </motion.p>
            )}
          </motion.form>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
