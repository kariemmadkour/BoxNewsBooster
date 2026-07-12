import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createComicIconTexture, type ComicIconKind } from "../utils/comicIcons";

interface Sprite {
  kind: ComicIconKind;
  text?: string;
  radius: number;
  tilt: number;
  angle: number;
  speed: number;
  bobPhase: number;
  bobSpeed: number;
  spinSpeed: number;
  scale: number;
  colorIndex: number;
}

const WORDS = ["AI", "SATIRE", "SCOOP", "LIVE"];

function buildSprites(): Sprite[] {
  const kinds: ComicIconKind[] = ["speech", "bolt", "spark", "ribbon"];
  const sprites: Sprite[] = [];

  // Three independent rings at different radii, tilts, and speeds for depth.
  const rings = [
    { radius: 4.2, tilt: 0.35, speed: 0.05, count: 6 },
    { radius: 4.9, tilt: -0.55, speed: -0.035, count: 5 },
    { radius: 5.6, tilt: 0.15, speed: 0.025, count: 4 },
  ];

  let seed = 0;
  rings.forEach((ring) => {
    for (let i = 0; i < ring.count; i++) {
      seed++;
      const isWord = i % 4 === 3;
      sprites.push({
        kind: isWord ? "word" : kinds[seed % kinds.length],
        text: isWord ? WORDS[seed % WORDS.length] : undefined,
        radius: ring.radius,
        tilt: ring.tilt,
        angle: (i / ring.count) * Math.PI * 2,
        speed: ring.speed,
        bobPhase: seed * 1.7,
        bobSpeed: 0.4 + (seed % 5) * 0.12,
        spinSpeed: 0.15 + (seed % 3) * 0.08,
        scale: isWord ? 0.55 : 0.32 + (seed % 3) * 0.06,
        colorIndex: seed % 3,
      });
    }
  });

  return sprites;
}

export default function OrbitingComicLayer() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const sprites = useMemo(() => buildSprites(), []);

  const textures = useMemo(
    () => sprites.map((s) => createComicIconTexture(s.kind, s.colorIndex, s.text)),
    [sprites]
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    sprites.forEach((s, i) => {
      const group = groupRefs.current[i];
      if (!group) return;

      const angle = s.angle + time * s.speed;
      const x = Math.cos(angle) * s.radius;
      const z = Math.sin(angle) * s.radius;
      const y = Math.sin(angle) * s.radius * Math.sin(s.tilt) + Math.sin(time * s.bobSpeed + s.bobPhase) * 0.18;

      group.position.set(x, y, z * Math.cos(s.tilt));

      // Billboard toward the camera, then add a slow independent spin for kinetic motion.
      group.quaternion.copy(state.camera.quaternion);
      group.rotateZ(time * s.spinSpeed);
    });
  });

  return (
    <group>
      {sprites.map((s, i) => (
        <group key={i} ref={(el) => (groupRefs.current[i] = el)}>
          <mesh>
            <planeGeometry args={[s.scale, s.scale]} />
            <meshBasicMaterial
              map={textures[i]}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
