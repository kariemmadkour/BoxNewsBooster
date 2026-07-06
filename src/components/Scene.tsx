import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Earth from "./Earth";
import Atmosphere from "./Atmosphere";
import Starfield from "./Starfield";
import OrbitingPanels from "./OrbitingPanels";

export default function Scene() {
  const controlsRef = useRef<any>(null);

  // Beautiful Studio spotlight direction
  const sunDirection = useMemo(() => new THREE.Vector3(-6.0, 3.5, 5.0).normalize(), []);

  // Primary studio lamp color (crisp neutral white to render the colored countries accurately)
  const sunColor = "#ffffff";

  // Ambient fill light to ensure all country details are clearly visible from all angles
  const ambientColor = "#d6e6ff";

  // Galactic rim light (soft cool blue backlight for professional 3D volume mapping)
  const backlightColor = "#1e2d3d";
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
          toneMappingExposure: 1.35, // Bright, rich exposure for classroom globe colors
        }}
      >
        {/* Elegant deep space backdrop */}
        <color attach="background" args={["#040712"]} />

        {/* 1. Starfield background */}
        <Starfield count={2200} minRadius={150} maxRadius={350} />

        {/* 2. Primary Studio Directional Spotlight (projects glossy reflections and reflections of country text) */}
        <directionalLight
          position={[sunDirection.x * 12, sunDirection.y * 12, sunDirection.z * 12]}
          intensity={4.8}
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

        {/* 4. Rich Ambient Light so the details on all sides of the political globe are fully readable */}
        <ambientLight intensity={0.55} color={ambientColor} />

        {/* 5. Dual side point lights for realistic orbital specular glints & glossy refraction highlights */}
        <pointLight position={[-6, 4, -4]} intensity={2.5} color="#ec4899" />
        <pointLight position={[6, -4, 4]} intensity={3.5} color="#3b82f6" />

        {/* 6. The core 3D Earth & Acrylic Casing Group */}
        {/* Inclined at Earth's realistic axial tilt of ~23.5 degrees (0.41 radians) */}
        <group rotation={[0, 0, 0.41]}>
          <Earth radius={2.0} sunDirection={sunDirection} />
          {/* Subtle glossy glass highlight ring around the sphere */}
          <Atmosphere radius={2.03} color="#9ec2ff" sunDirection={sunDirection} />
        </group>

        {/* Organized orbiting glass panels (News, Live & Sport) positioned dynamically in camera-local space */}
        <OrbitingPanels orbitRadius={3.35} controlsRef={controlsRef} />

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

        {/* 8. Premium Post-Processing Bloom for glossy lens shine */}
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.8}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
