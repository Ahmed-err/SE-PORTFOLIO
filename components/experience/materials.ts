/* Shaders shared across the places: the sky dome, soft glowing points, reflective
   water, dressed stone, and light veils. Everything renders in linear HDR; the
   final pass tone-maps, so values above 1 bloom. */
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { NOISE_GLSL, shared } from "./util";

/* ------------------------------------------------------------------ sky */
export interface SkyOptions {
  top: THREE.ColorRepresentation;
  hor: THREE.ColorRepresentation;
  glow?: THREE.ColorRepresentation;
  sun?: THREE.ColorRepresentation;
  sunSize?: number;
  sunI?: number;
  glowI?: number;
  hazeI?: number;
  cloudI?: number;
  moon?: number;
  milky?: number;
}

export function makeSkyDome(o: SkyOptions, radius = 900) {
  const uniforms = {
    top: { value: new THREE.Color(o.top) },
    hor: { value: new THREE.Color(o.hor) },
    glowCol: { value: new THREE.Color(o.glow ?? o.hor) },
    sunCol: { value: new THREE.Color(o.sun ?? 0xffffff) },
    sunDir: { value: new THREE.Vector3(0, 0.1, -1).normalize() },
    sunSize: { value: o.sunSize ?? 0.03 },
    sunI: { value: o.sunI ?? 0 },
    glowI: { value: o.glowI ?? 0 },
    hazeI: { value: o.hazeI ?? 0 },
    cloudI: { value: o.cloudI ?? 0 },
    moon: { value: o.moon ?? 0 },
    milky: { value: o.milky ?? 0 },
    milkyN: { value: new THREE.Vector3(0.35, 0.55, 0.76).normalize() },
    uTime: shared.uTime,
  };
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 top, hor, glowCol, sunCol, sunDir, milkyN;
      uniform float sunSize, sunI, glowI, hazeI, cloudI, moon, milky, uTime;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        float hp = max(h, 0.0);
        vec3 col = mix(hor, top, pow(smoothstep(0.0, 0.8, hp), 0.6));
        col = mix(col, hor * 0.55, smoothstep(0.0, -0.3, h));
        float mu = dot(d, sunDir);
        float m = max(mu, 0.0);
        /* haze along the horizon, gathering toward the sun */
        col += glowCol * exp(-abs(h) * 8.0) * hazeI * (0.3 + 0.7 * pow(m, 3.0));
        /* forward scattering around the disc */
        col += glowCol * glowI * (pow(m, 5.0) * 0.3 + pow(m, 40.0) * 0.8 + pow(m, 500.0) * 2.2);
        /* high thin cloud, lit from beneath near the sun */
        if (cloudI > 0.0 && h > -0.02) {
          vec2 uv = d.xz / (h + 0.14);
          float c = fbm(uv * vec2(0.55, 2.2) + vec2(uTime * 0.006, 0.0));
          c = smoothstep(0.5, 0.86, c) * smoothstep(0.0, 0.07, h) * (1.0 - smoothstep(0.3, 0.65, h));
          vec3 lit = mix(top * 1.6 + glowCol * 0.25, glowCol * 1.9 + sunCol * 0.35, pow(m, 3.0));
          col = mix(col, lit, c * cloudI);
        }
        /* the galaxy band, with dark dust lanes */
        if (milky > 0.0) {
          float b = dot(d, milkyN);
          float band = exp(-b * b * 11.0);
          float n = fbm3(d * 3.5);
          float lanes = smoothstep(0.42, 0.72, fbm3(d * 7.0 + 4.0)) * exp(-b * b * 40.0);
          vec3 mw = mix(vec3(0.42, 0.5, 0.78), vec3(0.95, 0.82, 0.62), exp(-b * b * 60.0) * 0.6);
          col += mw * band * (0.18 + n * n * 1.1) * (1.0 - lanes * 0.85) * milky * smoothstep(-0.05, 0.25, h);
        }
        /* the disc: sun at dusk, the moon at night */
        float r = sunSize;
        float disc = smoothstep(cos(r * 1.04), cos(r * 0.96), mu);
        if (disc > 0.0) {
          vec3 up = abs(sunDir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
          vec3 tx = normalize(cross(up, sunDir));
          vec3 ty = cross(sunDir, tx);
          vec2 q = vec2(dot(d, tx), dot(d, ty)) / sin(r);
          float limb = sqrt(max(0.0, 1.0 - dot(q, q)));
          float mare = fbm(q * 3.2 + 3.0);
          vec3 sunTone = sunCol * (0.6 + 0.4 * limb);
          vec3 moonTone = sunCol * (0.75 - smoothstep(0.45, 0.7, mare) * 0.3) * (0.7 + 0.3 * limb);
          col = mix(col, mix(sunTone, moonTone, moon) * sunI, disc);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return { mesh, uniforms };
}

/* ------------------------------------------------------------ soft points */
export interface PointsOptions {
  positions: number[];
  sizes?: number[];
  colors?: number[];
  size: number;
  color?: THREE.ColorRepresentation;
  intensity?: number;
  twinkle?: number;
  attenuate?: boolean;
  fadeNear?: number;
  fadeFar?: number;
}

export function softPoints(o: PointsOptions) {
  const n = o.positions.length / 3;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(o.positions, 3));
  const sizes = o.sizes ?? new Array(n).fill(1);
  const colors = o.colors ?? new Array(n * 3).fill(1);
  const phase: number[] = [];
  for (let i = 0; i < n; i++) phase.push((Math.sin(i * 12.9898) * 43758.5453) % 1);
  g.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
  g.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
  const uniforms = {
    color: { value: new THREE.Color(o.color ?? 0xffffff) },
    intensity: { value: o.intensity ?? 1 },
    opacity: { value: 1 },
    uSize: { value: o.size },
    twinkle: { value: o.twinkle ?? 0 },
    attenuate: { value: o.attenuate ? 1 : 0 },
    fadeNear: { value: o.fadeNear ?? 1e5 },
    fadeFar: { value: o.fadeFar ?? 2e5 },
    uTime: shared.uTime,
    uPR: shared.uPR,
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSize; attribute vec3 aColor; attribute float aPhase;
      uniform float uSize, uPR, uTime, twinkle, attenuate, fadeNear, fadeFar;
      varying vec3 vCol; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float ph = abs(aPhase);
        float tw = 1.0 - twinkle * (0.5 + 0.5 * sin(uTime * (0.8 + ph * 2.6) + ph * 40.0));
        vA = tw * (1.0 - smoothstep(fadeNear, fadeFar, -mv.z));
        vCol = aColor;
        float s = uSize * aSize * uPR;
        gl_PointSize = attenuate > 0.5 ? s * (60.0 / -mv.z) : s;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color; uniform float intensity, opacity;
      varying vec3 vCol; varying float vA;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c) * 2.0;
        float a = exp(-d * d * 5.0) * (1.0 - smoothstep(0.85, 1.0, d));
        gl_FragColor = vec4(color * vCol * intensity, a * vA * opacity);
      }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return { points: pts, uniforms, geometry: g };
}

/* ---------------------------------------------------------------- water */
export const NILE_GLSL = /* glsl */ `
  float pathX(float z){ return sin(z * 0.024) * 2.0; }
  float sst(float a, float b, float x){ x = clamp((x - a) / (b - a), 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }
  float bankH(float x, float z){
    float dx = abs(x - pathX(z));
    float b = sst(8.0, 24.0, dx);
    return b * (2.2 + sin(x * 0.08 + z * 0.05) * 1.6 + sin(z * 0.11 - x * 0.04) * 1.2) - 0.6 * (1.0 - b) + sst(12.0, 18.0, dx) * 1.2;
  }
`;

export interface WaterOptions {
  width: number;
  length: number;
  deep: THREE.ColorRepresentation;
  tint: THREE.ColorRepresentation;
  fog: THREE.ColorRepresentation;
  fogNear: number;
  fogFar: number;
  shore: boolean;
  multisample?: number;
}

export function makeWater(o: WaterOptions) {
  const shader = {
    name: "NileWater",
    uniforms: {
      tDiffuse: { value: null },
      color: { value: new THREE.Color(0xffffff) },
      textureMatrix: { value: new THREE.Matrix4() },
      deep: { value: new THREE.Color(o.deep) },
      tint: { value: new THREE.Color(o.tint) },
      fogc: { value: new THREE.Color(o.fog) },
      sunCol: { value: new THREE.Color(0xffc080) },
      sunDir: { value: new THREE.Vector3(0, 0.1, -1).normalize() },
      fogNear: { value: o.fogNear },
      fogFar: { value: o.fogFar },
      reflI: { value: 1 },
      specI: { value: 1 },
      shoreOn: { value: o.shore ? 1 : 0 },
      dim: { value: 0 },
      uTime: shared.uTime,
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
      uniform sampler2D tDiffuse;
      uniform vec3 deep, tint, fogc, sunCol, sunDir;
      uniform float fogNear, fogFar, reflI, specI, shoreOn, uTime, dim;
      varying vec4 vUv4; varying vec3 vW;
      ${NOISE_GLSL}
      ${NILE_GLSL}
      /* long swells running with the current, chop across them, fine ripples on top */
      float H(vec2 p){
        float t = uTime;
        float h = vnoise(p * vec2(0.32, 0.11) + vec2(0.0, t * 0.22)) * 0.6;
        h += vnoise(p * vec2(0.9, 0.42) - vec2(t * 0.12, t * 0.5)) * 0.3;
        h += vnoise(p * vec2(2.4, 1.3) + vec2(t * 0.3, -t * 0.9)) * 0.12;
        return h;
      }
      void main(){
        vec3 V = cameraPosition - vW;
        float dist = length(V);
        V /= dist;
        vec2 p = vW.xz;
        float e = 0.12;
        float h0 = H(p);
        float s = mix(0.55, 0.12, smoothstep(12.0, 140.0, dist));
        vec3 n = normalize(vec3((h0 - H(p + vec2(e, 0.0))) / e * s, 1.0, (h0 - H(p + vec2(0.0, e))) / e * s));
        float ndv = max(dot(n, V), 0.0);
        float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
        vec2 uv = vUv4.xy / vUv4.w + n.xz * 0.05;
        vec3 refl = texture2D(tDiffuse, uv).rgb * reflI;
        vec3 body = deep * (0.7 + 0.6 * h0) + tint * pow(1.0 - ndv, 2.0) * 0.12;
        /* al-Mogran: the dark Blue Nile and the pale White Nile run side by side */
        float mog = 0.0;
        if (shoreOn > 0.5) {
          mog = smoothstep(-135.0, -185.0, vW.z) * (1.0 - smoothstep(-340.0, -400.0, vW.z));
          float seam = vW.x - pathX(vW.z) + (vnoise(p * vec2(0.18, 0.06) + vec2(0.0, uTime * 0.04)) - 0.5) * 7.0 + sin(vW.z * 0.07) * 1.4;
          float blue = smoothstep(1.6, -1.6, seam);
          vec3 nb = vec3(0.004, 0.03, 0.05) * (0.8 + 0.5 * h0);
          vec3 nw = vec3(0.17, 0.12, 0.075) * (0.85 + 0.35 * h0);
          float swirl = smoothstep(0.35, 0.0, abs(seam)) * vnoise(p * 0.9 + uTime * 0.2);
          body = mix(body, mix(nw, nb, blue) * (1.0 - dim * 0.8) + nw * swirl * 0.25, mog * 0.9);
        }
        vec3 col = mix(body, refl, clamp(fres + 0.32 - mog * 0.2, 0.0, 1.0));
        /* sun glitter: a broad sheen and needle-sharp glints that bloom */
        vec3 R = reflect(-V, n);
        float sd = max(dot(R, sunDir), 0.0);
        col += sunCol * (pow(sd, 90.0) * 0.6 + pow(sd, 1400.0) * 14.0) * specI;
        if (shoreOn > 0.5) {
          float th = bankH(vW.x, vW.z);
          float shore = smoothstep(-0.42, 0.0, th);
          float foam = smoothstep(0.55, 0.8, vnoise(p * vec2(2.2, 0.7) + vec2(0.0, uTime * 0.4)));
          col = mix(col, tint * 0.35 + col * 0.9, shore * 0.55);
          col += sunCol * 0.06 * foam * shore;
        }
        col = mix(col, fogc, smoothstep(fogNear, fogFar, dist));
        gl_FragColor = vec4(col, 1.0);
      }`,
  };
  const water = new Reflector(new THREE.PlaneGeometry(o.width, o.length), {
    textureWidth: 512,
    textureHeight: 512,
    clipBias: 0.003,
    multisample: o.multisample ?? 0,
    shader,
  });
  water.rotation.x = -Math.PI / 2;
  const uniforms = (water.material as THREE.ShaderMaterial).uniforms as typeof shader.uniforms;
  return { water, uniforms };
}

/* ------------------------------------------------------------- stone */
/* MeshStandardMaterial with masonry courses and weathering in world space, and an
   optional per-instance glow attribute ("aGlow") for things you can light up. */
export function stoneMaterial(
  color: THREE.ColorRepresentation,
  opts: { course?: number; glow?: THREE.ColorRepresentation; roughness?: number; metalness?: number; masonry?: boolean } = {}
) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.95, metalness: opts.metalness ?? 0 });
  const glowCol = new THREE.Color(opts.glow ?? 0xffa63d);
  const course = opts.course ?? 2.2;
  const masonry = opts.masonry ?? true;
  mat.onBeforeCompile = (s) => {
    s.uniforms.glowCol = { value: glowCol };
    s.vertexShader = s.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 vWP; varying float vGlow;
         #ifdef USE_INSTANCING
         attribute float aGlow;
         #endif`
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
         vec4 wp4 = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
         wp4 = instanceMatrix * wp4;
         vGlow = aGlow;
         #else
         vGlow = 0.0;
         #endif
         vWP = (modelMatrix * wp4).xyz;`
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform vec3 glowCol;
         varying vec3 vWP; varying float vGlow;
         ${NOISE_GLSL}`
      )
      .replace(
        "#include <color_fragment>",
        masonry
          ? `#include <color_fragment>
         float cy = fract(vWP.y * ${course.toFixed(2)});
         float joint = smoothstep(0.0, 0.09, cy) * smoothstep(1.0, 0.9, cy);
         float blk = hash12(floor(vec2(vWP.x + vWP.z, vWP.y) * vec2(1.3, ${course.toFixed(2)})));
         float grit = vnoise(vWP.xz * 4.0 + vWP.y * 3.0);
         diffuseColor.rgb *= mix(0.72, 1.0, joint) * (0.88 + 0.16 * blk) * (0.9 + 0.2 * grit);`
          : "#include <color_fragment>"
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += glowCol * vGlow;`
      );
  };
  mat.customProgramCacheKey = () => "stone" + course + (masonry ? "m" : "p");
  return mat;
}

/* -------------------------------------------------------------- veils */
/* a curtain of rising light threads, used for the gates on the river */
export function veilMaterial(color: THREE.ColorRepresentation) {
  const uniforms = { col: { value: new THREE.Color(color) }, intensity: { value: 1 }, uTime: shared.uTime };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: /* glsl */ `
      uniform vec3 col; uniform float intensity, uTime;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main(){
        float x = vUv.x, y = vUv.y;
        float edge = pow(abs(x - 0.5) * 2.0, 5.0);
        float lane = floor(x * 46.0);
        float speed = 0.12 + hash12(vec2(lane, 3.0)) * 0.25;
        float streak = smoothstep(0.75, 1.0, fract(y * 0.8 - uTime * speed + hash12(vec2(lane, 9.0))));
        streak *= smoothstep(0.5, 0.0, abs(fract(x * 46.0) - 0.5) - 0.1);
        float shimmer = vnoise(vec2(x * 9.0, y * 3.0 - uTime * 0.4));
        float a = 0.06 + 0.5 * edge + 0.35 * streak + 0.1 * shimmer;
        a *= smoothstep(0.0, 0.06, y) * (1.0 - smoothstep(0.82, 1.0, y) * 0.6);
        gl_FragColor = vec4(col * intensity * a, 1.0);
      }`,
  });
  return { mat, uniforms };
}

/* a soft vertical shaft of light; open cylinder with faded rim and ends */
export function shaftMaterial(color: THREE.ColorRepresentation, intensity = 1) {
  const uniforms = { col: { value: new THREE.Color(color) }, intensity: { value: intensity }, uTime: shared.uTime };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vRim;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vRim = abs(dot(n, normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 col; uniform float intensity, uTime;
      varying vec2 vUv; varying float vRim;
      ${NOISE_GLSL}
      void main(){
        float a = pow(vRim, 2.2) * smoothstep(0.0, 0.25, vUv.y) * pow(1.0 - vUv.y, 0.6);
        a *= 0.75 + 0.25 * vnoise(vec2(vUv.x * 12.0, vUv.y * 4.0 + uTime * 0.3));
        gl_FragColor = vec4(col * intensity * a, 1.0);
      }`,
  });
  return { mat, uniforms };
}

/* a short streak with a bright head, for shooting stars */
export function streakMaterial() {
  const uniforms = { opacity: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: /* glsl */ `
      uniform float opacity; varying vec2 vUv;
      void main(){
        float along = pow(vUv.x, 3.0);
        float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float a = along * pow(across, 2.0) * opacity;
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * (0.6 + 3.0 * pow(vUv.x, 12.0)) * a, 1.0);
      }`,
  });
  return { mat, uniforms };
}

/* a small environment for image-based lighting, built from a few glowing shapes */
export function makeEnvironment(renderer: THREE.WebGLRenderer, build: (s: THREE.Scene) => void) {
  const pm = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene();
  build(s);
  const rt = pm.fromScene(s, 0.02);
  pm.dispose();
  s.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
  });
  return rt.texture;
}

export const emissive = (hex: THREE.ColorRepresentation, k: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide });
