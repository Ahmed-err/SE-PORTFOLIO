/* The finishing chain: HDR render (multisampled where the device can afford it),
   bloom, then one grading pass: exposure, a colour-preserving tone curve,
   contrast, saturation, split toning, vignette, a breath of chromatic fringe,
   film grain and dither. Also carries the white-gold flash between places. */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { damp, type Grade } from "./util";

const GradeShader = {
  name: "Grade",
  uniforms: {
    tDiffuse: { value: null },
    res: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    exposure: { value: 1 },
    sat: { value: 1 },
    contrast: { value: 1 },
    lift: { value: new THREE.Color(0, 0, 0) },
    gain: { value: new THREE.Color(1, 1, 1) },
    vig: { value: 0.3 },
    grain: { value: 0.03 },
    ca: { value: 0.0 },
    flash: { value: 0 },
    flashCol: { value: new THREE.Color(1, 0.86, 0.62) },
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 res;
    uniform float uTime, exposure, sat, contrast, vig, grain, ca, flash;
    uniform vec3 lift, gain, flashCol;
    varying vec2 vUv;
    /* Khronos PBR Neutral: leaves colours alone until they near white */
    vec3 neutral(vec3 c){
      const float start = 0.76;
      const float desat = 0.15;
      float x = min(c.r, min(c.g, c.b));
      float off = x < 0.08 ? x - 6.25 * x * x : 0.04;
      c -= off;
      float peak = max(c.r, max(c.g, c.b));
      if (peak < start) return c;
      const float d = 1.0 - start;
      float np = 1.0 - d * d / (peak + d - start);
      c *= np / peak;
      float g = 1.0 - 1.0 / (desat * (peak - np) + 1.0);
      return mix(c, vec3(np), g);
    }
    float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main(){
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * r2 * ca;
      vec3 col = vec3(texture2D(tDiffuse, vUv - off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + off).b);
      col *= exposure * (1.0 + flash * 5.0);
      col = mix(col, flashCol * 3.0, flash * flash * 0.7);
      col = max(col, 0.0);
      /* contrast around mid grey, in linear light */
      col = 0.18 * pow(col / 0.18 + 1e-5, vec3(contrast));
      col = neutral(col);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, sat);
      /* split toning: tint the shadows and the highlights separately */
      col = col * gain + lift * (1.0 - col) * (1.0 - l);
      col *= 1.0 - vig * smoothstep(0.08, 0.6, r2 * 1.6);
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      #include <colorspace_fragment>
      float n = h12(vUv * res + fract(uTime * 7.31) * 113.0) - 0.5;
      float n2 = h12(vUv * res * 0.5 + fract(uTime * 3.7) * 71.0) - 0.5;
      gl_FragColor.rgb += (n + n2) * 0.5 * grain + (h12(vUv * res + 0.37) - 0.5) / 255.0;
    }`,
};

export function makePost(renderer: THREE.WebGLRenderer, msaa: boolean) {
  const size = renderer.getSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: msaa ? 4 : 0 });
  const composer = new EffectComposer(renderer, rt);
  const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  composer.addPass(renderPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.6, 0.6, 1.0);
  /* bloom works at half resolution: soft light does not need sharp pixels */
  const baseSetSize = bloom.setSize.bind(bloom);
  bloom.setSize = (w: number, h: number) => baseSetSize(Math.max(2, Math.round(w * 0.5)), Math.max(2, Math.round(h * 0.5)));
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  const u = grade.uniforms as typeof GradeShader.uniforms;

  const cur: Grade = {
    exposure: 1,
    sat: 1,
    contrast: 1,
    lift: new THREE.Color(0, 0, 0),
    gain: new THREE.Color(1, 1, 1),
    vig: 0.3,
    grain: 0.03,
    ca: 0,
    bloom: 0.6,
    bloomRadius: 0.6,
    bloomThreshold: 1,
  };
  let first = true;

  let flashAt = -1;
  const flash = (now: number) => {
    flashAt = now;
  };

  const render = (scene: THREE.Scene, camera: THREE.Camera, target: Grade, t: number, dt: number) => {
    renderPass.scene = scene;
    renderPass.camera = camera;
    /* ease the look from one place to the next instead of cutting */
    const k = first ? 1 : 1 - Math.exp(-dt * 2.2);
    first = false;
    cur.exposure += (target.exposure - cur.exposure) * k;
    cur.sat += (target.sat - cur.sat) * k;
    cur.contrast += (target.contrast - cur.contrast) * k;
    cur.lift.lerp(target.lift, k);
    cur.gain.lerp(target.gain, k);
    cur.vig += (target.vig - cur.vig) * k;
    cur.grain += (target.grain - cur.grain) * k;
    cur.ca += (target.ca - cur.ca) * k;
    cur.bloom = damp(cur.bloom, target.bloom, 2.2, dt);
    cur.bloomRadius = damp(cur.bloomRadius, target.bloomRadius, 2.2, dt);
    cur.bloomThreshold = damp(cur.bloomThreshold, target.bloomThreshold, 2.2, dt);
    bloom.strength = cur.bloom;
    bloom.radius = cur.bloomRadius;
    bloom.threshold = cur.bloomThreshold;

    /* flash: rise over 0.6s, hold, fall over 0.9s */
    let f = 0;
    if (flashAt >= 0) {
      const a = t - flashAt;
      if (a < 0.6) f = Math.pow(a / 0.6, 2.2);
      else if (a < 0.72) f = 1;
      else if (a < 1.65) f = 1 - Math.pow((a - 0.72) / 0.93, 0.7);
      else flashAt = -1;
    }
    u.flash.value = f;
    u.exposure.value = cur.exposure;
    u.sat.value = cur.sat;
    u.contrast.value = cur.contrast;
    u.lift.value.copy(cur.lift);
    u.gain.value.copy(cur.gain);
    u.vig.value = cur.vig;
    u.grain.value = cur.grain;
    u.ca.value = cur.ca;
    u.uTime.value = t;
    composer.render(dt);
  };

  const setSize = (w: number, h: number, pr: number) => {
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    u.res.value.set(w * pr, h * pr);
  };

  const dispose = () => {
    rt.dispose();
    composer.dispose();
    bloom.dispose();
  };

  return { render, setSize, flash, dispose };
}
