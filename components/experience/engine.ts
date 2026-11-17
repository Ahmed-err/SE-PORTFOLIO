/* The 3D world behind the portfolio: the Nile journey plus three places you
   can step into (gallery, sky, majlis). Plain three.js, driven by Experience.tsx. */
import * as THREE from "three";

export type Place = "river" | "gallery" | "sky" | "majlis";

export interface EngineCallbacks {
  onFocusProject: (index: number) => void;
  onOpenProject: (index: number) => void;
  onService: (index: number) => void;
}

export interface Engine {
  setPlace: (p: Place) => void;
  setProgress: (p: number) => void;
  /** surge forward through the gate ahead; call just before leaving the river */
  rush: () => void;
  setTime: (d: number) => void;
  stepGallery: (dir: number) => void;
  enableAudio: () => void;
  setMuted: (m: boolean) => void;
  dispose: () => void;
}

interface PlaceRig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (t: number) => void;
  click: (ray: THREE.Raycaster) => void;
  drag: (dx: number, dy: number) => void;
  dragEnd: () => void;
}

export const GATE_STOPS = [0.33, 0.66, 1];
const END = -262;
const GATE_Z = [-100, -187, -276];
const GOLD = 0xf0c874;

const sstep = (a: number, b: number, x: number) => {
  x = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const makeRnd = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

function glowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,.55)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSky(top: number, hor: number) {
  const uniforms = {
    top: { value: new THREE.Color(top) },
    hor: { value: new THREE.Color(hor) },
  };
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(900, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms,
      vertexShader:
        "varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "uniform vec3 top;uniform vec3 hor;varying float h;void main(){float t=pow(clamp(h*1.6,0.0,1.0),0.55);gl_FragColor=vec4(mix(hor,top,t),1.0);\n#include <colorspace_fragment>\n}",
    })
  );
  return { mesh, uniforms };
}

function makeStars(n: number, rnd: () => number, minEl = 0.08) {
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.283;
    const e = rnd() * (1.45 - minEl) + minEl;
    p.push(Math.cos(a) * Math.cos(e) * 850, Math.sin(e) * 850, Math.sin(a) * Math.cos(e) * 850);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 1,
    fog: false,
    depthWrite: false,
  });
  return new THREE.Points(g, m);
}

function waterMaterial() {
  const uniforms = {
    t: { value: 0 },
    sun: { value: new THREE.Color(0xffb060) },
    deep: { value: new THREE.Color(0x2a1830) },
    fogc: { value: new THREE.Color(0xf2893a) },
    fogFar: { value: 240 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader:
      "varying vec2 u;varying float d;void main(){u=uv;vec4 m=modelViewMatrix*vec4(position,1.0);d=-m.z;gl_Position=projectionMatrix*m;}",
    /* Water: dark body tinted by the sky, with a broken glitter path under the sun.
       Ripples are value noise stretched along the river, so they read as long
       soft swells in perspective instead of regular stripes. */
    fragmentShader: `
      uniform float t; uniform float fogFar; uniform vec3 sun; uniform vec3 deep; uniform vec3 fogc;
      varying vec2 u; varying float d;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      void main(){
        vec2 p = vec2((u.x - 0.5) * 60.0, u.y * 820.0);
        float far = smoothstep(18.0, 130.0, d);
        float swell = n(p * vec2(0.22, 0.9) + vec2(t * 0.12, t * 0.55));
        float chop = n(p * vec2(0.7, 3.1) - vec2(t * 0.25, t * 1.1));
        float fine = n(p * vec2(1.9, 8.0) + vec2(t * 0.4, t * 1.9));
        float r = swell * 0.5 + chop * 0.33 + fine * 0.17 * (1.0 - far);
        /* glitter: sharp glints up close, melting into a soft sheen with distance */
        float c = clamp(1.0 - abs(u.x - 0.5) * 6.0, 0.0, 1.0);
        float glint = smoothstep(0.58, 0.70, r);
        float path = mix(glint, 0.35 + r * 0.5, far) * (c * c * 0.95 + c * 0.25);
        /* sky colour picked up on the faces of the swells, everywhere on the river */
        float face = smoothstep(0.42, 0.75, r);
        vec3 col = deep * (0.75 + 0.5 * swell) + fogc * face * 0.16 + sun * path * 0.9;
        float f = smoothstep(25.0, fogFar, d);
        gl_FragColor = vec4(mix(col, fogc, f), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  return { mat, uniforms };
}

function makePalm(rnd: () => number, trunkG: THREE.BufferGeometry, leafG: THREE.BufferGeometry, trunkM: THREE.Material, leafM: THREE.Material) {
  const pm = new THREE.Group();
  const tr = new THREE.Mesh(trunkG, trunkM);
  tr.rotation.z = (rnd() - 0.5) * 0.25;
  pm.add(tr);
  const crown = new THREE.Group();
  crown.position.set(-Math.sin(tr.rotation.z) * 4, Math.cos(tr.rotation.z) * 4, 0);
  for (let k = 0; k < 7; k++) {
    const pv = new THREE.Group();
    pv.rotation.y = k * 0.9 + rnd();
    const lf = new THREE.Mesh(leafG, leafM);
    lf.rotation.z = 1.15 + rnd() * 0.5;
    lf.scale.set(1, 1, 0.4);
    pv.add(lf);
    crown.add(pv);
  }
  pm.add(crown);
  return pm;
}

/* ---------------------------------------------------------------- audio */
class Sound {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  drone: OscillatorNode[] = [];
  muted = false;
  enable() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      this.ctx = ctx;
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.9;
      master.connect(ctx.destination);
      this.master = master;
      // soft drone: root + fifth through a slow-breathing lowpass
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      const dg = ctx.createGain();
      dg.gain.value = 0.07;
      lp.connect(dg);
      dg.connect(master);
      [73.42, 110, 146.83].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i === 2 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = (i - 1) * 6;
        o.connect(lp);
        o.start();
        this.drone.push(o);
      });
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.07;
      lg.gain.value = 160;
      lfo.connect(lg);
      lg.connect(lp.frequency);
      lfo.start();
      // water: filtered noise
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 520;
      bp.Q.value = 0.6;
      const wg = ctx.createGain();
      wg.gain.value = 0.025;
      src.connect(bp);
      bp.connect(wg);
      wg.connect(master);
      src.start();
    } catch {
      this.ctx = null;
    }
  }
  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.15);
  }
  setRoot(f: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [1, 1.5, 2].forEach((r, i) => this.drone[i]?.frequency.setTargetAtTime(f * r, now, 0.8));
  }
  note(f: number, dur: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    try {
      const n = ctx.currentTime;
      const parts: [number, OscillatorType, number][] = [
        [1, "triangle", 1],
        [2, "sine", 0.35],
      ];
      for (const [mul, type, v] of parts) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = f * mul;
        g.gain.setValueAtTime(0.0001, n);
        g.gain.linearRampToValueAtTime(vol * v, n + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
        o.connect(g);
        g.connect(this.master);
        o.start(n);
        o.stop(n + dur + 0.05);
      }
    } catch {
      /* audio is a nicety; ignore */
    }
  }
}
const SCALE = [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25, 2.5, 3];

/* ---------------------------------------------------------------- river */
/* Scroll is remapped so the camera eases out of one stop and into the next:
   it lingers at the hero and at each gate, and travels fastest mid-leg. */
const STOPS = [0, ...GATE_STOPS];
const dwell = (p: number) => {
  for (let i = 1; i < STOPS.length; i++) {
    if (p <= STOPS[i] || i === STOPS.length - 1) {
      const a = STOPS[i - 1];
      const b = STOPS[i];
      const u = Math.min(1, Math.max(0, (p - a) / (b - a)));
      return a + (b - a) * (u + 0.7 * (u * u * (3 - 2 * u) - u));
    }
  }
  return p;
};
/* smooth bump: 1 at c, 0 beyond c +/- w */
const bump = (c: number, w: number, x: number) => sstep(0, 1, 1 - Math.abs(x - c) / w);
const LEGS = [0.185, 0.495, 0.83];

function buildRiver(sound: Sound, state: { progress: number; tod: number; mx: number; my: number; portrait: boolean; rush: number }) {
  const calm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd = makeRnd(7);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 1400);
  scene.fog = new THREE.Fog(0xf08a3c, 25, 240);
  const pathX = (z: number) => Math.sin(z * 0.024) * 2;
  const hgt = (x: number, z: number) => {
    const b = sstep(8, 24, Math.abs(x - pathX(z)));
    return b * (2.2 + Math.sin(x * 0.08 + z * 0.05) * 1.6 + Math.sin(z * 0.11 - x * 0.04) * 1.2) - 0.6 * (1 - b);
  };

  const sky = makeSky(0x2a1a55, 0xf2893a);
  scene.add(sky.mesh);
  const stars = makeStars(1600, rnd);
  const starM = stars.material as THREE.PointsMaterial;
  scene.add(stars);

  const sun = new THREE.Group();
  const sunM = new THREE.MeshBasicMaterial({ color: 0xffe2a0, fog: false });
  sun.add(new THREE.Mesh(new THREE.CircleGeometry(26, 48), sunM));
  const glows: THREE.MeshBasicMaterial[] = [];
  for (const [r, o] of [[60, 0.22], [120, 0.1]]) {
    const m = new THREE.MeshBasicMaterial({ color: 0xffb45a, transparent: true, opacity: o, blending: THREE.AdditiveBlending, fog: false, depthWrite: false });
    glows.push(m);
    const d = new THREE.Mesh(new THREE.CircleGeometry(r, 48), m);
    d.position.z = -1;
    sun.add(d);
  }
  scene.add(sun);

  const hemi = new THREE.HemisphereLight(0xffc48a, 0x3a2416, 2.2);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffb060, 4.6);
  scene.add(dir);
  scene.add(dir.target);

  const gg = new THREE.PlaneGeometry(320, 820, 100, 240);
  gg.rotateX(-Math.PI / 2);
  const gp = gg.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const gx = gp.getX(i);
    const gz = gp.getZ(i) - 330;
    gp.setZ(i, gz);
    gp.setY(i, hgt(gx, gz));
  }
  gg.computeVertexNormals();
  scene.add(new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0x9a653a, roughness: 1, metalness: 0, flatShading: true })));

  const water = waterMaterial();
  const river = new THREE.Mesh(new THREE.PlaneGeometry(60, 820, 1, 1).rotateX(-Math.PI / 2), water.mat);
  river.position.set(0, 0, -330);
  scene.add(river);

  interface PyrData { g: number; tg: number; h: number; pop: number; beam: THREE.Mesh | null; n: number }
  const pyrs: THREE.Mesh[] = [];
  const pg = new THREE.ConeGeometry(1, 1, 4, 1);
  pg.translate(0, 0.5, 0);
  pg.rotateY(Math.PI / 4);
  for (let i = 0; i < 90; i++) {
    const z = 30 - rnd() * 640;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = pathX(z) + side * (15 + rnd() * rnd() * 70);
    const hh = 4 + rnd() * 9;
    const m = new THREE.MeshStandardMaterial({ color: 0xb5793f, roughness: 1, flatShading: true, emissive: 0xffa63d, emissiveIntensity: 0 });
    const py = new THREE.Mesh(pg, m);
    py.position.set(x, hgt(x, z) - 0.3, z);
    py.scale.set(hh * 0.42, hh, hh * 0.42);
    py.userData = { g: 0, tg: 0, h: hh, pop: 0, beam: null, n: Math.min(8, Math.floor(13 - hh)) } as PyrData;
    scene.add(py);
    pyrs.push(py);
  }

  const gateM = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const gateR = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.22 });
  const veilM = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const z of GATE_Z) {
    for (const sy of [1, -1]) {
      const g = new THREE.Group();
      const mt = sy > 0 ? gateM : gateR;
      for (const px of [-4.6, 4.6]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7.4, 0.3), mt);
        b.position.set(px, 3.7, 0);
        g.add(b);
      }
      const top = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.3, 0.3), mt);
      top.position.y = 7.4;
      g.add(top);
      const in2 = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.08, 0.08), mt);
      in2.position.y = 6.6;
      g.add(in2);
      if (sy > 0) {
        const veil = new THREE.Mesh(new THREE.PlaneGeometry(8.9, 7.2), veilM);
        veil.position.y = 3.7;
        g.add(veil);
      }
      g.position.set(pathX(z), 0.02, z);
      g.scale.y = sy;
      scene.add(g);
    }
  }

  const trunkG = new THREE.CylinderGeometry(0.1, 0.17, 4, 5);
  trunkG.translate(0, 2, 0);
  const leafG = new THREE.ConeGeometry(0.24, 2.6, 4);
  leafG.translate(0, 1.3, 0);
  const palmM = new THREE.MeshStandardMaterial({ color: 0x33401f, roughness: 1, flatShading: true });
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x4a321c, roughness: 1, flatShading: true });
  for (let i = 0; i < 38; i++) {
    const pz = -16 - rnd() * 540;
    const ps = rnd() < 0.5 ? -1 : 1;
    const px = pathX(pz) + ps * (10.5 + rnd() * 5);
    const pm = makePalm(rnd, trunkG, leafG, trunkM, palmM);
    pm.position.set(px, hgt(px, pz) - 0.1, pz);
    pm.scale.setScalar(0.8 + rnd() * 0.7);
    scene.add(pm);
  }

  const boat = new THREE.Group();
  const woodM = new THREE.MeshStandardMaterial({ color: 0x3a2415, roughness: 1, flatShading: true });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 4.4), woodM);
  hull.position.y = 0.2;
  boat.add(hull);
  for (const d of [1, -1]) {
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.7, 4), woodM);
    e.rotation.x = (d * Math.PI) / 2;
    e.rotation.z = Math.PI / 4;
    e.scale.set(1, 1, 0.42);
    e.position.set(0, 0.22, -d * 3.0);
    boat.add(e);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 5), woodM);
  mast.position.y = 2.6;
  boat.add(mast);
  const sailG = new THREE.BufferGeometry();
  sailG.setAttribute("position", new THREE.Float32BufferAttribute([-1.7, 0.8, 0.2, 1.6, 1.1, -0.2, -0.9, 5.4, 0], 3));
  sailG.computeVertexNormals();
  boat.add(new THREE.Mesh(sailG, new THREE.MeshStandardMaterial({ color: 0xf3e3c2, side: THREE.DoubleSide, emissive: 0x8a6a3c, emissiveIntensity: 0.7, roughness: 1 })));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  lamp.position.set(0, 1.0, 2.1);
  boat.add(lamp);
  scene.add(boat);

  const birds = new THREE.Group();
  const wingG = new THREE.BufferGeometry();
  wingG.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.18, 1, 0, -0.12, 0, 0, -0.18], 3));
  const birdM = new THREE.MeshBasicMaterial({ color: 0x1c1118, side: THREE.DoubleSide });
  const wings: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const bd = new THREE.Group();
    const row = Math.ceil(i / 2);
    const sd = i % 2 ? 1 : -1;
    bd.position.set(sd * row * 2.1, (rnd() - 0.5) * 1.2, row * 1.9);
    for (const d of [1, -1]) {
      const wg = new THREE.Mesh(wingG, birdM);
      wg.scale.x = d;
      wg.userData = { d, ph: rnd() * 6 };
      bd.add(wg);
      wings.push(wg);
    }
    birds.add(bd);
  }
  scene.add(birds);

  const ripples: THREE.Mesh[] = [];
  const ringG = new THREE.RingGeometry(0.92, 1, 56);
  ringG.rotateX(-Math.PI / 2);
  const beamG = new THREE.CylinderGeometry(0.18, 0.8, 160, 8, 1, true);
  const shoot = new THREE.Mesh(
    new THREE.BoxGeometry(46, 0.7, 0.7),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  shoot.rotation.z = -0.5;
  scene.add(shoot);
  let shT = -99;
  const shP = new THREE.Vector3();

  const dp: number[] = [];
  for (let i = 0; i < 900; i++) dp.push((rnd() - 0.5) * 70, rnd() * 14 + 0.3, -14 - rnd() * 120);
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffcf7a, size: 0.07, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  const C = (h: number) => new THREE.Color(h);
  const A = { top: C(0x2a1a55), hor: C(0xf2893a), sun: C(0xffd9a0), glow: C(0xff9a3c), dir: C(0xffa85a), deep: C(0x2a1830), hs: C(0xffc48a), hg: C(0x3a2416) };
  const B = { top: C(0x01020a), hor: C(0x0c1838), sun: C(0xe9efff), glow: C(0x6f8cff), dir: C(0x8fa6ff), deep: C(0x030612), hs: C(0x2a3a7a), hg: C(0x05060c) };
  const tmp = new THREE.Color();
  let appliedTod = -1;
  const applyTime = (d: number) => {
    appliedTod = d;
    sky.uniforms.top.value.copy(A.top).lerp(B.top, d);
    sky.uniforms.hor.value.copy(A.hor).lerp(B.hor, d);
    (scene.fog as THREE.Fog).color.copy(sky.uniforms.hor.value);
    water.uniforms.fogc.value.copy(sky.uniforms.hor.value);
    sunM.color.copy(A.sun).lerp(B.sun, d);
    tmp.copy(A.glow).lerp(B.glow, d);
    glows.forEach((g) => g.color.copy(tmp));
    water.uniforms.sun.value.copy(tmp).lerp(sunM.color, 0.4);
    water.uniforms.deep.value.copy(A.deep).lerp(B.deep, d);
    dir.color.copy(A.dir).lerp(B.dir, d);
    dir.intensity = 4.6 - d * 2.9;
    hemi.color.copy(A.hs).lerp(B.hs, d);
    hemi.groundColor.copy(A.hg).lerp(B.hg, d);
    hemi.intensity = 2.2 - d * 0.9;
    starM.opacity = sstep(0.25, 1, d);
  };

  let cp = 0;
  let lx = 0;
  let ly = 0;
  let prevZ = 0;
  let nowT = 0;
  let camX = 0;
  let roll = 0;
  let kick = 0;
  const waves: { x: number; z: number; t: number }[] = [];
  const look = new THREE.Vector3();

  const update = (t: number) => {
    /* time-based smoothing, so the camera feels the same at 30, 60 or 120 fps */
    const dt = Math.min(0.1, Math.max(0, t - nowT));
    nowT = t;
    if (appliedTod !== state.tod) applyTime(state.tod);
    const tod = state.tod;
    const cpBefore = cp;
    cp += (dwell(state.progress) - cp) * (1 - Math.exp(-dt * 3.7));
    const kLook = 1 - Math.exp(-dt * 3.1);

    /* the shot, as a function of where we are on the river */
    const open = calm ? 0 : 1 - sstep(0, 0.12, cp); // aerial opening, craning down to the water
    const cruise = 1 - open;
    const rise = calm ? 0 : (bump(LEGS[0], 0.14, cp) + bump(LEGS[1], 0.15, cp) + bump(LEGS[2], 0.15, cp)) * cruise;
    const side = calm ? 0 : (bump(LEGS[0], 0.14, cp) - bump(LEGS[1], 0.15, cp) + bump(LEGS[2], 0.15, cp)) * cruise;
    const near = calm ? 0 : bump(GATE_STOPS[0], 0.08, cp) + bump(GATE_STOPS[1], 0.08, cp) + bump(GATE_STOPS[2], 0.08, cp);

    /* leaving through a gate: surge forward and widen the lens */
    let rush = 0;
    if (state.rush >= 0 && !calm) {
      const r = Math.min(1, Math.max(0, (t - state.rush) / 0.62));
      rush = r * r * r;
    }

    const z = cp * END - rush * 22;
    const px = pathX(z);
    const x = px + side * 3.4 * (1 - rush);
    const y = 2.5 + open * 20 + rise * 4.2 - near * 0.9 + Math.sin(t * 0.6) * 0.12;
    cam.position.set(x, y, z);
    lx += ((state.mx - 0.5) * 7 - lx) * kLook;
    ly += ((0.5 - state.my) * 3 - ly) * kLook;
    /* pitch: down from the air, slightly down on the rises, up at the gates so they tower */
    const pitch = 0.4 - open * 7.9 - rise * 4.4 + near * 1.7;
    look.set(pathX(z - 30) - side * 1.6 + lx, y + pitch + ly, z - 30);
    cam.lookAt(look);
    /* bank into sideways movement, and open the lens a little with speed */
    const vx = dt > 0 ? (x - camX) / dt : 0;
    camX = x;
    roll += (Math.max(-0.07, Math.min(0.07, -vx * 0.035)) - roll) * kLook;
    if (!calm) cam.rotateZ(roll);
    const speed = dt > 0 ? Math.abs(cp - cpBefore) * -END / dt : 0;
    kick += (Math.min(9, speed * 0.22) - kick) * kLook;
    const fov = (state.portrait ? 78 : 60) + (calm ? 0 : kick - near * 4) + rush * 30;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    sky.mesh.position.copy(cam.position);
    stars.position.copy(cam.position);
    stars.rotation.y = t * 0.004;
    sun.position.set(cam.position.x - 150, 70 - tod * 10 + cp * 40 * tod, cam.position.z - 800);
    dir.position.set(cam.position.x - 60, 30, cam.position.z - 200);
    dir.target.position.copy(cam.position);
    dust.position.set(x, 0, z + 10);
    water.uniforms.t.value = t;
    for (let g = 0; g < GATE_Z.length; g++) {
      if (prevZ > GATE_Z[g] + 14 && z <= GATE_Z[g] + 14) {
        waves.push({ x, z: GATE_Z[g], t });
        sound.note(98, 3.5, 0.18);
        sound.note(147, 3.5, 0.12);
      }
    }
    prevZ = z;
    while (waves.length && t - waves[0].t > 5) waves.shift();
    const fin = sstep(0.92, 1, cp);
    /* the boat starts far ahead and we catch up as we descend; it leads us through a gate */
    const lead = 24 - cp * 14;
    /* at a gate the boat keeps clear of the title: it waits just beyond the frame */
    const bz = z - lead - near * Math.max(0, 28 - lead) - open * 56 - rush * 6;
    const bx = pathX(bz);
    boat.position.set(bx, 0.05 + Math.sin(t * 1.3) * 0.07, bz);
    boat.rotation.z = Math.sin(t * 0.9) * 0.05;
    boat.rotation.y = -(pathX(bz - 4) - bx) * 0.25;
    birds.position.set(cam.position.x - 75 + ((t * 3.2) % 150), 19 + Math.sin(t * 0.5) * 1.5, cam.position.z - 95);
    birds.rotation.y = -Math.PI / 2;
    for (const w of wings) w.rotation.z = w.userData.d * Math.sin(t * 7 + w.userData.ph) * 0.65;
    for (let r = ripples.length - 1; r >= 0; r--) {
      const rr = ripples[r];
      const a = (t - rr.userData.t) / 1.7;
      if (a < 0) continue;
      if (a >= 1) {
        scene.remove(rr);
        (rr.material as THREE.Material).dispose();
        ripples.splice(r, 1);
        continue;
      }
      const sc = 0.4 + a * 7;
      rr.scale.set(sc, 1, sc);
      (rr.material as THREE.MeshBasicMaterial).opacity = (1 - a) * 0.8;
    }
    if (tod > 0.5 && t - shT > 5.5) {
      shT = t;
      shP.set(-260 + rnd() * 420, 300 + rnd() * 120, -760);
    }
    const sa = (t - shT) / 0.9;
    const shootM = shoot.material as THREE.MeshBasicMaterial;
    if (sa < 1) {
      shoot.position.set(cam.position.x + shP.x + sa * 150, cam.position.y + shP.y - sa * 82, cam.position.z + shP.z);
      shootM.opacity = Math.sin(sa * Math.PI) * 0.9 * sstep(0.5, 0.8, tod);
    } else shootM.opacity = 0;
    for (let i = 0; i < pyrs.length; i++) {
      const p = pyrs[i];
      const u = p.userData as PyrData;
      u.g += (u.tg - u.g) * 0.08;
      let wv = 0;
      for (const w of waves) {
        const ddx = p.position.x - w.x;
        const ddz = p.position.z - w.z;
        const dd = (Math.sqrt(ddx * ddx + ddz * ddz) - (t - w.t) * 55) / 14;
        wv += Math.exp(-dd * dd);
      }
      (p.material as THREE.MeshStandardMaterial).emissiveIntensity = u.g * (0.9 + Math.sin(t * 3 + i) * 0.1) + wv * 0.9 + fin * (0.35 + 0.25 * Math.sin(t * 2 + i * 0.7));
      if (u.beam) (u.beam.material as THREE.MeshBasicMaterial).opacity = u.g * 0.55;
      if (u.pop) {
        u.pop *= 0.9;
        if (u.pop < 0.01) u.pop = 0;
        p.scale.y = u.h * (1 + u.pop * 0.25);
      }
    }
  };

  const click = (ray: THREE.Raycaster) => {
    const hit = ray.intersectObjects(pyrs)[0];
    if (hit) {
      const o = hit.object as THREE.Mesh;
      const u = o.userData as PyrData;
      u.tg = u.tg ? 0 : 1;
      u.pop = 1;
      if (u.tg) {
        sound.note(196 * SCALE[u.n], 2.4, 0.22);
        if (!u.beam) {
          u.beam = new THREE.Mesh(beamG, new THREE.MeshBasicMaterial({ color: 0xffcf7a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
          u.beam.position.set(o.position.x, o.position.y + u.h + 80, o.position.z);
          scene.add(u.beam);
        }
      }
      return;
    }
    const rd = ray.ray.direction;
    const ro = ray.ray.origin;
    if (rd.y < -0.01) {
      const k = -ro.y / rd.y;
      const wx = ro.x + rd.x * k;
      const wz = ro.z + rd.z * k;
      if (k < 110 && Math.abs(wx - pathX(wz)) < 9) {
        for (let i = 0; i < 3; i++) {
          const m = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0xffd992, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
          m.position.set(wx, 0.06, wz);
          m.userData = { t: nowT + i * 0.28 };
          scene.add(m);
          ripples.push(m);
        }
        sound.note(660 + rnd() * 200, 0.6, 0.08);
      }
    }
  };

  const rig: PlaceRig = { scene, camera: cam, update, click, drag: () => {}, dragEnd: () => {} };
  return rig;
}

/* -------------------------------------------------------------- gallery */
function buildGallery(sound: Sound, images: string[], cb: EngineCallbacks, state: { mx: number; my: number }) {
  const rnd = makeRnd(21);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05040a);
  scene.fog = new THREE.Fog(0x05040a, 10, 34);
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  const n = images.length;
  const step = (Math.PI * 2) / n;
  const R = 8.2;
  const W = 5;
  const H = 3.125;

  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x07060d, transparent: true, opacity: 0.86 }));
  scene.add(floor);
  for (const r of [4, R + 2.4, 16]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.03, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35 }));
    ring.position.y = 0.01;
    scene.add(ring);
  }

  const loader = new THREE.TextureLoader();
  const frames: THREE.Mesh[] = [];
  const borders: THREE.MeshBasicMaterial[] = [];
  images.forEach((src, i) => {
    const a = i * step;
    for (const sy of [1, -1]) {
      const g = new THREE.Group();
      const pm = new THREE.MeshBasicMaterial({ color: 0x15131f, transparent: sy < 0, opacity: sy < 0 ? 0.16 : 1 });
      loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const img = tex.image as { width: number; height: number };
        const ar = img.width / img.height;
        const want = W / H;
        if (ar > want) {
          tex.repeat.set(want / ar, 1);
          tex.offset.set((1 - want / ar) / 2, 0);
        } else {
          tex.repeat.set(1, ar / want);
          tex.offset.set(0, 1 - ar / want);
        }
        pm.map = tex;
        pm.color.set(0xffffff);
        pm.needsUpdate = true;
      });
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(W, H), pm);
      pic.userData = { index: i };
      const bm = new THREE.MeshBasicMaterial({ color: GOLD, transparent: sy < 0, opacity: sy < 0 ? 0.12 : 1 });
      const border = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.16, H + 0.16), bm);
      border.position.z = -0.02;
      g.add(border, pic);
      if (sy > 0) {
        frames.push(pic);
        borders.push(bm);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 9, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        cone.position.set(0, 2.2, 0.4);
        g.add(cone);
      }
      g.position.set(Math.sin(a) * R, sy * 2.5, -Math.cos(a) * R);
      g.lookAt(0, sy * 2.5, 0);
      g.scale.y = sy;
      scene.add(g);
    }
  });

  const dp: number[] = [];
  for (let i = 0; i < 500; i++) {
    const a = rnd() * 6.283;
    const r = 5 + rnd() * 12;
    dp.push(Math.sin(a) * r, rnd() * 8, Math.cos(a) * r);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffcf7a, size: 0.035, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  let yaw = -0.6;
  let yawT = 0;
  let focus = -1;
  let dragging = false;
  const look = new THREE.Vector3();
  const snap = () => {
    yawT = Math.round(yawT / step) * step;
  };
  const update = (t: number) => {
    yaw += (yawT - yaw) * 0.08;
    const px = (state.mx - 0.5) * 0.18;
    const py = (0.5 - state.my) * 0.5;
    cam.position.set(0, 2.5, 0);
    look.set(Math.sin(yaw + px) * 10, 1.75 + py, -Math.cos(yaw + px) * 10);
    cam.lookAt(look);
    dust.rotation.y = t * 0.02;
    const f = ((Math.round(yawT / step) % n) + n) % n;
    if (f !== focus && !dragging) {
      focus = f;
      cb.onFocusProject(f);
      sound.note(196 * SCALE[f % SCALE.length], 1.2, 0.1);
    }
    borders.forEach((b, i) => b.color.set(i === focus ? 0xffe2a0 : 0x8a7038));
  };
  const click = (ray: THREE.Raycaster) => {
    const hit = ray.intersectObjects(frames)[0];
    if (!hit) return;
    const i = hit.object.userData.index as number;
    if (i === focus) cb.onOpenProject(i);
    else {
      let d = i - focus;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      yawT = Math.round(yawT / step) * step + d * step;
    }
  };
  const rig: PlaceRig & { stepBy: (d: number) => void } = {
    scene,
    camera: cam,
    update,
    click,
    drag: (dx) => {
      dragging = true;
      yawT -= dx * 0.006;
    },
    dragEnd: () => {
      dragging = false;
      snap();
    },
    stepBy: (d) => {
      yawT = Math.round(yawT / step) * step + d * step;
    },
  };
  return rig;
}

/* ------------------------------------------------------------------ sky */
function buildSky(sound: Sound, count: number, cb: EngineCallbacks) {
  const rnd = makeRnd(99);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 1400);
  const sky = makeSky(0x01020a, 0x13204a);
  scene.add(sky.mesh);
  scene.add(makeStars(2600, rnd, 0.02));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x04050b }));
  ground.position.y = -1;
  scene.add(ground);
  const pg = new THREE.ConeGeometry(1, 1, 4, 1);
  pg.translate(0, 0.5, 0);
  const sil = new THREE.MeshBasicMaterial({ color: 0x05060f });
  for (let i = 0; i < 46; i++) {
    const a = rnd() * 6.283;
    const r = 60 + rnd() * 80;
    const h = 6 + rnd() * 16;
    const p = new THREE.Mesh(pg, sil);
    p.position.set(Math.sin(a) * r, -1, Math.cos(a) * r);
    p.scale.set(h * 0.42, h, h * 0.42);
    scene.add(p);
  }
  const tex = glowTexture();
  const targets: THREE.Mesh[] = [];
  const halos: THREE.Sprite[] = [];
  const pts: THREE.Vector3[] = [];
  const hitG = new THREE.SphereGeometry(3.2, 8, 8);
  const hitM = new THREE.MeshBasicMaterial({ visible: false });
  for (let i = 0; i < count; i++) {
    const az = (-1 + (2 * i) / (count - 1)) * 1.15;
    const el = 0.42 + 0.2 * Math.sin(i * 2.1) + 0.1 * Math.cos(i * 1.3);
    const v = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(46);
    pts.push(v);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffd58a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.setScalar(7);
    halo.position.copy(v);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    core.scale.setScalar(2.4);
    core.position.copy(v);
    scene.add(halo, core);
    halos.push(halo);
    const hm = new THREE.Mesh(hitG, hitM);
    hm.position.copy(v);
    hm.userData = { index: i };
    scene.add(hm);
    targets.push(hm);
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35 }));
  scene.add(line);

  const shoot = new THREE.Mesh(new THREE.BoxGeometry(46, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  shoot.rotation.z = -0.5;
  scene.add(shoot);
  let shT = 0;
  const shP = new THREE.Vector3();

  let yaw = 0;
  let pitch = 0.42;
  let yawT = 0;
  let pitchT = 0.42;
  let selected = -1;
  const look = new THREE.Vector3();
  const update = (t: number) => {
    yaw += (yawT - yaw) * 0.1;
    pitch += (pitchT - pitch) * 0.1;
    cam.position.set(0, 1.6, 0);
    look.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(10).add(cam.position);
    cam.lookAt(look);
    halos.forEach((h, i) => {
      const s = i === selected ? 12 + Math.sin(t * 4) * 1.5 : 7 + Math.sin(t * 1.5 + i) * 0.8;
      h.scale.setScalar(s);
    });
    if (t - shT > 4.5) {
      shT = t;
      shP.set(-260 + rnd() * 520, 300 + rnd() * 160, -700);
    }
    const sa = (t - shT) / 0.9;
    const sm = shoot.material as THREE.MeshBasicMaterial;
    if (sa < 1) {
      shoot.position.set(shP.x + sa * 150, shP.y - sa * 82, shP.z);
      sm.opacity = Math.sin(sa * Math.PI) * 0.9;
    } else sm.opacity = 0;
  };
  const click = (ray: THREE.Raycaster) => {
    const hit = ray.intersectObjects(targets)[0];
    if (!hit) return;
    selected = hit.object.userData.index as number;
    const v = pts[selected];
    yawT = Math.atan2(v.x, -v.z);
    pitchT = Math.max(0.05, Math.asin(v.y / 46) - 0.16);
    sound.note(392 * SCALE[selected % SCALE.length], 2.6, 0.16);
    cb.onService(selected);
  };
  const rig: PlaceRig = {
    scene,
    camera: cam,
    update,
    click,
    drag: (dx, dy) => {
      yawT -= dx * 0.004;
      yawT = Math.max(-1.5, Math.min(1.5, yawT));
      pitchT = Math.max(0.05, Math.min(1.05, pitchT + dy * 0.004));
    },
    dragEnd: () => {},
  };
  return rig;
}

/* --------------------------------------------------------------- majlis */
function buildMajlis(state: { mx: number; my: number; portrait: boolean }) {
  const rnd = makeRnd(5);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c1838, 14, 90);
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 1400);
  const sky = makeSky(0x01020a, 0x0c1838);
  scene.add(sky.mesh);
  scene.add(makeStars(1800, rnd));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshBasicMaterial({ color: 0xe9efff, fog: false }));
  moon.position.set(-160, 190, -780);
  scene.add(moon);
  const mg = new THREE.Mesh(new THREE.CircleGeometry(80, 48), new THREE.MeshBasicMaterial({ color: 0x6f8cff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, fog: false, depthWrite: false }));
  mg.position.set(-160, 190, -781);
  scene.add(mg);

  scene.add(new THREE.HemisphereLight(0x3a4a8a, 0x0a0806, 1.6));
  const lampLight = new THREE.PointLight(0xffa64a, 9, 22, 1.6);
  lampLight.position.set(0.9, 1.5, 0.2);
  scene.add(lampLight);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 60, 40, 12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9a653a, roughness: 1, flatShading: true }));
  const sp = sand.geometry.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setY(i, Math.sin(sp.getX(i) * 0.3) * 0.12 + Math.cos(sp.getZ(i) * 0.4) * 0.1);
  sand.geometry.computeVertexNormals();
  sand.position.set(0, 0, 18);
  scene.add(sand);
  const water = waterMaterial();
  water.uniforms.sun.value.set(0x8fa6ff);
  water.uniforms.deep.value.set(0x030612);
  water.uniforms.fogc.value.set(0x0c1838);
  water.uniforms.fogFar.value = 60;
  const river = new THREE.Mesh(new THREE.PlaneGeometry(60, 820, 1, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 2), water.mat);
  river.position.set(0, -0.15, -40);
  scene.add(river);

  // rug with a woven pattern
  const rc = document.createElement("canvas");
  rc.width = 256;
  rc.height = 384;
  const g = rc.getContext("2d")!;
  g.fillStyle = "#7a1f1c";
  g.fillRect(0, 0, 256, 384);
  const cols = ["#f0c874", "#1d2a5c", "#c8512f", "#f3e3c2"];
  for (let y = 0; y < 384; y += 32) {
    g.fillStyle = cols[(y / 32) % 4];
    g.fillRect(0, y, 256, 5);
    for (let x = 0; x < 256; x += 32) {
      g.fillStyle = cols[(x / 32 + y / 32) % 4];
      g.beginPath();
      g.moveTo(x + 16, y + 9);
      g.lineTo(x + 26, y + 18);
      g.lineTo(x + 16, y + 27);
      g.lineTo(x + 6, y + 18);
      g.fill();
    }
  }
  g.strokeStyle = "#f0c874";
  g.lineWidth = 10;
  g.strokeRect(5, 5, 246, 374);
  const rt = new THREE.CanvasTexture(rc);
  rt.colorSpace = THREE.SRGBColorSpace;
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 6.2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rt, roughness: 1 }));
  rug.position.y = 0.16;
  rug.rotation.y = 0.3;
  scene.add(rug);

  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.9 });
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 32), brass);
  table.position.y = 0.6;
  scene.add(table);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.45, 8), wood);
  leg.position.y = 0.38;
  scene.add(leg);
  const pot = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14), brass);
  body.scale.y = 1.15;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.2, 12), brass);
  neck.position.y = 0.34;
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), brass);
  lid.position.y = 0.47;
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.42, 8), brass);
  spout.position.set(0.3, 0.1, 0);
  spout.rotation.z = -0.9;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 8, 20, Math.PI), brass);
  handle.position.set(-0.26, 0.05, 0);
  handle.rotation.z = Math.PI / 2;
  pot.add(body, neck, lid, spout, handle);
  pot.position.set(-0.15, 0.94, 0);
  scene.add(pot);
  const glassM = new THREE.MeshStandardMaterial({ color: 0xb5501c, emissive: 0x9a3c10, emissiveIntensity: 0.9, roughness: 0.2, transparent: true, opacity: 0.9 });
  for (const [gx, gz] of [[0.42, 0.3], [0.2, -0.45], [-0.5, 0.4]]) {
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.16, 12), glassM);
    gl.position.set(gx, 0.72, gz);
    scene.add(gl);
  }
  const cushM = [0x7a1f1c, 0x1d2a5c, 0xc8512f].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
  [[-1.7, 0.6, 0.4], [1.6, -0.9, -0.5], [0.2, 1.9, 1.4]].forEach(([cx, cz, ry], i) => {
    const cu = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.8), cushM[i]);
    cu.position.set(cx, 0.32, cz);
    cu.rotation.y = ry;
    scene.add(cu);
  });
  const lantern = new THREE.Group();
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffc46a }));
  flame.position.y = 0.3;
  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.46, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0x1a1208, wireframe: true }));
  cage.position.y = 0.3;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 6), wood);
  cap.position.y = 0.62;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 6), wood);
  base.position.y = 0.05;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffa64a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
  halo.scale.setScalar(3.2);
  halo.position.y = 0.3;
  lantern.add(flame, cage, cap, base, halo);
  lantern.position.set(1.25, 0.16, 0.9);
  scene.add(lantern);

  const trunkG = new THREE.CylinderGeometry(0.1, 0.17, 4, 5);
  trunkG.translate(0, 2, 0);
  const leafG = new THREE.ConeGeometry(0.24, 2.6, 4);
  leafG.translate(0, 1.3, 0);
  const palmM = new THREE.MeshStandardMaterial({ color: 0x1c2412, roughness: 1, flatShading: true });
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x2a1c10, roughness: 1, flatShading: true });
  for (const [px, pz, s] of [[-5.2, -7.5, 1.5], [6.4, -8.4, 1.25], [-9.5, -10, 1.1]]) {
    const pm = makePalm(rnd, trunkG, leafG, trunkM, palmM);
    pm.position.set(px, 0, pz);
    pm.scale.setScalar(s);
    scene.add(pm);
  }
  const ep: number[] = [];
  for (let i = 0; i < 60; i++) ep.push((rnd() - 0.5) * 0.5, rnd() * 3, (rnd() - 0.5) * 0.5);
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.Float32BufferAttribute(ep, 3));
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xffb060, size: 0.035, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  embers.position.set(1.25, 0.6, 0.9);
  scene.add(embers);

  const look = new THREE.Vector3();
  let ox = 0;
  const update = (t: number) => {
    ox += ((state.mx - 0.5) * 0.5 - ox) * 0.04;
    const a = 0.35 + Math.sin(t * 0.13) * 0.28 + ox;
    const r = state.portrait ? 8.6 : 7.2;
    cam.position.set(Math.sin(a) * r, state.portrait ? 2.6 : 2.2, Math.cos(a) * r);
    look.set(0, state.portrait ? -1.1 : 0.7, 0);
    cam.lookAt(look);
    lampLight.intensity = 9 + Math.sin(t * 9) * 0.8 + Math.sin(t * 23) * 0.5;
    water.uniforms.t.value = t;
    const pos = eg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + 0.008;
      if (y > 3) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    embers.material.opacity = 0.6 + Math.sin(t * 5) * 0.2;
  };
  const rig: PlaceRig = { scene, camera: cam, update, click: () => {}, drag: () => {}, dragEnd: () => {} };
  return rig;
}

/* --------------------------------------------------------------- engine */
export function createEngine(canvas: HTMLCanvasElement, images: string[], serviceCount: number, cb: EngineCallbacks): Engine | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const sound = new Sound();
  const state = { progress: 0, tod: 0, mx: 0.5, my: 0.5, portrait: false, rush: -1 };
  const rigs: Record<Place, PlaceRig> = {
    river: buildRiver(sound, state),
    gallery: buildGallery(sound, images, cb, state),
    sky: buildSky(sound, serviceCount, cb),
    majlis: buildMajlis(state),
  };
  let place: Place = "river";
  const roots: Record<Place, number> = { river: 73.42, gallery: 82.41, sky: 98, majlis: 65.41 };

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    state.portrait = w < h;
    (Object.keys(rigs) as Place[]).forEach((k) => {
      const c = rigs[k].camera;
      c.aspect = w / h;
      c.fov = k === "majlis" ? (w < h ? 62 : 46) : w < h ? 78 : 60;
      c.updateProjectionMatrix();
    });
  };
  window.addEventListener("resize", resize);
  resize();

  const ray = new THREE.Raycaster();
  const v2 = new THREE.Vector2();
  let down: { x: number; y: number; lx: number; ly: number; moved: number } | null = null;
  const onMove = (e: PointerEvent) => {
    state.mx = e.clientX / window.innerWidth;
    state.my = e.clientY / window.innerHeight;
    if (down) {
      const dx = e.clientX - down.lx;
      const dy = e.clientY - down.ly;
      down.lx = e.clientX;
      down.ly = e.clientY;
      down.moved += Math.abs(dx) + Math.abs(dy);
      if (down.moved > 6) rigs[place].drag(dx, dy);
    }
  };
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: 0 };
  };
  const onUp = (e: PointerEvent) => {
    if (!down) return;
    const wasClick = down.moved <= 6;
    down = null;
    rigs[place].dragEnd();
    if (wasClick) {
      v2.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      ray.setFromCamera(v2, rigs[place].camera);
      rigs[place].click(ray);
    }
  };
  const onCancel = () => {
    if (down) rigs[place].dragEnd();
    down = null;
  };
  window.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);

  let raf = 0;
  const frame = (ms: number) => {
    const rig = rigs[place];
    rig.update(ms / 1000);
    renderer.render(rig.scene, rig.camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    setPlace: (p) => {
      place = p;
      state.rush = -1;
      canvas.style.touchAction = p === "river" ? "pan-y" : "none";
      sound.setRoot(roots[p]);
    },
    setProgress: (p) => {
      state.progress = p;
    },
    rush: () => {
      if (place === "river") state.rush = performance.now() / 1000;
    },
    setTime: (d) => {
      state.tod = d;
    },
    stepGallery: (d) => (rigs.gallery as PlaceRig & { stepBy: (d: number) => void }).stepBy(d),
    enableAudio: () => sound.enable(),
    setMuted: (m) => sound.setMuted(m),
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      renderer.dispose();
      if (sound.ctx) void sound.ctx.close();
    },
  };
}
