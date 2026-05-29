import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RadiationMachineProps {
  active: boolean;
  /** X position on the conveyor belt */
  positionX?: number;
}

/**
 * Máquina de irradiación profesional:
 * Un aro grueso blanco/plateado perpendicular que envuelve la cinta transportadora (3x más ancho).
 * Cuando está activa, emite una luz intensa desde dentro del aro hacia el centro.
 */
export const RadiationBeam: React.FC<RadiationMachineProps> = ({ active, positionX = 1.5 }) => {
  const glowRef = useRef<THREE.PointLight>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (active) {
      const t = clock.getElapsedTime();
      // Pulsación suave de la luz
      const intensity = 6.0 + Math.sin(t * 4) * 2.5;
      if (glowRef.current) {
        glowRef.current.intensity = intensity;
      }
      // Pulsación del anillo interior luminoso
      if (innerGlowRef.current) {
        const mat = innerGlowRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.25 + Math.sin(t * 6) * 0.15;
      }
    }
  });

  return (
    <group position={[positionX, 0, 0]}>
      {/* === ESTRUCTURA EXTERIOR: Aro principal grueso blanco/plateado === */}
      {/* Grupo escalado en X para hacer la máquina casi 3 veces más gruesa a lo largo de la cinta */}
      <group scale={[2.8, 1.0, 1.0]}>
        {/* Torus perpendicular que envuelve la cinta (aumentado de 1.3 a 1.6 de radio) */}
        <mesh rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <torusGeometry args={[1.6, 0.22, 24, 48]} />
          <meshStandardMaterial
            color="#f3f4f6"
            metalness={0.7}
            roughness={0.25}
            envMapIntensity={1.0}
          />
        </mesh>

        {/* Anillo interior decorativo (más delgado, ligeramente más pequeño) */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.45, 0.06, 16, 48]} />
          <meshStandardMaterial
            color="#d0d0d8"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Segundo anillo exterior decorativo */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.75, 0.04, 12, 48]} />
          <meshStandardMaterial
            color="#b0b0b8"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* === SOPORTES LATERALES: Pilares que soportan el aro (posicionados fuera de la cinta a z = 1.35) === */}
      {/* Pilar izquierdo */}
      <mesh position={[0, -0.9, 1.35]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.5, 0.25]} />
        <meshStandardMaterial color="#b8b8c0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Pilar derecho */}
      <mesh position={[0, -0.9, -1.35]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.5, 0.25]} />
        <meshStandardMaterial color="#b8b8c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* === EMISIÓN DE LUZ CUANDO ACTIVO === */}
      {active && (
        <>
          <group scale={[2.8, 1.0, 1.0]}>
            {/* Anillo luminoso interior (la "luz" que emite la máquina) */}
            <mesh ref={innerGlowRef} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[1.35, 0.12, 16, 48]} />
              <meshBasicMaterial
                color="#ffcc44"
                transparent
                opacity={0.35}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Halo de luz interior (plano circular luminoso) */}
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <ringGeometry args={[0.1, 1.3, 32]} />
              <meshBasicMaterial
                color="#ffdd66"
                transparent
                opacity={0.12}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* Luz puntual central (ilumina el objeto al pasar) */}
          <pointLight
            ref={glowRef}
            position={[0, 0, 0]}
            color="#ffcc44"
            intensity={6.0}
            distance={4.0}
            decay={2}
          />

          {/* Luces secundarias para efecto volumétrico */}
          <pointLight
            position={[0.3, 0.5, 0]}
            color="#ffaa22"
            intensity={2.0}
            distance={2.5}
          />
          <pointLight
            position={[-0.3, -0.3, 0]}
            color="#ffdd88"
            intensity={1.5}
            distance={2.0}
          />
        </>
      )}

      {/* Indicador LED de estado (siempre visible) */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={active ? '#44ff44' : '#444444'} />
      </mesh>
    </group>
  );
};
