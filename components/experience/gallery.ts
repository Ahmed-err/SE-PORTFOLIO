/* The Gallery: client work hung in brass frames around a dark hall with a
   polished stone floor that holds their reflections. Live Sarmadax products
   stand between them on stone plinths: a glowing screen and a phone floating
   over a pulsing brass ring. Drag to turn, tap to open. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import type { Sound } from "./audio";
import type { EngineCallbacks } from "./engine";
import { makeEnvironment, shaftMaterial, softPoints, stoneMaterial } from "./materials";
import { damp, glowTexture, makeRnd, NOISE_GLSL, type Grade, type PlaceRig, type WorldState } from "./util";

const BG = 0x050408;

export interface Exhibit {
  kind: "work" | "product" | "concepts";
  img: string;
  phone?: string;
}

export function buildGallery(renderer: THREE.WebGLRenderer, sound: Sound, exhibits: Exhibit[], cb: EngineCallbacks, state: WorldState) {
  const rnd = makeRnd(21);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 12, 38);
  scene.environment = makeEnvironment(renderer, (s) => {
    s.background = new THREE.Color(0x040306);
    const box = (w: number, h: number, c: number, k: number, x: number, y: number, z: number, ry = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      m.rotation.z += ry;
      s.add(m);
    };
    box(30, 6, 0xffd8a0, 2.2, 0, 40, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(6, 18, 0xffb870, 0.5, Math.sin(a) * 30, 6, Math.cos(a) * 30);
    }
    box(40, 4, 0x6a7cff, 0.12, 0, -20, 30);
  });
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  const n = exhibits.length;
  const step = (Math.PI * 2) / n;
  const R = 8.2;
  const W = 5;
  const H = 3.125;
  const Y = 2.5;

  /* the floor: dark stone, softened reflections, inlaid brass rings */
  const floor = new Reflector(new THREE.CircleGeometry(42, 96), {
    textureWidth: 256,
    textureHeight: 256,
    clipBias: 0.002,
    multisample: 0,
    shader: {
      name: "GalleryFloor",
      uniforms: {
        tDiffuse: { value: null },
        color: { value: new THREE.Color(0xffffff) },
        textureMatrix: { value: new THREE.Matrix4() },
        fogc: { value: new THREE.Color(BG) },
        rings: { value: new THREE.Vector3(4, R + 2.4, 16) },
      },
      vertexShader: /* glsl */ `
        uniform mat4 textureMatrix;
        varying vec4 vUv4; varying vec3 vW;
        void main(){
          vUv4 = textureMatrix * vec4(position, 1.0);
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform vec3 fogc, rings;
        varying vec4 vUv4; varying vec3 vW;
        ${NOISE_GLSL}
        void main(){
          vec2 uv = vUv4.xy / vUv4.w;
          float veins = fbm(vW.xz * 0.35 + vec2(fbm(vW.xz * 0.8), 0.0));
          vec2 wob = vec2(veins - 0.5) * 0.01;
          vec3 r = vec3(0.0);
          for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) r += texture2D(tDiffuse, uv + wob + vec2(float(i), float(j)) * 0.0035).rgb;
          r /= 25.0;
          float rad = length(vW.xz);
          vec3 stone = vec3(0.012, 0.010, 0.014) * (0.6 + veins * 0.9) + vec3(0.02, 0.016, 0.012) * smoothstep(0.62, 0.7, veins);
          vec3 col = stone + r * 0.42;
          float ring = 0.0;
          ring += 1.0 - smoothstep(0.0, 0.03, abs(rad - rings.x));
          ring += 1.0 - smoothstep(0.0, 0.03, abs(rad - rings.y));
          ring += 1.0 - smoothstep(0.0, 0.03, abs(rad - rings.z));
          col += vec3(0.85, 0.62, 0.3) * ring * 0.5;
          float dist = length(cameraPosition - vW);
          col = mix(col, fogc, smoothstep(12.0, 38.0, dist));
          gl_FragColor = vec4(col, 1.0);
        }`,
    },
  });
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  /* columns between the frames */
  const colM = stoneMaterial(0x2a221a, { course: 1.6, roughness: 0.6 });
  const colG = new THREE.CylinderGeometry(0.34, 0.4, 9, 20);
  colG.translate(0, 4.5, 0);
  colG.setAttribute("aGlow", new THREE.InstancedBufferAttribute(new Float32Array(n), 1));
  const cols = new THREE.InstancedMesh(colG, colM, n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const a = i * step + step / 2;
    m4.makeTranslation(Math.sin(a) * (R + 0.9), 0, -Math.cos(a) * (R + 0.9));
    cols.setMatrixAt(i, m4);
  }
  scene.add(cols);

  const brass = new THREE.MeshStandardMaterial({ color: 0xc89a4c, metalness: 1, roughness: 0.3, envMapIntensity: 1.2 });
  const loader = new THREE.TextureLoader();
  const glow = glowTexture();
  interface Frame {
    g: THREE.Group;
    screens: THREE.MeshBasicMaterial[];
    shaft: ReturnType<typeof shaftMaterial>;
    pool: THREE.MeshBasicMaterial;
    k: number;
    a: number;
    /* products only */
    phone?: THREE.Group;
    slab?: THREE.Group;
    ring?: THREE.MeshStandardMaterial;
  }
  const frames: Frame[] = [];
  const pics: THREE.Mesh[] = [];

  /* fill a w x h surface with an image, cropped from the top like a page */
  const loadInto = (src: string, mat: THREE.MeshBasicMaterial, w: number, h: number) =>
    loader.load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const img = tex.image as { width: number; height: number };
      const ar = img.width / img.height;
      const want = w / h;
      if (ar > want) {
        tex.repeat.set(want / ar, 1);
        tex.offset.set((1 - want / ar) / 2, 0);
      } else {
        tex.repeat.set(1, ar / want);
        tex.offset.set(0, 1 - ar / want);
      }
      mat.map = tex;
      mat.needsUpdate = true;
    });
  const screenMat = () => new THREE.MeshBasicMaterial({ color: 0x15131f });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0b0a10, metalness: 0.7, roughness: 0.22, envMapIntensity: 1.4 });
  const plinthM = stoneMaterial(0x2e251c, { course: 0.45, roughness: 0.55 });

  exhibits.forEach((ex, i) => {
    const a = i * step;
    const g = new THREE.Group();
    const screens: THREE.MeshBasicMaterial[] = [];
    const fr: Partial<Frame> = {};

    if (ex.kind === "product") {
      /* the product's own screen, a slab of dark glass floating over the plinth */
      const SW = 4.3;
      const SH = SW / 1.6;
      const scrM = screenMat();
      loadInto(ex.img, scrM, SW, SH);
      const slab = new THREE.Group();
      const body = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.16, SH + 0.16, 0.08, 3, 0.05), glass);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), scrM);
      scr.position.z = 0.045;
      scr.userData = { index: i };
      slab.add(body, scr);
      slab.position.set(-0.45, 0.4, 0.3);
      slab.rotation.y = 0.1;
      g.add(slab);
      pics.push(scr);
      screens.push(scrM);

      /* and the phone, in front, turning slowly as if held up to show you */
      const PW = 0.86;
      const PH = (PW * 844) / 390;
      const phM = screenMat();
      loadInto(ex.phone ?? ex.img, phM, PW, PH);
      const phone = new THREE.Group();
      const shell = new THREE.Mesh(new RoundedBoxGeometry(PW + 0.1, PH + 0.12, 0.09, 4, 0.08), glass);
      const ph = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), phM);
      ph.position.z = 0.047;
      ph.userData = { index: i };
      phone.add(shell, ph);
      phone.position.set(1.85, -0.3, 1.3);
      g.add(phone);
      pics.push(ph);
      screens.push(phM);

      /* the plinth and its brass ring, which pulses: this one is live */
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.7, 0.9, 48), plinthM);
      plinth.position.set(0.3, -Y + 0.45, 0.9);
      const ring = new THREE.MeshStandardMaterial({ color: 0x3a2a10, emissive: new THREE.Color(0xffc060), emissiveIntensity: 2, metalness: 1, roughness: 0.25 });
      const band = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.035, 10, 96), ring);
      band.rotation.x = Math.PI / 2;
      band.position.set(0.3, -Y + 0.91, 0.9);
      g.add(plinth, band);
      Object.assign(fr, { phone, slab, ring });
    } else {
      const picM = screenMat();
      loadInto(ex.img, picM, W, H);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.42, H + 0.42, 0.16), brass);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, H + 0.12, 0.17), new THREE.MeshStandardMaterial({ color: 0x0a0910, roughness: 0.9 }));
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(W, H), picM);
      pic.position.z = 0.09;
      pic.userData = { index: i };
      g.add(frame, lip, pic);
      pics.push(pic);
      screens.push(picM);
    }

    const shaft = shaftMaterial(0xffd9a0, 0.4);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.3, 7.5, 40, 1, true), shaft.mat);
    cone.position.set(0, 1.9, 0.8);
    cone.rotation.x = -0.12;
    g.add(cone);
    g.position.set(Math.sin(a) * R, Y, -Math.cos(a) * R);
    g.lookAt(0, Y, 0);
    scene.add(g);
    const pool = new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color(0xffc887), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.4).rotateX(-Math.PI / 2), pool);
    pm.position.set(Math.sin(a) * (R - 1.3), 0.01, -Math.cos(a) * (R - 1.3));
    pm.rotation.y = -a;
    scene.add(pm);
    frames.push({ ...fr, g, screens, shaft, pool, k: 0.4, a });
  });

  /* motes drifting through the light, and a ring of small lamps overhead */
  const dp: number[] = [];
  const ds: number[] = [];
  for (let i = 0; i < 700; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 4 + rnd() * 11;
    dp.push(Math.sin(a) * r, rnd() * 8, Math.cos(a) * r);
    ds.push(0.4 + rnd() * rnd() * 1.6);
  }
  const dust = softPoints({ positions: dp, sizes: ds, size: 0.35, color: 0xffd08a, intensity: 1.2, attenuate: true, twinkle: 0.7 });
  scene.add(dust.points);
  const lp: number[] = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    lp.push(Math.sin(a) * 12, 8.6, Math.cos(a) * 12);
  }
  scene.add(softPoints({ positions: lp, size: 0.7, color: 0xffc070, intensity: 2.2, attenuate: true }).points);
  scene.add(new THREE.HemisphereLight(0x8a7a6a, 0x0a0806, 0.5));
  const key = new THREE.SpotLight(0xffe2b0, 30, 30, 0.9, 0.6, 1.5);
  key.position.set(0, 9, 0);
  scene.add(key, key.target);

  let yaw = -0.6;
  let yawT = 0;
  let focus = -1;
  let dragging = false;
  let enterAt = -99;
  let enterPending = false;
  const look = new THREE.Vector3();
  const snap = () => {
    yawT = Math.round(yawT / step) * step;
  };
  const grade: Grade = {
    exposure: 1.05,
    sat: 1.02,
    contrast: 1.1,
    lift: new THREE.Color().setRGB(0.004, 0.003, 0.006),
    gain: new THREE.Color().setRGB(1.03, 1.0, 0.96),
    vig: 0.48,
    grain: 0.04,
    ca: 0.01,
    bloom: 0.55,
    bloomRadius: 0.6,
    bloomThreshold: 0.95,
  };

  const update = (t: number, dt: number) => {
    if (enterPending) {
      enterAt = t;
      enterPending = false;
    }
    yaw = damp(yaw, yawT, 4.5, dt);
    const intro = state.calm ? 0 : Math.pow(1 - Math.min(1, (t - enterAt) / 2.2), 3);
    const px = (state.mx - 0.5) * 0.18;
    const py = (0.5 - state.my) * 0.5;
    cam.position.set(0, Y + intro * 1.2, 0);
    const yy = yaw + px - intro * 1.1;
    look.set(Math.sin(yy) * 10, 1.75 + py - intro * 0.8, -Math.cos(yy) * 10);
    cam.lookAt(look);
    dust.points.rotation.y = t * 0.02;
    const f = ((Math.round(yawT / step) % n) + n) % n;
    if (f !== focus && !dragging) {
      focus = f;
      cb.onFocusProject(f);
      sound.pluck(sound.note(f + 3, "gallery"), 0.4, 0, 0, 0.9);
    }
    frames.forEach((fr, i) => {
      fr.k = damp(fr.k, i === focus ? 1 : 0.34, 4, dt);
      for (const m of fr.screens) m.color.setScalar(fr.k);
      fr.shaft.uniforms.intensity.value = 0.04 + fr.k * 0.16;
      fr.pool.opacity = 0.12 + fr.k * 0.5;
      const push = (fr.k - 0.34) * 0.5;
      fr.g.position.set(Math.sin(fr.a) * (R - push), Y, -Math.cos(fr.a) * (R - push));
      if (fr.phone && fr.slab && fr.ring) {
        const still = state.calm ? 0 : 1;
        fr.phone.position.y = -0.3 + Math.sin(t * 0.9 + i) * 0.07 * still;
        fr.phone.rotation.y = -0.32 + Math.sin(t * 0.37 + i) * 0.14 * still;
        fr.phone.rotation.z = Math.sin(t * 0.5 + i) * 0.025 * still;
        fr.slab.position.y = 0.4 + Math.sin(t * 0.6 + i + 1.3) * 0.04 * still;
        fr.ring.emissiveIntensity = (0.6 + fr.k * 1.6) * (1 + 0.45 * Math.sin(t * 2.6) * still);
      }
    });
  };
  const hit = (ray: THREE.Raycaster) => ray.intersectObjects(pics, false)[0];
  const click = (ray: THREE.Raycaster) => {
    const h = hit(ray);
    if (!h) return;
    const i = h.object.userData.index as number;
    if (i === focus) {
      sound.tap();
      cb.onOpenProject(i);
    } else {
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
    hover: (ray) => !!hit(ray),
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
    enter: () => {
      enterPending = true;
    },
    grade: () => grade,
    setReflectionScale: (w, h) => floor.getRenderTarget().setSize(Math.max(64, Math.round(w * 0.6)), Math.max(64, Math.round(h * 0.6))),
  };
  return rig;
}
