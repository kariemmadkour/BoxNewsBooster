import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createComicSphereTexture } from "../utils/comicSphereTexture";

interface EarthProps {
  radius?: number;
  sunDirection: THREE.Vector3;
}

const GOLD = new THREE.Color("#D4AF37");

export default function Earth({ radius = 2.0 }: EarthProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const sketchRefA = useRef<THREE.Mesh>(null);
  const sketchRefB = useRef<THREE.Mesh>(null);
  const sketchMatA = useRef<THREE.MeshBasicMaterial>(null);
  const sketchMatB = useRef<THREE.MeshBasicMaterial>(null);

  // Generate the "Comic Intelligence Sphere" ink/halftone artwork once —
  // fully procedural, so this never depends on network access.
  const { base, emissive, sketchOverlay } = useMemo(() => createComicSphereTexture(), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Slow rotation of the core sphere
    if (globeRef.current) {
      globeRef.current.rotation.y = time * 0.035;

      // Subtle breathing / pulse — a living AI object, not a static globe
      const breathe = 1.0 + Math.sin(time * 0.6) * 0.015;
      globeRef.current.scale.setScalar(breathe);
    }

    // Gold ink glows with a slow independent pulse
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 1.1 + Math.sin(time * 0.6 + 1.2) * 0.5;
    }

    // Two counter-rotating sketch-line shells that fade in/out independently,
    // giving the illusion of sketch lines appearing and disappearing.
    if (sketchRefA.current) {
      sketchRefA.current.rotation.y = time * 0.06;
      sketchRefA.current.rotation.x = Math.sin(time * 0.15) * 0.05;
    }
    if (sketchMatA.current) {
      sketchMatA.current.opacity = 0.12 + Math.max(0, Math.sin(time * 0.35)) * 0.22;
    }

    if (sketchRefB.current) {
      sketchRefB.current.rotation.y = -time * 0.045;
      sketchRefB.current.rotation.x = Math.cos(time * 0.12) * 0.05;
    }
    if (sketchMatB.current) {
      sketchMatB.current.opacity = 0.1 + Math.max(0, Math.cos(time * 0.28 + 2.1)) * 0.2;
    }
  });

  return (
    <group>
      {/* 1. The core Comic Intelligence Sphere — ink/halftone artwork, no map */}
      <mesh ref={globeRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshPhysicalMaterial
          ref={materialRef}
          map={base}
          emissiveMap={emissive}
          emissive={GOLD}
          emissiveIntensity={1.1}
          roughness={0.5}
          metalness={0.15}
          clearcoat={0.5}
          clearcoatRoughness={0.25}
          reflectivity={0.4}
          transmission={0.06}
          ior={1.45}
          sheen={0.35}
          sheenColor={new THREE.Color("#4fd8ff")}
        />
      </mesh>

      {/* 2 & 3. Animated sketch-line shells: sparse ink strokes fading in/out for a "living" sketch feel */}
      <mesh ref={sketchRefA} scale={1.012}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          ref={sketchMatA}
          map={sketchOverlay}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={sketchRefB} scale={1.024}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          ref={sketchMatB}
          map={sketchOverlay}
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
