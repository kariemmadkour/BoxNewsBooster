import * as THREE from "three";

const GOLD = "#D4AF37";
const CYAN = "#4fd8ff";
const WARM_WHITE = "#f5ecd8";

export type ComicIconKind = "speech" | "bolt" | "spark" | "ribbon" | "word";

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return { canvas, ctx: canvas.getContext("2d", { alpha: true })! };
}

function toTexture(canvas: HTMLCanvasElement): THREE.Texture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.premultiplyAlpha = false;
  return texture;
}

function drawSpeechIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const c = size / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.ellipse(c, c * 0.9, size * 0.36, size * 0.24, 0, 0, Math.PI * 2);
  ctx.moveTo(c - size * 0.06, c * 1.1);
  ctx.lineTo(c - size * 0.16, c * 1.35);
  ctx.lineTo(c + size * 0.04, c * 1.14);
  ctx.stroke();
}

function drawBoltIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const s = size * 0.32;
  const c = size / 2;
  ctx.save();
  ctx.translate(c, c);
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.05;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s * 0.2, -s);
  ctx.lineTo(-s * 0.3, s * 0.1);
  ctx.lineTo(s * 0.05, s * 0.1);
  ctx.lineTo(-s * 0.2, s);
  ctx.lineTo(s * 0.35, -s * 0.15);
  ctx.lineTo(s * 0.05, -s * 0.15);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawSparkIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const c = size / 2;
  const r = size * 0.3;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.045;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(c, c, size * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function drawRibbonIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const c = size / 2;
  const r = size * 0.32;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.035;
  ctx.beginPath();
  ctx.moveTo(c - r, c);
  ctx.quadraticCurveTo(c, c - r * 0.9, c + r, c);
  ctx.stroke();
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    const x = c - r + t * r * 2;
    const y = c - r * 0.9 * (1 - Math.pow(2 * t - 1, 2));
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, i % 2 === 0 ? size * 0.028 : size * 0.015, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWordIcon(ctx: CanvasRenderingContext2D, size: number, color: string, text: string) {
  ctx.fillStyle = color;
  ctx.font = `900 ${size * 0.22}px 'Inter', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.1;
  ctx.fillText(text, size / 2, size / 2);
  ctx.shadowBlur = 0;
}

export function createComicIconTexture(kind: ComicIconKind, colorIndex: number, text?: string): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const palette = [GOLD, CYAN, WARM_WHITE];
  const color = palette[colorIndex % palette.length];

  switch (kind) {
    case "speech":
      drawSpeechIcon(ctx, size, color);
      break;
    case "bolt":
      drawBoltIcon(ctx, size, color);
      break;
    case "spark":
      drawSparkIcon(ctx, size, color);
      break;
    case "ribbon":
      drawRibbonIcon(ctx, size, color);
      break;
    case "word":
      drawWordIcon(ctx, size, color, text ?? "AI");
      break;
  }

  return toTexture(canvas);
}
