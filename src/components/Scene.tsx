import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Earth from "./Earth";
import Atmosphere from "./Atmosphere";
import Starfield from "./Starfield";
import OrbitingPanels from "./OrbitingPanels";
import OrbitingComicLayer from "./OrbitingComicLayer";

export default function Scene() {
  const controlsRef = useRef<any>(null);

  // Studio spotlight direction, warmed toward the gold accent
  const sunDirection = useMemo(() => new THREE.Vector3(-6.0, 3.5, 5.0).normalize(), []);

  // Primary studio lamp — warm gold, to catch the ink sphere's emissive gold linework
  const sunColor = "#f5e0a8";

  // Ambient fill — subtle cyan holographic tint
  const ambientColor = "#1a2a4a";

  // Galactic rim light (deep navy backlight for volume against the void)
  const backlightColor = "#07111f";
  const backlightDirection = useMemo(() => sunDirection.clone().multiplyScalar(-1), [sunDirection]);

  return (
    <div id="canvas-container" className="relative w-full h-full select-none outline-none overflow-hidden">
      <Canvas
        id="earth-canvas"
        shadows
        camera={{ position: [0, 0, 5.2], fov: 42, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15, // Moodier exposure to let the gold ink and holographic glow pop
        }}
      >
        {/* Dark navy / midnight void backdrop */}
        <color attach="background" args={["#07111F"]} />

        {/* 1. Ink-splash particle field */}
        <Starfield count={2200} minRadius={150} maxRadius={350} />

        {/* 2. Primary Studio Directional Spotlight (warm gold key light) */}
        <directionalLight
          position={[sunDirection.x * 12, sunDirection.y * 12, sunDirection.z * 12]}
          intensity={4.2}
          color={sunColor}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />

        {/* 3. Backlight for elegant edge profile */}
        <directionalLight
          position={[backlightDirection.x * 12, backlightDirection.y * 12, backlightDirection.z * 12]}
          intensity={1.2}
          color={backlightColor}
        />

        {/* 4. Ambient fill — subtle cyan holographic tint */}
        <ambientLight intensity={0.5} color={ambientColor} />

        {/* 5. Dual side point lights — gold + cyan holographic accent glints */}
        <pointLight position={[-6, 4, -4]} intensity={2.2} color="#D4AF37" />
        <pointLight position={[6, -4, 4]} intensity={2.8} color="#4fd8ff" />

        {/* 6. The Comic Intelligence Sphere & its holographic aura */}
        {/* Inclined at Earth's realistic axial tilt of ~23.5 degrees (0.41 radians) */}
        <group rotation={[0, 0, 0.41]}>
          <Earth radius={2.0} sunDirection={sunDirection} />
          {/* Subtle cyan-to-gold holographic Fresnel rim */}
          <Atmosphere radius={2.03} color="#4fd8ff" sunDirection={sunDirection} />
        </group>

        {/* Interactive orbiting glass channel cards (News, Live & Sport) */}
        <OrbitingPanels orbitRadius={3.35} controlsRef={controlsRef} />

        {/* Decorative outer layers: comic frames, speech bubbles, data ribbons, glowing typography */}
        <OrbitingComicLayer />

        {/* 7. Smooth Cinematic Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={false}
          minDistance={3.2}
          maxDistance={10.0}
          enableDamping={true}
          dampingFactor={0.05}
          autoRotate={false} // Auto-rotation is elegantly managed inside the Earth component
        />

        {/* 8. Bloom tuned for gold emissive ink + holographic glow */}
        <EffectComposer>
          <Bloom
            intensity={1.9}
            luminanceThreshold={0.32}
            luminanceSmoothing={0.75}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
