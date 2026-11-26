/* The 3D world behind the portfolio: the Nile journey plus three places you can
   step into (gallery, sky, majlis). Plain three.js, driven by Experience.tsx.
   This file owns the renderer, the finishing chain, input and sound; each place
   lives in its own module. */
import * as THREE from "three";
import { Sound } from "./audio";
import { buildGallery } from "./gallery";
import { buildMajlis } from "./majlis";
import { makePost } from "./post";
import { buildRiver } from "./river";
import { buildSky } from "./sky";
import { shared, type Place, type PlaceRig, type WorldState } from "./util";

export type { Place } from "./util";
export { GATE_STOPS } from "./river";

export interface EngineCallbacks {
  onFocusProject: (index: number) => void;
  onOpenProject: (index: number) => void;
  onService: (index: number) => void;
  /** the pointer moved on or off something in the scene that responds to a tap */
  onHot?: (hot: boolean) => void;
}

export interface Engine {
  setPlace: (p: Place) => void;
  setProgress: (p: number) => void;
  /** surge forward through the gate ahead; call just before leaving the river */
  rush: () => void;
  /** the white-gold bloom that carries you from one place to another */
  flash: () => void;
  /** the visitor has stepped in: play the river's opening move */
  begin: () => void;
  setTime: (d: number) => void;
  stepGallery: (dir: number) => void;
  /** elements to keep pinned under each service star, in service order */
  setStarLabels: (els: HTMLElement[]) => void;
  selectService: (index: number) => void;
  enableAudio: () => void;
  setMuted: (m: boolean) => void;
  sfx: (kind: "hover" | "tap") => void;
  dispose: () => void;
}

export function createEngine(canvas: HTMLCanvasElement, images: string[], serviceCount: number, cb: EngineCallbacks): Engine | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const state: WorldState = {
    progress: 0,
    tod: 0,
    mx: 0.5,
    my: 0.5,
    portrait: false,
    rush: -1,
    calm: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    tier: coarse || small ? 1 : 2,
  };
  const sound = new Sound();
  const post = makePost(renderer, state.tier === 2 && renderer.capabilities.isWebGL2);

  const rigs = {
    river: buildRiver(sound, state),
    gallery: buildGallery(renderer, sound, images, cb, state),
    sky: buildSky(sound, serviceCount, cb, state),
    majlis: buildMajlis(renderer, state),
  };
  const all = Object.values(rigs) as PlaceRig[];
  let place: Place = "river";

  /* render quality: starts from the device, and steps down, once and for good,
     on machines that cannot hold a smooth frame rate */
  let quality = state.tier === 2 ? 2 : 1.5;
  const reflScale = () => (state.tier === 2 ? 0.5 : state.tier === 1 ? 0.36 : 0.24);
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pr = Math.min(quality, window.devicePixelRatio || 1);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    post.setSize(w, h, pr);
    shared.uPR.value = pr;
    state.portrait = w < h;
    const rs = reflScale();
    (Object.keys(rigs) as Place[]).forEach((k) => {
      const r = rigs[k];
      const c = r.camera;
      c.aspect = w / h;
      c.fov = k === "majlis" ? (w < h ? 62 : 46) : w < h ? 78 : 60;
      c.updateProjectionMatrix();
      r.setReflectionScale?.(Math.max(64, Math.round(w * pr * rs)), Math.max(64, Math.round(h * pr * rs)));
    });
  };
  window.addEventListener("resize", resize);
  resize();

  const ray = new THREE.Raycaster();
  const v2 = new THREE.Vector2();
  let down: { x: number; y: number; lx: number; ly: number; moved: number } | null = null;
  let pointerMoved = false;
  let hot = false;
  const onMove = (e: PointerEvent) => {
    state.mx = e.clientX / window.innerWidth;
    state.my = e.clientY / window.innerHeight;
    if (e.pointerType === "mouse") pointerMoved = true;
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
  const onLeave = () => {
    if (hot) {
      hot = false;
      cb.onHot?.(false);
    }
  };
  window.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);
  canvas.addEventListener("pointerleave", onLeave);

  let raf = 0;
  let lastMs = 0;
  let slow = 0;
  let counted = 0;
  let strikes = 0;
  const frame = (ms: number) => {
    raf = requestAnimationFrame(frame);
    const gap = ms - lastMs;
    lastMs = ms;
    const dt = gap > 0 && gap < 250 ? gap / 1000 : 1 / 60;
    if (gap > 0 && gap < 250) {
      /* judge every 90 frames; long gaps (tab switches) are ignored */
      counted++;
      slow += gap;
      if (counted >= 90) {
        if (slow / counted > 21) {
          strikes++;
          const current = Math.min(quality, window.devicePixelRatio || 1);
          if (current > 0.75) quality = Math.max(0.75, current * 0.82);
          if (strikes % 2 === 0 && state.tier > 0) state.tier--;
          resize();
        }
        counted = 0;
        slow = 0;
      }
    }
    const t = ms / 1000;
    shared.uTime.value = t;
    const rig = rigs[place];
    rig.update(t, dt);
    if (pointerMoved && !down) {
      pointerMoved = false;
      v2.set(state.mx * 2 - 1, -(state.my * 2 - 1));
      ray.setFromCamera(v2, rig.camera);
      const h = rig.hover(ray);
      if (h !== hot) {
        hot = h;
        cb.onHot?.(h);
      }
    }
    post.render(rig.scene, rig.camera, rig.grade(), t, dt);
  };
  raf = requestAnimationFrame(frame);

  return {
    setPlace: (p) => {
      if (p === place) return;
      place = p;
      state.rush = -1;
      canvas.style.touchAction = p === "river" ? "pan-y" : "none";
      rigs[p].enter();
      sound.setPlace(p);
      if (hot) {
        hot = false;
        cb.onHot?.(false);
      }
    },
    setProgress: (p) => {
      state.progress = p;
    },
    rush: () => {
      if (place === "river") state.rush = performance.now() / 1000;
    },
    flash: () => {
      post.flash(performance.now() / 1000);
      sound.whoosh();
    },
    begin: () => rigs.river.enter(),
    setTime: (d) => {
      state.tod = d;
    },
    stepGallery: (d) => (rigs.gallery as PlaceRig & { stepBy: (d: number) => void }).stepBy(d),
    setStarLabels: (els) => rigs.sky.setLabels(els),
    selectService: (i) => rigs.sky.select(i),
    enableAudio: () => {
      sound.enable();
      sound.setPlace(place);
    },
    setMuted: (m) => sound.setMuted(m),
    sfx: (kind) => (kind === "hover" ? sound.hover() : sound.tap()),
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerleave", onLeave);
      all.forEach((r) =>
        r.scene.traverse((o) => {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          const mat = m.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat?.dispose();
        })
      );
      post.dispose();
      renderer.dispose();
      sound.dispose();
    },
  };
}
