import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ConveyorBelt: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animate belt UV offset to simulate movement
  useFrame((_, delta) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat && mat.map) {
        mat.map.offset.x += delta * 0.15;
      }
    }
  });

  // Create a grid pattern procedurally for the conveyor belt texture
  const beltTexture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Metallic grey base
      ctx.fillStyle = '#565968';
      ctx.fillRect(0, 0, 128, 128);

      // Belt lines
      ctx.strokeStyle = '#2b2c35';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= 128; i += 16) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 128);
      }
      ctx.stroke();

      // Horizontal grooves
      ctx.strokeStyle = '#7c8096';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 128; i += 32) {
        ctx.moveTo(0, i);
        ctx.lineTo(128, i);
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
      {/* Belt Plane */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 1.8]} />
        <meshStandardMaterial
          map={beltTexture}
          roughness={0.7}
          metalness={0.5}
        />
      </mesh>

      {/* Steel Frame side guards */}
      <mesh position={[0, 0.05, 0.9]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.15, 0.05]} />
        <meshStandardMaterial color="#30343f" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, -0.9]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.15, 0.05]} />
        <meshStandardMaterial color="#30343f" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Leg Supports */}
      <mesh position={[-4, -0.6, 0]}>
        <boxGeometry args={[0.2, 1.2, 1.6]} />
        <meshStandardMaterial color="#1e2025" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[4, -0.6, 0]}>
        <boxGeometry args={[0.2, 1.2, 1.6]} />
        <meshStandardMaterial color="#1e2025" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  );
};
