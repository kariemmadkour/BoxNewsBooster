import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const atmosphereVertexShader = `
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uAtmosphereColor;
  uniform vec3 uSunDirection;
  uniform float uTime;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(vViewDir);

    // Smooth Fresnel effect to create a holographic rim-light edge
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);

    // Light influence from the primary studio lamp
    float sunInfluence = max(dot(normal, normalize(uSunDirection)), 0.0);
    float scattering = smoothstep(-0.2, 0.5, dot(normal, normalize(uSunDirection)));

    // Soft blend of subtle cyan holographic base with a gold sheen at the grazing sun-facing angle
    vec3 edgeColor = mix(uAtmosphereColor, vec3(0.831, 0.686, 0.216), sunInfluence * 0.55);

    // Slow-drifting holographic scanline bands for a "living AI object" shimmer
    float scan = 0.85 + 0.15 * sin(vWorldNormal.y * 26.0 + uTime * 1.1);

    // Total alpha intensity for the outer rim shine
    float alpha = fresnel * (scattering * 0.8 + 0.2) * 0.75 * scan;

    gl_FragColor = vec4(edgeColor * 1.8, alpha);
  }
`;

interface AtmosphereProps {
  radius?: number;
  color?: string;
  sunDirection: THREE.Vector3;
}

export default function Atmosphere({
  radius = 2.02,
  color = "#4fd8ff", // Subtle cyan holographic base glow
  sunDirection,
}: AtmosphereProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uSunDirection.value.copy(sunDirection);
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={{
          uAtmosphereColor: { value: new THREE.Color(color) },
          uSunDirection: { value: sunDirection.clone() },
          uTime: { value: 0 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide} // Render back side for volumetric glass envelope glow
        depthWrite={false}
      />
    </mesh>
  );
}
