/* Modern Khartoum: glass towers whose windows light up with the evening, and
   the city's landmarks: the Corinthia Hotel, Tuti Bridge, Al-Nilin Mosque and the
   Mahdi's Tomb, with the lamps of the corniche and traffic on the move. */
import * as THREE from "three";
import { softPoints } from "./materials";
import { NOISE_GLSL } from "./util";

export interface CityLights {
  litFrac: { value: number };
  winI: { value: number };
}

/* facades with a grid of windows; which ones are lit is decided per window, per
   building, and the share grows as night falls. "aGlow" lights a whole tower. */
export function towerMaterial(color: THREE.ColorRepresentation, u: CityLights, rows = 0.85, cols = 1.1) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.25 });
  mat.onBeforeCompile = (s) => {
    s.uniforms.litFrac = u.litFrac;
    s.uniforms.winI = u.winI;
    s.vertexShader = s.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 vWP; varying vec3 vWN; varying float vSeed; varying float vGlow;
         #ifdef USE_INSTANCING
         attribute float aGlow;
         #endif`
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
         vec4 wp4 = vec4(transformed, 1.0);
         vec3 wn = objectNormal;
         #ifdef USE_INSTANCING
         wp4 = instanceMatrix * wp4;
         wn = mat3(instanceMatrix) * wn;
         vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
         vGlow = aGlow;
         #else
         vSeed = 0.37;
         vGlow = 0.0;
         #endif
         vWP = (modelMatrix * wp4).xyz;
         vWN = normalize(mat3(modelMatrix) * wn);`
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float litFrac, winI;
         varying vec3 vWP; varying vec3 vWN; varying float vSeed; varying float vGlow;
         ${NOISE_GLSL}`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         float side = 1.0 - step(0.55, abs(vWN.y));
         float u = abs(vWN.x) > abs(vWN.z) ? vWP.z : vWP.x;
         vec2 g = vec2(u * ${cols.toFixed(2)}, vWP.y * ${rows.toFixed(2)});
         vec2 cell = floor(g);
         vec2 f = fract(g);
         float win = step(0.16, f.x) * step(f.x, 0.84) * step(0.2, f.y) * step(f.y, 0.74);
         float h = hash12(cell + vSeed * 91.7);
         float lit = step(h, litFrac + vGlow);
         vec3 wc = mix(vec3(1.0, 0.68, 0.38), vec3(0.78, 0.86, 1.0), step(0.72, hash12(cell * 1.7 + vSeed)));
         totalEmissiveRadiance += wc * win * lit * side * winI * (0.55 + 0.45 * hash12(cell + 3.1)) * (1.0 + vGlow * 1.5);
         diffuseColor.rgb *= mix(1.0, 0.55, win * side);`
      );
  };
  mat.customProgramCacheKey = () => "tower" + rows + cols;
  return mat;
}

export interface TowerSpot {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

const FACADES = [0x3a4f62, 0x5f666e, 0xb4a283, 0x2e3c4a, 0x8c7a62, 0x46607a, 0xc9b99a];

export function makeTowers(spots: TowerSpot[], lights: CityLights, rnd: () => number) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  const glow = new Float32Array(spots.length);
  const glowAttr = new THREE.InstancedBufferAttribute(glow, 1);
  glowAttr.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute("aGlow", glowAttr);
  const im = new THREE.InstancedMesh(g, towerMaterial(0xffffff, lights), spots.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  const c = new THREE.Color();
  spots.forEach((p, i) => {
    m.compose(v.set(p.x, p.y, p.z), q, s.set(p.w, p.h, p.d));
    im.setMatrixAt(i, m);
    im.setColorAt(i, c.set(FACADES[Math.floor(rnd() * FACADES.length)]));
  });
  im.computeBoundingSphere();
  /* red lights on the tallest roofs */
  const ap: number[] = [];
  spots.forEach((p) => {
    if (p.h > 18) ap.push(p.x, p.y + p.h + 0.4, p.z);
  });
  const aviation = softPoints({ positions: ap.length ? ap : [0, -99, 0], size: 1.4, color: 0xff3020, intensity: 3, attenuate: true, twinkle: 0.9 });
  return { mesh: im, glow, glowAttr, aviation };
}

/* cars: points that run along a list of lanes, headlights one way, tail lights the other */
export function makeTraffic(lanes: { a: THREE.Vector3; b: THREE.Vector3; count: number; red: boolean; speed: number }[]) {
  const pos: number[] = [];
  const col: number[] = [];
  const meta: { lane: number; s: number }[] = [];
  lanes.forEach((l, li) => {
    for (let k = 0; k < l.count; k++) {
      pos.push(0, 0, 0);
      if (l.red) col.push(1, 0.16, 0.1);
      else col.push(1, 0.92, 0.75);
      meta.push({ lane: li, s: Math.random() });
    }
  });
  const pts = softPoints({ positions: pos, colors: col, size: 0.75, intensity: 2.6, attenuate: true });
  const pa = pts.geometry.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const update = (dt: number) => {
    meta.forEach((m, i) => {
      const l = lanes[m.lane];
      m.s = (m.s + (dt * l.speed) / l.a.distanceTo(l.b)) % 1;
      v.copy(l.a).lerp(l.b, m.s);
      pa.setXYZ(i, v.x, v.y, v.z);
    });
    pa.needsUpdate = true;
  };
  update(0);
  return { points: pts.points, uniforms: pts.uniforms, update };
}

/* ------------------------------------------------------------ landmarks */

/* Corinthia Hotel, the "egg" on the Nile: an oval plan, walls that rise almost
   straight and then round over into a domed crown, dark blue glass ringed by
   pale floor lines. At night vertical lines of light run up the shell and
   drift slowly through colours, as on the real building. */
export function makeCorinthia(lights: CityLights) {
  const group = new THREE.Group();
  const H = 46;
  const RX = 11;
  const RZ = 6.6;
  const prof = (t: number) => Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, t), 3.2)), 0.42);
  const g = new THREE.CylinderGeometry(1, 1, 1, 80, 44);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i);
    const f = prof(t);
    p.setXYZ(i, p.getX(i) * RX * f, t * H, p.getZ(i) * RZ * f);
  }
  g.computeVertexNormals();
  const glass = towerMaterial(0x1f4a66, lights, 1.15, 2.2);
  glass.roughness = 0.16;
  glass.metalness = 0.7;
  glass.envMapIntensity = 1.4;
  group.add(new THREE.Mesh(g, glass));

  /* pale floor lines that follow the curve */
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e2d4, roughness: 0.45, metalness: 0.2 });
  for (let y = 4; y < H - 3; y += 2.6) {
    const f = prof(y / H) * 1.006;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.14, 80, 1, true), white);
    ring.scale.set(RX * f, 1, RZ * f);
    ring.position.y = y;
    group.add(ring);
  }
  /* the podium it stands on */
  const pod = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.04, 3.2, 64), white);
  pod.scale.set(RX + 4, 1, RZ + 3.2);
  pod.position.y = 1.6;
  group.add(pod);

  /* night: light lines up the meridians, and a halo round the crown */
  const sp: number[] = [];
  const M = 30;
  for (let m = 0; m < M; m++) {
    const a = (m / M) * Math.PI * 2;
    for (let t = 0.1; t < 0.97; t += 0.028) {
      const f = prof(t) * 1.012;
      sp.push(Math.cos(a) * RX * f, t * H, Math.sin(a) * RZ * f);
    }
  }
  const strips = softPoints({ positions: sp, size: 0.42, color: 0x7fb4ff, intensity: 1.6, attenuate: true });
  group.add(strips.points);
  const cp: number[] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    const f = prof(0.9) * 1.02;
    cp.push(Math.cos(a) * RX * f, H * 0.9, Math.sin(a) * RZ * f);
  }
  const crown = softPoints({ positions: cp, size: 0.7, color: 0x7fb4ff, intensity: 2.6, attenuate: true });
  group.add(crown.points);
  const hue = new THREE.Color();
  const update = (t: number) => {
    const night = Math.min(1, Math.max(0, (lights.litFrac.value - 0.2) / 0.42));
    hue.setHSL((0.55 + t * 0.012) % 1, 0.75, 0.6);
    crown.uniforms.color.value.copy(hue);
    strips.uniforms.color.value.copy(hue);
    strips.uniforms.opacity.value = 0.15 + night * 0.85;
  };
  return { mesh: group, crown, update };
}

/* Tuti Bridge: a white suspension bridge, two portal towers, main cables
   hanging in a curve, hangers down to the deck, lamps along both edges */
export function makeTutiBridge(x0: number, z: number, span: number, deckY: number) {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.55 });
  const deckM = new THREE.MeshStandardMaterial({ color: 0x8a857c, roughness: 0.8 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(span * 2, 0.9, 7), deckM);
  deck.position.y = deckY;
  group.add(deck);
  for (const sz of [-3.4, 3.4]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(span * 2, 0.6, 0.2), white);
    rail.position.set(0, deckY + 0.7, sz);
    group.add(rail);
  }
  const TX = 18;
  const TH = deckY + 21;
  for (const px of [-TX, TX]) {
    for (const sz of [-3.8, 3.8]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, TH + 1, 1.2), white);
      leg.position.set(px, TH / 2 - 0.5, sz);
      group.add(leg);
    }
    for (const y of [TH - 0.6, deckY + 9]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 8.8), white);
      beam.position.set(px, y, 0);
      group.add(beam);
    }
  }
  /* the main cables: anchor, tower top, a long sag over the river, tower top, anchor */
  const cableY = (x: number) => {
    const ax = Math.abs(x);
    if (ax <= TX) return deckY + 2.2 + (TH - deckY - 2.2) * Math.pow(ax / TX, 2);
    return TH - (TH - deckY - 1) * ((ax - TX) / (span - TX));
  };
  const cable: number[] = [];
  const hang: number[] = [];
  for (const sz of [-3.4, 3.4]) {
    for (let x = -span; x < span; x += 1) cable.push(x, cableY(x), sz, x + 1, cableY(x + 1), sz);
    for (let x = -span + 2; x < span - 1; x += 2.4) if (Math.abs(Math.abs(x) - TX) > 1) hang.push(x, cableY(x), sz, x, deckY + 0.5, sz);
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute("position", new THREE.Float32BufferAttribute(cable, 3));
  group.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0xf4f0e6 })));
  const hg = new THREE.BufferGeometry();
  hg.setAttribute("position", new THREE.Float32BufferAttribute(hang, 3));
  group.add(new THREE.LineSegments(hg, new THREE.LineBasicMaterial({ color: 0xd8d2c4, transparent: true, opacity: 0.6 })));
  const lp: number[] = [];
  for (let x = -span; x <= span; x += 2.2) for (const sz of [-3.3, 3.3]) lp.push(x, deckY + 1.3, sz);
  /* lights run up the cables too, so the curve reads at night */
  for (const sz of [-3.4, 3.4]) for (let x = -span; x <= span; x += 3) lp.push(x, cableY(x) + 0.1, sz);
  for (const px of [-TX, TX]) for (const sz of [-3.8, 3.8]) lp.push(px, TH + 0.4, sz);
  const lamps = softPoints({ positions: lp, size: 0.85, color: 0xcfe0ff, intensity: 2.4, attenuate: true, twinkle: 0.04 });
  group.add(lamps.points);
  group.position.set(x0, 0, z);
  return { group, lamps };
}

/* Al-Nilin Mosque at al-Mogran: a broad ribbed shell of a dome on a low hall, one minaret */
export function makeNilin() {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.55 });
  const hall = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.5, 3, 8), white);
  hall.position.y = 1.5;
  group.add(hall);
  const dg = new THREE.SphereGeometry(8.6, 96, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = dg.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const a = Math.atan2(v.z, v.x);
    const k = 1 + 0.05 * Math.abs(Math.cos(a * 12)) * Math.min(1, (8.6 - v.y) / 3);
    p.setXYZ(i, v.x * k, v.y * 0.62, v.z * k);
  }
  dg.computeVertexNormals();
  const dome = new THREE.Mesh(dg, new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.35, metalness: 0.1 }));
  dome.position.y = 3;
  group.add(dome);
  const prof = [
    [0, 0],
    [1.1, 0],
    [0.9, 1.2],
    [0.8, 20],
    [1.35, 20.4],
    [1.35, 20.9],
    [0.7, 21.1],
    [0.65, 25],
    [0.05, 28.5],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const minaret = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), white);
  minaret.position.set(12, 0, 0);
  group.add(minaret);
  const lp: number[] = [];
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    lp.push(Math.cos(a) * 9.7, 3.2, Math.sin(a) * 9.7);
  }
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    lp.push(12 + Math.cos(a) * 1.4, 20.9, Math.sin(a) * 1.4);
  }
  lp.push(0, 8.6, 0, 12, 28.8, 0);
  const lights = softPoints({ positions: lp, size: 0.8, color: 0xd8ffe8, intensity: 2.4, attenuate: true });
  group.add(lights.points);
  return { group, lights };
}

/* the Mahdi's Tomb in Omdurman: a square shrine under a tall pointed silver dome,
   a small dome at each corner */
export function makeMahdiTomb() {
  const group = new THREE.Group();
  const cream = new THREE.MeshStandardMaterial({ color: 0xe2d6bd, roughness: 0.7 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xcfd4da, roughness: 0.25, metalness: 0.9, emissive: 0x20242a });
  const base = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 10), cream);
  base.position.y = 3.5;
  group.add(base);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 2.4, 16), cream);
  drum.position.y = 8.2;
  group.add(drum);
  const ogive = (r: number, h: number) =>
    new THREE.LatheGeometry(
      Array.from({ length: 16 }, (_, i) => {
        const t = i / 15;
        return new THREE.Vector2(Math.max(0.02, r * Math.pow(Math.cos((t * Math.PI) / 2), 0.7)), t * h);
      }),
      32
    );
  const big = new THREE.Mesh(ogive(3.8, 10), silver);
  big.position.y = 9.4;
  group.add(big);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 2.4, 6), silver);
  spire.position.y = 20.4;
  group.add(spire);
  for (const [cx, cz] of [
    [-4.2, -4.2],
    [4.2, -4.2],
    [-4.2, 4.2],
    [4.2, 4.2],
  ]) {
    const d = new THREE.Mesh(ogive(1.2, 2.6), silver);
    d.position.set(cx, 7, cz);
    group.add(d);
  }
  const lp: number[] = [];
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    lp.push(Math.cos(a) * 7.5, 0.6, Math.sin(a) * 7.5);
  }
  lp.push(0, 21.8, 0);
  const lights = softPoints({ positions: lp, size: 1.1, color: 0xffe2b0, intensity: 1.6, attenuate: true });
  group.add(lights.points);
  return { group, lights, silver };
}
