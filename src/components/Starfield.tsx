import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const starVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aTwinkleSpeed;
  attribute float aSeed;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vColor = aColor;
    vSeed = aSeed;
    // Slow shimmer instead of a fast twinkle — feels like drifting ink, not stars
    vAlpha = 0.35 + 0.65 * sin(uTime * aTwinkleSpeed + aPhase);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Attenuate point size with distance from camera
    gl_PointSize = aSize * (400.0 / -mvPosition.z);
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    // Jagged, irregular blot edge instead of a perfect circle — reads as an ink splash
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    float angle = atan(center.y, center.x);
    float wobble = 0.42
      + 0.10 * sin(angle * 5.0 + vSeed * 12.0)
      + 0.06 * sin(angle * 11.0 + vSeed * 5.0);
    if (dist > wobble) {
      discard;
    }

    float glow = smoothstep(wobble, 0.0, dist);
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

export default function Starfield({ count = 2500, minRadius = 120, maxRadius = 250 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate ink-splash coordinates, sizes, colors, and shimmer params
  const { positions, sizes, colors, phases, speeds, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const seeds = new Float32Array(count);

    const starColors = [
      new THREE.Color("#f5ecd8"), // Warm white ink
      new THREE.Color("#f5ecd8"),
      new THREE.Color("#D4AF37"), // Gold
      new THREE.Color("#4fd8ff"), // Subtle cyan holographic highlight
    ];

    for (let i = 0; i < count; i++) {
      // Uniform distribution inside a hollow sphere shell
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const r = minRadius + Math.random() * (maxRadius - minRadius);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random size
      sizes[i] = 0.5 + Math.random() * 2.5;

      // Select random astronomical color
      const col = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      // Unique phase and speed for shimmer offset
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.5 + Math.random() * 2.0;

      // Seed used to shape each particle's jagged ink-blot silhouette
      seeds[i] = Math.random() * 100;
    }

    return { positions, sizes, colors, phases, speeds, seeds };
  }, [count, minRadius, maxRadius]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
        <bufferAttribute
          attach="attributes-aTwinkleSpeed"
          args={[speeds, 1]}
        />
        <bufferAttribute
          attach="attributes-aSeed"
          args={[seeds, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{
          uTime: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
