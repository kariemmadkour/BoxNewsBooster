import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { createPanelTexture } from "../utils/panelTextures";

interface OrbitingPanelsProps {
  orbitRadius?: number;
  controlsRef: React.RefObject<any>;
}

export default function OrbitingPanels({ orbitRadius = 3.35, controlsRef }: OrbitingPanelsProps) {
  const { camera } = useThree();

  // Active focused panel state
  const [activePanelIndex, setActivePanelIndex] = useState<number | null>(null);
  const activePanelIndexRef = useRef<number | null>(null);
  activePanelIndexRef.current = activePanelIndex;

  // Active hovered panel state for interactive 3D parallax tilt & scale
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  hoveredIndexRef.current = hoveredIndex;

  // Responsive interpolation values for smooth hover transitions on each panel
  const hoverLerp0 = useRef(0);
  const hoverLerp1 = useRef(0);
  const hoverLerp2 = useRef(0);
  const hoverLerps = [hoverLerp0, hoverLerp1, hoverLerp2];

  // Refs to store pre-zoom positions for perfect restoration
  const preZoomPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const preZoomTarget = useRef<THREE.Vector3>(new THREE.Vector3());

  // 1. Generate the three distinct textures on mount
  const textures = useMemo(() => {
    return {
      news: createPanelTexture("news"),
      live: createPanelTexture("live"),
      sport: createPanelTexture("sport"),
    };
  }, []);

  // Dispose of textures on unmount to prevent GPU memory leaks
  useEffect(() => {
    return () => {
      Object.values(textures).forEach((tex) => tex.dispose());
    };
  }, [textures]);

  // Ref array for the 3 orbiting panels
  const panelRefs = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
  ];

  // Setup scroll and touch refs for momentum-based fluid physics
  const targetAngleRef = useRef(0);
  const currentAngleRef = useRef(0);
  const lastAngleRef = useRef(0);
  const lastInteractionTimeRef = useRef(performance.now());

  useEffect(() => {
    let lastTouchY = 0;

    const handleWheel = (event: WheelEvent) => {
      if (activePanelIndexRef.current !== null) return;
      // Scale down deltaY to map to smooth radians
      targetAngleRef.current += event.deltaY * 0.0015;
      lastInteractionTimeRef.current = performance.now();
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (activePanelIndexRef.current !== null) return;
      if (event.touches.length > 0) {
        lastTouchY = event.touches[0].clientY;
        lastInteractionTimeRef.current = performance.now();
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (activePanelIndexRef.current !== null) return;
      if (event.touches.length > 0) {
        const deltaY = lastTouchY - event.touches[0].clientY;
        targetAngleRef.current += deltaY * 0.004; // touch drag mapping
        lastTouchY = event.touches[0].clientY;
        lastInteractionTimeRef.current = performance.now();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Synchronize state with window custom events for clean HTML Overlay integration
  useEffect(() => {
    const onZoomIn = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.index === "number") {
        handleZoomIn(customEvent.detail.index);
      }
    };

    const onZoomOut = () => {
      handleZoomOut();
    };

    window.addEventListener("app-zoom-in", onZoomIn);
    window.addEventListener("app-zoom-out", onZoomOut);

    return () => {
      window.removeEventListener("app-zoom-in", onZoomIn);
      window.removeEventListener("app-zoom-out", onZoomOut);
    };
  }, [camera, activePanelIndex]);

  useEffect(() => {
    // Notify HTML overlay of focused panel index
    window.dispatchEvent(
      new CustomEvent("app-active-panel-changed", {
        detail: { activeIndex: activePanelIndex },
      })
    );
  }, [activePanelIndex]);

  // Smooth cinematic camera animations with premium easing
  const handlePanelClick = (idx: number) => {
    if (activePanelIndex === idx) {
      handleZoomOut();
    } else {
      handleZoomIn(idx);
    }
  };

  const handleZoomIn = (idx: number) => {
    // If not already zoomed in, capture the current position and look target
    if (activePanelIndex === null) {
      preZoomPosition.current.copy(camera.position);
      if (controlsRef.current) {
        preZoomTarget.current.copy(controlsRef.current.target);
      } else {
        preZoomTarget.current.set(0, 0, 0);
      }
    }

    setActivePanelIndex(idx);

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    // Freeze panels' orbit rotation. Compute clicked panel's current exact orbital angle
    const clickedAngle = currentAngleRef.current + (idx * 2 * Math.PI) / 3;

    // Position camera directly in front of the clicked panel's position on the orbit ray
    const zoomDistance = orbitRadius + 1.25; // Sits at 4.6 units from origin
    const targetX = Math.cos(clickedAngle) * zoomDistance;
    const targetY = -0.3;
    const targetZ = Math.sin(clickedAngle) * zoomDistance;

    gsap.killTweensOf(camera.position);
    if (controlsRef.current) {
      gsap.killTweensOf(controlsRef.current.target);
    }

    gsap.to(camera.position, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 1.8,
      ease: "power4.inOut",
      onUpdate: () => {
        if (controlsRef.current) {
          controlsRef.current.update();
        } else {
          camera.lookAt(0, -0.3, 0);
        }
      }
    });

    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: 0,
        y: -0.3,
        z: 0,
        duration: 1.8,
        ease: "power4.inOut"
      });
    }
  };

  const handleZoomOut = () => {
    if (activePanelIndexRef.current === null) return;

    setActivePanelIndex(null);

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }

    gsap.killTweensOf(camera.position);
    if (controlsRef.current) {
      gsap.killTweensOf(controlsRef.current.target);
    }

    // Calculate fallback distances if not previously set
    const fallbackX = camera.position.x * (5.2 / 4.6);
    const fallbackY = 0;
    const fallbackZ = camera.position.z * (5.2 / 4.6);

    const targetX = preZoomPosition.current.x !== 0 ? preZoomPosition.current.x : fallbackX;
    const targetY = preZoomPosition.current.y !== 0 ? preZoomPosition.current.y : fallbackY;
    const targetZ = preZoomPosition.current.z !== 0 ? preZoomPosition.current.z : fallbackZ;

    const lookTargetX = preZoomTarget.current.x;
    const lookTargetY = preZoomTarget.current.y;
    const lookTargetZ = preZoomTarget.current.z;

    gsap.to(camera.position, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 1.6,
      ease: "power4.out",
      onUpdate: () => {
        if (controlsRef.current) {
          controlsRef.current.update();
        } else {
          camera.lookAt(0, 0, 0);
        }
      }
    });

    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: lookTargetX,
        y: lookTargetY,
        z: lookTargetZ,
        duration: 1.6,
        ease: "power4.out"
      });
    }
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Dynamically calculate camera's orbital angle in XZ plane relative to origin [0,0,0]
    const cameraAngle = Math.atan2(state.camera.position.z, state.camera.position.x);

    // Check if the user is actively scrolling or dragging
    const isInteracting = (performance.now() - lastInteractionTimeRef.current) < 800;

    if (activePanelIndexRef.current !== null) {
      // While a panel is active/zoomed, we FREEZE the carousel rotation completely so the panel is static
    } else if (!isInteracting) {
      // Smoothly snap/settle targetAngle to the nearest panel slot relative to camera angle
      const step = (2 * Math.PI) / 3;
      const snapOffset = cameraAngle;

      const currentTarget = targetAngleRef.current;
      const nearestSnap = snapOffset + Math.round((currentTarget - snapOffset) / step) * step;

      // Softly glide targetAngle toward the nearest snapped orientation
      targetAngleRef.current += (nearestSnap - targetAngleRef.current) * 0.08;
    }

    if (activePanelIndexRef.current === null) {
      // Linear interpolation (lerp) for ultra-smooth fluid momentum
      const lerpFactor = 0.045;
      currentAngleRef.current += (targetAngleRef.current - currentAngleRef.current) * lerpFactor;
    }

    // Compute instantaneous angular velocity to drive procedural momentum tilts
    const velocity = activePanelIndexRef.current !== null ? 0 : (currentAngleRef.current - lastAngleRef.current);
    lastAngleRef.current = currentAngleRef.current;

    panelRefs.forEach((ref, index) => {
      if (!ref.current) return;

      // Calculate smooth frame-level interpolation for hover state
      const isHovered = hoveredIndexRef.current === index;
      const targetHover = isHovered ? 1.0 : 0.0;
      hoverLerps[index].current += (targetHover - hoverLerps[index].current) * 0.14; // Ultra-responsive feel
      const currentHover = hoverLerps[index].current;

      // 1. Calculate spaced out angle (120 degrees apart) so they never collide!
      const baseAngle = currentAngleRef.current;
      const offset = (index * 2 * Math.PI) / 3;
      const angle = baseAngle + offset;

      // 2. Beautiful wavy vertical oscillation for extra organic floating feel
      // While active/zoomed, we stabilize the active panel's height to 0 for a pixel-perfect reading canvas
      const isThisActive = activePanelIndexRef.current === index;
      const bobHeight = isThisActive ? 0 : Math.sin(time * 1.4 + index * 2.2) * 0.04;

      // 3. Base position coordinates on the 3D circular path around the globe
      let x = Math.cos(angle) * orbitRadius;
      let z = Math.sin(angle) * orbitRadius;
      let y = -0.3 + bobHeight; // Sits beautifully at the lower-middle height of the globe

      // 4. Calculate relative angle difference to the camera angle to compute focus
      let diff = (angle - cameraAngle) % (2 * Math.PI);
      if (diff > Math.PI) diff -= 2 * Math.PI;
      if (diff < -Math.PI) diff += 2 * Math.PI;

      // focusFactor goes to 1.0 when centered, fading to 0.0 when 90 degrees away
      const focusFactor = Math.max(0, 1.0 - Math.abs(diff) / (Math.PI / 1.8));
      const smoothFocus = Math.sin((focusFactor * Math.PI) / 2);

      // 5. Pull slightly closer to camera when focused to enhance clarity and prevent clipping
      const focusPull = smoothFocus * 0.35 + currentHover * 0.15; // Pulls even closer when hovered!
      const dirToCam = new THREE.Vector3().subVectors(state.camera.position, new THREE.Vector3(x, y, z)).normalize();

      x += dirToCam.x * focusPull;
      y += dirToCam.y * focusPull;
      z += dirToCam.z * focusPull;

      ref.current.position.set(x, y, z);

      // 6. Perfect Reading Alignment: Keep panels perfectly flat and upright facing the screen (2D only)
      ref.current.quaternion.copy(state.camera.quaternion);

      // 7. Momentum Leaning & Wobbling relative to camera plane with active focus stabilization:
      const stabilityMultiplier = isThisActive ? 0 : (1.0 - smoothFocus);

      const leanX = velocity * 4.5; // Pitch tilt
      const leanZ = -velocity * 3.0; // Roll tilt

      const wobbleX = Math.cos(time * 0.8 + index * 1.5) * 0.03;
      const wobbleZ = Math.sin(time * 1.1 + index) * 0.04;

      // Immersive mouse-parallax tilt relative to camera focal plane
      const mouseTiltX = state.pointer.y * 0.16; // tilt up/down
      const mouseTiltY = -state.pointer.x * 0.16; // tilt left/right

      // Apply physical momentum wobble combined with cursor parallax tilts on hover
      ref.current.rotateX((leanX + wobbleX) * stabilityMultiplier + mouseTiltX * currentHover);
      ref.current.rotateY(mouseTiltY * currentHover);
      ref.current.rotateZ((leanZ + wobbleZ) * stabilityMultiplier);

      // 8. Scale up the active focused panel and hovered panel to make them pop visually!
      const scaleMultiplier = (1.0 + smoothFocus * 0.22) * (1.0 + currentHover * 0.08);
      ref.current.scale.setScalar(scaleMultiplier);

      // 9. Dynamically fade out inactive panels and glow the active or hovered one brighter!
      ref.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.Material;
          if (mat && "opacity" in mat) {
            if (mat instanceof THREE.MeshPhysicalMaterial) {
              if (mat.map) {
                // Front printed screen overlay
                mat.opacity = Math.min(1.0, 0.45 + smoothFocus * 0.55 + currentHover * 0.15); // fully visible when centered or hovered
              } else {
                // Clear glass backing plate
                mat.opacity = Math.min(1.0, 0.55 + smoothFocus * 0.33 + currentHover * 0.12);
              }
            } else if (mat instanceof THREE.MeshBasicMaterial) {
              // Glowing wireframe rim / backside hud grid
              mat.opacity = Math.min(1.0, 0.12 + smoothFocus * 0.48 + currentHover * 0.40); // wireframe glows significantly brighter on hover
            }
          }
        }
      });
    });
  });

  // Package the details for each of the three channels
  const channels = [
    { type: "news" as const, texture: textures.news, glowColor: "#ff3366" },
    { type: "live" as const, texture: textures.live, glowColor: "#ec4899" },
    { type: "sport" as const, texture: textures.sport, glowColor: "#22c55e" },
  ];

  return (
    <group onPointerMissed={() => handleZoomOut()}>
      {channels.map((ch, idx) => (
        <group
          key={ch.type}
          ref={panelRefs[idx]}
          onClick={(e) => {
            e.stopPropagation();
            handlePanelClick(idx);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
            setHoveredIndex(idx);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "default";
            setHoveredIndex(null);
          }}
        >
          {/* A. Dynamic Specular Gloss Rim (Thin wireframe overlay around the glass plate for professional neon glowing rim) */}
          <mesh scale={1.005}>
            <boxGeometry args={[1.36, 0.86, 0.042]} />
            <meshBasicMaterial
              color={ch.glowColor}
              wireframe
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* B. Outer Premium Glass Plate (Double sided glass refraction & glossy lamination) */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.35, 0.85, 0.04]} />
            <meshPhysicalMaterial
              transparent
              opacity={0.88}
              color="#ffffff"
              roughness={0.04}
              metalness={0.12}
              transmission={0.93} // physical transparency refraction
              thickness={0.15} // refracts the Earth behind it beautifully!
              clearcoat={1.0}
              clearcoatRoughness={0.02}
              ior={1.5} // standard heavy glass refractive index
              sheen={0.3}
              sheenColor={new THREE.Color("#ffffff")}
            />
          </mesh>

          {/* C. Front Screen Overlay (Double sided printed screen displaying the channel graphics) */}
          <mesh position={[0, 0, 0.021]}>
            <planeGeometry args={[1.31, 0.81]} />
            <meshPhysicalMaterial
              map={ch.texture}
              transparent
              roughness={0.15}
              metalness={0.2}
              clearcoat={0.6}
              clearcoatRoughness={0.05}
              side={THREE.DoubleSide}
              alphaTest={0.01}
            />
          </mesh>

          {/* D. Backside HUD Grid Decoration (gives the panel genuine structural depth when viewed from behind!) */}
          <mesh position={[0, 0, -0.021]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.31, 0.81]} />
            <meshBasicMaterial
              map={ch.texture}
              transparent
              opacity={0.2} // soft ghosting image when viewed from the back
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
