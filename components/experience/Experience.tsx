"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { content, contactInfo, skills, type Lang } from "@/lib/content";
import { createEngine, GATE_STOPS, type Engine, type Place } from "./engine";
import { Emblem } from "./Emblem";

const PLACES: Place[] = ["river", "gallery", "sky", "majlis"];
const GATE_PLACE: Place[] = ["gallery", "sky", "majlis"];
const STOP_AT = [0, ...GATE_STOPS];

type SendState = "idle" | "sending" | "sent" | "error";

const host = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className={`xp-arrow ${flip ? "flip" : ""}`}>
      <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Experience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const savedScroll = useRef(0);
  const starsRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastHover = useRef<Element | null>(null);

  const [lang, setLang] = useState<Lang>("ar");
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [place, setPlace] = useState<Place>("river");
  const [moving, setMoving] = useState(false);
  const [stop, setStop] = useState(0); // 0 hero, 1..3 gates, -1 between
  const [muted, setMuted] = useState(true);
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
      content.ar.projects.map((p) => ({ kind: p.kind, img: p.img, phone: p.phone })),
      content.ar.services.length,
      {
        onFocusProject: setFocus,
        onOpenProject: setOpenProject,
        onService: setService,
        onHot: (h) => cursorRef.current?.classList.toggle("hot", h),
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

  /* the cursor: a dot on the pointer and a ring that follows it */
  useEffect(() => {
    const el = cursorRef.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    const ring = el.querySelector<HTMLElement>(".ring")!;
    const dot = el.querySelector<HTMLElement>(".dot")!;
    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (x < -50) {
        x = tx;
        y = ty;
      }
      el.classList.add("on");
      const target = e.target as Element;
      el.classList.toggle("link", !!target.closest?.("button, a, label.xp-time"));
      el.classList.toggle("text", !!target.closest?.("input:not([type=range]), textarea"));
    };
    const leave = () => el.classList.remove("on");
    const press = () => el.classList.add("down");
    const release = () => el.classList.remove("down");
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, []);

  /* scroll drives the river */
  useEffect(() => {
    if (place !== "river") return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      engineRef.current?.setProgress(p);
      railRef.current?.style.setProperty("--p", p.toFixed(4));
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
  }, [place, entered]);

  useLayoutEffect(() => {
    document.body.style.overflow = place === "river" && entered ? "" : "hidden";
    if (place === "river") window.scrollTo(0, savedScroll.current);
  }, [place, entered]);

  const go = useCallback(
    (next: Place) => {
      if (next === place || moving) return;
      if (place === "river") {
        savedScroll.current = window.scrollY;
        engineRef.current?.rush();
      }
      engineRef.current?.flash();
      setMoving(true);
      setOpenProject(null);
      window.setTimeout(() => {
        engineRef.current?.setPlace(next);
        setPlace(next);
        setService(null);
      }, 640);
      window.setTimeout(() => setMoving(false), 1150);
    },
    [place, moving]
  );

  const toStop = (i: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: STOP_AT[i] * max, behavior: calm ? "auto" : "smooth" });
  };

  const enter = (withSound: boolean) => {
    if (withSound) {
      engineRef.current?.enableAudio();
      engineRef.current?.setMuted(false);
      setMuted(false);
    }
    setLeaving(true);
    engineRef.current?.begin();
    window.setTimeout(() => setEntered(true), 700);
  };
  const toggleSound = () => {
    const next = !muted;
    if (!next) engineRef.current?.enableAudio();
    engineRef.current?.setMuted(next);
    setMuted(next);
  };

  /* service names ride under their stars */
  useEffect(() => {
    if (place !== "sky" || !starsRef.current) return;
    const engine = engineRef.current;
    engine?.setStarLabels(Array.from(starsRef.current.children) as HTMLElement[]);
    return () => engine?.setStarLabels([]);
  }, [place]);

  /* the project sheet: Escape closes it, focus moves into it */
  useEffect(() => {
    if (openProject === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenProject(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openProject]);

  /* arrow keys turn the gallery */
  useEffect(() => {
    if (place !== "gallery" || openProject !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      /* each arrow turns the way it points, in either language */
      engineRef.current?.stepGallery(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [place, openProject]);

  /* quiet sounds under the interface */
  const onOver = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = (e.target as Element).closest("button, a");
    if (el && el !== lastHover.current) engineRef.current?.sfx("hover");
    lastHover.current = el;
  };
  const onTap = (e: React.MouseEvent) => {
    const el = (e.target as Element).closest("button, a");
    if (el && !el.hasAttribute("data-quiet")) engineRef.current?.sfx("tap");
  };

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
    <div
      className={`xp place-${place} ${entered ? "is-in" : ""} ${moving ? "is-moving" : ""}`}
      onPointerOver={onOver}
      onClickCapture={onTap}
    >
      <canvas ref={canvasRef} className="xp-canvas" aria-hidden="true" />
      <div className="xp-shade" />

      {noGl && <p className="xp-nogl">{t.noWebgl}</p>}

      <header className="xp-top">
        <div className="xp-lead">
          <Emblem className="xp-mark" />
          {place !== "river" && entered && (
            <button type="button" className="xp-back" onClick={() => go("river")}>
              <Arrow />
              <span className="label">{t.back}</span>
            </button>
          )}
        </div>

        {entered && (
          <nav className="xp-places" aria-label={t.journey} style={{ "--i": PLACES.indexOf(place) } as React.CSSProperties}>
            {PLACES.map((p) => (
              <button key={p} type="button" className={p === place ? "on" : ""} aria-current={p === place ? "page" : undefined} onClick={() => go(p)}>
                {t.places[p]}
              </button>
            ))}
          </nav>
        )}

        <div className="xp-tools">
          <button type="button" className={`xp-icon xp-sound ${muted ? "" : "playing"}`} onClick={toggleSound} aria-label={muted ? t.soundOn : t.soundOff} aria-pressed={!muted} data-quiet>
            <span />
            <span />
            <span />
            <span />
          </button>
          <button type="button" className="xp-lang" onClick={() => setLang(lang === "ar" ? "en" : "ar")} lang={lang === "ar" ? "en" : "ar"}>
            {t.lang}
          </button>
        </div>
      </header>

      {/* river */}
      {place === "river" && entered && (
        <>
          <section className={`xp-hero ${stop === 0 ? "show" : ""}`} aria-hidden={stop !== 0}>
            <h1 style={{ "--i": 0 } as React.CSSProperties}>{t.name}</h1>
            <p className="xp-role" style={{ "--i": 1 } as React.CSSProperties}>
              {t.role}
            </p>
            <p className="xp-tagline" style={{ "--i": 2 } as React.CSSProperties}>
              {t.tagline}
            </p>
            <p className="xp-hint" style={{ "--i": 3 } as React.CSSProperties}>
              <span className="xp-cue" aria-hidden="true" />
              {t.hint}
            </p>
          </section>
          <section className={`xp-gate ${gate ? "show" : ""}`} aria-hidden={!gate}>
            {gate && (
              <>
                <h2 style={{ "--i": 0 } as React.CSSProperties}>{gate.name}</h2>
                <p style={{ "--i": 1 } as React.CSSProperties}>{gate.line}</p>
                <button type="button" className="btn primary" style={{ "--i": 2 } as React.CSSProperties} onClick={() => go(GATE_PLACE[stop - 1])} tabIndex={gate ? 0 : -1}>
                  {gate.enter}
                  <Arrow flip />
                </button>
              </>
            )}
          </section>

          <nav className="xp-rail" ref={railRef} aria-label={t.journey}>
            <span className="xp-rail-track" aria-hidden="true">
              <span className="xp-rail-fill" />
            </span>
            {STOP_AT.map((at, i) => (
              <button key={i} type="button" className={stop === i ? "on" : ""} style={{ "--at": at } as React.CSSProperties} onClick={() => toStop(i)} aria-current={stop === i ? "step" : undefined}>
                <span>{i === 0 ? t.places.river : t.gates[i - 1].name}</span>
              </button>
            ))}
          </nav>

          <label className="xp-time">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="sun">
              <circle cx="12" cy="12" r="4.2" fill="currentColor" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <path key={a} d="M12 2.5v2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />
              ))}
            </svg>
            <span className="sr">{t.dusk}</span>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={0}
              aria-label={t.timeLabel}
              onInput={(e) => {
                const v = Number(e.currentTarget.value) / 100;
                engineRef.current?.setTime(v);
                e.currentTarget.style.setProperty("--v", String(v));
              }}
            />
            <span className="sr">{t.night}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="moon">
              <path d="M19.5 14.6A8 8 0 019.4 4.5a8 8 0 1010.1 10.1z" fill="currentColor" />
            </svg>
          </label>
          <div className="xp-spacer" />
        </>
      )}

      {/* gallery */}
      {place === "gallery" && (
        <section className="xp-panel xp-gallery" key={`g${focus}`}>
          <p className="xp-hint">{t.galleryHint}</p>
          {focused.kind === "product" && (
            <p className="xp-live">
              <span className="pulse" aria-hidden="true" />
              {t.studio} · {t.live}
            </p>
          )}
          <h2>{focused.title}</h2>
          <p className="xp-host" dir="ltr">
            {host(focused.url)}
          </p>
          <p className="xp-clamp">{focused.desc}</p>
          <div className="xp-row">
            {/* each button turns the way its arrow points; in Arabic the row is mirrored */}
            <button type="button" className="btn round" onClick={() => engineRef.current?.stepGallery(lang === "ar" ? 1 : -1)} aria-label={t.prev}>
              <Arrow />
            </button>
            <button type="button" className="btn primary" onClick={() => setOpenProject(focus)}>
              {t.open}
            </button>
            <button type="button" className="btn round" onClick={() => engineRef.current?.stepGallery(lang === "ar" ? -1 : 1)} aria-label={t.next}>
              <Arrow flip />
            </button>
          </div>
        </section>
      )}

      {project && (
        <div className="xp-sheet-wrap" onClick={() => setOpenProject(null)}>
          <article className="xp-sheet" role="dialog" aria-modal="true" aria-label={project.title} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="xp-close" onClick={() => setOpenProject(null)} aria-label={t.close} ref={closeRef}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <figure className={`xp-sheet-media${project.phone ? " xp-device" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.img} alt={project.title} />
              {project.phone && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className="xp-device-phone" src={project.phone} alt="" />
              )}
            </figure>
            <div className="xp-sheet-body">
              {project.kind === "product" && (
                <p className="xp-live">
                  <span className="pulse" aria-hidden="true" />
                  {t.studio} · {t.live}
                </p>
              )}
              <h2>{project.title}</h2>
              <a className="xp-host" href={project.url} target="_blank" rel="noreferrer" dir="ltr">
                {host(project.url)}
              </a>
              <p className="xp-lede">{project.desc}</p>
              {project.kind === "product" && (
                <dl className="xp-facts">
                  <div>
                    <dt>{t.forWho}</dt>
                    <dd>{project.audience}</dd>
                  </div>
                  <div>
                    <dt>{t.pricing}</dt>
                    <dd>{project.price}</dd>
                  </div>
                </dl>
              )}
              {project.items && (
                <ul className="xp-concepts">
                  {project.items.map((c) => (
                    <li key={c.key}>
                      <a href={c.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.img} alt="" loading="lazy" />
                        <span>
                          <strong>{c.title}</strong>
                          <small>{c.desc}</small>
                          <em>
                            {t.openConcept}
                            <Arrow flip />
                          </em>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {project.challenge && (
                <div className="xp-sheet-cols">
                  <section>
                    <h3>{t.challenge}</h3>
                    <p>{project.challenge}</p>
                  </section>
                  <section>
                    <h3>{t.solution}</h3>
                    <p>{project.solution}</p>
                  </section>
                </div>
              )}
              {project.features.length > 0 && (
                <>
                  <h3>{t.built}</h3>
                  <ul>
                    {project.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              )}
              {project.kind !== "concepts" && (
                <a className="btn primary" href={project.url} target="_blank" rel="noreferrer">
                  {project.cta ?? t.visit}
                  <Arrow flip />
                </a>
              )}
            </div>
          </article>
        </div>
      )}

      {/* sky */}
      {place === "sky" && (
        <div className="xp-stars" ref={starsRef}>
          {t.services.map((s, i) => (
            <button key={i} type="button" className={i === service ? "on" : ""} aria-pressed={i === service} onClick={() => engineRef.current?.selectService(i)} data-quiet>
              {s.title}
            </button>
          ))}
        </div>
      )}
      {place === "sky" && (
        <section className="xp-panel xp-sky" aria-live="polite" key={`s${service}`}>
          {service === null ? (
            <>
              <p className="xp-hint">{t.skyHint}</p>
              <h2>{t.gates[1].name}</h2>
              <p className="xp-sub">{t.skills}</p>
              <ul className="xp-chips">
                {skills.map((s, i) => (
                  <li key={s} style={{ "--i": i } as React.CSSProperties}>
                    {s}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2>{t.services[service].title}</h2>
              <p>{t.services[service].desc}</p>
              <button type="button" className="btn ghost" onClick={() => go("majlis")}>
                {t.gates[2].enter}
                <Arrow flip />
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
            <label className="half">
              <span>{t.contact.name}</span>
              <input name="name" type="text" autoComplete="name" required />
            </label>
            <label className="half">
              <span>{t.contact.email}</span>
              <input name="email" type="email" autoComplete="email" required dir="ltr" />
            </label>
            <label>
              <span>{t.contact.message}</span>
              <textarea name="message" rows={2} required />
            </label>
            <button type="submit" className={`btn primary ${send}`} disabled={send === "sending"}>
              {send === "sending" ? t.contact.sending : send === "sent" ? t.contact.sent : t.contact.send}
            </button>
            <p className="xp-status" role="status">
              {send === "error" ? t.contact.error : ""}
            </p>
          </form>
          <div className="xp-links">
            <a href={contactInfo.whatsappLink} target="_blank" rel="noreferrer">
              <span>{t.whatsapp}</span> <bdi dir="ltr">{contactInfo.whatsapp}</bdi>
            </a>
            <a href={`mailto:${contactInfo.email}`}>
              <span>{t.mail}</span> <bdi dir="ltr">{contactInfo.email}</bdi>
            </a>
          </div>
        </section>
      )}

      {/* intro */}
      {!entered && (
        <div className={`xp-intro ${leaving ? "leaving" : ""}`}>
          <h1>{t.name}</h1>
          <p className="xp-tagline">{t.tagline}</p>
          <p className="xp-note">{t.introNote}</p>
          <div className="xp-row">
            <button type="button" className="btn primary" onClick={() => enter(true)} disabled={leaving}>
              {t.introSound}
            </button>
            <button type="button" className="btn ghost" onClick={() => enter(false)} disabled={leaving}>
              {t.introSilent}
            </button>
          </div>
          <p className="xp-phones">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M4 14v-2a8 8 0 0116 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <rect x="3" y="13.5" width="4" height="6.5" rx="1.6" fill="currentColor" />
              <rect x="17" y="13.5" width="4" height="6.5" rx="1.6" fill="currentColor" />
            </svg>
            {t.headphones}
          </p>
        </div>
      )}

      <div className="xp-cursor" ref={cursorRef} aria-hidden="true">
        <span className="ring" />
        <span className="dot" />
      </div>
    </div>
  );
}
