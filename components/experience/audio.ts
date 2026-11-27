/* Sound, all generated in code: a warm drone, a soundscape for each place
   (water, wind, crickets, fire, room tone, a shimmer in the sky), a slow
   generative melody on plucked strings, and the small sounds of things you
   touch. Plucks are physically modelled (Karplus-Strong), doubled like the
   paired courses of an oud, and everything shares one generated hall reverb. */
import type { Place } from "./util";

const PENTA = [0, 2, 4, 7, 9];
type Bed = "water" | "wind" | "night" | "fire" | "room" | "shimmer";

const ROOTS: Record<Place, number> = { river: 146.83, gallery: 130.81, sky: 174.61, majlis: 110 };

export class Sound {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private wet: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private beds: Partial<Record<Bed, GainNode>> = {};
  private pad: OscillatorNode[] = [];
  private padRatios: number[] = [];
  private plucks = new Map<number, AudioBuffer>();
  private timer = 0;
  private nextPhrase = 0;
  private lastHover = 0;
  private lastTod = -1;
  muted = true;
  place: Place = "river";
  tod = 0;

  enable() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      this.ctx = ctx;
      this.build(ctx);
      this.timer = window.setInterval(() => this.tick(), 200);
      document.addEventListener("visibilitychange", this.onVis);
    } catch {
      this.ctx = null;
    }
  }

  private onVis = () => {
    const ctx = this.ctx;
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (!this.muted) void ctx.resume();
  };

  private build(ctx: AudioContext) {
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.0001;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 14;
    comp.ratio.value = 3;
    comp.attack.value = 0.008;
    comp.release.value = 0.3;
    master.connect(comp);
    comp.connect(ctx.destination);
    this.master = master;
    if (!this.muted) master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.8);

    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(ctx, 3.6);
    const verbOut = ctx.createGain();
    verbOut.gain.value = 0.6;
    verb.connect(verbOut);
    verbOut.connect(master);
    this.dry = ctx.createGain();
    this.dry.connect(master);
    this.wet = ctx.createGain();
    this.wet.connect(verb);

    this.noiseBuf = this.pinkNoise(ctx, 6);

    /* the drone: root, fifth, octave and twelfth, each a detuned pair through a
       slowly breathing low-pass */
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 430;
    lp.Q.value = 0.5;
    const padG = ctx.createGain();
    padG.gain.value = 0.032;
    lp.connect(padG);
    this.send(padG, 0.8, 0.5);
    const lfo = this.osc(0.045, "sine");
    const lfoG = ctx.createGain();
    lfoG.gain.value = 260;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    const amp = this.osc(0.07, "sine");
    const ampG = ctx.createGain();
    ampG.gain.value = 0.012;
    amp.connect(ampG);
    ampG.connect(padG.gain);
    const root = ROOTS[this.place] / 2;
    for (const r of [1, 1.5, 2, 3]) {
      for (const [type, det, v] of [
        ["triangle", -6, 1],
        ["sawtooth", 7, 0.07],
      ] as const) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = root * r;
        o.detune.value = det;
        const g = ctx.createGain();
        g.gain.value = (v * (r === 1 ? 1 : r === 1.5 ? 0.7 : 0.45)) / 2;
        o.connect(g);
        g.connect(lp);
        o.start();
        this.pad.push(o);
        this.padRatios.push(r);
      }
    }

    /* water lapping: two noise bands with slow, uneven swells, left and right */
    const water = this.bed("water");
    for (const [pan, a, b] of [
      [-0.6, 0.17, 0.11],
      [0.6, 0.13, 0.23],
    ]) {
      const src = this.loopNoise();
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 700;
      const f2 = ctx.createBiquadFilter();
      f2.type = "highpass";
      f2.frequency.value = 120;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      for (const rate of [a, b]) {
        const l = this.osc(rate, "sine");
        const lg = ctx.createGain();
        lg.gain.value = 0.022;
        l.connect(lg);
        lg.connect(g.gain);
      }
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      src.connect(f).connect(f2).connect(g).connect(p).connect(water);
    }
    /* and a thin trickle on top, the sound of moving water rather than rumble */
    {
      const src = this.loopNoise();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2300;
      bp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.value = 0.009;
      const l = this.osc(0.31, "sine");
      const lg = ctx.createGain();
      lg.gain.value = 0.005;
      l.connect(lg).connect(g.gain);
      src.connect(bp).connect(g).connect(water);
    }

    /* wind: a band of noise that wanders in pitch and strength */
    const wind = this.bed("wind");
    {
      const src = this.loopNoise();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 520;
      bp.Q.value = 0.9;
      const l = this.osc(0.06, "sine");
      const lg = ctx.createGain();
      lg.gain.value = 300;
      l.connect(lg).connect(bp.frequency);
      const g = ctx.createGain();
      g.gain.value = 0.035;
      const l2 = this.osc(0.09, "sine");
      const lg2 = ctx.createGain();
      lg2.gain.value = 0.02;
      l2.connect(lg2).connect(g.gain);
      src.connect(bp).connect(g).connect(wind);
    }

    /* crickets: a trilled tone gated into chirps; two of them, out of step */
    const night = this.bed("night");
    for (const [freq, rate, pan] of [
      [4400, 1.7, -0.5],
      [4750, 2.3, 0.55],
    ]) {
      const o = this.osc(freq, "sine");
      const am = ctx.createGain();
      am.gain.value = 0.5;
      const trill = this.osc(31 + rate * 3, "square");
      const tg = ctx.createGain();
      tg.gain.value = 0.5;
      trill.connect(tg).connect(am.gain);
      const gate = ctx.createGain();
      gate.gain.value = 0;
      const chirp = this.osc(rate, "sine");
      const shape = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * 2 - 1;
        const s = Math.min(1, Math.max(0, (x - 0.55) / 0.25));
        curve[i] = s * s * (3 - 2 * s);
      }
      shape.curve = curve;
      chirp.connect(shape).connect(gate.gain);
      const lvl = ctx.createGain();
      lvl.gain.value = 0.012;
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      o.connect(am).connect(gate).connect(lvl).connect(p).connect(night);
    }

    /* fire: a low roar under the crackles scheduled in tick() */
    const fire = this.bed("fire");
    {
      const src = this.loopNoise();
      const lp2 = ctx.createBiquadFilter();
      lp2.type = "lowpass";
      lp2.frequency.value = 220;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      src.connect(lp2).connect(g).connect(fire);
    }

    /* the hall: room tone you feel more than hear */
    const room = this.bed("room");
    {
      const src = this.loopNoise();
      const lp2 = ctx.createBiquadFilter();
      lp2.type = "lowpass";
      lp2.frequency.value = 160;
      const g = ctx.createGain();
      g.gain.value = 0.04;
      src.connect(lp2).connect(g).connect(room);
    }

    /* the sky: soft high partials that swell in and out, mostly reverb */
    const shimmer = this.bed("shimmer", 0.2, 1);
    [1, 1.5, 2.25, 3].forEach((r, i) => {
      const o = this.osc(ROOTS.sky * 4 * r, "sine");
      const g = ctx.createGain();
      g.gain.value = 0.004;
      const l = this.osc(0.05 + i * 0.023, "sine");
      const lg = ctx.createGain();
      lg.gain.value = 0.004;
      l.connect(lg).connect(g.gain);
      o.connect(g).connect(shimmer);
    });

    this.applyBeds(0.1);
  }

  /* ---------------------------------------------------------- plumbing */
  private send(node: AudioNode, dry: number, wet: number) {
    const ctx = this.ctx!;
    const d = ctx.createGain();
    d.gain.value = dry;
    const w = ctx.createGain();
    w.gain.value = wet;
    node.connect(d).connect(this.dry!);
    node.connect(w).connect(this.wet!);
  }
  private bed(name: Bed, dry = 0.9, wet = 0.25) {
    const g = this.ctx!.createGain();
    g.gain.value = 0;
    this.send(g, dry, wet);
    this.beds[name] = g;
    return g;
  }
  private osc(f: number, type: OscillatorType) {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.start();
    return o;
  }
  private loopNoise() {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    s.loopStart = Math.random() * 2;
    s.start(0, Math.random() * 4);
    return s;
  }
  private pinkNoise(ctx: AudioContext, secs: number) {
    const len = Math.floor(ctx.sampleRate * secs);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }
  /* a dark hall: early reflections, then a diffuse tail that loses its highs */
  private impulse(ctx: AudioContext, secs: number) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * secs);
    const buf = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const k = 0.75 - 0.55 * Math.min(1, t / secs);
        lp += k * ((Math.random() * 2 - 1) - lp);
        d[i] = lp * Math.pow(1 - t / secs, 2.6) * Math.exp(-t * 1.1);
      }
      for (let e = 0; e < 14; e++) {
        const at = Math.floor(sr * (0.012 + Math.random() * 0.09));
        d[at] += (Math.random() * 2 - 1) * 0.6 * (1 - e / 14);
      }
    }
    return buf;
  }

  /* Karplus-Strong: a burst of soft noise circulating in a lossy delay line */
  private pluckBuffer(f: number) {
    const key = Math.round(f * 4);
    const hit = this.plucks.get(key);
    if (hit) return hit;
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const N = Math.max(2, Math.round(sr / f));
    const decayT = Math.max(0.9, 3.2 - f / 380);
    const len = Math.floor(sr * (decayT + 0.3));
    const buf = ctx.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const ring = new Float32Array(N);
    let lp = 0;
    let mean = 0;
    for (let i = 0; i < N; i++) {
      lp += 0.5 * ((Math.random() * 2 - 1) - lp);
      ring[i] = lp;
      mean += lp;
    }
    mean /= N;
    /* pluck near the bridge: comb out a few harmonics for a woody tone */
    const pos = Math.max(1, Math.floor(N * 0.13));
    const ex = new Float32Array(N);
    for (let i = 0; i < N; i++) ex[i] = ring[i] - mean - 0.5 * (ring[(i + pos) % N] - mean);
    ring.set(ex);
    const rho = Math.pow(0.001, N / (sr * decayT));
    let p = 0;
    let peak = 0;
    for (let i = 0; i < len; i++) {
      const a = ring[p];
      const b = ring[(p + 1) % N];
      ring[p] = rho * 0.5 * (a + b);
      out[i] = a;
      if (Math.abs(a) > peak) peak = Math.abs(a);
      p = (p + 1) % N;
    }
    const fade = Math.floor(sr * 0.25);
    for (let i = 0; i < len; i++) {
      let g = 0.6 / (peak || 1);
      if (i < 64) g *= i / 64;
      if (i > len - fade) g *= (len - i) / fade;
      out[i] *= g;
    }
    this.plucks.set(key, buf);
    return buf;
  }

  /* ------------------------------------------------------------- voices */
  pluck(f: number, vel = 0.5, pan = 0, when = 0, wet = 0.45) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    try {
      const at = Math.max(ctx.currentTime, when || ctx.currentTime);
      const buf = this.pluckBuffer(f);
      const base = f / (ctx.sampleRate / Math.max(2, Math.round(ctx.sampleRate / f)));
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2400 + vel * 3000;
      tone.connect(p);
      this.send(p, 0.85, wet);
      /* two strings of a course, a hair apart in pitch and time */
      for (const [det, dly, v] of [
        [1, 0, 1],
        [1.0024, 0.009, 0.55],
      ]) {
        const s = ctx.createBufferSource();
        s.buffer = buf;
        s.playbackRate.value = base * det;
        const g = ctx.createGain();
        g.gain.value = vel * v * 0.5;
        s.connect(g).connect(tone);
        s.start(at + dly);
      }
    } catch {
      /* audio is a nicety */
    }
  }

  /* FM bell: glassy for the stars, a warm gong when low */
  bell(f: number, vel = 0.4, pan = 0, when = 0, decay = 3.2, wet = 0.8) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    try {
      const at = Math.max(ctx.currentTime, when || ctx.currentTime);
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      this.send(p, 0.5, wet);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(vel * 0.22, at + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
      env.connect(p);
      const car = ctx.createOscillator();
      car.frequency.value = f;
      const mod = ctx.createOscillator();
      mod.frequency.value = f * 3.5;
      const idx = ctx.createGain();
      idx.gain.setValueAtTime(f * 2.2, at);
      idx.gain.exponentialRampToValueAtTime(f * 0.05, at + decay * 0.6);
      mod.connect(idx).connect(car.frequency);
      car.connect(env);
      const part = ctx.createOscillator();
      part.frequency.value = f * 2.76;
      const pg = ctx.createGain();
      pg.gain.setValueAtTime(vel * 0.05, at);
      pg.gain.exponentialRampToValueAtTime(0.0001, at + decay * 0.45);
      part.connect(pg).connect(p);
      for (const o of [car, mod, part]) {
        o.start(at);
        o.stop(at + decay + 0.1);
      }
    } catch {
      /* ignore */
    }
  }

  /* a drop into still water: a short sine that rises fast */
  drop(pan = 0) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const at = ctx.currentTime;
    for (const [d, f0, f1, v] of [
      [0, 520 + Math.random() * 200, 1500, 0.16],
      [0.09, 900, 2100, 0.06],
    ]) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(f0, at + d);
      o.frequency.exponentialRampToValueAtTime(f1, at + d + 0.05);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at + d);
      g.gain.exponentialRampToValueAtTime(v, at + d + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, at + d + 0.11);
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      o.connect(g).connect(p);
      this.send(p, 0.7, 0.6);
      o.start(at + d);
      o.stop(at + d + 0.15);
    }
  }

  /* travelling through a gate: air rushing up, then a low bloom */
  whoosh() {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const at = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(160, at);
    bp.frequency.exponentialRampToValueAtTime(2600, at + 0.62);
    bp.frequency.exponentialRampToValueAtTime(300, at + 1.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.5, at + 0.58);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.7);
    src.connect(bp).connect(g);
    this.send(g, 0.6, 0.7);
    src.start(at, Math.random() * 3, 1.8);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(70, at + 0.6);
    o.frequency.exponentialRampToValueAtTime(38, at + 2.2);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, at + 0.58);
    og.gain.exponentialRampToValueAtTime(0.28, at + 0.66);
    og.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
    o.connect(og);
    this.send(og, 0.8, 0.5);
    o.start(at + 0.58);
    o.stop(at + 2.5);
  }

  gong() {
    this.bell(ROOTS[this.place] / 1.5, 0.55, 0, 0, 6, 1);
    this.bell(ROOTS[this.place], 0.3, 0, 0.02, 5, 1);
  }

  hover() {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    if (now - this.lastHover < 0.07) return;
    this.lastHover = now;
    const o = ctx.createOscillator();
    o.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.018, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    o.connect(g);
    this.send(g, 0.8, 0.2);
    o.start(now);
    o.stop(now + 0.06);
  }

  tap() {
    this.pluck(this.note(9 + Math.floor(Math.random() * 2)), 0.32, 0, 0, 0.3);
  }

  /* a note of the place's scale; degree 0 is two octaves over the drone */
  note(deg: number, place = this.place) {
    const oct = Math.floor(deg / 5);
    const st = PENTA[((deg % 5) + 5) % 5] + oct * 12;
    return ROOTS[place] * 2 * Math.pow(2, st / 12);
  }

  /* --------------------------------------------------------- scene state */
  setMuted(m: boolean) {
    this.muted = m;
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    if (!m && ctx.state === "suspended") void ctx.resume();
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, m ? 0.12 : 0.6);
    if (!m) this.nextPhrase = ctx.currentTime + 2;
  }

  setPlace(p: Place) {
    this.place = p;
    const ctx = this.ctx;
    if (!ctx) return;
    const root = ROOTS[p] / 2;
    this.pad.forEach((o, i) => o.frequency.setTargetAtTime(root * this.padRatios[i], ctx.currentTime, 1.4));
    this.applyBeds(1.6);
    this.nextPhrase = ctx.currentTime + 2.5;
  }

  setTod(tod: number) {
    this.tod = tod;
    if (Math.abs(tod - this.lastTod) > 0.03) this.applyBeds(0.8);
  }

  private applyBeds(tc: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.lastTod = this.tod;
    const n = this.tod;
    const lv: Record<Place, Record<Bed, number>> = {
      river: { water: 1, wind: 0.9 - n * 0.5, night: n, fire: 0, room: 0, shimmer: 0 },
      gallery: { water: 0, wind: 0, night: 0, fire: 0, room: 1, shimmer: 0 },
      sky: { water: 0, wind: 0.7, night: 0.25, fire: 0, room: 0, shimmer: 1 },
      majlis: { water: 0.55, wind: 0.25, night: 1, fire: 1, room: 0, shimmer: 0 },
    };
    const l = lv[this.place];
    (Object.keys(this.beds) as Bed[]).forEach((k) => this.beds[k]!.gain.setTargetAtTime(l[k], ctx.currentTime, tc));
  }

  /* the generative layer: every few seconds a short phrase, never the same twice */
  private tick() {
    const ctx = this.ctx;
    if (!ctx || this.muted || ctx.state !== "running") return;
    const now = ctx.currentTime;
    if (this.place === "majlis") {
      for (let i = 0; i < 3; i++) if (Math.random() < 0.28) this.crackle(now + Math.random() * 0.2);
    }
    /* life on the banks: birds while there is light, a fish or a drip now and then */
    if (this.place === "river") {
      if (Math.random() < 0.022 * (1 - this.tod)) this.bird(now + Math.random() * 0.3, (Math.random() - 0.5) * 1.6);
      if (Math.random() < 0.012) this.drop((Math.random() - 0.5) * 1.2);
    }
    if (now < this.nextPhrase) return;
    const p = this.place;
    const gap: Record<Place, [number, number]> = { river: [6, 12], gallery: [8, 15], sky: [4, 9], majlis: [4, 9] };
    const [a, b] = gap[p];
    this.nextPhrase = now + a + Math.random() * (b - a);
    let deg = Math.floor(Math.random() * 7);
    const count = 1 + Math.floor(Math.random() * (p === "majlis" ? 5 : 3));
    let at = now + 0.05;
    for (let i = 0; i < count; i++) {
      const vel = 0.32 * (1 - i * 0.12) + Math.random() * 0.08;
      const pan = (Math.random() - 0.5) * 0.9;
      if (p === "sky") this.bell(this.note(deg + 5), vel * 0.7, pan, at, 4);
      else this.pluck(this.note(deg), vel, pan, at, p === "gallery" ? 0.8 : 0.5);
      deg += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
      deg = Math.max(0, Math.min(9, deg));
      at += 0.2 + Math.random() * (p === "majlis" ? 0.25 : 0.45);
    }
  }

  /* a small bird: two to four quick rising-and-falling whistles */
  private bird(at: number, pan: number) {
    const ctx = this.ctx!;
    const base = 2600 + Math.random() * 1600;
    const notes = 2 + Math.floor(Math.random() * 3);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    const out = ctx.createGain();
    out.gain.value = 0.016 + Math.random() * 0.01;
    out.connect(p);
    this.send(p, 0.7, 0.45);
    for (let i = 0; i < notes; i++) {
      const t = at + i * (0.09 + Math.random() * 0.06);
      const o = ctx.createOscillator();
      o.type = "sine";
      const f = base * (1 + (Math.random() - 0.5) * 0.18);
      o.frequency.setValueAtTime(f * 0.82, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.18, t + 0.035);
      o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.075);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.1);
    }
  }

  private crackle(at: number) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200 + Math.random() * 2500;
    const g = ctx.createGain();
    const v = 0.04 + Math.random() * 0.12;
    const d = 0.004 + Math.random() * 0.02;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(v, at + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, at + d);
    const p = ctx.createStereoPanner();
    p.pan.value = 0.25 + (Math.random() - 0.5) * 0.3;
    s.connect(hp).connect(g).connect(p);
    this.send(p, 0.8, 0.25);
    s.start(at, Math.random() * 5, d + 0.01);
  }

  dispose() {
    window.clearInterval(this.timer);
    document.removeEventListener("visibilitychange", this.onVis);
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }
}
