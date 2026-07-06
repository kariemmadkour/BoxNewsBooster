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
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(vViewDir);
    
    // Smooth Fresnel effect to create a gorgeous glass-rim edge highlight
    // Represents light refracting on the outer protective plastic casing
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
    
    // Light influence from the primary studio lamp
    float sunInfluence = max(dot(normal, normalize(uSunDirection)), 0.0);
    float scattering = smoothstep(-0.2, 0.5, dot(normal, normalize(uSunDirection)));
    
    // Soft blend of ambient cool rim light with golden sunset sheen at the grazing angle
    vec3 edgeColor = mix(uAtmosphereColor, vec3(1.0, 0.75, 0.45), sunInfluence * 0.4);
    
    // Total alpha intensity for the outer rim shine
    float alpha = fresnel * (scattering * 0.8 + 0.2) * 0.7;
    
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
  color = "#a3cfff", // Soft clear sky/glass glow
  sunDirection,
}: AtmosphereProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uSunDirection.value.copy(sunDirection);
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
        }}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide} // Render back side for volumetric glass envelope glow
        depthWrite={false}
      />
    </mesh>
  );
}
