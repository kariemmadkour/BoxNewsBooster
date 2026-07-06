import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createPoliticalGlobeTexture } from "../utils/political";

interface EarthProps {
  radius?: number;
  sunDirection: THREE.Vector3;
}

export default function Earth({ radius = 2.0 }: EarthProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const acrylicRef = useRef<THREE.Mesh>(null);
  const [politicalTexture, setPoliticalTexture] = useState<THREE.Texture | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Load the highly detailed 4K political map texture on mount
  useEffect(() => {
    let active = true;

    async function loadTexture() {
      try {
        const tex = await createPoliticalGlobeTexture((progress) => {
          if (active) setLoadingProgress(progress);
        });
        if (active) {
          setPoliticalTexture(tex);
        }
      } catch (err) {
        console.error("Failed to generate political globe texture:", err);
      }
    }

    loadTexture();

    return () => {
      active = false;
      if (politicalTexture) {
        politicalTexture.dispose();
      }
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Constant slow rotation of the globe (approx 1.5 degrees per second)
    // Matches the "rotating with all details" requirement
    if (globeRef.current) {
      globeRef.current.rotation.y = time * 0.04;
    }

    // Slightly different speed for the outer acrylic glossy wrapper to create beautiful moving specular shifts
    if (acrylicRef.current) {
      acrylicRef.current.rotation.y = time * 0.042;
    }
  });

  return (
    <group>
      {/* 1. The main political globe sphere */}
      {politicalTexture ? (
        <mesh ref={globeRef} castShadow receiveShadow>
          <sphereGeometry args={[radius, 128, 128]} />
          {/* Use MeshPhysicalMaterial to get high-fidelity plastic clearcoat, glossy shine, and deep colors */}
          <meshPhysicalMaterial
            map={politicalTexture}
            roughness={0.16}
            metalness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            reflectivity={0.9}
            ior={1.5} // Index of Refraction for standard polished acrylic plastic
            sheen={0.2}
            sheenColor={new THREE.Color("#ffffff")}
          />
        </mesh>
      ) : (
        // High-quality loading fallback sphere
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial color="#3b82f6" wireframe />
        </mesh>
      )}

      {/* 2. Beautiful ultra-thin transparent protective acrylic outer shell */}
      {/* Adds realistic lens flares, glares, and professional plastic globe lamination */}
      <mesh ref={acrylicRef} scale={1.008}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.12}
          color="#ffffff"
          roughness={0.02}
          metalness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          transmission={0.95}
          ior={1.49}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
