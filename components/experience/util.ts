/* Small shared helpers for the scenes: maths, seeded randomness, canvas textures,
   and the per-frame uniforms every shader reads. */
import * as THREE from "three";

export type Place = "river" | "gallery" | "sky" | "majlis";

export const GOLD = 0xf0c874;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sstep = (a: number, b: number, x: number) => {
  x = clamp((x - a) / (b - a));
  return x * x * (3 - 2 * x);
};
/* smooth bump: 1 at c, 0 beyond c +/- w */
export const bump = (c: number, w: number, x: number) => sstep(0, 1, 1 - Math.abs(x - c) / w);
/* frame-rate independent easing toward a target */
export const damp = (cur: number, target: number, lambda: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));
export const makeRnd = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

/* uniforms shared by every material: time, and the device pixel ratio for point sizes */
export const shared = {
  uTime: { value: 0 },
  uPR: { value: 1 },
};

export interface WorldState {
  progress: number;
  tod: number;
  mx: number;
  my: number;
  portrait: boolean;
  rush: number;
  calm: boolean;
  /** 0 low, 1 medium, 2 high */
  tier: number;
}

export interface Grade {
  exposure: number;
  sat: number;
  contrast: number;
  lift: THREE.Color;
  gain: THREE.Color;
  vig: number;
  grain: number;
  ca: number;
  bloom: number;
  bloomRadius: number;
  bloomThreshold: number;
}

export interface PlaceRig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (t: number, dt: number) => void;
  click: (ray: THREE.Raycaster) => void;
  /** is the pointer over something that responds to a tap */
  hover: (ray: THREE.Raycaster) => boolean;
  drag: (dx: number, dy: number) => void;
  dragEnd: () => void;
  /** play the establishing move when the place is entered */
  enter: () => void;
  grade: () => Grade;
  /** scale of the reflection buffers relative to the screen */
  setReflectionScale?: (w: number, h: number) => void;
}

export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function glowTexture() {
  return canvasTexture(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.18, "rgba(255,255,255,.6)");
    gr.addColorStop(0.45, "rgba(255,255,255,.14)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
}

/* soft dark disc laid under objects so they sit on the ground */
export function contactShadowTexture() {
  return canvasTexture(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(0,0,0,.75)");
    gr.addColorStop(0.5, "rgba(0,0,0,.35)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
}

/* four-point star flare for the bright stars */
export function flareTexture() {
  return canvasTexture(256, 256, (g) => {
    g.translate(128, 128);
    for (const [len, wid, a] of [
      [128, 2.2, 0.9],
      [70, 5, 0.35],
    ] as const) {
      for (let k = 0; k < 2; k++) {
        const gr = g.createLinearGradient(-len, 0, len, 0);
        gr.addColorStop(0, "rgba(255,255,255,0)");
        gr.addColorStop(0.5, `rgba(255,255,255,${a})`);
        gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.ellipse(0, 0, len, wid, (k * Math.PI) / 2, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

/* GLSL helpers pasted into several shaders */
export const NOISE_GLSL = /* glsl */ `
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p){
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
    return s;
  }
  float hash13(vec3 p3){ p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
  float vnoise3(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y);
    float b = mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y);
    return mix(a, b, f.z);
  }
  float fbm3(vec3 p){
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 5; i++){ s += a * vnoise3(p); p = p * 2.07 + vec3(11.7, 5.3, 3.1); a *= 0.5; }
    return s;
  }
`;

/* a tiny mesh builder for hand-made geometry (palms, sails, hulls) */
export class GeoBuilder {
  pos: number[] = [];
  col: number[] = [];
  idx: number[] = [];
  vert(x: number, y: number, z: number, c: THREE.Color) {
    this.pos.push(x, y, z);
    this.col.push(c.r, c.g, c.b);
    return this.pos.length / 3 - 1;
  }
  tri(a: number, b: number, c: number) {
    this.idx.push(a, b, c);
  }
  quad(a: number, b: number, c: number, d: number) {
    this.idx.push(a, b, c, a, c, d);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}
