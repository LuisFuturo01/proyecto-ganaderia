import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore, BELT_STATIONS } from '../../store/useSimulationStore';
import { ConveyorBelt } from './ConveyorBelt';
import { RadiationBeam } from './RadiationBeam';
import { VegetableModel } from './VegetableModel';
import type { SimulationPhase } from '../../types/jsonData';
import { useTranslation } from '../../hooks/useTranslation';

// ─────────────────────────────────────────────────────
// Utilidades de estaciones
// ─────────────────────────────────────────────────────

/** Obtiene la posición X de una estación */
const getStationX = (phaseId: SimulationPhase): number => {
  const station = BELT_STATIONS.find(s => s.id === phaseId);
  return station ? station.x : -4.5;
};

/** Obtiene el índice de una estación */
const getStationIndex = (phaseId: SimulationPhase): number => {
  const idx = BELT_STATIONS.findIndex(s => s.id === phaseId);
  return idx >= 0 ? idx : 0;
};

/** Determina en qué estación está (o cerca) basándose en X actual */
const getCurrentStationFromX = (x: number): SimulationPhase => {
  let closest = BELT_STATIONS[0];
  let minDist = Math.abs(x - closest.x);
  for (const station of BELT_STATIONS) {
    const dist = Math.abs(x - station.x);
    if (dist < minDist) {
      minDist = dist;
      closest = station;
    }
  }
  return closest.id;
};

// ─────────────────────────────────────────────────────
// Componente de contenido animado dentro del Canvas
// ─────────────────────────────────────────────────────

const AnimatedSceneContent: React.FC = () => {
  const { phase, targetPhase, simulationData, setPhase, setIsMoving, isMoving } = useSimulationStore();
  const vegetableRef = useRef<THREE.Group>(null);
  
  // Velocidad de movimiento en unidades/segundo
  const BELT_SPEED = 3.0;

  // Estado de animación usando ref para evitar re-renders en cada frame
  const animState = useRef({
    currentX: getStationX('reception'),
    targetX: getStationX('reception'),
    lastPhaseAtStation: 'reception' as SimulationPhase,
  });

  // Cuando cambia el targetPhase, calcular la nueva posición destino
  useEffect(() => {
    if (targetPhase === 'idle') return;
    const newTargetX = getStationX(targetPhase);
    animState.current.targetX = newTargetX;

    // Si ambos son reception, resetear la posición física inmediatamente para un nuevo producto
    if (targetPhase === 'reception' && phase === 'reception') {
      animState.current.currentX = newTargetX;
    }
  }, [targetPhase, phase]);

  // Animación frame-by-frame: deslizamiento continuo por la cinta
  useFrame((_, delta) => {
    if (!vegetableRef.current) return;

    const state = animState.current;
    const currentX = state.currentX;
    const targetX = state.targetX;
    const diff = targetX - currentX;
    const absDiff = Math.abs(diff);

    if (absDiff > 0.02) {
      // Movimiento lineal uniforme (velocidad constante como en una cinta real de la vida real)
      // Ajustado a un punto medio de velocidad óptima de 1.8 unidades por segundo
      const LINEAR_SPEED = 1.8;
      const direction = diff > 0 ? 1 : -1;
      const step = Math.min(LINEAR_SPEED * delta, absDiff);
      state.currentX += direction * step;

      // Detectar si acabamos de pasar por una estación
      const nearStation = getCurrentStationFromX(state.currentX);
      if (nearStation !== state.lastPhaseAtStation) {
        state.lastPhaseAtStation = nearStation;
        // Actualizar la fase actual del store (activa efectos visuales de esa estación)
        setPhase(nearStation);
      }
    } else {
      // Llegó al destino
      state.currentX = targetX;
      const finalStation = getCurrentStationFromX(targetX);
      if (state.lastPhaseAtStation !== finalStation) {
        state.lastPhaseAtStation = finalStation;
        setPhase(finalStation);
      }
      if (isMoving) {
        setIsMoving(false);
      }
    }

    // Actualizar posición visual (bajado a -0.28 para estar sobre la cinta)
    vegetableRef.current.position.x = state.currentX;
    vegetableRef.current.position.y = -0.28;

    // Mantener el vegetal completamente quieto sobre su eje para mayor realismo (sin rotar)
    vegetableRef.current.rotation.y = 0.65; // Ángulo estático diagonal óptimo para apreciar su volumen 3D
  });

  // Determinar qué estaciones tienen efectos activos
  const scannerActive = phase === 'scanning';
  const radiationActive = phase === 'irradiation';

  return (
    <group>
      {/* Lights - Superior Studio Illumination */}
      <ambientLight intensity={1.0} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={2.2} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 4, 3]} intensity={2.5} castShadow color="#ffffff" />
      <pointLight position={[2, 4, 3]} intensity={2.5} castShadow color="#00d2fd" />
      <pointLight position={[-2, 3, -2]} intensity={2.0} castShadow color="#00ff9f" />
      <pointLight position={[0, 2, 2]} intensity={1.5} />
      <hemisphereLight args={['#00d2fd', '#374151', 0.6]} />

      {/* Conveyor Belt */}
      <ConveyorBelt />

      {/* Radiation Machine — Professional white ring */}
      <RadiationBeam active={radiationActive} positionX={1.5} />

      {/* Dynamic Vegetable Mesh */}
      {simulationData && simulationData.clasificacion_alimento.tipo_item_detectado && (
        <group ref={vegetableRef} position={[animState.current.currentX, -0.28, 0]}>
          <VegetableModel
            meshData={simulationData.datos_renderizado_malla_grafica}
            phase={phase}
            attenuationProfile={simulationData.simulacion_dosimetria_radiacion.perfil_atenuacion_profundidad_lineal_kGy}
            tipoItem={simulationData.clasificacion_alimento.tipo_item_detectado}
            dimensiones={simulationData.geometria_espacial_3d.dimensiones_caja_borde_cm}
            textureUrl={simulationData.geometria_espacial_3d.ruta_imagen_plana_textura}
            esfericidad={simulationData.geometria_espacial_3d.indice_forma_esfericidad}
          />
        </group>
      )}

      {/* Station markers on the belt */}
      {BELT_STATIONS.map((station) => (
        <group key={station.id} position={[station.x, -0.58, 1.05]}>
          {/* Small glowing marker */}
          <mesh>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial
              color={phase === station.id ? '#00ff9f' : '#334455'}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────
// Componente principal exportado
// ─────────────────────────────────────────────────────

export const SimulationScene: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative border border-border-dim bg-surface-void/45">
      {/* Simulation HUD/Overlay */}
      <div className="absolute top-3 left-4 z-10 font-mono text-[10px] text-cyan-light select-none animate-pulse">
        <span>{t('hud_title')}</span>
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 3.2, 5.8], fov: 40 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Cosmic Dark background particles */}
        <color attach="background" args={['#05070F']} />
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0.5} fade speed={1} />
        
        <AnimatedSceneContent />
        
        <OrbitControls
          enableZoom={true}
          maxDistance={24}
          minDistance={1.5}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
    </div>
  );
};
