/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Port scene 3D dari sigillum.html (three r160 -> three 0.184), CP9.
 *
 * Yang SAMA dengan HTML: kota instancing + shader jendela/lantai, kubah Vault (spire + cincin + orb),
 * paket data, lalu lintas, debu & bintang, post-processing bloom, kamera yang mengikuti section
 * (data-cam), picking menara, label district.
 *
 * Yang BERBEDA (keputusan CP0):
 *  - Menara mind = baris `agents` dari DB (bukan 20 nama contoh HTML). Posisi = slot per district
 *    (steward di slot terdekat). Tinggi menara & kilaunya mengikuti revenue / status job.
 *  - Siang/malam otomatis (uniform `uDay`, dari daylightAt; bisa dikunci lewat lib/city/day-mode.ts) -- HTML aslinya hanya malam.
 *  - Seluruh resource di-dispose saat `dispose()`; fallback bila WebGL gagal; reduced-motion
 *    mematikan auto-rotate; mobile menurunkan DPR & jumlah objek.
 *
 * Tidak ada innerHTML: semua teks dari DB masuk lewat textContent.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { DISTRICT_ORDER, type DistrictId } from '@/types/domain';
import {
  SECTION_CAMS,
  daylightAt,
  sunDirectionOf,
  sunPoseAt,
  type SceneDistrict,
  type SceneMind,
  type SunPose,
} from '@/lib/city/scene-config';
import { getDayMode, subscribeDayMode } from '@/lib/city/day-mode';

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  labelsEl: HTMLElement;
  tipEl: HTMLElement;
  districts: SceneDistrict[];
  minds: SceneMind[];
  onPickMind(id: string): void;
  /** District disorot (label diklik) atau null (sorotan dihapus karena section berganti). */
  onDistrict(id: DistrictId | null): void;
  /** Frame pertama sudah tergambar. */
  onReady(): void;
  /** WebGL tidak tersedia / konteks hilang. */
  onFail(): void;
}

export interface SceneHandle {
  focusDistrict(id: DistrictId): void;
  focusMind(id: string): void;
  clear(): void;
  dispose(): void;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function createSigillumScene(opts: SceneOptions): SceneHandle | null {
  const { canvas, labelsEl, tipEl } = opts;
  const mobile = matchMedia('(max-width: 760px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rnd = mulberry32(20261013);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    opts.onFail();
    return null;
  }

  const PR = Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 1.75);
  renderer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  const FOG_N = new THREE.Color().setRGB(0.028, 0.034, 0.06);
  const FOG_D = new THREE.Color().setRGB(0.3, 0.4, 0.54);
  const fogColor = FOG_N.clone();
  scene.background = fogColor.clone();
  scene.fog = new THREE.FogExp2(fogColor, 0.0076);
  const camera = new THREE.PerspectiveCamera(
    mobile ? 56 : 38,
    innerWidth / innerHeight,
    0.1,
    1200,
  );

  const U = {
    uTime: { value: 0 },
    uPR: { value: PR },
    uDay: { value: 0 },
    uWarm: { value: 0 },
  };
  const SUN_N = new THREE.Vector3(-0.55, 0.28, -0.79).normalize();
  const SUN_D = new THREE.Vector3();
  const SUN = SUN_N.clone();

  const DIST = DISTRICT_ORDER.map((id) => {
    const d = opts.districts.find((x) => x.id === id)!;
    return { ...d, col: new THREE.Color(d.color) };
  });
  const dAng = (i: number) => (i * Math.PI * 2) / 5 - Math.PI / 2;
  const bAng = (i: number) => dAng(i) + Math.PI / 5;
  const districtIndex = (id: DistrictId) => DISTRICT_ORDER.indexOf(id);

  /* ---------- Sky + environment reflections ---------- */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSun: { value: SUN },
      uDay: U.uDay,
      uWarm: U.uWarm,
      uFog: { value: fogColor },
    },
    vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uSun; uniform float uDay; uniform float uWarm; uniform vec3 uFog; varying vec3 vD;
    void main(){
      vec3 d = normalize(vD); float h = d.y;
      float s = max(dot(d, uSun), 0.0);
      vec3 zenD = mix(vec3(0.09,0.21,0.46), vec3(0.13,0.19,0.40), uWarm*0.6);
      vec3 zen = mix(vec3(0.004,0.009,0.028), zenD, uDay);
      vec3 horN = mix(vec3(0.028,0.034,0.06), vec3(0.40,0.26,0.13), pow(s, 4.0));
      horN = mix(horN, vec3(0.09,0.075,0.07), pow(s,1.5)*0.35);
      vec3 horD = mix(vec3(0.40,0.52,0.68), vec3(0.88,0.74,0.56), pow(s, 6.0)*0.8);
      // Matahari rendah (pagi/sore): horizon keemasan, paling pekat di sekitar arah matahari.
      vec3 horW = mix(vec3(0.74,0.50,0.40), vec3(1.0,0.68,0.34), pow(s, 3.0));
      horD = mix(horD, horW, uWarm*0.9);
      vec3 hor = mix(horN, horD, uDay);
      vec3 col = mix(hor, zen, pow(smoothstep(0.0, 0.65, h), 0.55));
      col += vec3(1.0,0.72,0.45)*pow(s, 400.0)*6.0*(1.0 - uDay*0.45) + vec3(1.0,0.68,0.40)*pow(s, 18.0)*(0.35 + uDay*0.45);
      col = mix(col, uFog, smoothstep(0.0,-0.08,h));
      gl_FragColor = vec4(col,1.0);
    }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), skyMat);
  sky.renderOrder = -1;
  scene.add(sky);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), skyMat);
  envScene.add(envSky);
  let envRT: THREE.WebGLRenderTarget | null = null;
  function buildEnv() {
    const next = pmrem.fromScene(envScene, 0.03);
    scene.environment = next.texture;
    envRT?.dispose();
    envRT = next;
  }

  /* ---------- Lights ---------- */
  const sun = new THREE.DirectionalLight(0xf3d2a6, 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, {
    left: -72,
    right: 72,
    top: 72,
    bottom: -72,
    near: 20,
    far: 360,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x8197b8, 0x0b0c10, 0.55);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xfff4e6, 0); // pengisi siang hari: mengangkat sisi yang tidak kena matahari
  scene.add(amb);
  const rim = new THREE.DirectionalLight(0x9fb8d8, 0.6);
  rim.position.set(60, 40, 70);
  scene.add(rim);

  /* ---------- Ground: blocks, roads, plaza ---------- */
  const ground = (() => {
    const g = new THREE.PlaneGeometry(800, 800);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1,
      envMapIntensity: 0.6,
    });
    m.onBeforeCompile = (sh: any) => {
      sh.uniforms.uTime = U.uTime;
      sh.uniforms.uDay = U.uDay;
      sh.uniforms.uAng = { value: [0, 1, 2, 3, 4].map(bAng) };
      sh.uniforms.uDA = { value: [0, 1, 2, 3, 4].map(dAng) };
      sh.uniforms.uDC = { value: DIST.map((d) => d.col) };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vGW;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvGW = (modelMatrix*vec4(transformed,1.0)).xyz;',
        );
      sh.fragmentShader = sh.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
        uniform float uTime; uniform float uDay; uniform float uAng[5]; uniform float uDA[5]; uniform vec3 uDC[5]; varying vec3 vGW;
        float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(gh(i), gh(i+vec2(1.0,0.0)), f.x), mix(gh(i+vec2(0.0,1.0)), gh(i+vec2(1.0,1.0)), f.x), f.y); }`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
        vec2 gp = vGW.xz; float gr = length(gp);
        float road = 0.0; float dash = 0.0; float curb = 0.0;
        for(int i=0;i<5;i++){
          float a = uAng[i]; vec2 dd = vec2(cos(a), sin(a));
          float pr = dot(gp, dd); float pp = abs(-gp.x*dd.y + gp.y*dd.x);
          float on = step(7.2, pr);
          road = max(road, on*(1.0 - smoothstep(1.45, 1.6, pp)));
          curb = max(curb, on*(1.0 - smoothstep(0.0, 0.12, abs(pp-1.6))));
          dash = max(dash, on*(1.0 - smoothstep(0.035, 0.08, pp))*step(0.5, fract(pr*0.35)));
        }
        float rr = abs(gr - 12.5);
        road = max(road, 1.0 - smoothstep(1.45, 1.6, rr));
        curb = max(curb, 1.0 - smoothstep(0.0, 0.12, abs(rr-1.6)));
        dash = max(dash, (1.0 - smoothstep(0.035, 0.08, rr))*step(0.5, fract(atan(gp.y, gp.x)*12.5*0.35)));
        float plaza = 1.0 - smoothstep(6.6, 6.75, gr);
        vec2 tile = abs(fract(gp*0.5) - 0.5);
        float joint = 1.0 - smoothstep(0.47, 0.5, max(tile.x, tile.y));
        vec3 pave = vec3(0.13,0.125,0.12)*(0.78 + 0.35*gn(gp*0.7))*(0.88 + 0.12*joint);
        vec3 asph = vec3(0.022,0.024,0.028)*(0.75 + 0.5*gn(gp*4.0));
        vec3 gcol = mix(pave, asph, road);
        gcol = mix(gcol, vec3(0.2,0.19,0.18), curb*0.8);
        gcol = mix(gcol, vec3(0.2,0.19,0.18)*(0.9+0.1*joint), plaza);
        gcol *= mix(0.55, 1.0, smoothstep(160.0, 50.0, gr));
        gcol *= 1.0 + uDay*1.1; // aspal & paving dirancang gelap untuk malam: angkat saat siang
        diffuseColor.rgb = gcol;
        float gRough = mix(0.9, 0.42, road);`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor = gRough;',
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
        float dn = 1.0 - uDay*0.8;
        vec3 gold = vec3(0.69,0.485,0.195);
        vec3 zone = vec3(0.0);
        for(int i=0;i<5;i++){
          float da = atan(sin(atan(gp.y, gp.x) - uDA[i]), cos(atan(gp.y, gp.x) - uDA[i]));
          zone += uDC[i]*exp(-da*da*9.0);
        }
        float zr = smoothstep(9.0, 16.0, gr)*smoothstep(62.0, 30.0, gr);
        totalEmissiveRadiance += zone*zr*(1.0 - road)*0.05*dn;
        totalEmissiveRadiance += gold*dash*0.55*smoothstep(70.0, 18.0, gr)*dn;
        totalEmissiveRadiance += gold*exp(-pow(gr-6.7, 2.0)*60.0)*1.6*dn;
        float pt = fract(uTime*0.055);
        totalEmissiveRadiance += gold*exp(-pow((gr - pt*90.0)*0.5, 2.0))*(1.0-pt)*0.18*dn;`,
        );
    };
    const mesh = new THREE.Mesh(g, m);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  })();
  void ground;

  /* ---------- Architecture generator ---------- */
  // shape 0 = box, 1 = cylinder
  // mat: 0 glass curtain wall · 1 limestone, punched windows · 2 dark metal, ribbon windows · 3 concrete podium / rooftop plant / slabs
  type Part = {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    d: number;
    rot: number;
    mat: number;
    col: THREE.Color;
    acc: number;
    seed: number;
    b: number;
  };
  const parts: Part[][] = [[], []];
  const bInst: Array<Array<[number, number]>> = [];
  let bCount = 0;
  const rotXZ = (ox: number, oz: number, r: number) => [
    ox * Math.cos(r) + oz * Math.sin(r),
    -ox * Math.sin(r) + oz * Math.cos(r),
  ];
  const at = (x: number, z: number, ox: number, oz: number, rot: number) => {
    const [rx, rz] = rotXZ(ox, oz, rot);
    return [x + rx, z + rz];
  };
  function put(
    shape: number,
    b: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rot: number,
    mat: number,
    col: THREE.Color,
    acc?: number,
  ) {
    parts[shape].push({
      x,
      y,
      z,
      w,
      h,
      d,
      rot,
      mat,
      col,
      acc: acc || 0,
      seed: rnd() * 100,
      b,
    });
    return y + h;
  }
  const box = (
    b: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rot: number,
    mat: number,
    col: THREE.Color,
    acc?: number,
  ) => put(0, b, x, y, z, w, h, d, rot, mat, col, acc);
  const cyl = (
    b: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    rot: number,
    mat: number,
    col: THREE.Color,
    acc?: number,
  ) => put(1, b, x, y, z, w, h, w, rot, mat, col, acc);

  function plant(
    b: number,
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    rot: number,
    col: THREE.Color,
  ) {
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const [px, pz] = at(
        x,
        z,
        (rnd() - 0.5) * w * 0.55,
        (rnd() - 0.5) * d * 0.55,
        rot,
      );
      if (rnd() < 0.3)
        cyl(b, px, y, pz, 0.45 + rnd() * 0.3, 0.6 + rnd() * 0.4, rot, 3, col);
      else
        box(
          b,
          px,
          y,
          pz,
          0.3 + rnd() * 0.5,
          0.22 + rnd() * 0.4,
          0.3 + rnd() * 0.5,
          rot,
          3,
          col,
        );
    }
  }
  const mast = (
    b: number,
    x: number,
    y: number,
    z: number,
    rot: number,
    h: number,
    col: THREE.Color,
  ) => box(b, x, y, z, 0.09, h, 0.09, rot, 2, col);

  function fins(
    b: number,
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    rot: number,
    col: THREE.Color,
  ) {
    const nx = Math.max(2, Math.round(w / 0.7)),
      nz = Math.max(2, Math.round(d / 0.7));
    for (const s of [1, -1]) {
      for (let i = 1; i < nx; i++) {
        const [fx, fz] = at(
          x,
          z,
          -w / 2 + (i * w) / nx,
          s * (d / 2 + 0.06),
          rot,
        );
        box(b, fx, y, fz, 0.05, h, 0.13, rot, 2, col);
      }
      for (let i = 1; i < nz; i++) {
        const [fx, fz] = at(
          x,
          z,
          s * (w / 2 + 0.06),
          -d / 2 + (i * d) / nz,
          rot,
        );
        box(b, fx, y, fz, 0.13, h, 0.05, rot, 2, col);
      }
    }
  }
  function balconies(
    b: number,
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    rot: number,
    col: THREE.Color,
  ) {
    for (let yy = y + 0.85; yy < y + h - 0.4; yy += 0.85)
      box(b, x, yy, z, w + 0.26, 0.06, d + 0.26, rot, 3, col);
  }
  function roundFins(
    b: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    rot: number,
    col: THREE.Color,
  ) {
    const n = 12,
      r = w / 2 + 0.05;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      box(
        b,
        x + Math.cos(a) * r,
        y,
        z + Math.sin(a) * r,
        0.06,
        h,
        0.06,
        rot,
        2,
        col,
      );
    }
  }

  type Plan = {
    podium?: boolean;
    round?: boolean;
    fins?: boolean;
    balc?: boolean;
    tiers: number[][];
    mast?: number;
    H?: number;
    w?: number;
  };
  /* A building is a stack of tiers; each tier can be a box or a cylinder */
  function stack(
    b: number,
    x: number,
    z: number,
    rot: number,
    w: number,
    d: number,
    H: number,
    col: THREE.Color,
    plan: Plan,
    acc: number,
  ) {
    let y = 0,
      cw = w,
      cd = d;
    if (plan.podium)
      y = box(b, x, 0, z, w * 1.32, 1.4 + rnd() * 1.2, d * 1.32, rot, 3, col);
    const rem = H - y;
    for (const [fr, sh, mat] of plan.tiers) {
      cw *= sh;
      cd *= sh;
      const th = rem * fr,
        a = mat === 3 ? 0 : acc;
      if (plan.round) {
        cyl(b, x, y, z, cw, th, rot, mat, col, a);
        if (plan.fins && mat === 0) roundFins(b, x, y, z, cw, th, rot, col);
      } else {
        box(b, x, y, z, cw, th, cd, rot, mat, col, a);
        if (plan.fins && mat === 0) fins(b, x, y, z, cw, cd, th, rot, col);
        if (plan.balc && mat === 1) balconies(b, x, y, z, cw, cd, th, rot, col);
      }
      y += th;
    }
    return { y, cw, cd };
  }

  /* Mind towers: four signature designs per district (slot 0 = steward) */
  const DESIGNS: Required<Pick<Plan, 'H' | 'w' | 'tiers' | 'mast'>>[] & Plan[] =
    [
      {
        H: 23,
        w: 3.0,
        podium: true,
        fins: true,
        tiers: [
          [0.58, 1, 0],
          [0.24, 0.8, 0],
          [0.18, 0.7, 2],
        ],
        mast: 6,
      },
      {
        H: 18,
        w: 2.6,
        podium: false,
        fins: true,
        balc: true,
        tiers: [
          [0.45, 1, 1],
          [0.55, 0.86, 0],
        ],
        mast: 2.5,
      },
      {
        H: 22,
        w: 2.6,
        podium: true,
        tiers: [
          [0.82, 1, 2],
          [0.18, 0.74, 0],
        ],
        mast: 3.5,
      },
      {
        H: 17,
        w: 2.7,
        podium: false,
        round: true,
        fins: true,
        tiers: [
          [0.6, 1, 0],
          [0.25, 0.86, 0],
          [0.15, 0.66, 2],
        ],
        mast: 2.2,
      },
    ];
  const SLOTS = [
    { r: 15.5, da: -0.2 },
    { r: 21.5, da: 0.22 },
    { r: 28, da: -0.1 },
    { r: 34.5, da: 0.2 },
  ];

  // Urutan per district: steward dulu, lalu revenue terbesar (sama dengan daftar di kartu district).
  const placed: SceneMind[] = [];
  const mindIndex = new Map<string, number>();
  DISTRICT_ORDER.forEach((did) => {
    opts.minds
      .filter((m) => m.district === did)
      .sort(
        (a, b) =>
          Number(b.isLead) - Number(a.isLead) ||
          b.revenue - a.revenue ||
          a.name.localeCompare(b.name),
      )
      .slice(0, SLOTS.length) // hanya 4 slot per district; kelebihannya tidak punya menara
      .forEach((m) => {
        mindIndex.set(m.id, placed.length);
        placed.push(m);
      });
  });
  const nMinds = placed.length;

  const mindPos: THREE.Vector3[] = [];
  const slotOf = (i: number) => {
    let k = 0;
    for (let j = 0; j < i; j++)
      if (placed[j].district === placed[i].district) k++;
    return k;
  };
  placed.forEach((m, i) => {
    const di = districtIndex(m.district);
    const k = slotOf(i);
    const s = SLOTS[k],
      ds = DESIGNS[k];
    // Aliran acak terpisah per menara: tata kota di sekitarnya tidak bergeser bila data berubah.
    const saved = rnd;
    rnd = mulberry32(7919 * (di + 1) + 104729 * (k + 1));
    const a = dAng(di) + s.da;
    const x = Math.cos(a) * s.r,
      z = Math.sin(a) * s.r,
      rot = -a;
    const b = i;
    bCount = Math.max(bCount, i + 1);
    const col = DIST[di].col;
    // Tinggi 0.85x - 1.2x dari desain, naik halus mengikuti revenue (saturasi di ~1500 SGUM).
    const hf = 0.85 + 0.35 * (1 - Math.exp(-Math.max(0, m.revenue) / 1500));
    const r = stack(b, x, z, rot, ds.w, ds.w, ds.H * hf, col, ds, 1);
    let top = ds.round
      ? cyl(b, x, r.y, z, r.cw * 0.55, 0.7, rot, 3, col)
      : box(b, x, r.y, z, r.cw * 0.5, 0.7, r.cd * 0.5, rot, 3, col);
    plant(b, x, top, z, r.cw * 0.5, r.cd * 0.5, rot, col);
    top = mast(b, x, top, z, rot, ds.mast, col);
    mindPos.push(new THREE.Vector3(x, top, z));
    rnd = saved;
  });
  rnd = mulberry32(20261013);

  const onAvenue = (x: number, z: number, half: number) => {
    for (let i = 0; i < 5; i++) {
      const bb = bAng(i),
        dx = Math.cos(bb),
        dz = Math.sin(bb);
      if (x * dx + z * dz > 0 && Math.abs(-x * dz + z * dx) < half) return true;
    }
    return false;
  };
  const nearestDistrict = (ang: number) => {
    let best = 0,
      bd = 9;
    for (let i = 0; i < 5; i++) {
      const dd = Math.abs(
        Math.atan2(Math.sin(ang - dAng(i)), Math.cos(ang - dAng(i))),
      );
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    return best;
  };

  /* Inner city fabric */
  {
    const step = 3.3;
    for (let gx = -56; gx <= 56; gx += step) {
      for (let gz = -56; gz <= 56; gz += step) {
        const x = gx + (rnd() - 0.5) * 0.6,
          z = gz + (rnd() - 0.5) * 0.6;
        const r = Math.hypot(x, z);
        if (r < 9.2 || r > 56) continue;
        if (Math.abs(r - 12.5) < 2.6) continue;
        if (onAvenue(x, z, 2.9)) continue;
        if (mindPos.some((p) => Math.hypot(p.x - x, p.z - z) < 4.2)) continue;
        if (rnd() < 0.16) continue;
        const ang = Math.atan2(z, x);
        const col = DIST[nearestDistrict(ang)].col;
        const near = 1 - (r - 9.2) / 47;
        let h = 1.4 + rnd() * 3.2 + near * near * rnd() * 10;
        if (rnd() < 0.07) h += 5 + rnd() * 5;
        if (r > 46) h *= 0.55;
        const w = 1.5 + rnd() * 0.9,
          d = 1.5 + rnd() * 0.9,
          rot = -ang;
        const b = bCount++;
        if (h < 3.6) {
          const top = box(b, x, 0, z, w, h, d, rot, rnd() < 0.6 ? 1 : 3, col);
          if (rnd() < 0.6) plant(b, x, top, z, w, d, rot, col);
        } else if (h < 9) {
          const mat = [1, 1, 2, 0][Math.floor(rnd() * 4)];
          let top: number;
          if (rnd() < 0.28) {
            const [ax, az] = at(x, z, 0, -d * 0.22, rot),
              [bx, bz] = at(x, z, w * 0.25, d * 0.0, rot);
            top = box(b, ax, 0, az, w, h, d * 0.55, rot, mat, col);
            box(b, bx, 0, bz, w * 0.5, h * 0.72, d, rot, mat, col);
            if (mat === 1 && rnd() < 0.5)
              balconies(b, ax, 0, az, w, d * 0.55, h, rot, col);
          } else {
            top = box(b, x, 0, z, w, h, d, rot, mat, col);
            if (mat === 1 && rnd() < 0.45)
              balconies(b, x, 0, z, w, d, h, rot, col);
            if (mat === 0 && rnd() < 0.4) fins(b, x, 0, z, w, d, h, rot, col);
            if (rnd() < 0.5)
              top = box(b, x, top, z, w * 0.55, 0.8, d * 0.55, rot, 3, col);
          }
          plant(b, x, top, z, w * 0.6, d * 0.6, rot, col);
        } else {
          const plans: Plan[] = [
            {
              podium: w < 2,
              fins: true,
              tiers: [
                [0.7, 1, 0],
                [0.3, 0.82, 0],
              ],
            },
            {
              podium: w < 2,
              balc: true,
              tiers: [
                [0.55, 1, 1],
                [0.45, 0.85, 1],
              ],
            },
            { podium: false, tiers: [[1, 1, 2]] },
            {
              podium: w < 2,
              tiers: [
                [0.6, 1, 1],
                [0.4, 0.8, 0],
              ],
            },
            {
              podium: false,
              round: true,
              fins: rnd() < 0.5,
              tiers: [
                [0.75, 1, 0],
                [0.25, 0.82, 0],
              ],
            },
          ];
          const plan = plans[Math.floor(rnd() * plans.length)];
          const fw = plan.round ? Math.min(w, d) : w;
          const r2 = stack(
            b,
            x,
            z,
            rot,
            fw,
            plan.round ? fw : d,
            h,
            col,
            plan,
            0,
          );
          const top = plan.round
            ? cyl(b, x, r2.y, z, r2.cw * 0.55, 0.7, rot, 3, col)
            : box(b, x, r2.y, z, r2.cw * 0.55, 0.7, r2.cd * 0.55, rot, 3, col);
          plant(b, x, top, z, r2.cw * 0.5, r2.cd * 0.5, rot, col);
          if (rnd() < 0.45) mast(b, x, top, z, rot, 1.5 + rnd() * 3, col);
        }
      }
    }
  }

  /* Distant skyline: low-detail blocks out to the horizon */
  {
    const step = 4.4;
    for (let gx = -130; gx <= 130; gx += step) {
      for (let gz = -130; gz <= 130; gz += step) {
        const x = gx + (rnd() - 0.5) * 1.2,
          z = gz + (rnd() - 0.5) * 1.2;
        const r = Math.hypot(x, z);
        if (r < 60 || r > 130) continue;
        if (onAvenue(x, z, 3.4)) continue;
        if (rnd() < 0.42) continue;
        const ang = Math.atan2(z, x),
          rot = -ang;
        const col = DIST[nearestDistrict(ang)].col;
        let h = 1.5 + rnd() * 5 + (rnd() < 0.12 ? 6 + rnd() * 10 : 0);
        h *= 1 - (r - 60) / 180;
        const w = 2 + rnd() * 1.6,
          d = 2 + rnd() * 1.6;
        const b = bCount++;
        if (h > 10 && rnd() < 0.3)
          cyl(b, x, 0, z, Math.min(w, d), h, rot, 0, col);
        else {
          const top = box(
            b,
            x,
            0,
            z,
            w,
            h,
            d,
            rot,
            [1, 1, 2, 0][Math.floor(rnd() * 4)],
            col,
          );
          if (rnd() < 0.4)
            box(b, x, top, z, w * 0.5, 0.6, d * 0.5, rot, 3, col);
        }
      }
    }
  }

  /* ---------- Building material ---------- */
  const bMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.2,
    envMapIntensity: 1.15,
  });
  bMat.onBeforeCompile = (sh: any) => {
    sh.uniforms.uTime = U.uTime;
    sh.uniforms.uDay = U.uDay;
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
      attribute vec3 aScale; attribute vec3 aColor; attribute float aSeed; attribute float aHi; attribute float aMat; attribute float aAcc; attribute float aShape;
      varying vec3 vS; varying vec3 vC; varying float vSeed; varying float vHi; varying float vMat; varying float vAcc; varying float vShape; varying vec3 vL; varying vec3 vLN; varying float vWY;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
      vS = aScale; vC = aColor; vSeed = aSeed; vHi = aHi; vMat = aMat; vAcc = aAcc; vShape = aShape; vL = position; vLN = normal;
      vWY = (modelMatrix*instanceMatrix*vec4(position,1.0)).y;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
      uniform float uTime; uniform float uDay;
      varying vec3 vS; varying vec3 vC; varying float vSeed; varying float vHi; varying float vMat; varying float vAcc; varying float vShape; varying vec3 vL; varying vec3 vLN; varying float vWY;
      float bh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      vec3 LN = normalize(vLN);
      float isTop = step(0.5, LN.y);
      float side = 1.0 - step(0.5, abs(LN.y));
      bool isRound = vShape > 0.5;
      bool xf = abs(LN.x) > 0.5;
      float fw; float fx;
      if(isRound){ fw = 3.14159*vS.x; fx = (atan(vL.z, vL.x)/6.28318 + 0.5)*fw; }
      else { fw = xf ? vS.z : vS.x; fx = xf ? (vL.z + 0.5)*vS.z : (vL.x + 0.5)*vS.x; }
      float fh = vS.y;
      float fy = vL.y*vS.y;
      if(isTop > 0.5){ fw = vS.x; fx = (vL.x + 0.5)*vS.x; fh = vS.z; fy = (vL.z + 0.5)*vS.z; }
      int M = int(vMat + 0.5);
      vec2 csz = M == 0 ? vec2(1.05, 0.82) : (M == 1 ? vec2(0.95, 0.85) : (M == 2 ? vec2(2.2, 0.8) : vec2(1.8, 2.2)));
      vec2 cl = vec2(fx, fy)/csz; vec2 cid = floor(cl); vec2 cf = fract(cl);
      float cr = bh(cid + vec2(vSeed, vSeed*1.7) + LN.xz*31.0);
      float hm = isRound ? 1.0 : step(0.12, fx)*step(fx, fw - 0.12);
      float inset = step(0.45, fy)*step(fy, fh - 0.3)*hm;
      float gt = fract(vSeed*0.731);
      vec3 tint = gt < 0.4 ? vec3(0.016,0.026,0.042) : (gt < 0.7 ? vec3(0.014,0.03,0.028) : vec3(0.036,0.026,0.016));
      tint = mix(tint, vec3(0.06,0.10,0.16) + tint*2.0, uDay*0.7); // kaca memantulkan langit siang, bukan hitam
      vec3 bcol; float bRough; float bMetal; float win = 0.0; float store = 0.0;
      if(M == 0){
        float mx = 1.0 - smoothstep(0.02, 0.06, min(cf.x, 1.0 - cf.x));
        float my = 1.0 - smoothstep(0.03, 0.07, min(cf.y, 1.0 - cf.y));
        float mull = max(mx, my);
        float pane = (1.0 - mull)*inset;
        float spand = pane*(1.0 - step(0.26, cf.y));
        vec3 gl = tint + vec3(0.008,0.01,0.012)*cr;
        bcol = mix(vec3(0.19,0.2,0.21), gl, pane);
        bcol = mix(bcol, tint*2.2 + 0.015, spand);
        bRough = mix(0.42, 0.04, pane); bRough = mix(bRough, 0.22, spand);
        bMetal = mix(0.75, 0.95, pane);
        win = pane - spand;
      } else if(M == 1){
        float w = step(0.24, cf.x)*step(cf.x, 0.76)*step(0.22, cf.y)*step(cf.y, 0.8);
        win = w*inset;
        float tex = 0.86 + 0.14*bh(floor(vec2(fx*5.0, fy*7.0)) + vSeed);
        float hue = fract(vSeed*0.413);
        vec3 stone = (hue < 0.5 ? vec3(0.50,0.44,0.36) : (hue < 0.8 ? vec3(0.42,0.40,0.38) : vec3(0.40,0.26,0.20)))*tex;
        stone *= 1.0 - (1.0 - smoothstep(0.0, 0.05, cf.y))*0.35;
        float sill = (1.0 - smoothstep(0.0, 0.03, abs(cf.y - 0.2)))*step(0.2, cf.x)*step(cf.x, 0.8)*inset;
        stone = mix(stone, stone*1.35, sill);
        bcol = mix(stone, tint*0.9, win);
        bRough = mix(0.88, 0.07, win); bMetal = mix(0.0, 0.8, win);
      } else if(M == 2){
        float rib = step(0.28, cf.y)*step(cf.y, 0.8);
        win = rib*inset;
        float seam = 1.0 - smoothstep(0.0, 0.03, min(cf.x, 1.0 - cf.x));
        vec3 panel = vec3(0.075,0.078,0.085)*(1.0 - seam*0.5)*(0.9 + 0.1*cr);
        bcol = mix(panel, tint, win);
        bRough = mix(0.32, 0.05, win); bMetal = mix(0.9, 0.95, win);
      } else {
        vec3 conc = vec3(0.23,0.22,0.21)*(0.85 + 0.15*bh(floor(vec2(fx*3.0, fy*3.0)) + vSeed));
        store = step(0.25, fy)*step(fy, 1.25)*step(0.18, cf.x)*step(cf.x, 0.92)*step(1.2, fh)*hm;
        bcol = mix(conc, vec3(0.02,0.025,0.03), store);
        bRough = mix(0.92, 0.1, store); bMetal = mix(0.0, 0.7, store);
      }
      win *= side; store *= side;
      if(isTop > 0.5){
        float ed = isRound ? (0.5 - length(vL.xz))*vS.x : min(min(fx, fw - fx), min(fy, fh - fy));
        float parapet = 1.0 - smoothstep(0.08, 0.14, ed);
        float gravel = 0.85 + 0.15*bh(floor(vec2(fx, fy)*12.0));
        bcol = mix(vec3(0.07,0.07,0.075)*gravel, vec3(0.24,0.23,0.22), parapet);
        bRough = 0.95; bMetal = 0.0; win = 0.0; store = 0.0;
      }
      bcol *= mix(0.4, 1.0, smoothstep(0.0, 3.5, vWY));
      bcol *= 1.0 + uDay*0.5; // fasad lebih terang di bawah matahari
      diffuseColor.rgb = bcol;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = bRough;',
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = bMetal;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
      float nite = 1.0 - uDay*0.88;
      float cr2 = fract(cr*7.31);
      float lit = step(0.58 - vHi*0.25, cr)*win;
      float flick = 0.9 + 0.1*sin(uTime*(0.15 + cr) + cr*50.0);
      vec3 room = cr2 < 0.35 ? vec3(0.85,0.93,1.0) : vec3(1.0,0.8,0.56);
      vec3 wcol = mix(room, vC, 0.45);
      float shade = mix(0.65, 1.15, cf.y)*(cr2 > 0.8 ? step(0.55, cf.y) : 1.0);
      totalEmissiveRadiance += wcol*lit*flick*shade*(0.5 + 0.9*cr)*(1.0 + vHi*1.6)*mix(nite, 1.0, vHi*0.5);
      totalEmissiveRadiance += vec3(1.0,0.82,0.6)*store*1.1*nite;
      float q = fw*0.25;
      float corner = isRound ? min(mod(fx, q), q - mod(fx, q)) : min(fx, fw - fx);
      float strip = (1.0 - smoothstep(0.03, 0.08, corner))*side*vAcc;
      totalEmissiveRadiance += vC*strip*(1.4 + vHi*3.0)*(0.8 + 0.2*sin(uTime*1.4 + vWY*0.25))*mix(1.0 - uDay*0.6, 1.0, vHi);
      float ed2 = isRound ? min(fy, fh - fy) : min(min(fx, fw - fx), min(fy, fh - fy));
      float edge = 1.0 - smoothstep(0.0, 0.07, ed2);
      totalEmissiveRadiance += vC*edge*vHi*2.2;
      float scan = exp(-pow((fract(vWY*0.04 - uTime*0.18) - 0.5)*24.0, 2.0));
      totalEmissiveRadiance += vC*scan*side*vHi*0.6;`,
      );
  };

  /* ---------- Instanced meshes ---------- */
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0);
  const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 28, 1);
  cylGeo.translate(0, 0.5, 0);
  type CityMesh = THREE.InstancedMesh & {
    userData: {
      aHi: Float32Array;
      hiAttr: THREE.InstancedBufferAttribute;
      instB: Int32Array;
    };
  };
  const cityMeshes: CityMesh[] = [];
  const dummy = new THREE.Object3D();
  [boxGeo, cylGeo].forEach((geo, shape) => {
    const list = parts[shape],
      N = list.length;
    const aScale = new Float32Array(N * 3),
      aColor = new Float32Array(N * 3),
      aSeed = new Float32Array(N);
    const aHi = new Float32Array(N),
      aMat = new Float32Array(N),
      aAcc = new Float32Array(N),
      aShape = new Float32Array(N).fill(shape);
    const instB = new Int32Array(N);
    const mesh = new THREE.InstancedMesh(geo, bMat, N) as unknown as CityMesh;
    list.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(0, it.rot, 0);
      dummy.scale.set(it.w, it.h, it.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      aScale.set([it.w, it.h, it.d], i * 3);
      aColor.set([it.col.r, it.col.g, it.col.b], i * 3);
      aSeed[i] = it.seed;
      aMat[i] = it.mat;
      aAcc[i] = it.acc;
      instB[i] = it.b;
      (bInst[it.b] = bInst[it.b] || []).push([cityMeshes.length, i]);
    });
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(aScale, 3));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(aColor, 3));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
    geo.setAttribute('aMat', new THREE.InstancedBufferAttribute(aMat, 1));
    geo.setAttribute('aAcc', new THREE.InstancedBufferAttribute(aAcc, 1));
    geo.setAttribute('aShape', new THREE.InstancedBufferAttribute(aShape, 1));
    const hiAttr = new THREE.InstancedBufferAttribute(aHi, 1);
    hiAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aHi', hiAttr);
    mesh.userData = { aHi, hiAttr, instB };
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
    cityMeshes.push(mesh);
  });

  /* ---------- Street life: trees and lamps ---------- */
  let lampGeo: THREE.BufferGeometry;
  {
    const trees: number[][] = [],
      lamps: number[][] = [];
    for (let i = 0; i < 5; i++) {
      const a = bAng(i),
        dx = Math.cos(a),
        dz = Math.sin(a),
        px = -dz,
        pz = dx;
      for (let pr = 9.5; pr < 58; pr += 2.3 + rnd() * 0.6) {
        for (const s of [1, -1]) {
          const o = s * (2.2 + rnd() * 0.15);
          if (rnd() < 0.85) trees.push([dx * pr + px * o, dz * pr + pz * o]);
        }
        if (Math.round(pr / 2.3) % 2 === 0) {
          const s = Math.round(pr) % 2 ? 1 : -1;
          lamps.push([dx * pr + px * s * 1.75, dz * pr + pz * s * 1.75]);
        }
      }
    }
    for (const rr of [10.3, 14.7]) {
      const n = Math.round((2 * Math.PI * rr) / 2.4);
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2;
        if (onAvenue(Math.cos(a) * rr, Math.sin(a) * rr, 2.4)) continue;
        trees.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
    }
    const okTree = ([x, z]: number[]) =>
      !mindPos.some((p) => Math.hypot(p.x - x, p.z - z) < 2.6) &&
      Math.hypot(x, z) > 7.5;
    const T = trees.filter(okTree);
    const crown = new THREE.IcosahedronGeometry(0.62, 1);
    crown.scale(1, 1.15, 1);
    crown.translate(0, 1.35, 0);
    const trunk = new THREE.CylinderGeometry(0.06, 0.09, 0.9, 6);
    trunk.translate(0, 0.45, 0);
    const crownMesh = new THREE.InstancedMesh(
      crown,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0,
        flatShading: true,
      }),
      T.length,
    );
    const trunkMesh = new THREE.InstancedMesh(
      trunk,
      new THREE.MeshStandardMaterial({ color: 0x2a2119, roughness: 0.95 }),
      T.length,
    );
    const tc = new THREE.Color();
    T.forEach(([x, z], i) => {
      const s = 0.8 + rnd() * 0.45;
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, rnd() * 6.28, 0);
      dummy.scale.set(s, s * (0.9 + rnd() * 0.3), s);
      dummy.updateMatrix();
      crownMesh.setMatrixAt(i, dummy.matrix);
      trunkMesh.setMatrixAt(i, dummy.matrix);
      tc.setRGB(0.05 + rnd() * 0.03, 0.1 + rnd() * 0.05, 0.06 + rnd() * 0.02);
      crownMesh.setColorAt(i, tc);
    });
    [crownMesh, trunkMesh].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    });

    const pole = new THREE.BoxGeometry(0.05, 1.7, 0.05);
    pole.translate(0, 0.85, 0);
    const poleMesh = new THREE.InstancedMesh(
      pole,
      new THREE.MeshStandardMaterial({
        color: 0x2b2e33,
        metalness: 0.8,
        roughness: 0.4,
      }),
      lamps.length,
    );
    const LP = new Float32Array(lamps.length * 3),
      LC = new Float32Array(lamps.length * 3);
    lamps.forEach(([x, z], i) => {
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poleMesh.setMatrixAt(i, dummy.matrix);
      LP.set([x, 1.72, z], i * 3);
      LC.set([1.4, 1.1, 0.75], i * 3);
    });
    poleMesh.castShadow = true;
    scene.add(poleMesh);
    lampGeo = new THREE.BufferGeometry();
    lampGeo.setAttribute('position', new THREE.BufferAttribute(LP, 3));
    lampGeo.setAttribute('aColor', new THREE.BufferAttribute(LC, 3));
  }

  /* ---------- Glow points (shared shader) ---------- */
  // Siang: semua titik cahaya meredup (uDay). Bintang menghilang penuh (lihat vertex shader-nya).
  const glowFrag = `uniform float uDay; varying vec3 vC; varying float vA;
  void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a *= a; if(a < 0.002) discard; float k = vA*(1.0 - uDay*0.85); gl_FragColor = vec4(vC*a*k, a*k); }`;
  const glowMat = (vs: string, extra?: Record<string, { value: unknown }>) =>
    new THREE.ShaderMaterial({
      uniforms: Object.assign(
        { uTime: U.uTime, uPR: U.uPR, uDay: U.uDay },
        extra || {},
      ),
      vertexShader: vs,
      fragmentShader: glowFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

  /* Beacons on top of mind towers */
  const bPos = new Float32Array(Math.max(1, nMinds) * 3),
    bCol = new Float32Array(Math.max(1, nMinds) * 3),
    bHi = new Float32Array(Math.max(1, nMinds));
  mindPos.forEach((p, i) => {
    bPos.set([p.x, p.y + 0.15, p.z], i * 3);
    const c = DIST[districtIndex(placed[i].district)].col;
    bCol.set([c.r * 1.8, c.g * 1.8, c.b * 1.8], i * 3);
  });
  const beaconGeo = new THREE.BufferGeometry();
  beaconGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  beaconGeo.setAttribute('aColor', new THREE.BufferAttribute(bCol, 3));
  const bHiAttr = new THREE.BufferAttribute(bHi, 1);
  bHiAttr.setUsage(THREE.DynamicDrawUsage);
  beaconGeo.setAttribute('aHi', bHiAttr);
  beaconGeo.setDrawRange(0, nMinds);
  scene.add(
    new THREE.Points(
      beaconGeo,
      glowMat(`uniform float uTime; uniform float uPR; attribute vec3 aColor; attribute float aHi; varying vec3 vC; varying float vA;
  void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); float p = 0.55 + 0.45*step(0.5, fract(uTime*0.6 + position.x));
  gl_PointSize = (4.0 + aHi*9.0)*p*uPR*(300.0/-mv.z); vC = aColor; vA = 0.9 + aHi*0.6; gl_Position = projectionMatrix*mv; }`),
    ),
  );

  /* Street lamp glow */
  scene.add(
    new THREE.Points(
      lampGeo,
      glowMat(`uniform float uPR; attribute vec3 aColor; varying vec3 vC; varying float vA;
  void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = 1.6*uPR*(300.0/-mv.z); vC = aColor; vA = 1.0; gl_Position = projectionMatrix*mv; }`),
    ),
  );

  /* Data packets: work flows into the Vault, wages flow out on seal */
  if (nMinds > 0) {
    const routes: {
      a: THREE.Vector3;
      b: THREE.Vector3;
      c: THREE.Color;
      s: number;
      o: number;
    }[] = [];
    const TRAIL = mobile ? 8 : 14;
    const top = new THREE.Vector3(0, 23.5, 0);
    mindPos.forEach((p) => {
      const t = new THREE.Vector3(p.x, p.y, p.z);
      routes.push({
        a: t,
        b: top,
        c: new THREE.Color('#A8C4DE'),
        s: 0.045 + rnd() * 0.035,
        o: rnd(),
      });
      routes.push({
        a: top,
        b: t,
        c: new THREE.Color('#E6CC96'),
        s: 0.04 + rnd() * 0.03,
        o: rnd(),
      });
    });
    const n = routes.length * TRAIL;
    const S = new Float32Array(n * 3),
      E = new Float32Array(n * 3),
      O = new Float32Array(n),
      V = new Float32Array(n),
      C = new Float32Array(n * 3),
      T = new Float32Array(n),
      P = new Float32Array(n * 3);
    let k = 0;
    routes.forEach((r) => {
      for (let j = 0; j < TRAIL; j++, k++) {
        S.set([r.a.x, r.a.y, r.a.z], k * 3);
        E.set([r.b.x, r.b.y, r.b.z], k * 3);
        O[k] = r.o - j * 0.0045;
        V[k] = r.s;
        C.set([r.c.r * 1.8, r.c.g * 1.8, r.c.b * 1.8], k * 3);
        T[k] = 1 - j / TRAIL;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(S, 3));
    g.setAttribute('aEnd', new THREE.BufferAttribute(E, 3));
    g.setAttribute('aOff', new THREE.BufferAttribute(O, 1));
    g.setAttribute('aSpd', new THREE.BufferAttribute(V, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(C, 3));
    g.setAttribute('aTrail', new THREE.BufferAttribute(T, 1));
    const pts = new THREE.Points(
      g,
      glowMat(`uniform float uTime; uniform float uPR;
    attribute vec3 aStart; attribute vec3 aEnd; attribute float aOff; attribute float aSpd; attribute vec3 aColor; attribute float aTrail;
    varying vec3 vC; varying float vA;
    void main(){
      float t = fract(uTime*aSpd + aOff);
      vec3 m = (aStart + aEnd)*0.5; float L = distance(aStart, aEnd);
      vec3 c = m + vec3(0.0, 5.0 + L*0.32, 0.0);
      vec3 p = mix(mix(aStart, c, t), mix(c, aEnd, t), t);
      vec4 mv = modelViewMatrix*vec4(p,1.0);
      float fade = sin(t*3.14159);
      gl_PointSize = (0.7 + aTrail*1.9)*(0.4 + fade)*uPR*(300.0/-mv.z);
      vC = aColor; vA = fade*aTrail*0.75;
      gl_Position = projectionMatrix*mv;
    }`),
    );
    pts.frustumCulled = false;
    scene.add(pts);
  }

  /* Street traffic: headlights one way, tail lights the other */
  {
    const n = mobile ? 300 : 620;
    const A = new Float32Array(n),
      L = new Float32Array(n),
      O = new Float32Array(n),
      V = new Float32Array(n),
      C = new Float32Array(n * 3),
      P = new Float32Array(n * 3);
    const head = new THREE.Color(1.5, 1.35, 1.1),
      tail = new THREE.Color(1.3, 0.22, 0.12);
    for (let i = 0; i < n; i++) {
      A[i] = Math.floor(rnd() * 6);
      L[i] = rnd() < 0.5 ? 1 : -1;
      O[i] = rnd();
      V[i] = (A[i] > 4.5 ? 0.01 : 0.022) + rnd() * 0.02;
      const c = L[i] > 0 ? head : tail;
      C.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('aAve', new THREE.BufferAttribute(A, 1));
    g.setAttribute('aLane', new THREE.BufferAttribute(L, 1));
    g.setAttribute('aOff', new THREE.BufferAttribute(O, 1));
    g.setAttribute('aSpd', new THREE.BufferAttribute(V, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(C, 3));
    const pts = new THREE.Points(
      g,
      glowMat(
        `uniform float uTime; uniform float uPR; uniform float uAng[5];
    attribute float aAve; attribute float aLane; attribute float aOff; attribute float aSpd; attribute vec3 aColor;
    varying vec3 vC; varying float vA;
    void main(){
      float t = fract(uTime*aSpd + aOff);
      float tt = aLane > 0.0 ? t : 1.0 - t;
      vec3 pos; float alpha;
      if(aAve > 4.5){
        float rr = 12.5 + aLane*0.55; float a = tt*6.28318;
        pos = vec3(cos(a)*rr, 0.18, sin(a)*rr); alpha = 0.85;
      } else {
        int i = int(aAve + 0.5);
        float ang = uAng[0];
        if(i == 1) ang = uAng[1]; if(i == 2) ang = uAng[2]; if(i == 3) ang = uAng[3]; if(i == 4) ang = uAng[4];
        float r = mix(8.0, 58.0, tt);
        vec2 d = vec2(cos(ang), sin(ang)); vec2 pp = vec2(-d.y, d.x);
        vec2 q = d*r + pp*aLane*0.6;
        pos = vec3(q.x, 0.18, q.y); alpha = smoothstep(8.0, 12.0, r)*smoothstep(58.0, 44.0, r);
      }
      vec4 mv = modelViewMatrix*vec4(pos,1.0);
      gl_PointSize = 1.3*uPR*(300.0/-mv.z);
      vC = aColor; vA = alpha;
      gl_Position = projectionMatrix*mv;
    }`,
        { uAng: { value: [0, 1, 2, 3, 4].map(bAng) } },
      ),
    );
    pts.frustumCulled = false;
    scene.add(pts);
  }

  /* Atmosphere dust & first stars */
  let stars: THREE.Points;
  {
    const n = mobile ? 300 : 700;
    const P = new Float32Array(n * 3),
      O = new Float32Array(n),
      C = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 6 + rnd() * 70,
        a = rnd() * Math.PI * 2;
      P.set([Math.cos(a) * r, 2 + rnd() * 36, Math.sin(a) * r], i * 3);
      O[i] = rnd();
      C.set(rnd() < 0.5 ? [0.9, 0.78, 0.58] : [0.6, 0.72, 0.88], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('aOff', new THREE.BufferAttribute(O, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(C, 3));
    scene.add(
      new THREE.Points(
        g,
        glowMat(`uniform float uTime; uniform float uPR; attribute float aOff; attribute vec3 aColor; varying vec3 vC; varying float vA;
    void main(){ vec3 p = position; p.y += sin(uTime*0.15 + aOff*40.0)*1.2; p.x += sin(uTime*0.08 + aOff*20.0)*1.4; p.z += cos(uTime*0.07 + aOff*30.0)*1.4;
    vec4 mv = modelViewMatrix*vec4(p,1.0); gl_PointSize = 0.9*uPR*(300.0/-mv.z); vC = aColor; vA = 0.18 + 0.18*sin(uTime + aOff*50.0); gl_Position = projectionMatrix*mv; }`),
      ),
    );

    const s = mobile ? 600 : 1200;
    const SP = new Float32Array(s * 3),
      SO = new Float32Array(s),
      SC = new Float32Array(s * 3);
    for (let i = 0; i < s; i++) {
      const u = rnd() * Math.PI * 2,
        v = Math.acos(rnd() * 0.75 + 0.25);
      const R = 520;
      SP.set(
        [
          Math.sin(v) * Math.cos(u) * R,
          Math.cos(v) * R,
          Math.sin(v) * Math.sin(u) * R,
        ],
        i * 3,
      );
      SO[i] = rnd();
      SC.set([0.85, 0.88, 1.0], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(SP, 3));
    sg.setAttribute('aOff', new THREE.BufferAttribute(SO, 1));
    sg.setAttribute('aColor', new THREE.BufferAttribute(SC, 3));
    stars = new THREE.Points(
      sg,
      glowMat(`uniform float uTime; uniform float uPR; uniform float uDay; attribute float aOff; attribute vec3 aColor; varying vec3 vC; varying float vA;
    void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = (1.0 + aOff*1.8)*uPR; vC = aColor;
    vA = (0.25 + 0.6*aOff)*(0.6 + 0.4*sin(uTime*1.3 + aOff*90.0))*smoothstep(0.25, 0.7, normalize(position).y)*(1.0 - uDay); gl_Position = projectionMatrix*mv; }`),
    );
    scene.add(stars);
  }

  /* ---------- The Core: Vault spire ---------- */
  const core = new THREE.Group();
  scene.add(core);
  const GOLDL = new THREE.Color('#D6B676'),
    ICEL = new THREE.Color('#A8C4DE');
  {
    const spireGeo = new THREE.CylinderGeometry(0.35, 2.5, 24, 6, 1);
    spireGeo.translate(0, 12.6, 0);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x1b1e25,
      metalness: 1.0,
      roughness: 0.16,
      flatShading: true,
      envMapIntensity: 1.4,
    });
    spireMat.onBeforeCompile = (sh: any) => {
      sh.uniforms.uTime = U.uTime;
      sh.uniforms.uDay = U.uDay;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vY;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvY = position.y;',
        );
      sh.fragmentShader = sh.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform float uTime; uniform float uDay; varying float vY;',
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
        float band = pow(0.5 + 0.5*sin(vY*1.5 - uTime*2.0), 34.0);
        float nite = 1.0 - uDay*0.55;
        totalEmissiveRadiance += mix(vec3(0.69,0.485,0.195), vec3(0.39,0.55,0.73), smoothstep(4.0, 24.0, vY))*band*2.2*nite;
        totalEmissiveRadiance += vec3(0.39,0.55,0.73)*smoothstep(19.0, 24.6, vY)*0.35*nite;`,
        );
    };
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.castShadow = true;
    spire.receiveShadow = true;
    core.add(spire);
    core.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(spireGeo),
        new THREE.LineBasicMaterial({
          color: GOLDL.clone().multiplyScalar(1.3),
          transparent: true,
          opacity: 0.55,
        }),
      ),
    );

    const stone = new THREE.MeshStandardMaterial({
      color: 0x2c2a28,
      roughness: 0.75,
      metalness: 0.05,
    });
    const plinth1 = new THREE.CylinderGeometry(5.6, 6.3, 0.5, 6);
    plinth1.translate(0, 0.25, 0);
    const plinth2 = new THREE.CylinderGeometry(4.6, 5.0, 0.6, 6);
    plinth2.translate(0, 0.8, 0);
    [plinth1, plinth2].forEach((g) => {
      const m = new THREE.Mesh(g, stone);
      m.castShadow = m.receiveShadow = true;
      core.add(m);
    });
    core.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(plinth2),
        new THREE.LineBasicMaterial({
          color: GOLDL.clone().multiplyScalar(1.4),
          transparent: true,
          opacity: 0.7,
        }),
      ),
    );

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d33,
      metalness: 0.9,
      roughness: 0.25,
    });
    const capMat = new THREE.MeshBasicMaterial({
      color: GOLDL.clone().multiplyScalar(2.2),
    });
    const pillarGeo = new THREE.BoxGeometry(0.35, 6, 0.35);
    const capGeo = new THREE.BoxGeometry(0.4, 0.08, 0.4);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(Math.cos(a) * 4.0, 4.1, Math.sin(a) * 4.0);
      p.castShadow = true;
      core.add(p);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(Math.cos(a) * 4.0, 7.14, Math.sin(a) * 4.0);
      core.add(cap);
    }
  }
  const rings: THREE.Mesh[] = [];
  (
    [
      [17, 4.2, 0.045, 0, GOLDL, 1.8],
      [21, 2.9, 0.035, 0.35, ICEL, 1.7],
      [25.6, 5.8, 0.028, -0.2, GOLDL, 1.4],
      [7.2, 4.0, 0.06, 0, GOLDL, 1.6],
    ] as [number, number, number, number, THREE.Color, number][]
  ).forEach(([y, r, t, tilt, c, s]) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, t, 8, 160),
      new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(s) }),
    );
    m.position.y = y;
    m.rotation.x = Math.PI / 2 + tilt;
    core.add(m);
    rings.push(m);
  });
  const orb = new THREE.Group();
  orb.position.y = 28.5;
  core.add(orb);
  let orbOuter: THREE.LineSegments;
  {
    const ico = new THREE.IcosahedronGeometry(1.5, 1);
    orb.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(ico),
        new THREE.LineBasicMaterial({
          color: ICEL.clone().multiplyScalar(1.8),
          transparent: true,
          opacity: 0.85,
        }),
      ),
    );
    orbOuter = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.4, 0)),
      new THREE.LineBasicMaterial({
        color: GOLDL.clone().multiplyScalar(1.4),
        transparent: true,
        opacity: 0.5,
      }),
    );
    orb.add(orbOuter);
    orb.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 24, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.6, 3.0) }),
      ),
    );
    const halo = new THREE.BufferGeometry();
    halo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
    );
    halo.setAttribute(
      'aColor',
      new THREE.BufferAttribute(new Float32Array([0.6, 0.75, 0.95]), 3),
    );
    orb.add(
      new THREE.Points(
        halo,
        glowMat(`uniform float uTime; uniform float uPR; attribute vec3 aColor; varying vec3 vC; varying float vA;
    void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = (60.0 + 10.0*sin(uTime*1.6))*uPR*(300.0/-mv.z); vC = aColor; vA = 0.7; gl_Position = projectionMatrix*mv; }`),
      ),
    );
  }
  {
    const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, 220, 8, 1, true);
    beamGeo.translate(0, 140, 0);
    core.add(
      new THREE.Mesh(
        beamGeo,
        new THREE.MeshBasicMaterial({
          color: GOLDL.clone().multiplyScalar(2.2),
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        }),
      ),
    );
    const beam2 = new THREE.CylinderGeometry(0.5, 0.5, 220, 16, 1, true);
    beam2.translate(0, 140, 0);
    core.add(
      new THREE.Mesh(
        beam2,
        new THREE.MeshBasicMaterial({
          color: GOLDL,
          transparent: true,
          opacity: 0.04,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        }),
      ),
    );
  }

  /* Selection marker */
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 2.72, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.06;
  marker.visible = false;
  scene.add(marker);

  /* ---------- District labels (DOM, tanpa innerHTML) ---------- */
  const labelAnchors = DIST.map((d, i) => {
    const a = dAng(i);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dlabel';
    el.style.setProperty('--c', d.color);
    const dot = document.createElement('i');
    el.append(dot, document.createTextNode(`0${i + 1} · ${d.name}`));
    const onClick = () => {
      handle.focusDistrict(d.id);
      opts.onDistrict(d.id);
    };
    el.addEventListener('click', onClick);
    labelsEl.appendChild(el);
    return {
      el,
      onClick,
      v: new THREE.Vector3(Math.cos(a) * 44, 0.5, Math.sin(a) * 44),
    };
  });
  const setLabelOn = (i: number) =>
    labelAnchors.forEach((l, j) => l.el.classList.toggle('on', j === i));

  /* ---------- Camera director ---------- */
  const cur: Record<string, number> = {
    r: 150,
    h: 90,
    lx: 0,
    ly: 0,
    lz: 0,
    th: 0.9,
  };
  const tgt: Record<string, number> = {
    r: 64,
    h: 30,
    lx: 0,
    ly: 7,
    lz: 0,
    th: 0.9,
  };
  let spin = !reduced; // reduced-motion: tanpa auto-rotate
  let override: {
    kind: 'district' | 'mind';
    r: number;
    h: number;
    lx: number;
    ly: number;
    lz: number;
  } | null = null;
  let lastSection: HTMLElement | null = null;
  let selected = -1,
    hover = -1,
    disposed = false;
  const sections = Object.keys(SECTION_CAMS)
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);
  const near = (from: number, to: number) =>
    to + Math.PI * 2 * Math.round((from - to) / (Math.PI * 2));

  function currentSection(): HTMLElement | null {
    const mid = innerHeight * 0.5;
    for (const s of sections) {
      const b = s.getBoundingClientRect();
      if (b.top <= mid && b.bottom >= mid) return s;
    }
    return sections[0] ?? null;
  }
  function applySection() {
    const s = currentSection();
    if (!s) return;
    const conf = SECTION_CAMS[s.id];
    if (s !== lastSection) {
      lastSection = s;
      labelsEl.classList.toggle('show', !!conf.labels);
      if (override && override.kind === 'district') {
        override = null;
        spin = !reduced;
        setLabelOn(-1);
        opts.onDistrict(null);
      }
    }
    if (!override) {
      const v = conf.cam;
      tgt.r = v[0];
      tgt.h = v[1];
      tgt.lx = v[2];
      tgt.ly = v[3];
      tgt.lz = v[4];
    }
  }
  addEventListener('scroll', applySection, { passive: true });

  // Kilau dasar menara: bekerja = menyala, sisanya naik halus mengikuti revenue ("towers glow brighter as they earn").
  const baseHi = placed.map((m) =>
    m.status !== 'idle'
      ? 0.5
      : Math.min(0.3, Math.sqrt(Math.max(0, m.revenue)) / 130),
  );
  function setHi() {
    for (let i = 0; i < nMinds; i++) {
      const v = i === hover || i === selected ? 1 : baseHi[i];
      bInst[i].forEach(([mi, k]) => {
        cityMeshes[mi].userData.aHi[k] = v;
      });
      bHi[i] = v;
    }
    cityMeshes.forEach((m) => {
      m.userData.hiAttr.needsUpdate = true;
    });
    bHiAttr.needsUpdate = true;
  }

  const handle: SceneHandle = {
    focusDistrict(id) {
      const i = districtIndex(id);
      if (i < 0) return;
      const a = dAng(i);
      override = {
        kind: 'district',
        r: 32,
        h: 24,
        lx: Math.cos(a) * 22,
        ly: 5,
        lz: Math.sin(a) * 22,
      };
      spin = false;
      tgt.th = near(cur.th, Math.PI / 2 - a);
      setLabelOn(i);
    },
    focusMind(id) {
      const i = mindIndex.get(id);
      if (i === undefined) return;
      const p = mindPos[i],
        a = Math.atan2(p.z, p.x);
      override = {
        kind: 'mind',
        r: mobile ? 32 : 25,
        h: p.y * 0.7 + 5,
        lx: p.x,
        ly: p.y * 0.5,
        lz: p.z,
      };
      spin = false;
      tgt.th = near(cur.th, Math.PI / 2 - a) + 0.45;
      selected = i;
      setHi();
      marker.position.x = p.x;
      marker.position.z = p.z;
      (marker.material as THREE.MeshBasicMaterial).color
        .copy(DIST[districtIndex(placed[i].district)].col)
        .multiplyScalar(2);
      marker.visible = true;
    },
    clear() {
      override = null;
      spin = !reduced;
      selected = -1;
      marker.visible = false;
      setHi();
      setLabelOn(-1);
      lastSection = null;
      applySection();
    },
    dispose,
  };

  /* ---------- Picking ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let wantPick = false,
    downAt: number[] | null = null;
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  const showTip = (i: number, x: number, y: number) => {
    tipEl.style.left = x + 'px';
    tipEl.style.top = y + 'px';
    if (i < 0) {
      tipEl.classList.remove('show');
      return;
    }
    const m = placed[i];
    tipEl.textContent = `${DIST[districtIndex(m.district)].name} · ${m.code}`;
    const b = document.createElement('b');
    b.textContent = m.name;
    tipEl.appendChild(b);
    tipEl.classList.add('show');
  };
  const onMove = (e: PointerEvent) => {
    ndc.set(
      (e.clientX / innerWidth) * 2 - 1,
      -(e.clientY / innerHeight) * 2 + 1,
    );
    wantPick = true;
    par.tx = ndc.x;
    par.ty = ndc.y;
    tipEl.style.left = e.clientX + 'px';
    tipEl.style.top = e.clientY + 'px';
  };
  const onLeave = () => {
    hover = -1;
    setHi();
    tipEl.classList.remove('show');
    canvas.style.cursor = '';
  };
  const onDown = (e: PointerEvent) => {
    downAt = [e.clientX, e.clientY];
    ndc.set(
      (e.clientX / innerWidth) * 2 - 1,
      -(e.clientY / innerHeight) * 2 + 1,
    );
    pick(e.clientX, e.clientY);
  };
  const onUp = (e: PointerEvent) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
    downAt = null;
    if (moved < 6 && hover >= 0) opts.onPickMind(placed[hover].id);
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  function pick(x = 0, y = 0) {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cityMeshes, false)[0];
    const bi = hit
      ? (hit.object as CityMesh).userData.instB[hit.instanceId!]
      : -1;
    const h = bi >= 0 && bi < nMinds ? bi : -1;
    if (h !== hover) {
      hover = h;
      setHi();
      canvas.style.cursor = h >= 0 ? 'pointer' : '';
      showTip(
        h,
        x || parseFloat(tipEl.style.left) || 0,
        y || parseFloat(tipEl.style.top) || 0,
      );
    }
  }

  /* ---------- Post-processing ---------- */
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(PR);
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight),
    mobile ? 0.5 : 0.6,
    0.5,
    0.82,
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setSize(innerWidth, innerHeight);
    bloom.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    dispose();
    opts.onFail();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  /* ---------- Siang / malam ---------- */
  const SUN_COL_NOON = new THREE.Color(1.0, 0.95, 0.86);
  const SUN_COL_LOW = new THREE.Color(1.0, 0.6, 0.3);
  const SUN_COL_N = new THREE.Color(0xf3d2a6);
  const HEMI_SKY = [new THREE.Color(0x8197b8), new THREE.Color(0xbcd2ee)];
  const HEMI_SKY_WARM = new THREE.Color(0xf0b88c);
  const HEMI_GND = [new THREE.Color(0x0b0c10), new THREE.Color(0x3a3a38)];
  const RIM_COL = [new THREE.Color(0x9fb8d8), new THREE.Color(0xd8e6f6)];
  const FOG_D_WARM = new THREE.Color().setRGB(0.62, 0.42, 0.32);
  const fogDay = new THREE.Color();
  const tmpC = new THREE.Color();
  const tmpV = new THREE.Vector3();
  // Mode dari tombol siang/malam (lib/city/day-mode.ts): auto = jam lokal, day = 1, night = 0.
  const targetDay = () => {
    const m = getDayMode();
    return m === 'day' ? 1 : m === 'night' ? 0 : daylightAt(new Date());
  };
  // Pose matahari mengikuti jam browser (lihat sunPoseAt). Day yang dikunci saat malam memakai pose pagi.
  const targetSun = (): SunPose =>
    sunPoseAt(new Date(), getDayMode() === 'day');
  let day = targetDay();
  let dayTarget = day;
  let sunPose: SunPose = targetSun();
  let sunTarget: SunPose = { ...sunPose };
  const offDayMode = subscribeDayMode(() => {
    dayTarget = targetDay();
    sunTarget = targetSun();
  });
  let appliedDay = -1,
    envDay = -1,
    lastEnvAt = 0;
  let appliedSun: SunPose = { el: -9, az: -9, warm: -9 },
    envSun: SunPose = { el: -9, az: -9, warm: -9 };
  let lastClock = performance.now();
  const sunDelta = (a: SunPose, b: SunPose) =>
    Math.abs(a.el - b.el) +
    Math.abs(a.az - b.az) +
    Math.abs(a.warm - b.warm) * 0.5;

  function applyDay(d: number) {
    const sp = sunPose;
    const sinEl = Math.sin(sp.el);
    // Kekuatan matahari 0..1 (rendah di pagi/sore, penuh saat siang).
    const str = Math.sqrt(Math.max(0, sinEl));
    U.uDay.value = d;
    U.uWarm.value = sp.warm * d;
    // Kabut/horizon: biru siang, bergeser keemasan saat matahari rendah, sedikit lebih redup.
    fogDay
      .copy(FOG_D)
      .lerp(FOG_D_WARM, sp.warm * 0.65)
      .multiplyScalar((0.82 + 0.18 * str) * 1.05);
    fogColor.copy(FOG_N).lerp(fogDay, d);
    (scene.fog as THREE.FogExp2).color.copy(fogColor);
    (scene.fog as THREE.FogExp2).density = lerp(0.0076, 0.0048, d);
    (scene.background as THREE.Color).copy(fogColor);
    skyMat.uniforms.uFog.value = fogColor;
    // Arah matahari: bulan hangat malam hari -> busur matahari sesuai jam saat siang.
    const dir = sunDirectionOf(sp);
    SUN_D.set(dir[0], dir[1], dir[2]);
    SUN.lerpVectors(SUN_N, SUN_D, d).normalize();
    skyMat.uniforms.uSun.value = SUN;
    sun.position.copy(SUN).multiplyScalar(160);
    tmpC.copy(SUN_COL_NOON).lerp(SUN_COL_LOW, sp.warm);
    sun.color.copy(SUN_COL_N).lerp(tmpC, d);
    sun.intensity = lerp(2.8, 1.5 + 1.8 * str, d);
    // Cahaya pantul langit; di sore/pagi ikut hangat.
    tmpC.copy(HEMI_SKY[1]).lerp(HEMI_SKY_WARM, sp.warm * 0.4);
    hemi.color.copy(HEMI_SKY[0]).lerp(tmpC, d);
    hemi.groundColor.copy(HEMI_GND[0]).lerp(HEMI_GND[1], d);
    hemi.intensity = lerp(0.55, 0.95 + 0.25 * str, d);
    amb.intensity = 0.14 * d;
    scene.environmentIntensity = lerp(1.0, 1.25, d);
    // Lampu pengisi dingin di sisi berlawanan dari matahari, supaya sisi bayangan tetap terbaca.
    rim.color.copy(RIM_COL[0]).lerp(RIM_COL[1], d);
    rim.intensity = lerp(0.6, 0.5, d);
    tmpV.set(-SUN.x, 0.35, -SUN.z).normalize().multiplyScalar(90);
    rim.position.set(60, 40, 70).lerp(tmpV, d);
    renderer.toneMappingExposure = lerp(0.95, 1.08, d);
    bloom.strength = lerp(mobile ? 0.5 : 0.6, mobile ? 0.1 : 0.12, d);
    bloom.threshold = lerp(0.82, 1.3, d);
    const root = document.documentElement.style;
    root.setProperty('--day', d.toFixed(3));
    root.setProperty('--sun-warm', (sp.warm * d).toFixed(3));
    appliedDay = d;
    appliedSun = { ...sp };
    // Bayangan & refleksi lingkungan mahal: segarkan hanya bila siang atau posisi matahari berubah cukup jauh.
    // Perpindahan cepat (tombol siang/malam) dibatasi 1x per 350 ms, dan keadaan akhir selalu disegarkan.
    const nowMs = performance.now();
    const dDay = Math.abs(d - envDay);
    const dSun = sunDelta(sp, envSun);
    const reached = d === dayTarget && sunDelta(sp, sunTarget) < 1e-6;
    const settled = reached && (dDay > 0.001 || dSun > 0.0005);
    if (
      envDay < 0 ||
      settled ||
      ((dDay > 0.06 || dSun > 0.012) && nowMs - lastEnvAt > 350)
    ) {
      envDay = d;
      envSun = { ...sp };
      lastEnvAt = nowMs;
      buildEnv();
      renderer.shadowMap.needsUpdate = true;
    }
  }

  /* ---------- Loop ---------- */
  const tmp = new THREE.Vector3();
  let first = true,
    last = performance.now(),
    raf = 0,
    readyTimer = 0;
  setHi();
  applyDay(day);
  renderer.shadowMap.needsUpdate = true;
  applySection();

  function frame(now: number) {
    if (disposed) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    U.uTime.value += dt * (reduced ? 0.35 : 1);
    const t = U.uTime.value;

    // Jam dicek tiap 5 detik; perpindahan siang <-> malam mulus (langsung loncat bila reduced-motion).
    if (now - lastClock > 5000) {
      lastClock = now;
      dayTarget = targetDay();
      sunTarget = targetSun();
    }
    const ease = Math.min(1, dt * 1.6);
    day = reduced ? dayTarget : day + (dayTarget - day) * ease;
    if (Math.abs(day - dayTarget) < 0.002) day = dayTarget;
    if (reduced || sunDelta(sunPose, sunTarget) < 5e-4) {
      sunPose = { ...sunTarget };
    } else {
      sunPose = {
        el: sunPose.el + (sunTarget.el - sunPose.el) * ease,
        az: sunPose.az + (sunTarget.az - sunPose.az) * ease,
        warm: sunPose.warm + (sunTarget.warm - sunPose.warm) * ease,
      };
    }
    if (day !== appliedDay || sunDelta(sunPose, appliedSun) > 0) applyDay(day);

    if (override) {
      tgt.r = override.r;
      tgt.h = override.h;
      tgt.lx = override.lx;
      tgt.ly = override.ly;
      tgt.lz = override.lz;
    }
    if (spin) tgt.th += dt * 0.028;
    const k = 1 - Math.exp(-dt * 1.35);
    for (const key in cur) cur[key] += (tgt[key] - cur[key]) * k;
    par.x += (par.tx - par.x) * 0.04;
    par.y += (par.ty - par.y) * 0.04;
    camera.position.set(
      cur.lx + Math.sin(cur.th) * cur.r + par.x * 1.8,
      Math.max(1.5, cur.h + par.y * 1.4),
      cur.lz + Math.cos(cur.th) * cur.r,
    );
    camera.lookAt(cur.lx, cur.ly, cur.lz);
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);

    rings.forEach((r, i) => {
      r.rotation.z += dt * (0.12 + i * 0.05) * (i % 2 ? -1 : 1);
    });
    orb.rotation.y += dt * 0.35;
    orb.rotation.x = Math.sin(t * 0.3) * 0.25;
    orb.position.y = 28.5 + Math.sin(t * 0.8) * 0.35;
    orbOuter.rotation.y -= dt * 0.6;
    if (marker.visible) {
      const s = 1 + Math.sin(t * 2.4) * 0.06;
      marker.scale.set(s, s, s);
    }

    if (wantPick) {
      wantPick = false;
      pick();
    }

    if (labelsEl.classList.contains('show')) {
      labelAnchors.forEach((l) => {
        tmp.copy(l.v).project(camera);
        if (tmp.z > 1) {
          l.el.style.visibility = 'hidden';
          return;
        }
        l.el.style.visibility = 'visible';
        l.el.style.transform = `translate(-50%,-50%) translate(${(tmp.x * 0.5 + 0.5) * innerWidth}px, ${(-tmp.y * 0.5 + 0.5) * innerHeight}px)`;
      });
    }

    composer.render();
    if (first) {
      first = false;
      readyTimer = window.setTimeout(opts.onReady, 250);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  /* ---------- Cleanup ---------- */
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    clearTimeout(readyTimer);
    offDayMode();
    removeEventListener('scroll', applySection);
    removeEventListener('resize', onResize);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    labelAnchors.forEach((l) => {
      l.el.removeEventListener('click', l.onClick);
      l.el.remove();
    });
    labelsEl.classList.remove('show');
    tipEl.classList.remove('show');
    document.documentElement.style.removeProperty('--day');

    const geos = new Set<THREE.BufferGeometry>();
    const mats = new Set<THREE.Material>();
    const disposeTree = (root: THREE.Object3D) =>
      root.traverse((o: any) => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(
            (m: THREE.Material) => mats.add(m),
          );
        if (o.isInstancedMesh) o.dispose();
      });
    disposeTree(scene);
    disposeTree(envScene);
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    envRT?.dispose();
    pmrem.dispose();
    composer.passes.forEach((p: any) => p.dispose?.());
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return handle;
}
