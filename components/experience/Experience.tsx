"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { content, contactInfo, skills, type Lang } from "@/lib/content";
import { createEngine, GATE_STOPS, type Engine, type Place } from "./engine";

const PLACES: Place[] = ["river", "gallery", "sky", "majlis"];
const GATE_PLACE: Place[] = ["gallery", "sky", "majlis"];

type SendState = "idle" | "sending" | "sent" | "error";

export default function Experience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const savedScroll = useRef(0);

  const [lang, setLang] = useState<Lang>("ar");
  const [entered, setEntered] = useState(false);
  const [place, setPlace] = useState<Place>("river");
  const [stop, setStop] = useState(0); // 0 hero, 1..3 gates, -1 between
  const [muted, setMuted] = useState(true);
  const [flash, setFlash] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const [focus, setFocus] = useState(0);
  const [openProject, setOpenProject] = useState<number | null>(null);
  const [service, setService] = useState<number | null>(null);
  const [send, setSend] = useState<SendState>("idle");

  const t = content[lang];

  /* engine */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createEngine(
      canvas,
      content.ar.projects.map((p) => p.img),
      content.ar.services.length,
      {
        onFocusProject: setFocus,
        onOpenProject: setOpenProject,
        onService: setService,
      }
    );
    if (!engine) {
      setNoGl(true);
      return;
    }
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  /* language: Arabic first, remembered per visitor */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lang");
      if (saved === "en" || saved === "ar") setLang(saved);
    } catch {
      /* storage can be unavailable; Arabic stays */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem("lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  /* scroll drives the river */
  useEffect(() => {
    if (place !== "river") return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      engineRef.current?.setProgress(p);
      let s = -1;
      if (p < 0.07) s = 0;
      GATE_STOPS.forEach((g, i) => {
        if (Math.abs(p - g) < 0.075) s = i + 1;
      });
      setStop(s);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    read();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [place]);

  useLayoutEffect(() => {
    document.body.style.overflow = place === "river" && entered ? "" : "hidden";
    if (place === "river") window.scrollTo(0, savedScroll.current);
  }, [place, entered]);

  const go = useCallback(
    (next: Place) => {
      if (next === place) return;
      if (place === "river") savedScroll.current = window.scrollY;
      setFlash(true);
      setOpenProject(null);
      window.setTimeout(() => {
        engineRef.current?.setPlace(next);
        setPlace(next);
        setService(null);
      }, 420);
      window.setTimeout(() => setFlash(false), 1000);
    },
    [place]
  );

  const enter = (withSound: boolean) => {
    if (withSound) {
      engineRef.current?.enableAudio();
      engineRef.current?.setMuted(false);
      setMuted(false);
    }
    setEntered(true);
  };
  const toggleSound = () => {
    const next = !muted;
    if (!next) engineRef.current?.enableAudio();
    engineRef.current?.setMuted(next);
    setMuted(next);
  };

  /* close the project sheet with Escape */
  useEffect(() => {
    if (openProject === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenProject(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openProject]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSend("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), message: fd.get("message") }),
      });
      if (!res.ok) throw new Error("failed");
      setSend("sent");
      form.reset();
    } catch {
      setSend("error");
    }
  };

  const project = openProject !== null ? t.projects[openProject] : null;
  const focused = t.projects[focus];
  const gate = stop >= 1 ? t.gates[stop - 1] : null;

  return (
    <div className={`xp place-${place} ${entered ? "is-in" : ""}`}>
      <canvas ref={canvasRef} className="xp-canvas" aria-hidden="true" />
      <div className="xp-shade" />

      {noGl && <p className="xp-nogl">{t.noWebgl}</p>}

      <header className="xp-top">
        {place === "river" ? (
          <span className="xp-mark">{lang === "ar" ? "أ ي" : "AY"}</span>
        ) : (
          <button type="button" className="xp-back" onClick={() => go("river")}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="xp-arrow">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.back}
          </button>
        )}
        <div className="xp-tools">
          <button type="button" className="xp-icon" onClick={toggleSound} aria-label={muted ? t.soundOn : t.soundOff} aria-pressed={!muted}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
              {muted ? (
                <path d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M15.5 9a4.2 4.2 0 010 6M18 6.5a7.6 7.6 0 010 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <button type="button" className="xp-lang" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
            {t.lang}
          </button>
        </div>
      </header>

      {entered && (
        <nav className="xp-places" aria-label={t.places.river}>
          {PLACES.map((p) => (
            <button key={p} type="button" className={p === place ? "on" : ""} aria-current={p === place ? "page" : undefined} onClick={() => go(p)}>
              {t.places[p]}
            </button>
          ))}
        </nav>
      )}

      {/* river */}
      {place === "river" && entered && (
        <>
          <section className={`xp-hero ${stop === 0 ? "show" : ""}`} aria-hidden={stop !== 0}>
            <h1>{t.name}</h1>
            <p className="xp-role">{t.role}</p>
            <p className="xp-tagline">{t.tagline}</p>
            <p className="xp-hint">{t.hint}</p>
          </section>
          <section className={`xp-gate ${gate ? "show" : ""}`} aria-hidden={!gate}>
            {gate && (
              <>
                <h2>{gate.name}</h2>
                <p>{gate.line}</p>
                <button type="button" className="btn primary" onClick={() => go(GATE_PLACE[stop - 1])}>
                  {gate.enter}
                </button>
              </>
            )}
          </section>
          <label className="xp-time">
            <span>{t.dusk}</span>
            <input type="range" min={0} max={100} defaultValue={0} aria-label={t.timeLabel} onInput={(e) => engineRef.current?.setTime(Number(e.currentTarget.value) / 100)} />
            <span>{t.night}</span>
          </label>
          <div className="xp-spacer" />
        </>
      )}

      {/* gallery */}
      {place === "gallery" && (
        <section className="xp-panel xp-gallery">
          <p className="xp-hint">{t.galleryHint}</p>
          <h2>{focused.title}</h2>
          <p className="xp-clamp">{focused.desc}</p>
          <div className="xp-row">
            <button type="button" className="btn round" onClick={() => engineRef.current?.stepGallery(-1)} aria-label={t.prev}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="xp-arrow">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="btn primary" onClick={() => setOpenProject(focus)}>
              {t.open}
            </button>
            <button type="button" className="btn round" onClick={() => engineRef.current?.stepGallery(1)} aria-label={t.next}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="xp-arrow flip">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {project && (
        <div className="xp-sheet-wrap" onClick={() => setOpenProject(null)}>
          <article className="xp-sheet" role="dialog" aria-modal="true" aria-label={project.title} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="xp-close" onClick={() => setOpenProject(null)} aria-label={t.close}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.img} alt="" />
            <h2>{project.title}</h2>
            <p>{project.desc}</p>
            <h3>{t.challenge}</h3>
            <p>{project.challenge}</p>
            <h3>{t.solution}</h3>
            <p>{project.solution}</p>
            <h3>{t.built}</h3>
            <ul>
              {project.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <a className="btn primary" href={project.url} target="_blank" rel="noreferrer">
              {t.visit}
            </a>
          </article>
        </div>
      )}

      {/* sky */}
      {place === "sky" && (
        <section className="xp-panel xp-sky" aria-live="polite">
          {service === null ? (
            <>
              <p className="xp-hint">{t.skyHint}</p>
              <h2>{t.gates[1].name}</h2>
              <p className="xp-sub">{t.skills}</p>
              <ul className="xp-chips">
                {skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2>{t.services[service].title}</h2>
              <p>{t.services[service].desc}</p>
              <button type="button" className="btn ghost" onClick={() => go("majlis")}>
                {t.gates[2].enter}
              </button>
            </>
          )}
        </section>
      )}

      {/* majlis */}
      {place === "majlis" && (
        <section className="xp-panel xp-majlis">
          <h2>{t.contact.title}</h2>
          <p>{t.contact.desc}</p>
          <form onSubmit={submit}>
            <label>
              <span>{t.contact.name}</span>
              <input name="name" type="text" autoComplete="name" required />
            </label>
            <label>
              <span>{t.contact.email}</span>
              <input name="email" type="email" autoComplete="email" required dir="ltr" />
            </label>
            <label>
              <span>{t.contact.message}</span>
              <textarea name="message" rows={2} required />
            </label>
            <button type="submit" className="btn primary" disabled={send === "sending"}>
              {send === "sending" ? t.contact.sending : t.contact.send}
            </button>
            <p className="xp-status" role="status">
              {send === "sent" ? t.contact.sent : send === "error" ? t.contact.error : ""}
            </p>
          </form>
          <div className="xp-links">
            <a href={contactInfo.whatsappLink} target="_blank" rel="noreferrer">
              {t.whatsapp} <bdi dir="ltr">{contactInfo.whatsapp}</bdi>
            </a>
            <a href={`mailto:${contactInfo.email}`}>
              {t.mail} <bdi dir="ltr">{contactInfo.email}</bdi>
            </a>
          </div>
        </section>
      )}

      {/* intro */}
      {!entered && (
        <div className="xp-intro">
          <h1>{t.name}</h1>
          <p className="xp-tagline">{t.tagline}</p>
          <p className="xp-note">{t.introNote}</p>
          <div className="xp-row">
            <button type="button" className="btn primary" onClick={() => enter(true)}>
              {t.introSound}
            </button>
            <button type="button" className="btn ghost" onClick={() => enter(false)}>
              {t.introSilent}
            </button>
          </div>
        </div>
      )}

      <div className={`xp-flash ${flash ? "on" : ""}`} aria-hidden="true" />
    </div>
  );
}
