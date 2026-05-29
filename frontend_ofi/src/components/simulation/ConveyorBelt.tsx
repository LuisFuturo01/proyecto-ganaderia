import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ConveyorBelt: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animate belt UV offset to simulate movement (inverted to match correct flow)
  useFrame((_, delta) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat && mat.map) {
        mat.map.offset.x -= delta * 0.15;
      }
    }
  });

  // Create a grid pattern procedurally for the conveyor belt texture (Minimalist bright lead-grey "plomo")
  const beltTexture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Very bright sleek metallic lead-grey plomo base (highly visible and reflective)
      ctx.fillStyle = '#cfd3e0';
      ctx.fillRect(0, 0, 128, 128);

      // Subtle minimalist transverse belt tracks
      ctx.strokeStyle = '#aeb2c5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 128; i += 32) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 128);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }, []);

  return (
    <group position={[0, -0.6, 0]}>
      {/* Conveyor Chassis - Heavy duty steel frame under the belt to increase thickness/height ("alto mas grande") */}
      <mesh position={[0, -0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.32, 2.38]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 3D Belt Box (width 2.4, thickness 0.08, bright minimalist lead-grey plomo texture) */}
      {/* Using a 3D Box instead of a 2D plane prevents distortion and transparency when moving the camera */}
      <mesh ref={meshRef} position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[12, 0.08, 2.4]} />
        <meshStandardMaterial
          map={beltTexture}
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>

      {/* Steel Frame elevated safety side walls (painted a clean, premium, futuristic white) */}
      <mesh position={[0, 0.1, 1.2]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.35, 0.06]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.5} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.1, -1.2]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.35, 0.06]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.5} roughness={0.15} />
      </mesh>

      {/* Robust vertical support columns - Doubled thickness (radius 0.12) to feel solid and professional */}
      {/* Front-left pillar */}
      <mesh position={[-4.5, -0.65, 1.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.3, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Back-left pillar */}
      <mesh position={[-4.5, -0.65, -1.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.3, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Front-right pillar */}
      <mesh position={[4.5, -0.65, 1.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.3, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Back-right pillar */}
      <mesh position={[4.5, -0.65, -1.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.3, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Thick rubber feet at the base of each pillar */}
      <mesh position={[-4.5, -1.28, 1.2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <mesh position={[-4.5, -1.28, -1.2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <mesh position={[4.5, -1.28, 1.2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <mesh position={[4.5, -1.28, -1.2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
    </group>
  );
};
