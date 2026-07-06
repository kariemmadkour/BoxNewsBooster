/**
 * Dynamic canvas texture generator for procedural fallback.
 * Provides a high-fidelity Earth map even when offline or during CDN failures.
 */

// Simple pseudo-random hash
function hash2D(x: number, y: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return h - Math.floor(h);
}

// Bilinear noise
function noise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Smoothstep interpolation
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  const a = hash2D(ix, iy);
  const b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1);
  const d = hash2D(ix + 1, iy + 1);

  return a * (1.0 - ux) * (1.0 - uy) +
         b * ux * (1.0 - uy) +
         c * (1.0 - ux) * uy +
         d * ux * uy;
}

// Fractal Brownian Motion
function fbm(x: number, y: number, octaves: number = 5): number {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

export function createProceduralDayMap(width = 1024, height = 512): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const latitude = (y / height - 0.5) * Math.PI; // -PI/2 to PI/2
    const sinLat = Math.sin(latitude);
    const cosLat = Math.cos(latitude);

    for (let x = 0; x < width; x++) {
      const longitude = (x / width - 0.5) * Math.PI * 2.0; // -PI to PI

      // Convert spherical to 3D Cartesian coordinates for seamless noise wrapping
      const nx = cosLat * Math.sin(longitude) * 2.5;
      const ny = sinLat * 2.5;
      const nz = cosLat * Math.cos(longitude) * 2.5;

      const n = fbm(nx + 50.0, ny + 50.0) + 0.1 * fbm(nx * 3.0, nz * 3.0);
      const idx = (y * width + x) * 4;

      // Color based on height (n) and latitude
      const isOcean = n < 0.45;
      const isPoles = Math.abs(y / height - 0.5) > 0.42;

      if (isPoles && n > 0.35) {
        // Ice caps
        const ice = Math.min(1, (Math.abs(y / height - 0.5) - 0.4) * 20.0 + (1.0 - n) * 0.5);
        data[idx] = Math.floor(240 + ice * 15);
        data[idx + 1] = Math.floor(245 + ice * 10);
        data[idx + 2] = Math.floor(255);
      } else if (isOcean) {
        // Ocean - deep blue to turquoise near shores
        const depth = n / 0.45;
        data[idx] = Math.floor(5 + depth * 15);      // R
        data[idx + 1] = Math.floor(20 + depth * 45); // G
        data[idx + 2] = Math.floor(60 + depth * 80); // B
      } else {
        // Land - green, brown, forest
        const landH = (n - 0.45) / (1.0 - 0.45);
        if (landH < 0.15) {
          // Sandy coast
          data[idx] = 195;
          data[idx + 1] = 175;
          data[idx + 2] = 140;
        } else if (landH < 0.5) {
          // Lush Green / Vegetation
          const greenBlend = (landH - 0.15) / 0.35;
          data[idx] = Math.floor(25 + greenBlend * 15);
          data[idx + 1] = Math.floor(95 - greenBlend * 15);
          data[idx + 2] = Math.floor(35 + greenBlend * 5);
        } else {
          // Mountains - brown to gray/white peaks
          const mountBlend = (landH - 0.5) / 0.5;
          data[idx] = Math.floor(80 + mountBlend * 80);
          data[idx + 1] = Math.floor(65 + mountBlend * 85);
          data[idx + 2] = Math.floor(55 + mountBlend * 95);
        }
      }
      data[idx + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function createProceduralNightMap(width = 1024, height = 512): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const latitude = (y / height - 0.5) * Math.PI;
    const sinLat = Math.sin(latitude);
    const cosLat = Math.cos(latitude);

    for (let x = 0; x < width; x++) {
      const longitude = (x / width - 0.5) * Math.PI * 2.0;

      const nx = cosLat * Math.sin(longitude) * 2.5;
      const ny = sinLat * 2.5;
      const nz = cosLat * Math.cos(longitude) * 2.5;

      const n = fbm(nx + 50.0, ny + 50.0) + 0.1 * fbm(nx * 3.0, nz * 3.0);
      const idx = (y * width + x) * 4;

      const isOcean = n < 0.45;
      const isPoles = Math.abs(y / height - 0.5) > 0.42;

      // Base night is almost pitch black blue
      data[idx] = 2;
      data[idx + 1] = 4;
      data[idx + 2] = 12;
      data[idx + 3] = 255;

      if (!isOcean && !isPoles) {
        // High density city lights close to coasts (transition area)
        const landH = (n - 0.45) / (1.0 - 0.45);
        const nearCoast = landH < 0.12;

        // Use high-frequency noise for individual cities
        const cityNoise = fbm(nx * 12.0, nz * 12.0, 3);
        if (cityNoise > 0.58) {
          const intensity = Math.floor(180 + (cityNoise - 0.58) * 170);
          const isCoastCity = nearCoast && cityNoise > 0.6;
          
          // Golden-orange city light glow
          data[idx] = isCoastCity ? 255 : Math.floor(intensity * 0.95);
          data[idx + 1] = isCoastCity ? 210 : Math.floor(intensity * 0.75);
          data[idx + 2] = isCoastCity ? 130 : Math.floor(intensity * 0.45);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function createProceduralCloudsMap(width = 1024, height = 512): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const latitude = (y / height - 0.5) * Math.PI;
    const sinLat = Math.sin(latitude);
    const cosLat = Math.cos(latitude);

    for (let x = 0; x < width; x++) {
      const longitude = (x / width - 0.5) * Math.PI * 2.0;

      const nx = cosLat * Math.sin(longitude) * 2.0;
      const ny = sinLat * 2.0;
      const nz = cosLat * Math.cos(longitude) * 2.0;

      // Cloud formation using offset fbm (turbulence / plasma)
      const ox = fbm(nx + 1.2, ny + 3.4, 3);
      const oy = fbm(nz + 5.6, nx + 7.8, 3);
      
      const cloudN = fbm(nx * 1.5 + ox * 2.0, nz * 1.5 + oy * 2.0, 4);
      const idx = (y * width + x) * 4;

      if (cloudN > 0.42) {
        const density = Math.min(255, Math.floor((cloudN - 0.42) * 450));
        data[idx] = 255;       // Pure white clouds
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = density; // Alpha is the cloud density
      } else {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
