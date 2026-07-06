import * as THREE from "three";

// Dynamic Classroom/Classroom political color palette for countries
const PALETTE = [
  "#ff6097", // Vibrant Pink
  "#ffd33d", // Sunny Yellow
  "#4ade80", // Leaf Green
  "#f97316", // Warm Orange
  "#a855f7", // Violet Purple
  "#2dd4bf", // Bright Teal
];

// Helper to get a stable color index for a country based on its name
function getCountryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

// Draw a beautiful coordinate grid on the canvas
function drawGridLines(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = "rgba(0, 30, 80, 0.15)"; // Soft dark blue grid lines
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]); // Dashed lines for standard parallels and meridians

  // Longitude (Meridian) lines every 30 degrees
  for (let lng = -150; lng <= 150; lng += 30) {
    const x = ((lng + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Add small coordinate labels at the equator level
    ctx.fillStyle = "rgba(0, 30, 80, 0.4)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(`${Math.abs(lng)}°${lng >= 0 ? "E" : "W"}`, x + 5, height / 2 - 10);
  }

  // Latitude lines every 30 degrees
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "rgba(0, 30, 80, 0.4)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(`${Math.abs(lat)}°${lat >= 0 ? "N" : "S"}`, 10, y - 5);
  }

  // 1. Highlight the Equator (0° Latitude)
  const equatorY = height / 2;
  ctx.strokeStyle = "rgba(180, 40, 40, 0.4)"; // Reddish equator line
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 6]);
  ctx.beginPath();
  ctx.moveTo(0, equatorY);
  ctx.lineTo(width, equatorY);
  ctx.stroke();

  ctx.fillStyle = "rgba(180, 40, 40, 0.6)";
  ctx.font = "bold 16px 'Inter', sans-serif";
  ctx.fillText("EQUATOR", width - 100, equatorY - 8);

  // 2. Tropic of Cancer (23.5° N)
  const cancerY = ((90 - 23.5) / 180) * height;
  ctx.strokeStyle = "rgba(0, 30, 80, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, cancerY);
  ctx.lineTo(width, cancerY);
  ctx.stroke();
  ctx.fillStyle = "rgba(0, 30, 80, 0.5)";
  ctx.font = "italic 14px 'Inter', sans-serif";
  ctx.fillText("TROPIC OF CANCER", 50, cancerY - 6);

  // 3. Tropic of Capricorn (23.5° S)
  const capricornY = ((90 - -23.5) / 180) * height;
  ctx.beginPath();
  ctx.moveTo(0, capricornY);
  ctx.lineTo(width, capricornY);
  ctx.stroke();
  ctx.fillText("TROPIC OF CAPRICORN", 50, capricornY + 18);

  // Reset line dash
  ctx.setLineDash([]);
}

// Predefined labels for major oceans and water bodies to populate the map
const WATER_LABELS = [
  { text: "NORTH PACIFIC OCEAN", lng: -140, lat: 25, size: 28, letterSpacing: 4 },
  { text: "SOUTH PACIFIC OCEAN", lng: -130, lat: -25, size: 28, letterSpacing: 4 },
  { text: "NORTH ATLANTIC OCEAN", lng: -40, lat: 30, size: 28, letterSpacing: 4 },
  { text: "SOUTH ATLANTIC OCEAN", lng: -15, lat: -25, size: 28, letterSpacing: 4 },
  { text: "INDIAN OCEAN", lng: 80, lat: -15, size: 30, letterSpacing: 5 },
  { text: "ARABIAN SEA", lng: 64, lat: 14, size: 16, letterSpacing: 2 },
  { text: "BAY OF BENGAL", lng: 88, lat: 13, size: 14, letterSpacing: 2 },
  { text: "MEDITERRANEAN SEA", lng: 18, lat: 34, size: 14, letterSpacing: 1 },
  { text: "CARIBBEAN SEA", lng: -75, lat: 15, size: 14, letterSpacing: 1 },
  { text: "CORAL SEA", lng: 155, lat: -18, size: 14, letterSpacing: 1 },
  { text: "SOUTHERN OCEAN", lng: 0, lat: -65, size: 26, letterSpacing: 6 },
  { text: "ARCTIC OCEAN", lng: 0, lat: 82, size: 24, letterSpacing: 5 },
];

export async function createPoliticalGlobeTexture(
  onProgress?: (progress: number) => void
): Promise<THREE.Texture> {
  const width = 4096;
  const height = 2048;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });

  if (!ctx) {
    throw new Error("Could not construct 2D context for political canvas map.");
  }

  // 1. Fill beautiful polished blue ocean background
  ctx.fillStyle = "#5fa3fa"; // Bright high-end glossy ocean blue
  ctx.fillRect(0, 0, width, height);

  // 2. Draw standard grid coordinate lines
  drawGridLines(ctx, width, height);

  // Define fallback if loading fails
  const renderFallback = () => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.font = "bold 120px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("POLITICAL GLOBE", width / 2, height / 2);
  };

  try {
    onProgress?.(0.1);
    const response = await fetch(
      "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson"
    );
    if (!response.ok) throw new Error("Failed to load political GeoJSON map boundaries");

    onProgress?.(0.4);
    const geojson = await response.json();
    onProgress?.(0.6);

    const features = geojson.features;

    // We will collect land centroid information to print crisp country text labels on top of them
    const labelQueue: { name: string; x: number; y: number; area: number }[] = [];

    // Helper to map longitude/latitude to canvas x/y
    const mapCoords = (lng: number, lat: number) => {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return { x, y };
    };

    // Render country features
    features.forEach((feature: any) => {
      const name = feature.properties.name || feature.properties.NAME || "Unknown";
      const geometry = feature.geometry;
      const color = getCountryColor(name);

      ctx.fillStyle = color;
      ctx.strokeStyle = "#111111"; // Distinct black/dark-gray classroom globe borders
      ctx.lineWidth = 2.0;

      let totalX = 0;
      let totalY = 0;
      let coordCount = 0;
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;

      const drawPolygon = (ring: number[][]) => {
        if (ring.length < 3) return;
        ctx.beginPath();
        const start = mapCoords(ring[0][0], ring[0][1]);
        ctx.moveTo(start.x, start.y);

        ring.forEach((pt) => {
          const p = mapCoords(pt[0], pt[1]);
          ctx.lineTo(p.x, p.y);

          // Accumulate for centroid estimation
          totalX += p.x;
          totalY += p.y;
          coordCount++;

          // Bounding box for area calculation
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      if (geometry.type === "Polygon") {
        geometry.coordinates.forEach((ring: number[][]) => drawPolygon(ring));
      } else if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach((polygon: number[][][]) => {
          polygon.forEach((ring: number[][]) => drawPolygon(ring));
        });
      }

      // Estimate centroid and land bounding size
      if (coordCount > 0) {
        const cx = totalX / coordCount;
        const cy = totalY / coordCount;
        const area = (maxX - minX) * (maxY - minY);
        labelQueue.push({ name, x: cx, y: cy, area });
      }
    });

    onProgress?.(0.8);

    // 3. Draw Water Labels
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    WATER_LABELS.forEach((ocean) => {
      const p = mapCoords(ocean.lng, ocean.lat);
      ctx.fillStyle = "rgba(0, 35, 95, 0.55)"; // Elegant translucent dark blue
      ctx.font = `bold italic ${ocean.size}px 'Inter', sans-serif`;
      
      // Draw ocean label with letter spacing
      ctx.fillText(ocean.text, p.x, p.y);
    });

    // 4. Draw Country Labels sorted by size/area so larger countries get priority text
    labelQueue.sort((a, b) => b.area - a.area);

    labelQueue.forEach((lbl) => {
      // Scale label size based on area of the country bounding box
      let fontSize = 12;
      let drawLabel = true;

      if (lbl.area > 50000) {
        fontSize = 24; // Massive countries (e.g. Russia, Canada, USA, Brazil, China, Australia)
      } else if (lbl.area > 15000) {
        fontSize = 18; // Medium-large countries (e.g. Algeria, Saudi Arabia, India)
      } else if (lbl.area > 4000) {
        fontSize = 14; // Medium countries
      } else if (lbl.area > 800) {
        fontSize = 10; // Smaller countries
      } else {
        drawLabel = false; // Skip drawing very tiny island countries to keep map highly legible
      }

      // Let's force draw key countries from the reference photo
      const highPriority = ["Algeria", "Libya", "Egypt", "Sudan", "Mali", "Niger", "Chad", "Nigeria", "Saudi Arabia", "Yemen", "Oman", "Somalia", "Kenya", "Angola", "South Africa", "DR Congo"];
      if (highPriority.includes(lbl.name)) {
        drawLabel = true;
        fontSize = Math.max(fontSize, 15);
      }

      if (drawLabel) {
        ctx.fillStyle = "#111111"; // Sharp black printed classroom text
        ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
        
        // Soft pale yellow background halo outline so text is perfectly readable across varying political colors
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 3.5;
        ctx.strokeText(lbl.name.toUpperCase(), lbl.x, lbl.y);
        ctx.fillText(lbl.name.toUpperCase(), lbl.x, lbl.y);
      }
    });

  } catch (error) {
    console.error("Error drawing premium political map:", error);
    renderFallback();
  }

  // Convert the fully rasterized high-res canvas into a ThreeJS Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;

  onProgress?.(1.0);
  return texture;
}
