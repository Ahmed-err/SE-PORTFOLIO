/* Things that appear in more than one place: date palms that sway in the wind,
   and the felucca. */
import * as THREE from "three";
import { GeoBuilder, shared } from "./util";

/* one palm: a curved, ringed trunk and a crown of drooping, folded fronds */
function palmGeometry(rnd: () => number, dark: boolean) {
  const b = new GeoBuilder();
  const H = 5 + rnd() * 1.4;
  const bend = (rnd() - 0.3) * 1.4;
  const segs = 12;
  const sides = 7;
  const bark = new THREE.Color(dark ? 0x2a1c10 : 0x5e4127);
  const ring = new THREE.Color(dark ? 0x1c130b : 0x3d2a17);
  const c = (y: number) => bend * Math.pow(y / H, 2);
  const rings: number[][] = [];
  for (let s = 0; s <= segs; s++) {
    const y = (H * s) / segs;
    const r = (0.2 - 0.075 * (s / segs)) * (1 + (s % 2) * 0.12);
    const col = s % 2 ? bark : ring;
    const row: number[] = [];
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      row.push(b.vert(c(y) + Math.cos(a) * r, y, Math.sin(a) * r, col));
    }
    rings.push(row);
  }
  for (let s = 0; s < segs; s++)
    for (let k = 0; k < sides; k++) {
      const k2 = (k + 1) % sides;
      b.quad(rings[s][k], rings[s + 1][k], rings[s + 1][k2], rings[s][k2]);
    }
  const top = new THREE.Vector3(c(H), H, 0);
  const base = new THREE.Color(dark ? 0x141c0b : 0x2c3a15);
  const tip = new THREE.Color(dark ? 0x26300f : 0x7a8a33);
  const edge = new THREE.Color(dark ? 0x10160a : 0x223010);
  const fronds = 12;
  const tmp = new THREE.Color();
  for (let f = 0; f < fronds; f++) {
    const yaw = (f / fronds) * Math.PI * 2 + rnd() * 0.45;
    const len = 2.5 + rnd() * 1.1;
    const lift = 0.4 + rnd() * 1.1;
    const droop = 1.5 + rnd() * 1.3;
    const dx = Math.cos(yaw);
    const dz = Math.sin(yaw);
    const S = 10;
    let pl = -1;
    let pc = -1;
    let pr = -1;
    for (let i = 0; i <= S; i++) {
      const u = i / S;
      const sx = top.x + dx * len * u;
      const sz = top.z + dz * len * u;
      const sy = top.y + lift * u - droop * u * u;
      const w = 0.6 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.75) + 0.015;
      tmp.copy(base).lerp(tip, u);
      const L = b.vert(sx + dz * w, sy - w * 0.38, sz - dx * w, edge);
      const C = b.vert(sx, sy, sz, tmp);
      const R = b.vert(sx - dz * w, sy - w * 0.38, sz + dx * w, edge);
      if (i > 0) {
        b.quad(pl, L, C, pc);
        b.quad(pc, C, R, pr);
      }
      pl = L;
      pc = C;
      pr = R;
    }
  }
  /* a cluster of dates under the crown */
  const dateCol = new THREE.Color(dark ? 0x2a0e06 : 0x8a3a12);
  for (let k = 0; k < 3; k++) {
    const a = rnd() * Math.PI * 2;
    const cx = top.x + Math.cos(a) * 0.3;
    const cz = Math.sin(a) * 0.3;
    const cy = H - 0.35;
    const v0 = b.vert(cx, cy + 0.15, cz, dateCol);
    const v1 = b.vert(cx + 0.18, cy - 0.3, cz, dateCol);
    const v2 = b.vert(cx - 0.1, cy - 0.3, cz + 0.16, dateCol);
    const v3 = b.vert(cx - 0.1, cy - 0.3, cz - 0.16, dateCol);
    b.tri(v0, v1, v2);
    b.tri(v0, v2, v3);
    b.tri(v0, v3, v1);
  }
  return b.build();
}

function palmMaterial() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, side: THREE.DoubleSide });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTime = shared.uTime;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         float hN = max(0.0, position.y) / 6.0;
         vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
         float ph = ip.x * 0.37 + ip.y * 0.21;
         float sw = sin(uTime * 0.8 + ph) * 0.08 + sin(uTime * 1.9 + ph * 1.7) * 0.03;
         transformed.x += sw * hN * hN * 1.3;
         transformed.z += sw * 0.45 * hN * hN;
         float rad = length(position.xz);
         transformed.y += sin(uTime * 2.6 + ph + rad * 2.2) * 0.05 * rad * step(4.6, position.y);`
      );
  };
  mat.customProgramCacheKey = () => "palm";
  return mat;
}

export interface PalmSpot {
  x: number;
  y: number;
  z: number;
  s: number;
}

/* a grove from a list of spots, spread over three palm shapes */
export function makePalms(rnd: () => number, spots: PalmSpot[], dark = false) {
  const group = new THREE.Group();
  const mat = palmMaterial();
  const kinds = [0, 1, 2].map(() => palmGeometry(rnd, dark));
  const buckets: PalmSpot[][] = [[], [], []];
  spots.forEach((p, i) => buckets[i % 3].push(p));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  buckets.forEach((list, k) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(kinds[k], mat, list.length);
    list.forEach((p, i) => {
      e.set((rnd() - 0.5) * 0.12, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.12);
      q.setFromEuler(e);
      m.compose(v.set(p.x, p.y, p.z), q, sc.setScalar(p.s));
      im.setMatrixAt(i, m);
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    group.add(im);
  });
  return group;
}

/* the felucca: a painted hull, a raked mast and the long lateen yard with its sail */
export function makeFelucca(opts: { night?: boolean } = {}) {
  const boat = new THREE.Group();
  const b = new GeoBuilder();
  const stations = 12;
  const L = 2.4;
  const band = new THREE.Color(0x1f5a6b);
  const white = new THREE.Color(0xd8cdb4);
  const wood = new THREE.Color(0x3b2414);
  const rows: number[][] = [];
  for (let i = 0; i <= stations; i++) {
    const z = -L + (2 * L * i) / stations;
    const u = z / L;
    const w = 0.62 * Math.pow(Math.max(0, 1 - u * u), 0.55);
    const top = 0.42 + 0.3 * u * u + (u < 0 ? 0.12 * u * u : 0);
    const keel = -0.06 + 0.16 * u * u;
    rows.push([
      b.vert(-w, top, z, band),
      b.vert(-w * 0.98, top - 0.12, z, white),
      b.vert(-w * 0.82, 0.08, z, wood),
      b.vert(0, keel, z, wood),
      b.vert(w * 0.82, 0.08, z, wood),
      b.vert(w * 0.98, top - 0.12, z, white),
      b.vert(w, top, z, band),
    ]);
  }
  for (let i = 0; i < stations; i++) for (let k = 0; k < 6; k++) b.quad(rows[i][k], rows[i + 1][k], rows[i + 1][k + 1], rows[i][k + 1]);
  const hull = new THREE.Mesh(b.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }));
  boat.add(hull);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a190d, roughness: 1 }));
  deck.position.y = 0.36;
  boat.add(deck);

  const spar = new THREE.MeshStandardMaterial({ color: 0x2b1a0e, roughness: 0.9 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 3.4, 6), spar);
  mast.position.set(0, 1.95, -0.8);
  mast.rotation.x = -0.08;
  boat.add(mast);

  /* sail swung out to one side, so it fills the view from astern */
  const rig = new THREE.Group();
  const tack = new THREE.Vector3(-2.0, 0.75, -1.9);
  const peak = new THREE.Vector3(1.35, 6.1, 0.4);
  const clew = new THREE.Vector3(1.6, 0.95, 1.5);
  const yardDir = peak.clone().sub(tack);
  const yardLen = yardDir.length() + 0.9;
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, yardLen, 6), spar);
  yard.position.copy(tack).add(peak).multiplyScalar(0.5);
  yard.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), yardDir.normalize());
  rig.add(yard);
  const sb = new GeoBuilder();
  const N = 10;
  const cream = new THREE.Color(0xf4e6c8);
  const shade = new THREE.Color(0xd9c39a);
  const nrm = new THREE.Vector3().subVectors(peak, tack).cross(new THREE.Vector3().subVectors(clew, tack)).normalize();
  const idx: number[][] = [];
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const row: number[] = [];
    for (let j = 0; j <= N - i; j++) {
      const a = i / N;
      const bb = j / N;
      const g = 1 - a - bb;
      p.set(0, 0, 0).addScaledVector(tack, g).addScaledVector(peak, a).addScaledVector(clew, bb);
      const belly = Math.sin(Math.PI * Math.min(1, a + bb)) * Math.sin(Math.PI * Math.min(1, g + bb)) * 0.55;
      p.addScaledVector(nrm, belly);
      c.copy(cream).lerp(shade, a * 0.6);
      row.push(sb.vert(p.x, p.y, p.z, c));
    }
    idx.push(row);
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N - i; j++) {
      sb.tri(idx[i][j], idx[i + 1][j], idx[i][j + 1]);
      if (j < N - i - 1) sb.tri(idx[i + 1][j], idx[i + 1][j + 1], idx[i][j + 1]);
    }
  const sailMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 1,
    emissive: new THREE.Color(0xffc98a),
    emissiveIntensity: opts.night ? 0.05 : 0.35,
  });
  const sail = new THREE.Mesh(sb.build(), sailMat);
  rig.add(sail);
  rig.position.z = -0.4;
  rig.rotation.y = 0.32;
  boat.add(rig);

  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc46a).multiplyScalar(4) });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), lampMat);
  lamp.position.set(0, 1.05, 2.05);
  boat.add(lamp);
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), spar);
  lampPole.position.set(0, 0.75, 2.05);
  boat.add(lampPole);
  const light = new THREE.PointLight(0xffa54a, 0, 9, 1.6);
  light.position.set(0, 1.2, 1.8);
  boat.add(light);
  return { boat, sailMat, lampMat, light };
}
