/* The Majlis: a coffee setting on the riverbank at night. A brass dallah and tea
   glasses on an engraved tray, a woven rug and cushions, a lantern and a brazier,
   the moon on the Nile, a felucca passing, lights on the far bank. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeCorinthia, makeTowers, type TowerSpot } from "./city";
import { makeEnvironment, makeSkyDome, makeWater, softPoints } from "./materials";
import { makeFelucca, makePalms, type PalmSpot } from "./props";
import { canvasTexture, contactShadowTexture, damp, glowTexture, makeRnd, sstep, type Grade, type PlaceRig, type WorldState } from "./util";

const MOON = new THREE.Vector3(-160, 190, -780).normalize();

/* a kilim: madder red field, borders of gold, indigo and cream, stepped diamonds */
function rugTexture() {
  return canvasTexture(512, 768, (g, w, h) => {
    g.fillStyle = "#6e1a18";
    g.fillRect(0, 0, w, h);
    const band = (inset: number, size: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(inset, inset, w - inset * 2, size);
      g.fillRect(inset, h - inset - size, w - inset * 2, size);
      g.fillRect(inset, inset, size, h - inset * 2);
      g.fillRect(w - inset - size, inset, size, h - inset * 2);
    };
    band(8, 14, "#e3b25e");
    band(26, 30, "#1b2450");
    band(60, 6, "#efe2c4");
    /* running teeth along the indigo border */
    g.fillStyle = "#e3b25e";
    for (let x = 34; x < w - 34; x += 18) {
      g.beginPath();
      g.moveTo(x, 30);
      g.lineTo(x + 9, 50);
      g.lineTo(x + 18, 30);
      g.fill();
      g.beginPath();
      g.moveTo(x, h - 30);
      g.lineTo(x + 9, h - 50);
      g.lineTo(x + 18, h - 30);
      g.fill();
    }
    const diamond = (cx: number, cy: number, r: number, cols: string[]) => {
      cols.forEach((c, k) => {
        const rr = r * (1 - k / cols.length);
        g.fillStyle = c;
        g.beginPath();
        g.moveTo(cx, cy - rr);
        g.lineTo(cx + rr * 0.7, cy);
        g.lineTo(cx, cy + rr);
        g.lineTo(cx - rr * 0.7, cy);
        g.closePath();
        g.fill();
      });
    };
    for (const cy of [210, 384, 558]) diamond(w / 2, cy, 92, ["#e3b25e", "#1b2450", "#c2512f", "#efe2c4", "#6e1a18"]);
    for (const [cx, cy] of [
      [120, 297],
      [392, 297],
      [120, 471],
      [392, 471],
      [120, 130],
      [392, 130],
      [120, 638],
      [392, 638],
    ])
      diamond(cx, cy, 34, ["#efe2c4", "#1b2450", "#e3b25e"]);
    /* wear: faint speckle so it reads as wool */
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,.07)" : "rgba(255,240,210,.05)";
      g.fillRect(Math.random() * w, Math.random() * h, 2, 1);
    }
  });
}

/* Sadu weaving for the cushions: bands of black, red, white and gold */
function saduTexture(seed: number) {
  return canvasTexture(256, 256, (g, w, h) => {
    const cols = ["#16110f", "#8c1d18", "#e9dcc0", "#c8963e", "#16110f", "#5a1410"];
    let y = 0;
    let k = seed;
    while (y < h) {
      const bh = 10 + ((k * 37) % 30);
      g.fillStyle = cols[k % cols.length];
      g.fillRect(0, y, w, bh);
      if (bh > 24) {
        g.fillStyle = cols[(k + 2) % cols.length];
        for (let x = 0; x < w; x += 16) {
          g.beginPath();
          g.moveTo(x, y + bh / 2);
          g.lineTo(x + 8, y + 4);
          g.lineTo(x + 16, y + bh / 2);
          g.lineTo(x + 8, y + bh - 4);
          g.fill();
        }
      }
      y += bh;
      k++;
    }
  });
}

/* engraved brass: concentric bands and an eight-pointed star */
function trayTexture() {
  return canvasTexture(512, 512, (g, w) => {
    g.fillStyle = "#b8893d";
    g.fillRect(0, 0, w, w);
    g.translate(w / 2, w / 2);
    g.strokeStyle = "rgba(60,36,10,.55)";
    for (const r of [240, 228, 180, 172, 90]) {
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.stroke();
    }
    for (let k = 0; k < 2; k++) {
      g.save();
      g.rotate((k * Math.PI) / 4);
      g.lineWidth = 3;
      g.strokeRect(-110, -110, 220, 220);
      g.restore();
    }
    for (let i = 0; i < 48; i++) {
      g.save();
      g.rotate((i / 48) * Math.PI * 2);
      g.beginPath();
      g.ellipse(0, -204, 7, 18, 0, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
  });
}

/* mother-of-pearl inlay on dark wood, for the low stand */
function inlayTexture() {
  return canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = "#2a170c";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#e8e0cc";
    for (let x = 16; x < w; x += 32)
      for (const y of [32, 96]) {
        g.save();
        g.translate(x, y);
        for (let k = 0; k < 2; k++) {
          g.rotate(Math.PI / 4);
          g.fillRect(-8, -8, 16, 16);
        }
        g.restore();
      }
    g.fillRect(0, 62, w, 4);
  });
}

/* the fanous: coloured panes behind a brass lattice */
function lanternTexture() {
  return canvasTexture(256, 128, (g, w, h) => {
    const panes = ["#ffb347", "#d8392b", "#ffd36b", "#2fa59a", "#ffb347", "#d8392b"];
    const pw = w / 6;
    panes.forEach((c, i) => {
      g.fillStyle = c;
      g.fillRect(i * pw, 0, pw, h);
    });
    g.strokeStyle = "#1a1006";
    g.lineWidth = 6;
    for (let i = 0; i <= 6; i++) {
      g.beginPath();
      g.moveTo(i * pw, 0);
      g.lineTo(i * pw, h);
      g.stroke();
    }
    g.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc(i * pw + pw / 2, h * 0.42, pw * 0.32, Math.PI, 0);
      g.lineTo(i * pw + pw * 0.82, h);
      g.moveTo(i * pw + pw * 0.18, h * 0.42);
      g.lineTo(i * pw + pw * 0.18, h);
      g.stroke();
    }
  });
}

export function buildMajlis(renderer: THREE.WebGLRenderer, state: WorldState) {
  const rnd = makeRnd(5);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c1838, 18, 150);
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 1400);
  const sky = makeSkyDome({ top: 0x01030c, hor: 0x0e1c40, glow: 0x4a6ad0, sun: 0xe8eeff, sunSize: 0.032, sunI: 2.6, glowI: 0.45, hazeI: 0.35, cloudI: 0.3, moon: 1 });
  sky.uniforms.sunDir.value.copy(MOON);
  scene.add(sky.mesh);
  const sp: number[] = [];
  const ss: number[] = [];
  for (let i = 0; i < 1800; i++) {
    const a = rnd() * Math.PI * 2;
    const e = Math.asin(0.04 + rnd() * 0.96);
    sp.push(Math.cos(a) * Math.cos(e) * 850, Math.sin(e) * 850, Math.sin(a) * Math.cos(e) * 850);
    ss.push(1 + Math.pow(rnd(), 4) * 3);
  }
  const stars = softPoints({ positions: sp, sizes: ss, size: 2.1, intensity: 0.95, twinkle: 0.55 });
  scene.add(stars.points);

  scene.environment = makeEnvironment(renderer, (s) => {
    s.background = new THREE.Color(0x070b1c);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa64a).multiplyScalar(3.2) }));
    lamp.position.set(14, 4, 8);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xdfe7ff).multiplyScalar(1.8) }));
    moon.position.copy(MOON).multiplyScalar(60);
    const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3a1408), side: THREE.DoubleSide }));
    floorGlow.position.y = -8;
    s.add(lamp, moon, floorGlow);
  });

  scene.add(new THREE.HemisphereLight(0x3a4a8a, 0x0a0806, 1.0));
  const moonLight = new THREE.DirectionalLight(0x9fb4ff, 0.9);
  moonLight.position.copy(MOON).multiplyScalar(50);
  scene.add(moonLight);
  const lampLight = new THREE.PointLight(0xffa04a, 16, 26, 1.5);
  lampLight.position.set(1.25, 0.6, 0.9);
  scene.add(lampLight);
  const fireLight = new THREE.PointLight(0xff6a24, 8, 16, 1.6);
  fireLight.position.set(-1.1, 0.7, -1.7);
  scene.add(fireLight);

  /* the bank */
  const sandG = new THREE.PlaneGeometry(200, 60, 200, 60).rotateX(-Math.PI / 2);
  {
    const p = sandG.attributes.position;
    const c = new Float32Array(p.count * 3);
    const a = new THREE.Color(0x8d5e36);
    const b = new THREE.Color(0xb07a48);
    const t = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      p.setY(i, Math.sin(x * 0.3) * 0.12 + Math.cos(z * 0.4) * 0.1 + Math.max(0, z - 10) * 0.05);
      /* wind ripples, and grain so it reads as sand rather than paint */
      const rip = 0.5 + 0.5 * Math.sin(x * 1.3 + z * 0.7) * Math.cos(z * 1.1 - x * 0.4);
      const grain = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      t.copy(a).lerp(b, rip * 0.8 + (grain - Math.floor(grain)) * 0.2).multiplyScalar(0.92 + 0.08 * Math.sin(z * 2.3 + x * 0.5));
      c.set([t.r, t.g, t.b], i * 3);
    }
    sandG.setAttribute("color", new THREE.BufferAttribute(c, 3));
    sandG.computeVertexNormals();
  }
  const sand = new THREE.Mesh(sandG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  sand.position.set(0, 0, 18);
  scene.add(sand);

  /* the Nile at night, with the moon's path on it */
  const water = makeWater({ width: 820, length: 64, deep: 0x02050e, tint: 0x1d2b55, fog: 0x0c1838, fogNear: 22, fogFar: 150, shore: false });
  water.water.position.set(0, -0.15, -44);
  water.uniforms.sunDir.value.copy(MOON);
  water.uniforms.sunCol.value.set(0xbcd0ff).multiplyScalar(0.9);
  water.uniforms.reflI.value = 1.1;
  scene.add(water.water);

  /* the far bank: a dark strip, palms, and the lights of a village */
  const far = new THREE.Mesh(new THREE.PlaneGeometry(500, 30).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 1 }));
  far.position.set(0, 0.25, -90);
  scene.add(far);
  const farPalms: PalmSpot[] = [];
  for (let i = 0; i < 40; i++) farPalms.push({ x: -120 + rnd() * 240, y: 0.2, z: -78 - rnd() * 10, s: 1.1 + rnd() * 0.8 });
  scene.add(makePalms(rnd, farPalms, true));
  const vl: number[] = [];
  const vs: number[] = [];
  for (let i = 0; i < 34; i++) {
    const cx = [-70, -18, 34, 82][i % 4];
    vl.push(cx + (rnd() - 0.5) * 18, 0.8 + rnd() * 1.6, -80 - rnd() * 6);
    vs.push(0.6 + rnd() * 0.8);
  }
  scene.add(softPoints({ positions: vl, sizes: vs, size: 1.3, color: 0xffb060, intensity: 3.2, attenuate: true, twinkle: 0.25 }).points);
  /* Khartoum across the water: towers lit for the night, and the sail */
  const cityU = { litFrac: { value: 0.55 }, winI: { value: 1.8 } };
  const ts: TowerSpot[] = [];
  for (let i = 0; i < 46; i++) {
    const x = -40 + rnd() * 150;
    const core = Math.max(0, 1 - Math.abs(x - 40) / 70);
    ts.push({ x, y: 0.2, z: -84 - rnd() * 16, w: 4 + rnd() * 5, h: 5 + rnd() * 8 + core * rnd() * 30, d: 4 + rnd() * 5 });
  }
  const skyline = makeTowers(ts, cityU, rnd);
  scene.add(skyline.mesh, skyline.aviation.points);
  const sail = makeCorinthia(cityU);
  sail.mesh.position.set(18, 0.2, -86);
  sail.mesh.rotation.y = -0.2;
  sail.crown.uniforms.intensity.value = 3.5;
  scene.add(sail.mesh);
  const fel = makeFelucca({ night: true });
  fel.boat.scale.setScalar(1.1);
  fel.lampMat.color.set(0xffc46a).multiplyScalar(6);
  fel.light.intensity = 0;
  scene.add(fel.boat);

  /* near palms */
  scene.add(
    makePalms(rnd, [
      { x: -5.2, y: 0, z: -7.5, s: 1.5 },
      { x: 6.4, y: 0, z: -8.4, s: 1.25 },
      { x: -9.5, y: 0, z: -10, s: 1.1 },
      { x: 11, y: 0, z: -12, s: 1.3 },
    ])
  );

  /* the setting */
  const shadowTex = contactShadowTexture();
  const shadow = (x: number, z: number, sx: number, sz: number, o = 0.85) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: o, depthWrite: false }));
    m.position.set(x, 0.175, z);
    scene.add(m);
  };
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 6.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 1 }));
  rug.position.y = 0.16;
  rug.rotation.y = 0.3;
  scene.add(rug);

  const brass = new THREE.MeshStandardMaterial({ color: 0xd4a24c, roughness: 0.3, metalness: 1, envMapIntensity: 1.0 });
  const trayM = new THREE.MeshStandardMaterial({ map: trayTexture(), roughness: 0.34, metalness: 1, envMapIntensity: 1.3 });
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.88, 0.04, 64), [brass, trayM, brass]);
  tray.position.y = 0.66;
  scene.add(tray);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.91, 0.022, 8, 80).rotateX(Math.PI / 2), brass);
  rim.position.y = 0.685;
  scene.add(rim);
  const inlay = inlayTexture();
  inlay.wrapS = THREE.RepeatWrapping;
  inlay.repeat.set(3, 1);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.5, 8, 1, true), new THREE.MeshStandardMaterial({ map: inlay, roughness: 0.6, side: THREE.DoubleSide }));
  stand.position.y = 0.4;
  scene.add(stand);
  shadow(0, 0, 3, 3);

  /* the dallah: wide base, narrow waist, a lidded crown and a long beak */
  const dallah = new THREE.Group();
  const prof = [
    [0, 0],
    [0.2, 0],
    [0.225, 0.025],
    [0.232, 0.08],
    [0.215, 0.15],
    [0.165, 0.21],
    [0.105, 0.255],
    [0.082, 0.3],
    [0.088, 0.335],
    [0.12, 0.365],
    [0.132, 0.39],
    [0.118, 0.405],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  dallah.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), brass));
  const lidProf = [
    [0, 0.52],
    [0.03, 0.51],
    [0.05, 0.47],
    [0.095, 0.43],
    [0.11, 0.405],
    [0.0, 0.405],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  dallah.add(new THREE.Mesh(new THREE.LatheGeometry(lidProf, 40), brass));
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), brass);
  fin.position.y = 0.55;
  const fin2 = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.08, 12), brass);
  fin2.position.y = 0.6;
  dallah.add(fin, fin2);
  const spout = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.17, 0.12, 0), new THREE.Vector3(0.26, 0.24, 0), new THREE.Vector3(0.3, 0.37, 0), new THREE.Vector3(0.4, 0.47, 0)]), 32, 0.026, 12),
    brass
  );
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 12), brass);
  beak.position.set(0.43, 0.49, 0);
  beak.rotation.z = -0.95;
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.1, 0.33, 0), new THREE.Vector3(-0.27, 0.36, 0), new THREE.Vector3(-0.31, 0.22, 0), new THREE.Vector3(-0.2, 0.07, 0)]), 32, 0.018, 10),
    brass
  );
  dallah.add(spout, beak, handle);
  dallah.scale.setScalar(1.25);
  dallah.position.set(-0.18, 0.68, 0.02);
  dallah.rotation.y = 0.5;
  scene.add(dallah);

  /* tea glasses on small saucers, amber with the lamp behind them */
  const glassM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.24, envMapIntensity: 0.45 });
  const teaM = new THREE.MeshStandardMaterial({ color: 0x7a2206, emissive: 0x8a3008, emissiveIntensity: 0.9, roughness: 0.1 });
  const gProf = [
    [0, 0],
    [0.045, 0],
    [0.05, 0.01],
    [0.036, 0.07],
    [0.048, 0.15],
    [0.052, 0.17],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const tProf = [
    [0, 0.008],
    [0.043, 0.008],
    [0.033, 0.07],
    [0.044, 0.13],
    [0, 0.13],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  for (const [gx, gz] of [
    [0.45, 0.32],
    [0.22, -0.48],
    [-0.52, 0.42],
    [0.55, -0.12],
  ]) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.LatheGeometry(tProf, 24), teaM));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(gProf, 24), glassM));
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.012, 24), brass);
    g.add(saucer);
    g.position.set(gx, 0.685, gz);
    scene.add(g);
  }

  /* floor cushions and bolsters in Sadu weave */
  [
    [-1.75, 0.55, 0.4],
    [1.65, -0.95, -0.5],
    [0.15, 1.95, 1.4],
  ].forEach(([cx, cz, ry], i) => {
    const tex = saduTexture(i * 3 + 1);
    const cu = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.26, 0.85, 4, 0.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    cu.position.set(cx, 0.3, cz);
    cu.rotation.y = ry;
    scene.add(cu);
    const bol = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.95, 6, 16).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ map: saduTexture(i * 3 + 2), roughness: 0.95 }));
    const back = new THREE.Vector3(0, 0, 0.42).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    const dirOut = Math.sign(cx * Math.sin(ry) + cz * Math.cos(ry)) || 1;
    bol.position.set(cx + back.x * dirOut, 0.58, cz + back.z * dirOut);
    bol.rotation.y = ry;
    scene.add(bol);
    shadow(cx, cz, 2.0, 1.6, 0.7);
  });

  /* the lantern */
  const glow = glowTexture();
  const lantern = new THREE.Group();
  const paneM = new THREE.MeshBasicMaterial({ map: lanternTexture(), color: new THREE.Color(1, 1, 1).multiplyScalar(2.2), side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.42, 6, 1, true), paneM);
  body.position.y = 0.32;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 6), brass);
  cap.position.y = 0.64;
  const knob = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 20), brass);
  knob.position.y = 0.8;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.08, 6), brass);
  base.position.y = 0.07;
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(0xffc46a).multiplyScalar(6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flame.scale.set(0.18, 0.3, 1);
  flame.position.y = 0.3;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(0xff9a40).multiplyScalar(0.9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.setScalar(3.4);
  halo.position.y = 0.32;
  lantern.add(body, cap, knob, base, flame, halo);
  lantern.position.set(1.25, 0.16, 0.9);
  scene.add(lantern);
  shadow(1.25, 0.9, 0.9, 0.9, 0.6);

  /* the brazier: a brass bowl of glowing coals, sparks rising */
  const brazier = new THREE.Group();
  const bowlProf = [
    [0, 0.02],
    [0.12, 0.02],
    [0.1, 0.12],
    [0.26, 0.2],
    [0.33, 0.34],
    [0.31, 0.35],
    [0.24, 0.26],
    [0, 0.26],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  brazier.add(new THREE.Mesh(new THREE.LatheGeometry(bowlProf, 40), brass));
  const coalM = new THREE.MeshStandardMaterial({ color: 0x1a0a04, emissive: new THREE.Color(0xff5a14), emissiveIntensity: 2.4, roughness: 1, flatShading: true });
  const coals = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.06, 0), coalM, 22);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2;
    const r = rnd() * 0.22;
    m4.compose(new THREE.Vector3(Math.cos(a) * r, 0.27 + rnd() * 0.04, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, 0)), new THREE.Vector3(1, 0.8, 1).multiplyScalar(0.7 + rnd() * 0.6));
    coals.setMatrixAt(i, m4);
  }
  brazier.add(coals);
  const fireHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(0xff6a20).multiplyScalar(1.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  fireHalo.scale.setScalar(2.2);
  fireHalo.position.y = 0.35;
  brazier.add(fireHalo);
  brazier.position.set(-1.1, 0.16, -1.7);
  scene.add(brazier);
  shadow(-1.1, -1.7, 1.2, 1.2, 0.6);

  const EMB = 70;
  const ep: number[] = [];
  const es: number[] = [];
  const life: number[] = [];
  for (let i = 0; i < EMB; i++) {
    ep.push(0, rnd() * 2.6, 0);
    es.push(0.5 + rnd() * 0.8);
    life.push(rnd());
  }
  const embers = softPoints({ positions: ep, sizes: es, size: 0.5, color: 0xffa040, intensity: 4, attenuate: true, twinkle: 0.8 });
  embers.points.position.set(-1.1, 0.5, -1.7);
  scene.add(embers.points);
  const eSeed = Array.from({ length: EMB }, () => [rnd() * 6.28, 0.3 + rnd() * 0.5, rnd() * 6.28]);

  /* fireflies along the bank */
  const FF = 26;
  const fp: number[] = [];
  const fSeed = Array.from({ length: FF }, () => [(rnd() - 0.5) * 22, 0.4 + rnd() * 2.2, -4 - rnd() * 9, rnd() * 6.28]);
  for (const [x, y, z] of fSeed) fp.push(x, y, z);
  const flies = softPoints({ positions: fp, size: 0.45, color: 0xd8ff8a, intensity: 3, attenuate: true, twinkle: 1 });
  scene.add(flies.points);

  const look = new THREE.Vector3();
  let ox = 0;
  let viewKey = "";
  let enterAt = -99;
  let enterPending = false;
  const grade: Grade = {
    exposure: 1.06,
    sat: 1.05,
    contrast: 1.08,
    lift: new THREE.Color().setRGB(0.0, 0.004, 0.014),
    gain: new THREE.Color().setRGB(1.05, 1.0, 0.94),
    vig: 0.42,
    grain: 0.04,
    ca: 0.012,
    bloom: 0.6,
    bloomRadius: 0.55,
    bloomThreshold: 1.1,
  };

  const update = (t: number, dt: number) => {
    if (enterPending) {
      enterAt = t;
      enterPending = false;
    }
    const intro = state.calm ? 0 : Math.pow(1 - sstep(0, 2.6, t - enterAt), 2);
    ox = damp(ox, (state.mx - 0.5) * 0.5, 2.4, dt);
    const a = 0.35 + Math.sin(t * 0.13) * 0.28 + ox - intro * 0.5;
    /* on a phone the camera steps back until the whole majlis fits the width */
    const fit = state.portrait ? Math.min(15, 6.4 / Math.max(0.3, cam.aspect)) : 7.2;
    const r = fit + intro * 5;
    cam.position.set(Math.sin(a) * r, (state.portrait ? 2.4 + (fit - 7.2) * 0.22 : 2.2) + intro * 2.2, Math.cos(a) * r);
    look.set(0, state.portrait ? 0.5 : 0.7, 0);
    cam.lookAt(look);
    /* the form covers part of the screen: centre the setting in what is left,
       beside it on wide screens and above it on phones */
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const shift = vw >= 900 ? (document.documentElement.dir === "rtl" ? -1 : 1) * 214 : 0;
    const lift = vw < 900 ? Math.round(vh * 0.24) : 0;
    const key = shift || lift ? vw + "x" + vh + ":" + shift + ":" + lift : "";
    if (key !== viewKey) {
      viewKey = key;
      if (shift || lift) cam.setViewOffset(vw, vh, shift, lift, vw, vh);
      else cam.clearViewOffset();
    }
    const flick = Math.sin(t * 9) * 0.6 + Math.sin(t * 23.7) * 0.4 + Math.sin(t * 3.1) * 0.5;
    lampLight.intensity = 16 + flick * 1.6;
    flame.scale.set(0.18 + flick * 0.01, 0.3 + flick * 0.03, 1);
    halo.material.opacity = 0.85 + flick * 0.06;
    const fk = Math.sin(t * 7.3) * 0.5 + Math.sin(t * 17.1) * 0.5;
    fireLight.intensity = 8 + fk * 2.2;
    coalM.emissiveIntensity = 2.2 + fk * 0.5;

    const pos = embers.geometry.attributes.position;
    for (let i = 0; i < EMB; i++) {
      let l = life[i] + dt * eSeed[i][1] * 0.45;
      if (l > 1) l -= 1;
      life[i] = l;
      const s = eSeed[i];
      pos.setXYZ(i, Math.sin(s[0] + t * 1.3 + l * 6) * 0.25 * l, l * 2.8, Math.cos(s[2] + t * 1.1 + l * 5) * 0.25 * l);
    }
    pos.needsUpdate = true;
    embers.uniforms.opacity.value = 0.9;
    const fpos = flies.geometry.attributes.position;
    for (let i = 0; i < FF; i++) {
      const [x, y, z, ph] = fSeed[i];
      fpos.setXYZ(i, x + Math.sin(t * 0.3 + ph) * 1.2, y + Math.sin(t * 0.7 + ph * 2) * 0.35, z + Math.cos(t * 0.25 + ph) * 1.2);
    }
    fpos.needsUpdate = true;

    sail.update(t);
    const bx = ((t * 1.6) % 220) - 110;
    fel.boat.position.set(bx, Math.sin(t * 1.2) * 0.05 - 0.1, -58);
    fel.boat.rotation.y = -Math.PI / 2;
    fel.boat.rotation.z = Math.sin(t * 0.8) * 0.03;
  };

  const rig: PlaceRig = {
    scene,
    camera: cam,
    update,
    click: () => {},
    hover: () => false,
    drag: () => {},
    dragEnd: () => {},
    enter: () => {
      enterPending = true;
    },
    grade: () => grade,
    setReflectionScale: (w, h) => water.water.getRenderTarget().setSize(w, h),
  };
  return rig;
}
