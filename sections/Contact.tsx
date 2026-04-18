"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, Clock, Check, Loader2 } from "lucide-react";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
import { useTranslations } from "next-intl";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { staggerContainer, fadeUp } from "@/lib/animations";

function FloatingInput({
  id,
  type = "text",
  label,
  value,
  onChange,
  required,
  textarea,
}: {
  id: string;
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
          id={id}
          placeholder={label}
          required={required}
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={label}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      )}
      <label
        htmlFor={id}
        className="floating-label pointer-events-none absolute top-3.5 ltr:left-4 rtl:right-4 text-text-muted text-sm transition-all duration-200 peer-focus:translate-y-[-1.75rem] peer-focus:scale-[0.85] peer-focus:text-accent peer-[:not(:placeholder-shown)]:translate-y-[-1.75rem] peer-[:not(:placeholder-shown)]:scale-[0.85] peer-[:not(:placeholder-shown)]:text-accent origin-left rtl:origin-right"
      >
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
    { icon: WhatsAppIcon, label: t("whatsapp"), hasPulse: false },
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
        <motion.div variants={fadeUp} className="relative mb-12 text-center">
          <span
            aria-hidden="true"
            className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2 -top-6 text-[9rem] font-black leading-none text-foreground/[0.06]"
          >
            06
          </span>
          <h2 className="relative mb-2 text-sm font-medium uppercase tracking-widest text-accent">
            {t("label")}
          </h2>
          <h3 className="relative text-3xl font-bold md:text-4xl">{t("title")}</h3>
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
              id="contact-name"
              label={t("namePlaceholder")}
              value={formState.name}
              onChange={(val) => setFormState({ ...formState, name: val })}
              required
            />
            <FloatingInput
              id="contact-email"
              type="email"
              label={t("emailPlaceholder")}
              value={formState.email}
              onChange={(val) => setFormState({ ...formState, email: val })}
              required
            />
            <FloatingInput
              id="contact-message"
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
