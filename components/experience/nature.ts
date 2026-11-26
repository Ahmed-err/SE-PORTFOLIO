/* The green of the Nile: acacia umbrella trees, scarlet flame trees, dense neem,
   reeds and papyrus at the water's edge, and the petals a tree lets go when
   you tap it. Everything is instanced and sways in the same wind. */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { softPoints } from "./materials";
import { shared, sstep } from "./util";

/* a geometry with its own colour, darkened toward its underside for depth */
function paint(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, shade?: [number, number, number]) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute("uv");
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const base = new THREE.Color(color);
  for (let i = 0; i < p.count; i++) {
    const k = shade ? shade[2] + (1 - shade[2]) * sstep(shade[0], shade[1], p.getY(i)) : 1;
    c[i * 3] = base.r * k;
    c[i * 3 + 1] = base.g * k;
    c[i * 3 + 2] = base.b * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return g;
}

/* a lumpy leaf mass; displacement depends only on position so seams stay closed */
function blob(r: number, sx: number, sy: number, sz: number, x: number, y: number, z: number, seed: number) {
  const g = new THREE.IcosahedronGeometry(r, 2);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + 0.16 * Math.sin(v.x * 3.1 + v.y * 1.7 + seed) * Math.sin(v.z * 2.3 - v.y * 2.9 + seed * 2) + 0.08 * Math.sin(v.x * 7 + v.z * 5 + seed);
    v.multiplyScalar(k);
    p.setXYZ(i, v.x * sx + x, v.y * sy + y, v.z * sz + z);
  }
  return g;
}

function trunk(h: number, r0: number, r1: number, lean: number, yaw: number, y0 = 0) {
  const g = new THREE.CylinderGeometry(r1, r0, h, 7, 3);
  g.translate(0, h / 2, 0);
  g.rotateZ(lean);
  g.rotateY(yaw);
  g.translate(0, y0, 0);
  return g;
}

const BARK = 0x3a2818;

/* Acacia tortilis: forked trunk, a wide flat crown */
function acacia(rnd: () => number) {
  const parts: THREE.BufferGeometry[] = [paint(trunk(2.2, 0.22, 0.14, 0, 0), BARK)];
  for (let k = 0; k < 3; k++) parts.push(paint(trunk(1.7, 0.12, 0.06, 0.5 + rnd() * 0.3, (k / 3) * 6.28 + rnd(), 1.9), BARK));
  const green = [0x56662a, 0x63722f, 0x4b5a24];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + rnd() * 0.5;
    const r = k === 0 ? 0 : 1.2 + rnd() * 0.6;
    parts.push(paint(blob(1, 1.5 + rnd() * 0.4, 0.34, 1.5 + rnd() * 0.4, Math.cos(a) * r, 3.25 + rnd() * 0.3, Math.sin(a) * r, k + rnd() * 9), green[k % 3], [2.9, 3.6, 0.45]));
  }
  return mergeGeometries(parts)!;
}

/* Delonix regia: a short trunk and a broad dome, mostly scarlet with green showing */
function flame(rnd: () => number) {
  const parts: THREE.BufferGeometry[] = [paint(trunk(2.0, 0.3, 0.2, 0.05, 0), BARK)];
  for (let k = 0; k < 3; k++) parts.push(paint(trunk(1.4, 0.16, 0.08, 0.6, (k / 3) * 6.28 + rnd(), 1.6), BARK));
  const reds = [0xd8361a, 0xec5524, 0xc42a16, 0xf07a2c];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + rnd() * 0.4;
    const r = k === 0 ? 0 : 1.3 + rnd() * 0.7;
    const col = rnd() < 0.24 ? 0x3c5a1c : reds[Math.floor(rnd() * reds.length)];
    parts.push(paint(blob(1, 1.25, 0.72, 1.25, Math.cos(a) * r, 2.7 + (k === 0 ? 0.6 : rnd() * 0.5), Math.sin(a) * r, k * 3 + rnd() * 9), col, [1.9, 3.4, 0.5]));
  }
  return mergeGeometries(parts)!;
}

/* neem: a tall rounded mass of dark leaves, the shade tree of Khartoum's streets */
function neem(rnd: () => number) {
  const parts: THREE.BufferGeometry[] = [paint(trunk(2.6, 0.22, 0.14, 0.04, 0), BARK)];
  const greens = [0x2c4818, 0x3a5a1f, 0x335220];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + rnd();
    const r = k === 0 ? 0 : 0.8 + rnd() * 0.5;
    parts.push(paint(blob(1, 1.05, 1.0, 1.05, Math.cos(a) * r, 3.4 + rnd() * 1.4, Math.sin(a) * r, k * 5 + rnd() * 9), greens[k % 3], [2.4, 5, 0.42]));
  }
  return mergeGeometries(parts)!;
}

/* a tuft of reeds, some crowned with papyrus heads */
function reeds(rnd: () => number) {
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 9; k++) {
    const h = 1.1 + rnd() * 1.3;
    const a = rnd() * Math.PI * 2;
    const lean = 0.1 + rnd() * 0.25;
    const g = new THREE.BufferGeometry();
    const w = 0.05;
    g.setAttribute("position", new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, Math.sin(lean) * h, h, 0], 3));
    g.computeVertexNormals();
    g.rotateY(a);
    g.translate((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5);
    const c = new Float32Array([0.13, 0.17, 0.06, 0.13, 0.17, 0.06, 0.42, 0.45, 0.17]);
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    parts.push(g);
    if (rnd() < 0.16) {
      const head = new THREE.ConeGeometry(0.2, 0.24, 7, 1, true);
      head.rotateX(Math.PI);
      head.translate(0, 0.16, 0);
      head.rotateY(a);
      const hx = Math.sin(lean) * h;
      head.translate(Math.cos(a) * hx + (rnd() - 0.5) * 0.02, h, -Math.sin(a) * hx);
      parts.push(paint(head, 0x9aa848));
    }
  }
  return mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
}

/* every plant shares one wind: the higher a vertex, the more it moves */
function swayMaterial(key: string, height: number, amp: number) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, side: THREE.DoubleSide });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTime = shared.uTime;
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime;").replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float hN = max(0.0, position.y) / ${height.toFixed(2)};
       vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
       float ph = ip.x * 0.37 + ip.y * 0.21;
       float sw = sin(uTime * 0.9 + ph) * ${amp.toFixed(3)} + sin(uTime * 2.3 + ph * 1.7 + position.x) * ${(amp * 0.35).toFixed(3)};
       transformed.x += sw * hN * hN;
       transformed.z += sw * 0.5 * hN * hN;`
    );
  };
  mat.customProgramCacheKey = () => "sway" + key;
  return mat;
}

export interface Spot {
  x: number;
  y: number;
  z: number;
  s: number;
}

export type TreeKind = "acacia" | "flame" | "neem";
const PETAL: Record<TreeKind, number> = { acacia: 0xe8e2a0, flame: 0xff5a2a, neem: 0xd8f0a0 };

export function makeGrove(rnd: () => number, kind: TreeKind, spots: Spot[]) {
  const build = kind === "acacia" ? acacia : kind === "flame" ? flame : neem;
  const mat = swayMaterial(kind, kind === "neem" ? 6 : 4.5, 0.06);
  const group = new THREE.Group();
  const meshes: THREE.InstancedMesh[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const variants = [build(rnd), build(rnd)];
  const buckets: Spot[][] = [[], []];
  spots.forEach((s, i) => buckets[i % 2].push(s));
  buckets.forEach((list, k) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(variants[k], mat, list.length);
    list.forEach((p, i) => {
      e.set(0, rnd() * Math.PI * 2, 0);
      m.compose(v.set(p.x, p.y, p.z), q.setFromEuler(e), sc.set(p.s, p.s * (0.9 + rnd() * 0.2), p.s));
      im.setMatrixAt(i, m);
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    im.userData = { kind, petal: PETAL[kind] };
    group.add(im);
    meshes.push(im);
  });
  return { group, meshes };
}

export function makeReeds(rnd: () => number, spots: Spot[]) {
  const mat = swayMaterial("reed", 2.2, 0.12);
  const im = new THREE.InstancedMesh(reeds(rnd), mat, spots.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  spots.forEach((p, i) => {
    m.compose(v.set(p.x, p.y, p.z), q.setFromAxisAngle(up, rnd() * 6.28), sc.setScalar(p.s));
    im.setMatrixAt(i, m);
  });
  im.computeBoundingSphere();
  return im;
}

/* petals and leaves that burst from a tapped tree and drift down */
export function makePetals(capacity = 360) {
  const pos = new Array(capacity * 3).fill(0);
  const col = new Array(capacity * 3).fill(0);
  const sizes = new Array(capacity).fill(1);
  const pts = softPoints({ positions: pos, colors: col, sizes, size: 0.9, intensity: 1.6, attenuate: true });
  const vel = new Float32Array(capacity * 3);
  const life = new Float32Array(capacity);
  const base = new Float32Array(capacity * 3);
  let head = 0;
  const pa = pts.geometry.attributes.position as THREE.BufferAttribute;
  const ca = pts.geometry.attributes.aColor as THREE.BufferAttribute;
  const tmp = new THREE.Color();
  const burst = (at: THREE.Vector3, color: number, n = 46) => {
    tmp.set(color);
    for (let k = 0; k < n; k++) {
      const i = head;
      head = (head + 1) % capacity;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.8;
      pa.setXYZ(i, at.x + Math.cos(a) * r, at.y + (Math.random() - 0.3) * 1.2, at.z + Math.sin(a) * r);
      vel[i * 3] = Math.cos(a) * (0.6 + Math.random() * 1.6);
      vel[i * 3 + 1] = 0.8 + Math.random() * 1.8;
      vel[i * 3 + 2] = Math.sin(a) * (0.6 + Math.random() * 1.6);
      life[i] = 1;
      const v = 0.75 + Math.random() * 0.5;
      base[i * 3] = tmp.r * v;
      base[i * 3 + 1] = tmp.g * v;
      base[i * 3 + 2] = tmp.b * v;
    }
  };
  const update = (t: number, dt: number) => {
    let any = false;
    for (let i = 0; i < capacity; i++) {
      if (life[i] <= 0) continue;
      any = true;
      life[i] -= dt / 3.2;
      const k = Math.max(0, life[i]);
      vel[i * 3 + 1] -= dt * 1.4;
      vel[i * 3] *= 1 - dt * 0.6;
      vel[i * 3 + 2] *= 1 - dt * 0.6;
      const flutter = Math.sin(t * 6 + i) * 0.6;
      pa.setXYZ(i, pa.getX(i) + (vel[i * 3] + flutter) * dt, Math.max(0.05, pa.getY(i) + Math.max(-1.1, vel[i * 3 + 1]) * dt), pa.getZ(i) + vel[i * 3 + 2] * dt);
      const f = Math.min(1, k * 3);
      ca.setXYZ(i, base[i * 3] * f, base[i * 3 + 1] * f, base[i * 3 + 2] * f);
    }
    if (any) {
      pa.needsUpdate = true;
      ca.needsUpdate = true;
    }
  };
  return { points: pts.points, burst, update };
}
