import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RadiationBeamProps {
  active: boolean;
}

export const RadiationBeam: React.FC<RadiationBeamProps> = ({ active }) => {
  const coneRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (active && coneRef.current) {
      // Pulse animation for high energy effect
      const t = clock.getElapsedTime();
      const scale = 1.0 + Math.sin(t * 12) * 0.05;
      coneRef.current.scale.set(scale, 1.0, scale);
    }
  });

  if (!active) return null;

  return (
    <group position={[1.2, 0.4, 0]}>
      {/* Upper emitter shield structure */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 0.4, 16]} />
        <meshStandardMaterial color="#1a1c24" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Glowing orange/red cone of beam particles */}
      <mesh ref={coneRef} position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.7, 1.4, 32, 1, true]} />
        <meshBasicMaterial
          color="#ff8c00"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Nuclear point light flashing inside */}
      <pointLight position={[0, -0.2, 0]} color="#ffaa00" intensity={4.5} distance={3.0} />
    </group>
  );
};
