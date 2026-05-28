import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ScannerLaserProps {
  active: boolean;
}

export const ScannerLaser: React.FC<ScannerLaserProps> = ({ active }) => {
  const laserRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (active && laserRef.current) {
      // Move laser line back and forth along the scanner tunnel (X axis around center-left)
      const t = clock.getElapsedTime();
      laserRef.current.position.x = -1.2 + Math.sin(t * 5) * 0.4;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Outer Scanner Ring/Arch structure */}
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.1, 0.08, 8, 24]} />
        <meshStandardMaterial color="#0b172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Laser Plane Emitter */}
      <mesh ref={laserRef} position={[-1.2, 0, 0]}>
        <boxGeometry args={[0.02, 1.8, 1.6]} />
        <meshBasicMaterial
          color="#00FF9F"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Laser floor indicator glow */}
      <mesh position={[-1.2, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 1.6]} />
        <meshBasicMaterial
          color="#00FF9F"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Internal scanner lights */}
      <pointLight position={[-1.2, 0.8, 0]} color="#00FF9F" intensity={2.5} distance={2.5} />
    </group>
  );
};
