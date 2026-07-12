import * as THREE from "three";

// Deterministic hash so the generated artwork is stable across reloads.
function hash(seed: number): number {
  const h = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return h - Math.floor(h);
}

const NAVY = "#07111F";
const GOLD = "#D4AF37";
const INK = "rgba(226, 232, 245, 0.85)"; // warm white ink

interface Ctx2D {
  base: CanvasRenderingContext2D;
  emissive: CanvasRenderingContext2D;
  width: number;
  height: number;
}

// Calls draw(x, y) once, plus mirrored copies near the left/right seam so
// the texture tiles seamlessly around the sphere's longitude wrap.
function wrapPlace(x: number, y: number, margin: number, width: number, draw: (x: number, y: number) => void) {
  draw(x, y);
  if (x < margin) draw(x + width, y);
  if (x > width - margin) draw(x - width, y);
}

function drawGrain(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, width, height);

  const speckles = 20000;
  for (let i = 0; i < speckles; i++) {
    const x = hash(i * 3.11) * width;
    const y = hash(i * 7.73 + 1) * height;
    const light = hash(i * 5.31 + 2) > 0.5;
    ctx.fillStyle = light ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.25)";
    ctx.fillRect(x, y, 2, 2);
  }
}

// A loose, hand-sketched curved ink stroke.
function drawSketchStroke(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, rot: number, alpha: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = size * 0.035;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-size, (hash(cx) - 0.5) * size * 0.4);
  ctx.quadraticCurveTo(0, (hash(cy) - 0.5) * size * 0.9, size, (hash(cx + cy) - 0.5) * size * 0.4);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Ben-Day halftone dot cluster, shrinking radially outward.
function drawHalftoneCluster(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
  const spacing = radius * 0.16;
  for (let dy = -radius; dy < radius; dy += spacing) {
    for (let dx = -radius; dx < radius; dx += spacing) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > radius) continue;
      const t = 1 - d / radius;
      const r = spacing * 0.32 * t + spacing * 0.05;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3 * t + 0.05;
      ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Dense manga screentone patch (uniform fine dots inside a soft-edged box).
function drawScreentonePatch(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.clip();
  const spacing = 9;
  for (let y = -h / 2; y < h / 2; y += spacing) {
    for (let x = -w / 2; x < w / 2; x += spacing) {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.22;
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Diagonal-line cross-hatch shading block, editorial-cartoon style.
function drawCrossHatch(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1.4;
  const spacing = 10;
  for (let d = -w - h; d < w + h; d += spacing) {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + d, -h / 2);
    ctx.lineTo(-w / 2 + d + h, h / 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Rounded comic speech-bubble outline with a small tail.
function drawSpeechBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.045;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.68, 0, 0, Math.PI * 2);
  ctx.moveTo(-size * 0.15, size * 0.55);
  ctx.lineTo(-size * 0.4, size * 1.05);
  ctx.lineTo(size * 0.1, size * 0.6);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// A cluster of parallel motion / speed lines.
function drawMotionLines(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.03;
  ctx.globalAlpha = 0.45;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-size, i * size * 0.16);
    ctx.lineTo(size, i * size * 0.16 * 0.4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Small ink doodle: lightning bolt, sparkle burst, or swirl.
function drawDoodle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, kind: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.06;
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.75;

  if (kind === 0) {
    // Lightning bolt
    ctx.beginPath();
    ctx.moveTo(size * 0.2, -size);
    ctx.lineTo(-size * 0.3, size * 0.1);
    ctx.lineTo(size * 0.05, size * 0.1);
    ctx.lineTo(-size * 0.2, size);
    ctx.lineTo(size * 0.35, -size * 0.15);
    ctx.lineTo(size * 0.05, -size * 0.15);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 1) {
    // Sparkle / star burst
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Swirl
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 3.2; t += 0.2) {
      const r = (t / (Math.PI * 3.2)) * size;
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// A blurred "newspaper clipping" fragment: bordered box with faux text lines.
function drawNewspaperFragment(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.lineWidth = 1;
  const lines = Math.floor(h / 9);
  for (let i = 0; i < lines; i++) {
    const ly = -h / 2 + 6 + i * 9;
    const lw = w * (0.5 + hash(cx + i) * 0.4);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 5, ly);
    ctx.lineTo(-w / 2 + 5 + lw, ly);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// A thin curved "AI data ribbon": a bezier line studded with small glyph nodes.
function drawDataRibbon(c: Ctx2D, cx: number, cy: number, size: number, rot: number) {
  [c.base, c.emissive].forEach((ctx) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.globalAlpha = ctx === c.emissive ? 1 : 0.75;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.quadraticCurveTo(0, -size * 0.5, size, 0);
    ctx.stroke();

    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const x = -size + t * size * 2;
      const y = -size * 0.5 * (1 - Math.pow(2 * t - 1, 2));
      ctx.beginPath();
      ctx.fillStyle = GOLD;
      ctx.arc(x, y, i % 2 === 0 ? 3 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

function drawGoldSparkle(c: Ctx2D, cx: number, cy: number, size: number) {
  [c.base, c.emissive].forEach((ctx) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = GOLD;
    ctx.fillStyle = GOLD;
    ctx.lineWidth = size * 0.09;
    ctx.globalAlpha = ctx === c.emissive ? 1 : 0.85;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

function drawGoldBubble(c: Ctx2D, cx: number, cy: number, size: number) {
  [c.base, c.emissive].forEach((ctx) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = size * 0.05;
    ctx.globalAlpha = ctx === c.emissive ? 0.9 : 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.68, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

export interface ComicSphereTextures {
  base: THREE.Texture;
  emissive: THREE.Texture;
  sketchOverlay: THREE.Texture;
}

/**
 * Generates the "Comic Intelligence Sphere" surface: an abstract, hand-drawn
 * ink/halftone illustration wrapped around the globe (no maps, no countries),
 * plus a matching emissive map so the gold ink elements glow, plus a sparse
 * transparent overlay texture used for animated flicker/reveal sketch lines.
 */
export function createComicSphereTexture(onProgress?: (progress: number) => void): ComicSphereTextures {
  const width = 4096;
  const height = 2048;

  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = width;
  baseCanvas.height = height;
  const base = baseCanvas.getContext("2d", { alpha: false })!;

  const emissiveCanvas = document.createElement("canvas");
  emissiveCanvas.width = width;
  emissiveCanvas.height = height;
  const emissive = emissiveCanvas.getContext("2d", { alpha: false })!;
  emissive.fillStyle = "#000000";
  emissive.fillRect(0, 0, width, height);

  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlay = overlayCanvas.getContext("2d", { alpha: true })!;
  overlay.clearRect(0, 0, width, height);

  const c: Ctx2D = { base, emissive, width, height };

  onProgress?.(0.05);
  drawGrain(base, width, height);

  // Ambient halftone wash (soft, sparse, monochrome)
  for (let i = 0; i < 26; i++) {
    const x = hash(i * 4.7) * width;
    const y = 200 + hash(i * 8.3 + 1) * (height - 400);
    const r = 140 + hash(i * 2.1) * 220;
    wrapPlace(x, y, r, width, (px) => drawHalftoneCluster(base, px, y, r, INK));
  }
  onProgress?.(0.2);

  // Cross-hatch shading blocks
  for (let i = 0; i < 22; i++) {
    const x = hash(i * 9.1 + 5) * width;
    const y = 150 + hash(i * 6.2 + 2) * (height - 300);
    const w = 180 + hash(i * 3.4) * 260;
    const h = 90 + hash(i * 5.5) * 160;
    const rot = hash(i * 7.7) * Math.PI;
    wrapPlace(x, y, w, width, (px) => drawCrossHatch(base, px, y, w, h, rot, INK));
  }
  onProgress?.(0.32);

  // Manga screentone patches
  for (let i = 0; i < 16; i++) {
    const x = hash(i * 11.3 + 9) * width;
    const y = 200 + hash(i * 4.9 + 3) * (height - 400);
    const w = 160 + hash(i * 2.7) * 220;
    const h = 120 + hash(i * 6.1) * 160;
    const rot = hash(i * 8.9) * Math.PI;
    wrapPlace(x, y, w, width, (px) => drawScreentonePatch(base, px, y, w, h, rot, INK));
  }
  onProgress?.(0.42);

  // Loose sketch strokes scattered everywhere
  for (let i = 0; i < 260; i++) {
    const x = hash(i * 1.37) * width;
    const y = hash(i * 2.53 + 1) * height;
    const size = 30 + hash(i * 3.71) * 90;
    const rot = hash(i * 4.11) * Math.PI * 2;
    const alpha = 0.15 + hash(i * 5.9) * 0.35;
    wrapPlace(x, y, size, width, (px) => drawSketchStroke(base, px, y, size, rot, alpha, INK));
  }
  onProgress?.(0.55);

  // Speech bubbles
  for (let i = 0; i < 18; i++) {
    const x = hash(i * 13.1 + 2) * width;
    const y = 200 + hash(i * 9.7 + 4) * (height - 400);
    const size = 50 + hash(i * 6.3) * 70;
    wrapPlace(x, y, size * 1.3, width, (px) => drawSpeechBubble(base, px, y, size, INK));
  }

  // Motion line clusters
  for (let i = 0; i < 20; i++) {
    const x = hash(i * 15.7 + 3) * width;
    const y = hash(i * 10.3 + 5) * height;
    const size = 60 + hash(i * 4.4) * 90;
    const rot = hash(i * 12.2) * Math.PI * 2;
    wrapPlace(x, y, size, width, (px) => drawMotionLines(base, px, y, size, rot, INK));
  }

  // Newspaper fragments
  for (let i = 0; i < 12; i++) {
    const x = hash(i * 17.9 + 6) * width;
    const y = 180 + hash(i * 8.8 + 7) * (height - 360);
    const w = 140 + hash(i * 3.3) * 120;
    const h = 90 + hash(i * 5.5) * 80;
    const rot = (hash(i * 6.6) - 0.5) * 0.4;
    wrapPlace(x, y, w, width, (px) => drawNewspaperFragment(base, px, y, w, h, rot, INK));
  }
  onProgress?.(0.68);

  // Small ink doodles (bolts, sparkles, swirls)
  for (let i = 0; i < 46; i++) {
    const x = hash(i * 19.3 + 8) * width;
    const y = hash(i * 7.1 + 9) * height;
    const size = 18 + hash(i * 2.9) * 26;
    const kind = Math.floor(hash(i * 14.4) * 3);
    wrapPlace(x, y, size, width, (px) => drawDoodle(base, px, y, size, kind, INK));
  }
  onProgress?.(0.78);

  // Signature gold accents — sparse, glow via emissive canvas too
  for (let i = 0; i < 24; i++) {
    const x = hash(i * 21.1 + 11) * width;
    const y = 150 + hash(i * 9.9 + 12) * (height - 300);
    const size = 24 + hash(i * 4.6) * 26;
    wrapPlace(x, y, size, width, (px) => drawGoldSparkle(c, px, y, size));
  }
  for (let i = 0; i < 10; i++) {
    const x = hash(i * 23.7 + 13) * width;
    const y = 220 + hash(i * 6.4 + 14) * (height - 440);
    const size = 60 + hash(i * 3.8) * 60;
    wrapPlace(x, y, size * 1.3, width, (px) => drawGoldBubble(c, px, y, size));
  }
  for (let i = 0; i < 9; i++) {
    const x = hash(i * 25.3 + 15) * width;
    const y = 260 + hash(i * 5.2 + 16) * (height - 520);
    const size = 90 + hash(i * 6.9) * 110;
    const rot = hash(i * 8.1) * Math.PI * 2;
    wrapPlace(x, y, size, width, (px) => drawDataRibbon(c, px, y, size, rot));
  }
  onProgress?.(0.9);

  // Sparse transparent overlay used for the animated flicker/reveal shells
  for (let i = 0; i < 90; i++) {
    const x = hash(i * 31.1 + 21) * width;
    const y = hash(i * 12.7 + 22) * height;
    const size = 25 + hash(i * 5.3) * 70;
    const rot = hash(i * 9.9) * Math.PI * 2;
    wrapPlace(x, y, size, width, (px) => drawSketchStroke(overlay, px, y, size, rot, 0.5 + hash(i) * 0.4, "#ffffff"));
  }
  for (let i = 0; i < 14; i++) {
    const x = hash(i * 33.9 + 23) * width;
    const y = 200 + hash(i * 6.6 + 24) * (height - 400);
    const size = 20 + hash(i * 4.1) * 22;
    const kind = Math.floor(hash(i * 16.6) * 3);
    wrapPlace(x, y, size, width, (px) => drawDoodle(overlay, px, y, size, kind, "#ffffff"));
  }

  const makeTexture = (canvas: HTMLCanvasElement, transparent: boolean) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = !transparent || true;
    return texture;
  };

  onProgress?.(1.0);

  return {
    base: makeTexture(baseCanvas, false),
    emissive: makeTexture(emissiveCanvas, false),
    sketchOverlay: makeTexture(overlayCanvas, true),
  };
}
