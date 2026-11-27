/* The Sky of Services: a desert night under the galaxy. Every bright star is a
   service; a constellation of gold light joins them and draws itself in as you
   arrive. Drag to look around, tap a star. */
import * as THREE from "three";
import type { Sound } from "./audio";
import type { EngineCallbacks } from "./engine";
import { makeSkyDome, softPoints, streakMaterial } from "./materials";
import { damp, flareTexture, glowTexture, makeRnd, shared, sstep, type Grade, type PlaceRig, type WorldState } from "./util";

const RAD = 46;

export function buildSky(sound: Sound, count: number, cb: EngineCallbacks, state: WorldState) {
  const rnd = makeRnd(99);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 1400);
  const sky = makeSkyDome({ top: 0x01020a, hor: 0x111d44, glow: 0x2c4a9a, hazeI: 0.7, milky: 1.15 });
  sky.uniforms.sunDir.value.set(0.1, 0.05, -1).normalize();
  scene.add(sky.mesh);

  const sp: number[] = [];
  const ss: number[] = [];
  const sc: number[] = [];
  const mN = sky.uniforms.milkyN.value;
  const v = new THREE.Vector3();
  for (let i = 0; i < 4200; i++) {
    /* denser along the galaxy band */
    let tries = 0;
    do {
      v.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
      tries++;
    } while (tries < 3 && Math.abs(v.dot(mN)) > 0.25 && rnd() < 0.6);
    if (v.y < -0.02) v.y = -v.y;
    v.multiplyScalar(600);
    sp.push(v.x, v.y, v.z);
    const big = rnd();
    ss.push(1 + big * big * big * big * 4);
    const k = rnd();
    if (k < 0.15) sc.push(1, 0.82, 0.62);
    else if (k < 0.4) sc.push(0.75, 0.85, 1);
    else sc.push(1, 0.97, 0.94);
  }
  const stars = softPoints({ positions: sp, sizes: ss, colors: sc, size: 2.3, intensity: 0.95, twinkle: 0.6 });
  scene.add(stars.points);

  /* the desert at night, with the silhouettes of a pyramid field */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x03040a }));
  ground.position.y = -1;
  scene.add(ground);
  const pg = new THREE.CylinderGeometry(0.12, 1, 1, 4, 1);
  pg.translate(0, 0.5, 0);
  /* nearer ridges darker, farther ones lifted by haze: depth at night */
  const sil = new THREE.MeshBasicMaterial({ color: 0x03040a });
  const pyrs = new THREE.InstancedMesh(pg, sil, 52);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 52; i++) {
    const a = rnd() * 6.283;
    const r = 60 + rnd() * 90;
    const h = 6 + rnd() * 16;
    m4.compose(new THREE.Vector3(Math.sin(a) * r, -1, Math.cos(a) * r), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd()), new THREE.Vector3(h * 0.4, h, h * 0.4));
    pyrs.setMatrixAt(i, m4);
  }
  scene.add(pyrs);
  const dunes = new THREE.Mesh(
    new THREE.CylinderGeometry(300, 300, 1, 96, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x111a36, side: THREE.BackSide })
  );
  {
    const p = dunes.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, 8 + Math.sin(i * 0.7) * 4 + Math.sin(i * 0.23) * 6);
    dunes.position.y = -1.5;
  }
  scene.add(dunes);

  /* glow on the horizon: the warmth of a far town low down, the cool of
     airglow above it, fading out before the stars */
  {
    const hg = new THREE.CylinderGeometry(296, 296, 70, 96, 8, true);
    const p = hg.attributes.position;
    const c = new Float32Array(p.count * 3);
    const warm = new THREE.Color(0xa0523a);
    const cool = new THREE.Color(0x1d5578);
    const tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const h = (p.getY(i) + 35) / 70;
      const az = Math.atan2(p.getZ(i), p.getX(i));
      const town = 0.55 + 0.45 * Math.max(0, Math.cos(az - 1.9));
      tmp.copy(warm).multiplyScalar(town).lerp(cool, Math.min(1, h * 1.6)).multiplyScalar(Math.pow(1 - h, 1.8));
      c.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    hg.setAttribute("color", new THREE.BufferAttribute(c, 3));
    const glowRing = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    glowRing.position.y = 33;
    glowRing.renderOrder = -1;
    scene.add(glowRing);
  }

  /* the service stars */
  const glow = glowTexture();
  const flare = flareTexture();
  const pts: THREE.Vector3[] = [];
  const halos: THREE.Sprite[] = [];
  const flares: THREE.Sprite[] = [];
  const cores: THREE.Sprite[] = [];
  const targets: THREE.Mesh[] = [];
  const hitG = new THREE.SphereGeometry(3.2, 8, 8);
  const hitM = new THREE.MeshBasicMaterial({ visible: false });
  for (let i = 0; i < count; i++) {
    const az = (-1 + (2 * i) / Math.max(1, count - 1)) * 1.15;
    const el = 0.42 + 0.2 * Math.sin(i * 2.1) + 0.1 * Math.cos(i * 1.3);
    const p = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(RAD);
    pts.push(p);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(0xffc97a).multiplyScalar(0.9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.position.copy(p);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flare, color: new THREE.Color(0xffe6b8).multiplyScalar(1.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    fl.position.copy(p);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(0xffffff).multiplyScalar(5), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    core.position.copy(p);
    core.scale.setScalar(1.5);
    scene.add(halo, fl, core);
    halos.push(halo);
    flares.push(fl);
    cores.push(core);
    const hm = new THREE.Mesh(hitG, hitM);
    hm.position.copy(p);
    hm.userData = { index: i };
    scene.add(hm);
    targets.push(hm);
  }

  /* the constellation: thin ribbons of gold facing the viewer, drawn in on arrival */
  const lp: number[] = [];
  const la: number[] = [];
  const lx: number[] = [];
  const li: number[] = [];
  let total = 0;
  const lens: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    lens.push(pts[i].distanceTo(pts[i + 1]));
    total += lens[i];
  }
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const side = b.clone().sub(a).cross(mid).normalize().multiplyScalar(0.07);
    const base = lp.length / 3;
    /* stop short of each star so the line meets its glow, not its centre */
    const sa = a.clone().lerp(b, 1.6 / lens[i]);
    const sb = b.clone().lerp(a, 1.6 / lens[i]);
    for (const [p, al] of [
      [sa, acc + 1.6],
      [sb, acc + lens[i] - 1.6],
    ] as const) {
      lp.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z);
      la.push(al / total, al / total);
      lx.push(0, 1);
    }
    li.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    acc += lens[i];
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
  lg.setAttribute("aAlong", new THREE.Float32BufferAttribute(la, 1));
  lg.setAttribute("aAcross", new THREE.Float32BufferAttribute(lx, 1));
  lg.setIndex(li);
  const lineU = { uTime: shared.uTime, draw: { value: 0 }, intensity: { value: 1 }, total: { value: total } };
  const lineM = new THREE.ShaderMaterial({
    uniforms: lineU,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aAlong; attribute float aAcross;
      varying float vAlong; varying float vAcross;
      void main(){ vAlong = aAlong; vAcross = aAcross; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, draw, intensity, total;
      varying float vAlong; varying float vAcross;
      void main(){
        float core = pow(1.0 - abs(vAcross * 2.0 - 1.0), 2.0);
        float shown = 1.0 - smoothstep(draw - 0.03, draw, vAlong);
        float pulse = pow(fract(vAlong * total / 40.0 - uTime * 0.22), 18.0);
        float a = core * shown * (0.35 + pulse * 2.2) * intensity;
        gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * a, 1.0);
      }`,
  });
  const lines = new THREE.Mesh(lg, lineM);
  lines.frustumCulled = false;
  scene.add(lines);

  const streak = streakMaterial();
  const shoot = new THREE.Mesh(new THREE.PlaneGeometry(70, 0.8), streak.mat);
  shoot.rotation.z = -0.5;
  scene.add(shoot);
  let shT = 0;
  const shP = new THREE.Vector3();

  let yaw = 0;
  let pitch = 0.42;
  let yawT = 0;
  let pitchT = 0.42;
  let selected = -1;
  let labels: HTMLElement[] = [];
  let enterAt = -99;
  let enterPending = false;
  const proj = new THREE.Vector3();
  const look = new THREE.Vector3();
  const grade: Grade = {
    exposure: 1.1,
    sat: 1.05,
    contrast: 1.08,
    lift: new THREE.Color().setRGB(0.0, 0.004, 0.012),
    gain: new THREE.Color().setRGB(0.98, 1.0, 1.05),
    vig: 0.42,
    grain: 0.04,
    ca: 0.008,
    bloom: 0.75,
    bloomRadius: 0.65,
    bloomThreshold: 1.05,
  };

  const update = (t: number, dt: number) => {
    if (enterPending) {
      enterAt = t;
      enterPending = false;
    }
    const since = t - enterAt;
    /* arriving: the gaze rises from the horizon to the stars */
    const rise = state.calm ? 1 : sstep(0, 2.4, since);
    yaw = damp(yaw, yawT, 5, dt);
    pitch = damp(pitch, pitchT, 5, dt);
    cam.position.set(0, 1.6, 0);
    const pp = pitch * (0.25 + 0.75 * rise);
    look.set(Math.sin(yaw) * Math.cos(pp), Math.sin(pp), -Math.cos(yaw) * Math.cos(pp)).multiplyScalar(10).add(cam.position);
    cam.lookAt(look);
    lineU.draw.value = state.calm ? 1.05 : sstep(0.8, 3.6, since) * 1.05;
    lineU.intensity.value = selected >= 0 ? 1.25 : 1;
    stars.points.rotation.y = t * 0.003;

    if (labels.length) {
      cam.updateMatrixWorld();
      cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
      const w = window.innerWidth;
      const h = window.innerHeight;
      const drop = (h / (2 * Math.tan((cam.fov * Math.PI) / 360))) * (4.2 / RAD);
      const panel = document.querySelector(".xp-sky");
      const panelTop = panel ? panel.getBoundingClientRect().top : h;
      const panelHalf = Math.min(w / 2, 300);
      const shown = sstep(1.2, 2.6, since) || (state.calm ? 1 : 0);
      for (let i = 0; i < labels.length && i < pts.length; i++) {
        proj.copy(pts[i]).project(cam);
        const on = shown > 0.01 && proj.z < 1 && Math.abs(proj.x) < 1.02 && Math.abs(proj.y) < 1.1;
        const el = labels[i];
        el.style.visibility = on ? "visible" : "hidden";
        if (on) {
          const half = el.offsetWidth / 2 + 8;
          const x = Math.min(w - half, Math.max(half, ((proj.x + 1) / 2) * w));
          const y = ((1 - proj.y) / 2) * h + drop;
          if (y + el.offsetHeight > panelTop && Math.abs(x - w / 2) < panelHalf + half) el.style.visibility = "hidden";
          else {
            el.style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`;
            el.style.opacity = String(shown);
          }
        }
      }
    }
    for (let i = 0; i < halos.length; i++) {
      const on = i === selected;
      const s = on ? 13 + Math.sin(t * 3.2) * 1.4 : 7 + Math.sin(t * 1.5 + i) * 0.7;
      halos[i].scale.setScalar(damp(halos[i].scale.x, s, 6, dt));
      const fs = on ? 16 : 7.5;
      flares[i].scale.setScalar(damp(flares[i].scale.x || 7.5, fs, 5, dt));
      flares[i].material.rotation = t * 0.05 + i;
      cores[i].scale.setScalar(on ? 2.2 : 1.5);
    }
    if (t - shT > 4.5) {
      shT = t;
      shP.set(-260 + Math.random() * 520, 300 + Math.random() * 160, -700);
    }
    const sa = (t - shT) / 0.9;
    if (sa < 1) {
      shoot.position.set(shP.x + sa * 150, shP.y - sa * 82, shP.z);
      streak.uniforms.opacity.value = Math.sin(sa * Math.PI);
    } else streak.uniforms.opacity.value = 0;
  };
  const select = (index: number) => {
    if (index < 0 || index >= pts.length) return;
    selected = index;
    const p = pts[selected];
    yawT = Math.atan2(p.x, -p.z);
    pitchT = Math.max(0.05, Math.asin(p.y / RAD) - 0.16);
    const pan = Math.max(-0.8, Math.min(0.8, p.x / RAD));
    sound.bell(sound.note(index + 4, "sky"), 0.7, pan, 0, 4.5);
    sound.bell(sound.note(index + 6, "sky"), 0.25, -pan, 0.12, 3.5);
    cb.onService(selected);
  };
  const hit = (ray: THREE.Raycaster) => ray.intersectObjects(targets, false)[0];
  const rig: PlaceRig & { select: (i: number) => void; setLabels: (els: HTMLElement[]) => void } = {
    select,
    setLabels: (els) => {
      labels = els;
    },
    scene,
    camera: cam,
    update,
    click: (ray) => {
      const h = hit(ray);
      if (h) select(h.object.userData.index as number);
    },
    hover: (ray) => !!hit(ray),
    drag: (dx, dy) => {
      /* grab the sky and pull it */
      yawT = Math.max(-1.5, Math.min(1.5, yawT - dx * 0.004));
      pitchT = Math.max(0.05, Math.min(1.05, pitchT + dy * 0.004));
    },
    dragEnd: () => {},
    enter: () => {
      enterPending = true;
    },
    grade: () => grade,
  };
  return rig;
}
