/* The Nile: the main journey, told as the tagline reads, from the banks to the
   world. It opens on green banks (acacias, flame trees, reeds, palms, Nubian
   villages, a few Meroitic pyramids on the ridge), passes al-Mogran where the
   Blue and White Nile meet, and ends in modern Khartoum: towers, a sail-shaped
   hotel, a lit bridge to sail under. Tap trees, towers, pyramids and water. */
import * as THREE from "three";
import type { Sound } from "./audio";
import { emissive, makeSkyDome, makeWater, shaftMaterial, softPoints, stoneMaterial, streakMaterial, veilMaterial } from "./materials";
import { makeCorinthia, makeMahdiTomb, makeNilin, makeTowers, makeTraffic, makeTutiBridge, type CityLights, type TowerSpot } from "./city";
import { makeGrove, makePetals, makeReeds, type Spot } from "./nature";
import { makeFelucca, makePalms, type PalmSpot } from "./props";
import { bump, damp, makeRnd, shared, sstep, type Grade, type PlaceRig, type WorldState } from "./util";

export const GATE_STOPS = [0.33, 0.66, 1];
const END = -262;
const GATE_Z = [-100, -187, -276];
const STOPS = [0, ...GATE_STOPS];
const LEGS = [0.185, 0.495, 0.83];

/* scroll is remapped so the camera eases out of one stop and into the next */
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

export const pathX = (z: number) => Math.sin(z * 0.024) * 2;
/* must match bankH in materials.ts (the water's shoreline reads it) */
const bankH = (x: number, z: number) => {
  const b = sstep(8, 24, Math.abs(x - pathX(z)));
  return b * (2.2 + Math.sin(x * 0.08 + z * 0.05) * 1.6 + Math.sin(z * 0.11 - x * 0.04) * 1.2) - 0.6 * (1 - b) + sstep(12, 18, Math.abs(x - pathX(z))) * 1.2;
};
/* 0 on the green banks, 1 in the city */
const cityK = (z: number) => sstep(-160, -200, z);
const CITY_Y = 1.6;
const hgt = (x: number, z: number) => {
  const dx = Math.abs(x - pathX(z));
  const far = sstep(28, 70, dx);
  const ridge = Math.pow(1 - Math.abs(Math.sin(x * 0.045 - z * 0.028)), 3) * 4.5 + Math.sin(x * 0.021 + z * 0.013) * 2.5 + 1.5;
  const h = bankH(x, z) + far * ridge;
  /* the city sits on level ground behind its corniche */
  const flat = cityK(z) * sstep(14, 18, dx);
  return h + (CITY_Y - h) * flat;
};
const vn = (x: number, z: number) => Math.sin(x * 0.37 + z * 0.11) * Math.sin(z * 0.23 - x * 0.17) * 0.5 + 0.5;

/* the two looks the slider moves between */
const C = (h: number) => new THREE.Color(h);
/* golden hour as contrast, not one orange wash: the sun is warm, the sky
   that fills the shadows is cool, the haze is a soft dusty rose, and the
   river carries the blue of the sky with the sun's gold on top */
const DUSK = {
  top: C(0x1d2862),
  hor: C(0xf08a3e),
  glow: C(0xff9440),
  sun: C(0xffe2b0),
  dir: C(0xffa65a),
  hs: C(0x8f98cc),
  hg: C(0x2c1f1c),
  deep: C(0x121a36),
  tint: C(0x4d5e88),
  spec: C(0xffbe74),
  fog: C(0xbf8c84),
};
const NIGHT = {
  top: C(0x01030c),
  hor: C(0x0d1a3c),
  glow: C(0x4a6ad0),
  sun: C(0xe4ecff),
  dir: C(0x8fa6ff),
  hs: C(0x2a3a7a),
  hg: C(0x05060c),
  deep: C(0x02050e),
  tint: C(0x1d2b55),
  spec: C(0xbcd0ff),
  fog: C(0x0d1a3c),
};

export function buildRiver(sound: Sound, state: WorldState) {
  const rnd = makeRnd(7);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 1400);
  scene.fog = new THREE.Fog(DUSK.fog, 48, 340);

  const sky = makeSkyDome({ top: DUSK.top, hor: DUSK.hor, glow: DUSK.glow, sun: DUSK.sun, sunSize: 0.036, sunI: 6, glowI: 1.0, hazeI: 0.55, cloudI: 0.75 });
  scene.add(sky.mesh);

  /* stars: varied in size and colour, twinkling */
  const sp: number[] = [];
  const ss: number[] = [];
  const sc: number[] = [];
  for (let i = 0; i < 2200; i++) {
    const a = rnd() * Math.PI * 2;
    const e = Math.asin(0.05 + rnd() * 0.95);
    sp.push(Math.cos(a) * Math.cos(e) * 850, Math.sin(e) * 850, Math.sin(a) * Math.cos(e) * 850);
    const big = rnd();
    ss.push(1.2 + big * big * big * 3.4);
    const warm = rnd();
    sc.push(0.8 + warm * 0.2, 0.86 + warm * 0.06, 1 - warm * 0.25);
  }
  const stars = softPoints({ positions: sp, sizes: ss, colors: sc, size: 2.2, intensity: 0.95, twinkle: 0.55 });
  scene.add(stars.points);

  const hemi = new THREE.HemisphereLight(DUSK.hs, DUSK.hg, 1.6);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(DUSK.dir, 3.6);
  scene.add(dir, dir.target);

  /* ground: wet mud at the water, a green cultivated strip, then the desert */
  const gg = new THREE.PlaneGeometry(380, 820, 150, 300);
  gg.rotateX(-Math.PI / 2);
  const gp = gg.attributes.position;
  const cols = new Float32Array(gp.count * 3);
  const mud = C(0x3e2a1a);
  const green = C(0x3f4c1c);
  const green2 = C(0x5d6a26);
  const sand = C(0xb57e46);
  const sandHi = C(0xd8a466);
  const paved = C(0x4a443d);
  const paved2 = C(0x655c50);
  const col = new THREE.Color();
  const pv2 = new THREE.Color();
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const z = gp.getZ(i) - 330;
    gp.setZ(i, z);
    const y = hgt(x, z);
    gp.setY(i, y);
    const dx = Math.abs(x - pathX(z));
    const n = vn(x, z);
    const n2 = vn(x * 3.1 + 7, z * 2.7);
    col.copy(sand).lerp(sandHi, sstep(0.5, 6, y) * 0.6 + n2 * 0.25);
    const g = sstep(9.5, 12, dx) * (1 - sstep(17 + n * 7, 23 + n * 7, dx));
    col.lerp(n2 > 0.5 ? green2 : green, g * 0.92);
    pv2.copy(paved).lerp(paved2, n2);
    col.lerp(pv2, cityK(z) * sstep(16.5, 19, dx));
    col.lerp(mud, 1 - sstep(8.5, 11, dx));
    cols[i * 3] = col.r;
    cols[i * 3 + 1] = col.g;
    cols[i * 3 + 2] = col.b;
  }
  gg.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  gg.computeVertexNormals();
  scene.add(new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));

  /* shrubs along the green strip */
  {
    const sg = new THREE.IcosahedronGeometry(1, 1);
    const p = sg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.85 + rnd() * 0.3), p.getY(i) * (0.85 + rnd() * 0.3), p.getZ(i) * (0.85 + rnd() * 0.3));
    sg.computeVertexNormals();
    const n = 320;
    const im = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const z = 40 - rnd() * 640;
      const side = rnd() < 0.5 ? -1 : 1;
      const x = pathX(z) + side * (10 + rnd() * 10);
      const k = 0.35 + rnd() * 0.8;
      m.compose(v.set(x, hgt(x, z) - 0.15, z), q.setFromAxisAngle(v.clone().set(0, 1, 0), rnd() * 6), s.set(k * 1.2, k * 0.75, k * 1.2));
      im.setMatrixAt(i, m);
      im.setColorAt(i, col.set(0x34421a).lerp(C(0x5d6b28), rnd()));
    }
    scene.add(im);
  }

  /* water with real reflections */
  const water = makeWater({ width: 60, length: 820, deep: DUSK.deep, tint: DUSK.tint, fog: DUSK.fog, fogNear: 48, fogFar: 340, shore: true });
  water.water.position.set(0, 0, -330);
  scene.add(water.water);

  /* ------------------------------------------------------------ pyramids */
  /* steep Meroitic pyramids in clusters, each crowned with gold */
  interface Pyr {
    x: number;
    y: number;
    z: number;
    h: number;
    g: number;
    tg: number;
    pop: number;
    beam: THREE.Mesh | null;
    deg: number;
  }
  const pyrs: Pyr[] = [];
  const addPyr = (x: number, z: number, h: number) => pyrs.push({ x, y: hgt(x, z) - 0.3, z, h, g: 0, tg: 0, pop: 0, beam: null, deg: Math.max(0, Math.min(9, Math.floor(13 - h))) });
  for (const [cz, side, count] of [
    [-48, -1, 7],
    [-128, 1, 5],
  ]) {
    const cx = pathX(cz) + side * 46;
    for (let k = 0; k < count; k++) {
      const x = cx + (rnd() - 0.5) * 16;
      const z = cz + (rnd() - 0.5) * 18;
      addPyr(x, z, 5 + rnd() * 8);
    }
  }
  for (const [z, side] of [
    [-8, 1],
    [-82, -1],
    [-150, -1],
  ])
    addPyr(pathX(z) + side * (34 + rnd() * 20), z, 6 + rnd() * 6);
  const nP = pyrs.length;
  const bodyG = new THREE.CylinderGeometry(0.14, 1, 0.86, 4, 1).toNonIndexed();
  bodyG.translate(0, 0.43, 0);
  bodyG.rotateY(Math.PI / 4);
  bodyG.computeVertexNormals();
  const capG = new THREE.ConeGeometry(0.14, 0.15, 4, 1).toNonIndexed();
  capG.translate(0, 0.86 + 0.075, 0);
  capG.rotateY(Math.PI / 4);
  capG.computeVertexNormals();
  const glowArr = new Float32Array(nP);
  const capGlowArr = new Float32Array(nP);
  const glowAttr = new THREE.InstancedBufferAttribute(glowArr, 1);
  const capGlowAttr = new THREE.InstancedBufferAttribute(capGlowArr, 1);
  glowAttr.setUsage(THREE.DynamicDrawUsage);
  capGlowAttr.setUsage(THREE.DynamicDrawUsage);
  bodyG.setAttribute("aGlow", glowAttr);
  capG.setAttribute("aGlow", capGlowAttr);
  const bodyM = stoneMaterial(0xba8752, { course: 2.4, glow: 0xffa040 });
  bodyM.flatShading = true;
  const capM = stoneMaterial(0xe6b45a, { masonry: false, glow: 0xffc060, roughness: 0.32, metalness: 0.55 });
  capM.flatShading = true;
  const bodies = new THREE.InstancedMesh(bodyG, bodyM, nP);
  const caps = new THREE.InstancedMesh(capG, capM, nP);
  const pm = new THREE.Matrix4();
  const pq = new THREE.Quaternion();
  const pv = new THREE.Vector3();
  const ps = new THREE.Vector3();
  const setPyr = (i: number) => {
    const p = pyrs[i];
    const w = p.h * 0.42;
    pq.setFromAxisAngle(pv.set(0, 1, 0), Math.atan2(p.x - pathX(p.z), 0) * 0.15 + (i % 3) * 0.05);
    pm.compose(pv.set(p.x, p.y, p.z), pq, ps.set(w, p.h * (1 + p.pop * 0.22), w));
    bodies.setMatrixAt(i, pm);
    caps.setMatrixAt(i, pm);
  };
  for (let i = 0; i < nP; i++) setPyr(i);
  bodies.computeBoundingSphere();
  caps.computeBoundingSphere();
  scene.add(bodies, caps);
  /* small chapels at the foot of the big ones, facing the river */
  {
    const big = pyrs.filter((p) => p.h > 8.5);
    const cg = new THREE.BoxGeometry(1, 1, 1);
    cg.translate(0, 0.5, 0);
    cg.setAttribute("aGlow", new THREE.InstancedBufferAttribute(new Float32Array(big.length), 1));
    const ch = new THREE.InstancedMesh(cg, stoneMaterial(0xa8774a, { course: 3 }), big.length);
    big.forEach((p, i) => {
      const toward = Math.sign(pathX(p.z) - p.x);
      const off = p.h * 0.32 + 1;
      pm.compose(pv.set(p.x + toward * off, p.y, p.z), pq.identity(), ps.set(1.8, p.h * 0.2, p.h * 0.22));
      ch.setMatrixAt(i, pm);
    });
    scene.add(ch);
  }
  const beamG = new THREE.CylinderGeometry(0.22, 1.1, 160, 20, 1, true);

  /* --------------------------------------------------------------- gates */
  /* stone pylons standing in the river, a lintel of gold light, a veil between */
  const gateStone = stoneMaterial(0xc4915c, { course: 2.6 });
  const goldLine = emissive(0xffd27a, 3.2);
  const goldMark = emissive(0xffd27a, 4.5);
  const veils: ReturnType<typeof veilMaterial>[] = [];
  const emblem = (kind: number) => {
    const s = new THREE.Shape();
    if (kind === 0) {
      s.moveTo(-0.55, -0.42);
      s.lineTo(0.55, -0.42);
      s.lineTo(0.55, 0.42);
      s.lineTo(-0.55, 0.42);
      s.closePath();
      const h = new THREE.Path();
      h.moveTo(-0.4, -0.28);
      h.lineTo(-0.4, 0.28);
      h.lineTo(0.4, 0.28);
      h.lineTo(0.4, -0.28);
      h.closePath();
      s.holes.push(h);
    } else if (kind === 1) {
      for (let k = 0; k < 16; k++) {
        const r = k % 2 ? 0.24 : 0.58;
        const a = (k / 16) * Math.PI * 2 + Math.PI / 2;
        if (k === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      s.closePath();
    } else {
      s.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
      const h = new THREE.Path();
      h.absarc(0.2, 0.1, 0.42, 0, Math.PI * 2, true);
      s.holes.push(h);
    }
    return new THREE.ShapeGeometry(s, 24);
  };
  const towerG = new THREE.BoxGeometry(2.4, 8.4, 1.7, 1, 6, 1);
  {
    const p = towerG.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 1 - 0.22 * ((p.getY(i) + 4.2) / 8.4);
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k);
    }
    towerG.translate(0, 4.2 - 0.6, 0);
    towerG.computeVertexNormals();
  }
  GATE_Z.forEach((z, gi) => {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) {
      const t = new THREE.Mesh(towerG, gateStone);
      t.position.x = sx * 4.95;
      g.add(t);
      const cor = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.4, 1.6), gateStone);
      cor.position.set(sx * 4.95, 7.95, 0);
      g.add(cor);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 7.0, 0.06), goldLine);
      edge.position.set(sx * 3.86, 3.1, 0.72);
      g.add(edge);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.0, 1.25), gateStone);
    lintel.position.y = 7.05;
    g.add(lintel);
    const under = new THREE.Mesh(new THREE.BoxGeometry(7.7, 0.06, 0.06), goldLine);
    under.position.set(0, 6.52, 0.6);
    g.add(under);
    const mark = new THREE.Mesh(emblem(gi), goldMark);
    mark.position.set(0, 7.05, 0.64);
    g.add(mark);
    const veil = veilMaterial(0xffcf7a);
    veils.push(veil);
    const vm = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 6.6), veil.mat);
    vm.position.y = 3.2;
    g.add(vm);
    g.position.set(pathX(z), 0, z);
    scene.add(g);
  });

  /* --------------------------------------------------------------- palms */
  const spots: PalmSpot[] = [];
  for (let i = 0; i < 62; i++) {
    const z = 22 - rnd() * 580;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = pathX(z) + side * (10.4 + rnd() * 8);
    if (GATE_Z.some((gz) => Math.abs(gz - z) < 6)) continue;
    spots.push({ x, y: hgt(x, z) - 0.1, z, s: 0.8 + rnd() * 0.6 });
  }

  /* ------------------------------------------------------------ villages */
  const houseSpots: { x: number; y: number; z: number; w: number; h: number; d: number; r: number }[] = [];
  const lights: number[] = [];
  const lightSize: number[] = [];
  for (let v = 0; v < 8; v++) {
    const cz = 12 - rnd() * 165;
    const side = rnd() < 0.5 ? -1 : 1;
    const cx = pathX(cz) + side * (19 + rnd() * 6);
    const count = 5 + Math.floor(rnd() * 6);
    for (let k = 0; k < count; k++) {
      const x = cx + (rnd() - 0.5) * 12;
      const z = cz + (rnd() - 0.5) * 12;
      if (Math.abs(x - pathX(z)) < 15) continue;
      const w = 1.4 + rnd() * 1.4;
      const h = 1.1 + rnd() * 1.1;
      const d = 1.4 + rnd() * 1.4;
      const y = hgt(x, z) - 0.1;
      houseSpots.push({ x, y, z, w, h, d, r: (rnd() - 0.5) * 0.4 });
      if (rnd() < 0.8) {
        const toward = Math.sign(pathX(z) - x);
        lights.push(x + toward * (w / 2 + 0.05), y + h * 0.45, z + (rnd() - 0.5) * d * 0.5);
        lightSize.push(0.8 + rnd() * 0.5);
      }
      if (rnd() < 0.5) spots.push({ x: x + (rnd() - 0.5) * 5, y: hgt(x, z) - 0.1, z: z + (rnd() - 0.5) * 5, s: 0.7 + rnd() * 0.5 });
    }
  }
  scene.add(makePalms(rnd, spots));
  {
    const hg = new THREE.BoxGeometry(1, 1, 1);
    hg.translate(0, 0.5, 0);
    const im = new THREE.InstancedMesh(hg, new THREE.MeshStandardMaterial({ roughness: 1 }), houseSpots.length);
    const paints = [0xe8dcc4, 0xdcc49a, 0xc9a26a, 0x8fb3c4, 0xd98e5a, 0xeee6d2];
    houseSpots.forEach((hs, i) => {
      pm.compose(pv.set(hs.x, hs.y, hs.z), pq.setFromAxisAngle(ps.set(0, 1, 0), hs.r), ps.set(hs.w, hs.h, hs.d));
      im.setMatrixAt(i, pm);
      im.setColorAt(i, col.set(paints[Math.floor(rnd() * paints.length)]));
    });
    scene.add(im);
  }
  const windows = softPoints({ positions: lights, sizes: lightSize, size: 1.2, color: 0xffb05a, intensity: 0, attenuate: true, twinkle: 0.12 });
  scene.add(windows.points);

  /* --------------------------------------------------------------- trees */
  const nearGate = (z: number, r: number) => GATE_Z.some((gz) => Math.abs(gz - z) < r);
  const acaciaSpots: Spot[] = [];
  const flameSpots: Spot[] = [];
  const neemSpots: Spot[] = [];
  const reedSpots: Spot[] = [];
  for (let i = 0; i < 80; i++) {
    const z = 34 - rnd() * 210;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = pathX(z) + side * (19 + rnd() * 40);
    if (cityK(z) > 0.05) continue;
    acaciaSpots.push({ x, y: hgt(x, z) - 0.15, z, s: 0.9 + rnd() * 0.6 });
  }
  for (let i = 0; i < 52; i++) {
    const z = 28 - rnd() * 470;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = pathX(z) + side * (12.4 + rnd() * 5.5);
    if (nearGate(z, 7)) continue;
    flameSpots.push({ x, y: hgt(x, z) - 0.15, z, s: 0.8 + rnd() * 0.5 });
  }
  for (let i = 0; i < 56; i++) {
    const z = 28 - rnd() * 470;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = pathX(z) + side * (13 + rnd() * 9);
    if (nearGate(z, 7)) continue;
    neemSpots.push({ x, y: hgt(x, z) - 0.15, z, s: 0.75 + rnd() * 0.5 });
  }
  for (let i = 0; i < 560; i++) {
    const z = 34 - rnd() * 230;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = pathX(z) + side * (9.7 + rnd() * 1.8);
    if (nearGate(z, 5)) continue;
    reedSpots.push({ x, y: Math.max(-0.35, hgt(x, z)) - 0.05, z, s: 0.7 + rnd() * 0.6 });
  }
  const trees: THREE.InstancedMesh[] = [];
  for (const [kind, list] of [
    ["acacia", acaciaSpots],
    ["flame", flameSpots],
    ["neem", neemSpots],
  ] as const) {
    const grove = makeGrove(rnd, kind, list);
    scene.add(grove.group);
    trees.push(...grove.meshes);
  }
  scene.add(makeReeds(rnd, reedSpots));
  const petals = makePetals();
  scene.add(petals.points);

  /* ---------------------------------------------------------------- city */
  const cityU: CityLights = { litFrac: { value: 0.2 }, winI: { value: 1.4 } };
  const BRIDGE_Z = -238;
  const SAIL_Z = -318;
  const MOSQUE_Z = -214;
  const MAHDI_Z = -368;
  const towerSpots: TowerSpot[] = [];
  const addTower = (x: number, z: number, w: number, h: number, d: number) => towerSpots.push({ x, y: CITY_Y - 0.3, z, w, h, d });
  for (let i = 0; i < 120; i++) {
    const z = -190 - rnd() * 280;
    const side = rnd() < 0.5 ? -1 : 1;
    const dx = (z > -300 ? 30 : 24) + rnd() * rnd() * 120;
    const x = pathX(z) + side * dx;
    if (Math.abs(z - BRIDGE_Z) < 7 && dx < 52) continue;
    if (Math.abs(z - SAIL_Z) < 16 && side > 0 && dx < 48) continue;
    if (Math.abs(z - MOSQUE_Z) < 16 && side < 0 && dx < 50) continue;
    if (Math.abs(z - MAHDI_Z) < 12 && side < 0 && dx < 46) continue;
    const core = Math.max(0, 1 - Math.abs(z + 330) / 150) * Math.max(0, 1 - dx / 150);
    addTower(x, z, 4 + rnd() * 5, 5 + rnd() * 9 + core * rnd() * 38, 4 + rnd() * 5);
  }
  /* a few tall ones on the waterfront to frame the last gate */
  for (const [z, side, h] of [
    [-305, -1, 34],
    [-330, -1, 44],
    [-348, 1, 32],
    [-362, -1, 28],
  ])
    addTower(pathX(z) + side * (36 + rnd() * 6), z, 6 + rnd() * 3, h, 6 + rnd() * 3);
  const towers = makeTowers(towerSpots, cityU, rnd);
  scene.add(towers.mesh, towers.aviation.points);
  const sail = makeCorinthia(cityU);
  sail.mesh.position.set(pathX(SAIL_Z) + 27, CITY_Y - 0.3, SAIL_Z);
  sail.mesh.rotation.y = 1.25;
  scene.add(sail.mesh);
  const mosque = makeNilin();
  mosque.group.position.set(pathX(MOSQUE_Z) - 34, CITY_Y - 0.2, MOSQUE_Z);
  mosque.group.rotation.y = Math.PI;
  scene.add(mosque.group);
  const mahdi = makeMahdiTomb();
  mahdi.group.position.set(pathX(MAHDI_Z) - 34, CITY_Y - 0.2, MAHDI_Z);
  mahdi.group.rotation.y = 0.2;
  scene.add(mahdi.group);
  const bridge = makeTutiBridge(pathX(BRIDGE_Z), BRIDGE_Z, 50, 10.5);
  scene.add(bridge.group);
  const lampPos: number[] = [];
  for (let z = -182; z > -470; z -= 5.5) for (const side of [-1, 1]) lampPos.push(pathX(z) + side * 15.2, CITY_Y + 2.6, z);
  const lamps = softPoints({ positions: lampPos, size: 0.8, color: 0xffc27a, intensity: 1.5, attenuate: true });
  scene.add(lamps.points);
  const bx0 = pathX(BRIDGE_Z);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const traffic = makeTraffic([
    { a: V(bx0 - 50, 11.35, BRIDGE_Z - 1.3), b: V(bx0 + 50, 11.35, BRIDGE_Z - 1.3), count: 7, red: false, speed: 9 },
    { a: V(bx0 + 50, 11.35, BRIDGE_Z + 1.3), b: V(bx0 - 50, 11.35, BRIDGE_Z + 1.3), count: 7, red: true, speed: 8 },
    { a: V(-17, CITY_Y + 0.35, -182), b: V(-17, CITY_Y + 0.35, -470), count: 16, red: true, speed: 11 },
    { a: V(-18.5, CITY_Y + 0.35, -470), b: V(-18.5, CITY_Y + 0.35, -182), count: 16, red: false, speed: 10 },
    { a: V(18.5, CITY_Y + 0.35, -182), b: V(18.5, CITY_Y + 0.35, -470), count: 14, red: false, speed: 10 },
    { a: V(17, CITY_Y + 0.35, -470), b: V(17, CITY_Y + 0.35, -182), count: 14, red: true, speed: 9 },
  ]);
  scene.add(traffic.points);

  /* --------------------------------------------------------------- boat */
  const fel = makeFelucca();
  scene.add(fel.boat);
  const wakeM = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: shared.uTime, col: { value: C(0xffd9a0) }, k: { value: 0.35 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: /* glsl */ `
      uniform float uTime, k; uniform vec3 col; varying vec2 vUv;
      void main(){
        float y = vUv.y;
        float x = abs(vUv.x - 0.5) * 2.0;
        float arm = 1.0 - smoothstep(0.0, 0.12 + y * 0.12, abs(x - (0.15 + (1.0 - y) * 0.85)));
        float rip = 0.6 + 0.4 * sin((1.0 - y) * 40.0 - uTime * 6.0);
        float a = arm * rip * pow(y, 1.5) * k;
        gl_FragColor = vec4(col * a, 1.0);
      }`,
  });
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(5, 10).rotateX(-Math.PI / 2), wakeM);
  wake.position.set(0, 0.03, 6.6);
  fel.boat.add(wake);

  /* --------------------------------------------------------------- birds */
  const birds = new THREE.Group();
  const wingG = new THREE.BufferGeometry();
  wingG.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.16, 1.05, 0.1, -0.1, 0, 0, -0.2, 0.5, 0.05, 0.05], 3));
  wingG.setIndex([0, 3, 2, 3, 1, 2]);
  const birdM = new THREE.MeshBasicMaterial({ color: 0x1a1016, side: THREE.DoubleSide });
  const wings: { m: THREE.Mesh; d: number; ph: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const bd = new THREE.Group();
    const row = Math.ceil(i / 2);
    const sd = i % 2 ? 1 : -1;
    bd.position.set(sd * row * 2.1, (rnd() - 0.5) * 1.2, row * 1.9);
    for (const d of [1, -1]) {
      const wg = new THREE.Mesh(wingG, birdM);
      wg.scale.x = d;
      bd.add(wg);
      wings.push({ m: wg, d, ph: rnd() * 6 });
    }
    birds.add(bd);
  }
  scene.add(birds);

  /* ------------------------------------------------------ small effects */
  const ripples: { m: THREE.Mesh; t: number }[] = [];
  const ringG = new THREE.RingGeometry(0.9, 1, 64).rotateX(-Math.PI / 2);
  const streak = streakMaterial();
  const shoot = new THREE.Mesh(new THREE.PlaneGeometry(60, 0.7), streak.mat);
  shoot.rotation.z = -0.5;
  scene.add(shoot);
  let shT = -99;
  const shP = new THREE.Vector3();

  const dp: number[] = [];
  const ds: number[] = [];
  for (let i = 0; i < 1100; i++) {
    dp.push((rnd() - 0.5) * 70, rnd() * 14 + 0.3, -14 - rnd() * 120);
    ds.push(0.5 + rnd() * rnd() * 2);
  }
  const dust = softPoints({ positions: dp, sizes: ds, size: 0.5, color: 0xffcf7a, intensity: 1.3, attenuate: true, twinkle: 0.6, fadeNear: 60, fadeFar: 130 });
  scene.add(dust.points);

  /* ------------------------------------------------------------- the look */
  const tmp = new THREE.Color();
  let appliedTod = -1;
  const sunPos = new THREE.Vector3();
  const applyTime = (d: number) => {
    appliedTod = d;
    const u = sky.uniforms;
    u.top.value.copy(DUSK.top).lerp(NIGHT.top, d);
    u.hor.value.copy(DUSK.hor).lerp(NIGHT.hor, d);
    u.glowCol.value.copy(DUSK.glow).lerp(NIGHT.glow, d);
    u.sunCol.value.copy(DUSK.sun).lerp(NIGHT.sun, d);
    u.sunI.value = 6 - d * 3.6;
    u.sunSize.value = 0.036 - d * 0.008;
    u.glowI.value = 1.0 - d * 0.78;
    u.hazeI.value = 0.55 - d * 0.35;
    u.cloudI.value = 0.75 - d * 0.42;
    u.moon.value = sstep(0.35, 0.75, d);
    (scene.fog as THREE.Fog).color.copy(DUSK.fog).lerp(NIGHT.fog, d);
    const w = water.uniforms;
    w.fogc.value.copy((scene.fog as THREE.Fog).color);
    w.deep.value.copy(DUSK.deep).lerp(NIGHT.deep, d);
    w.tint.value.copy(DUSK.tint).lerp(NIGHT.tint, d);
    w.sunCol.value.copy(DUSK.spec).lerp(NIGHT.spec, d).multiplyScalar(1 - d * 0.45);
    dir.color.copy(DUSK.dir).lerp(NIGHT.dir, d);
    dir.intensity = 4.3 - d * 3.4;
    hemi.color.copy(DUSK.hs).lerp(NIGHT.hs, d);
    hemi.groundColor.copy(DUSK.hg).lerp(NIGHT.hg, d);
    hemi.intensity = 1.6 - d * 0.7;
    stars.uniforms.opacity.value = sstep(0.2, 0.9, d);
    dust.uniforms.opacity.value = 1 - 0.75 * sstep(0.2, 0.8, d);
    windows.uniforms.intensity.value = 0.6 + sstep(0.1, 0.8, d) * 4;
    fel.sailMat.emissiveIntensity = 0.32 - d * 0.27;
    fel.lampMat.color.set(0xffc46a).multiplyScalar(1.5 + d * 4);
    fel.light.intensity = d * 6;
    wakeM.uniforms.col.value.copy(DUSK.spec).lerp(NIGHT.spec, d);
    birdM.color.set(0x1a1016).lerp(tmp.set(0x05070f), d);
    w.dim.value = d;
    cityU.litFrac.value = 0.2 + 0.42 * sstep(0, 1, d);
    cityU.winI.value = 1.1 + 0.6 * d;
    lamps.uniforms.intensity.value = 1.2 + 2.6 * d;
    bridge.lamps.uniforms.intensity.value = 1.6 + 2.2 * d;
    traffic.uniforms.intensity.value = 1.4 + 1.8 * d;
    mosque.lights.uniforms.intensity.value = 1 + 2.4 * d;
    sail.crown.uniforms.intensity.value = 1.6 + 2.4 * d;
    mahdi.lights.uniforms.intensity.value = 0.6 + 2.2 * d;
    towers.aviation.uniforms.intensity.value = 2 + 2 * d;
    sound.setTod(d);
  };
  const grade: Grade = {
    exposure: 1,
    sat: 1.06,
    contrast: 1.06,
    lift: new THREE.Color(),
    gain: new THREE.Color(),
    vig: 0.34,
    grain: 0.035,
    ca: 0.006,
    bloom: 0.5,
    bloomRadius: 0.5,
    bloomThreshold: 1.15,
  };
  const liftD = C(0x000000).setRGB(0.0, 0.007, 0.024);
  const liftN = C(0x000000).setRGB(0.0, 0.005, 0.016);
  const gainD = C(0x000000).setRGB(1.05, 0.99, 0.91);
  const gainN = C(0x000000).setRGB(0.94, 0.98, 1.06);

  /* -------------------------------------------------------------- camera */
  let cp = 0;
  let lx = 0;
  let ly = 0;
  let prevZ = 0;
  let nowT = 0;
  let camX = 0;
  let roll = 0;
  let kick = 0;
  let enterAt = -99;
  let enterPending = false;
  const waves: { x: number; z: number; t: number }[] = [];
  const look = new THREE.Vector3();

  const update = (t: number, dtIn: number) => {
    const dt = Math.min(0.1, Math.max(0, dtIn));
    nowT = t;
    if (enterPending) {
      enterAt = t;
      enterPending = false;
    }
    if (appliedTod !== state.tod) applyTime(state.tod);
    const tod = state.tod;
    const calm = state.calm;
    const cpBefore = cp;
    cp = damp(cp, dwell(state.progress), 3.7, dt);
    const kLook = 1 - Math.exp(-dt * 3.1);

    const open = calm ? 0 : 1 - sstep(0, 0.12, cp);
    const cruise = 1 - open;
    const rise = calm ? 0 : (bump(LEGS[0], 0.14, cp) + bump(LEGS[1], 0.15, cp) + bump(LEGS[2], 0.15, cp)) * cruise;
    const side = calm ? 0 : (bump(LEGS[0], 0.14, cp) - bump(LEGS[1], 0.15, cp) + bump(LEGS[2], 0.15, cp)) * cruise;
    const near = calm ? 0 : bump(GATE_STOPS[0], 0.08, cp) + bump(GATE_STOPS[1], 0.08, cp) + bump(GATE_STOPS[2], 0.08, cp);

    let rush = 0;
    if (state.rush >= 0 && !calm) {
      const r = Math.min(1, Math.max(0, (t - state.rush) / 0.62));
      rush = r * r * r;
    }
    /* coming back from another place: settle in from a little way behind */
    const back = calm ? 0 : Math.pow(1 - sstep(0, 1.8, t - enterAt), 3);

    const z = cp * END - rush * 22 + back * 9;
    const px = pathX(z);
    const x = px + side * 3.4 * (1 - rush);
    const y = 2.5 + open * 20 + rise * 4.2 - near * 0.9 + back * 1.5 + Math.sin(t * 0.6) * 0.12;
    cam.position.set(x, y, z);
    lx += ((state.mx - 0.5) * 7 - lx) * kLook;
    ly += ((0.5 - state.my) * 3 - ly) * kLook;
    const short = Math.min(1, Math.max(0, (760 - window.innerHeight) / 300));
    const pitch = 0.4 - open * 7.9 - rise * 4.4 + near * (1.7 + short * 3.2);
    look.set(pathX(z - 30) - side * 1.6 + lx, y + pitch + ly, z - 30);
    cam.lookAt(look);
    const vx = dt > 0 ? (x - camX) / dt : 0;
    camX = x;
    roll += (Math.max(-0.07, Math.min(0.07, -vx * 0.035)) - roll) * kLook;
    if (!calm) cam.rotateZ(roll);
    const speed = dt > 0 ? (Math.abs(cp - cpBefore) * -END) / dt : 0;
    kick += (Math.min(9, speed * 0.22) - kick) * kLook;
    const fov = (state.portrait ? 78 : 60) + (calm ? 0 : kick - near * 4) + rush * 30;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    sky.mesh.position.copy(cam.position);
    stars.points.position.copy(cam.position);
    stars.points.rotation.y = t * 0.004;
    sunPos.set(-150, 70 - tod * 10 + cp * 40 * tod, -800).normalize();
    sky.uniforms.sunDir.value.copy(sunPos);
    water.uniforms.sunDir.value.copy(sunPos);
    dir.position.copy(cam.position).addScaledVector(sunPos, 200);
    dir.target.position.copy(cam.position);
    dust.points.position.set(x, 0, z + 10);

    for (let g = 0; g < GATE_Z.length; g++) {
      if (prevZ > GATE_Z[g] + 14 && z <= GATE_Z[g] + 14) {
        waves.push({ x, z: GATE_Z[g], t });
        sound.gong();
      }
      const dz = Math.abs(z - GATE_Z[g]);
      /* bright as you approach, gone as you pass through, so it never fills the screen */
      veils[g].uniforms.intensity.value = (0.55 + 1.6 * (1 - sstep(10, 60, dz)) + rush * 3) * sstep(3, 11, dz);
    }
    prevZ = z;
    while (waves.length && t - waves[0].t > 5) waves.shift();

    /* the boat leads the way and waits beyond the frame at each gate */
    const lead = 24 - cp * 14;
    const ahead = 1 - sstep(0, 0.12, cp);
    const gateHold = bump(GATE_STOPS[0], 0.08, cp) + bump(GATE_STOPS[1], 0.08, cp) + bump(GATE_STOPS[2], 0.08, cp);
    const bz = z - lead - gateHold * Math.max(0, 28 - lead) - ahead * 56 - rush * 6;
    const bx = pathX(bz);
    fel.boat.position.set(bx, 0.02 + Math.sin(t * 1.3) * 0.06, bz);
    fel.boat.rotation.z = Math.sin(t * 0.9) * 0.04;
    fel.boat.rotation.x = Math.sin(t * 1.1 + 1) * 0.015;
    fel.boat.rotation.y = -(pathX(bz - 4) - bx) * 0.25;

    birds.position.set(cam.position.x - 75 + ((t * 3.2) % 150), 19 + Math.sin(t * 0.5) * 1.5, cam.position.z - 95);
    birds.rotation.y = -Math.PI / 2;
    for (const w of wings) w.m.rotation.z = w.d * Math.sin(t * 7 + w.ph) * 0.6;

    for (let r = ripples.length - 1; r >= 0; r--) {
      const rr = ripples[r];
      const a = (t - rr.t) / 1.9;
      const mm = rr.m.material as THREE.MeshBasicMaterial;
      if (a < 0) continue;
      if (a >= 1) {
        scene.remove(rr.m);
        mm.dispose();
        ripples.splice(r, 1);
        continue;
      }
      const s = 0.3 + a * 7.5;
      rr.m.scale.set(s, 1, s);
      mm.opacity = Math.pow(1 - a, 1.6) * 0.9;
    }

    if (tod > 0.45 && t - shT > 5.5) {
      shT = t;
      shP.set(-260 + Math.random() * 420, 300 + Math.random() * 120, -760);
    }
    const sa = (t - shT) / 0.9;
    if (sa < 1) {
      shoot.position.set(cam.position.x + shP.x + sa * 150, cam.position.y + shP.y - sa * 82, cam.position.z + shP.z);
      streak.uniforms.opacity.value = Math.sin(sa * Math.PI) * sstep(0.45, 0.8, tod);
    } else streak.uniforms.opacity.value = 0;

    /* pyramids: tapped ones glow, gate waves pass through, all of them at the end */
    const fin = sstep(0.92, 1, cp);
    let moved = false;
    for (let i = 0; i < nP; i++) {
      const p = pyrs[i];
      p.g += (p.tg - p.g) * (1 - Math.exp(-dt * 5));
      let wv = 0;
      for (const w of waves) {
        const ddx = p.x - w.x;
        const ddz = p.z - w.z;
        const dd = (Math.sqrt(ddx * ddx + ddz * ddz) - (t - w.t) * 55) / 14;
        wv += Math.exp(-dd * dd);
      }
      const base = p.g * (0.9 + Math.sin(t * 3 + i) * 0.1) + wv * 0.9 + fin * (0.35 + 0.25 * Math.sin(t * 2 + i * 0.7));
      glowArr[i] = base * 0.9;
      capGlowArr[i] = 0.25 + tod * 0.9 + base * 4;
      if (p.beam) (p.beam.material as THREE.ShaderMaterial).uniforms.intensity.value = p.g * 2.2;
      if (p.pop) {
        p.pop *= Math.exp(-dt * 6);
        if (p.pop < 0.01) p.pop = 0;
        setPyr(i);
        moved = true;
      }
    }
    glowAttr.needsUpdate = true;
    capGlowAttr.needsUpdate = true;
    petals.update(t, dt);
    sail.update(t);
    traffic.update(dt);
    let lit = false;
    for (let i = 0; i < towers.glow.length; i++) {
      if (towers.glow[i] <= 0) continue;
      towers.glow[i] = Math.max(0, towers.glow[i] - dt * 0.35);
      lit = true;
    }
    if (lit) towers.glowAttr.needsUpdate = true;
    if (moved) {
      bodies.instanceMatrix.needsUpdate = true;
      caps.instanceMatrix.needsUpdate = true;
    }

    const n = tod;
    grade.exposure = 1 + n * 0.12;
    grade.sat = 1.04 - n * 0.12;
    grade.lift.copy(liftD).lerp(liftN, n);
    grade.gain.copy(gainD).lerp(gainN, n);
    grade.bloom = 0.5 + n * 0.2;
    grade.bloomThreshold = 1.15 - n * 0.2;
  };

  const ray2 = new THREE.Raycaster();
  const hitPyr = (ray: THREE.Raycaster) => {
    ray2.ray.copy(ray.ray);
    const h = ray2.intersectObject(bodies, false)[0] ?? ray2.intersectObject(caps, false)[0];
    return h && h.instanceId !== undefined ? h.instanceId : -1;
  };

  const hitTree = (ray: THREE.Raycaster) => {
    const h = ray.intersectObjects(trees, false)[0];
    return h && h.distance < 140 ? h : null;
  };
  const hitTower = (ray: THREE.Raycaster) => {
    const h = ray.intersectObject(towers.mesh, false)[0];
    return h && h.instanceId !== undefined ? h : null;
  };
  const click = (ray: THREE.Raycaster) => {
    const tree = hitTree(ray);
    const tower = tree ? null : hitTower(ray);
    const pyrHit = hitPyr(ray);
    const near = (d: number | undefined) => d ?? Infinity;
    const pd = pyrHit >= 0 ? (ray2.intersectObject(bodies, false)[0]?.distance ?? Infinity) : Infinity;
    if (tree && near(tree.distance) < pd) {
      const pan = Math.max(-0.8, Math.min(0.8, (tree.point.x - cam.position.x) / 30));
      petals.burst(tree.point, (tree.object.userData.petal as number) ?? 0xff5a2a);
      const deg = Math.floor(rnd() * 8);
      sound.pluck(sound.note(deg), 0.6, pan, 0, 0.55);
      sound.pluck(sound.note(deg + 2), 0.35, pan, 0.12, 0.6);
      return;
    }
    if (tower && tower.distance < pd) {
      const id = tower.instanceId!;
      towers.glow[id] = 1;
      towers.glowAttr.needsUpdate = true;
      const pan = Math.max(-0.8, Math.min(0.8, (tower.point.x - cam.position.x) / 40));
      sound.bell(sound.note(5 + (id % 5)), 0.5, pan, 0, 3.5, 0.9);
      return;
    }
    const i = pyrHit;
    if (i >= 0) {
      const p = pyrs[i];
      p.tg = p.tg ? 0 : 1;
      p.pop = 1;
      setPyr(i);
      if (p.tg) {
        const pan = Math.max(-0.8, Math.min(0.8, (p.x - cam.position.x) / 40));
        sound.pluck(sound.note(p.deg), 0.75, pan, 0, 0.6);
        sound.pluck(sound.note(p.deg + 5), 0.3, pan, 0, 0.8);
        if (!p.beam) {
          const sh = shaftMaterial(0xffcf7a, 0);
          p.beam = new THREE.Mesh(beamG, sh.mat);
          p.beam.position.set(p.x, p.y + p.h + 80, p.z);
          scene.add(p.beam);
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
          const m = new THREE.Mesh(
            ringG,
            new THREE.MeshBasicMaterial({ color: C(0xffd992).multiplyScalar(1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
          );
          m.position.set(wx, 0.05, wz);
          scene.add(m);
          ripples.push({ m, t: nowT + i * 0.26 });
        }
        sound.drop(Math.max(-0.8, Math.min(0.8, (wx - cam.position.x) / 12)));
      }
    }
  };

  const rig: PlaceRig = {
    scene,
    camera: cam,
    update,
    click,
    hover: (ray) => hitPyr(ray) >= 0 || !!hitTree(ray) || !!hitTower(ray),
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

