import * as THREE from "three";

export function createPanelTexture(type: "news" | "live" | "sport"): THREE.Texture {
  const width = 512;
  const height = 320;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });

  if (!ctx) {
    throw new Error("Could not construct 2D context for orbiting panel texture.");
  }

  // 1. Draw Glass Backdrop with translucent glass effect
  // Monochrome navy + gold/cyan comic-card theme (matches the Comic Intelligence Sphere)
  let accentColor = "#D4AF37"; // gold
  let secondaryColor = "#4fd8ff"; // subtle cyan holographic highlight
  if (type === "news") {
    accentColor = "#D4AF37"; // gold
    secondaryColor = "#f5ecd8"; // warm white ink
  } else if (type === "live") {
    accentColor = "#4fd8ff"; // cyan
    secondaryColor = "#D4AF37"; // gold
  } else if (type === "sport") {
    accentColor = "#D4AF37"; // gold
    secondaryColor = "#4fd8ff"; // cyan
  }

  // Base frosted glass color — dark navy
  ctx.fillStyle = "rgba(7, 17, 31, 0.78)";
  ctx.fillRect(0, 0, width, height);

  // Soft internal radial color glow to mimic embedded screen lights
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    50,
    width / 2,
    height / 2,
    width / 1.5
  );
  gradient.addColorStop(0, `${accentColor}1d`); // very soft transparent accent glow
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Futuristic High-Tech Glass Frame / Border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Bright corners to give it a high-fidelity HUD look
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;

  // Top Left corner
  ctx.beginPath();
  ctx.moveTo(4, 30);
  ctx.lineTo(4, 4);
  ctx.lineTo(30, 4);
  ctx.stroke();

  // Top Right corner
  ctx.beginPath();
  ctx.moveTo(width - 4, 30);
  ctx.lineTo(width - 4, 4);
  ctx.lineTo(width - 30, 4);
  ctx.stroke();

  // Bottom Left corner
  ctx.beginPath();
  ctx.moveTo(4, height - 30);
  ctx.lineTo(4, height - 4);
  ctx.lineTo(30, height - 4);
  ctx.stroke();

  // Bottom Right corner
  ctx.beginPath();
  ctx.moveTo(width - 4, height - 30);
  ctx.lineTo(width - 4, height - 4);
  ctx.lineTo(width - 30, height - 4);
  ctx.stroke();

  // 3. Draw Header Section (Branding)
  // Badge/Tag
  ctx.fillStyle = accentColor;
  ctx.fillRect(20, 20, 75, 20);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(type === "news" ? "ALERT" : type === "live" ? "LIVE" : "MATCH", 57, 30);

  // Main title branding
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 21px 'Inter', sans-serif";
  const channelName = type === "news" ? "NNSENSE NEWS" : type === "live" ? "NNSENSE LIVE" : "NNSENSE SPORT";
  ctx.fillText(channelName, 105, 31);

  // Channel Frequency / Tech metadata
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "600 11px 'JetBrains Mono', monospace";
  const channelFreq = type === "news" ? "FRQ: 142.8" : type === "live" ? "STREAM: B-01" : "CH: SP03";
  ctx.fillText(channelFreq, width - 24, 31);

  // 4. Draw Procedural Mock Thumbnail Image
  // Outer Thumbnail Frame
  const tx = 20;
  const ty = 54;
  const tw = width - 40;
  const th = 196;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(tx, ty, tw, th);

  // Clip content inside the thumbnail
  ctx.save();
  ctx.beginPath();
  ctx.rect(tx, ty, tw, th);
  ctx.clip();

  // Dark backdrop for mock video screen
  ctx.fillStyle = "rgba(4, 8, 20, 0.9)";
  ctx.fillRect(tx, ty, tw, th);

  // Let's paint custom abstract graphics based on channel type!
  if (type === "news") {
    // Elegant sphere contours / digital tech grids
    ctx.strokeStyle = `${accentColor}33`; // soft gold
    ctx.lineWidth = 1.5;
    for (let r = 20; r < 200; r += 24) {
      ctx.beginPath();
      ctx.arc(tw / 2 + 20, ty + th / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Grid overlays
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    for (let gx = tx; gx < tx + tw; gx += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, ty);
      ctx.lineTo(gx, ty + th);
      ctx.stroke();
    }
    for (let gy = ty; gy < ty + th; gy += 20) {
      ctx.beginPath();
      ctx.moveTo(tx, gy);
      ctx.lineTo(tx + tw, gy);
      ctx.stroke();
    }

    // Breaking news sweep lines
    ctx.fillStyle = accentColor;
    ctx.fillRect(tx, ty + th - 36, tw, 3);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(tx, ty + th - 33, tw, 33);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("WORLD REPORT: GLOBAL CONVERGENCE", tx + 16, ty + th - 13);

  } else if (type === "live") {
    // Dynamic sound wave/audio frequency spectrogram
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(tx, ty, tw, th);

    // Dynamic wave curves
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx, ty + th / 2);
    for (let wx = 0; wx < tw; wx++) {
      const wy = Math.sin(wx * 0.03) * 35 * Math.sin(wx * 0.01) + Math.cos(wx * 0.08) * 10;
      ctx.lineTo(tx + wx, ty + th / 2 + wy);
    }
    ctx.stroke();

    // Secondary wave
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx, ty + th / 2);
    for (let wx = 0; wx < tw; wx++) {
      const wy = Math.sin(wx * 0.04 + 2) * 20 * Math.cos(wx * 0.02) + Math.sin(wx * 0.1) * 8;
      ctx.lineTo(tx + wx, ty + th / 2 + wy);
    }
    ctx.stroke();

    // Scan lines
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let sy = ty; sy < ty + th; sy += 4) {
      ctx.fillRect(tx, sy, tw, 2);
    }

    // Audio meters in corner
    ctx.fillStyle = accentColor;
    for (let i = 0; i < 15; i++) {
      const hVal = Math.sin(i * 0.4) * 40 + 50;
      ctx.fillRect(tx + 15 + i * 8, ty + th - 15 - hVal, 5, hVal);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("EASTERN HEMISPHERE LIVE STREAM", tx + 16, ty + 24);

  } else if (type === "sport") {
    // Bright diagonal chevrons and stadium floodlight flares
    ctx.fillStyle = "rgba(7, 17, 31, 0.7)";
    ctx.fillRect(tx, ty, tw, th);

    // Stadium line rings in gold
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tx + tw / 2, ty + th, 120, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tx + tw / 2, ty + th, 60, Math.PI, 0);
    ctx.stroke();

    // Center pitch line
    ctx.beginPath();
    ctx.moveTo(tx, ty + th);
    ctx.lineTo(tx + tw, ty + th);
    ctx.stroke();

    // Abstract sports motion vectors (glowing chevrons)
    ctx.strokeStyle = "rgba(79, 216, 255, 0.6)"; // Cyan
    ctx.lineWidth = 4;
    for (let cx = tx + 30; cx < tx + tw; cx += 120) {
      ctx.beginPath();
      ctx.moveTo(cx, ty + th / 2 - 20);
      ctx.lineTo(cx + 15, ty + th / 2);
      ctx.lineTo(cx, ty + th / 2 + 20);
      ctx.stroke();
    }

    // Sport scoreboard overlay
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(tx + tw / 2 - 80, ty + 12, 160, 32);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + tw / 2 - 80, ty + 12, 160, 32);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 13px 'JetBrains Mono', monospace";
    ctx.fillText("FCB 2 - 1 RMA", tx + tw / 2, ty + 28);
  }

  ctx.restore();

  // 5. Draw Footer Section
  // Bottom telemetry logs
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "500 10px 'JetBrains Mono', monospace";
  const telemetryText =
    type === "news"
      ? "DATALINK: ACTIVE // LATENCY 12MS // RESOLUTION: 4K"
      : type === "live"
      ? "SYS: SECURE // BITRATE: 42.5 MBPS // FEED: CLEAR"
      : "MATCH: STAGE 2 // LIVE TELEMETRY STREAM // UHD_60FPS";
  ctx.fillText(telemetryText, 20, height - 16);

  // Tiny tech graphic (decorative barcode block)
  ctx.fillStyle = accentColor;
  for (let i = 0; i < 12; i++) {
    const barWidth = (i % 3 === 0) ? 3 : 1;
    ctx.fillRect(width - 20 - i * 4, height - 22, barWidth, 8);
  }

  // Convert the canvas to a high-end texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;

  return texture;
}
