import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';
import { ConveyorBelt } from './ConveyorBelt';
import { ScannerLaser } from './ScannerLaser';
import { RadiationBeam } from './RadiationBeam';
import { VegetableModel } from './VegetableModel';

// Inner component to animate the vegetable model position and rotation
const AnimatedSceneContent: React.FC = () => {
  const { phase, simulationData } = useSimulationStore();
  const vegetableRef = useRef<THREE.Group>(null);

  // Map phase to X coordinate position
  const targetX = useMemo(() => {
    switch (phase) {
      case 'reception':
        return -3.5;
      case 'scanning':
        return -1.2;
      case 'irradiation':
        return 1.2;
      case 'output':
      case 'comparative':
        return 3.5;
      case 'idle':
      default:
        return -3.5;
    }
  }, [phase]);

  // Smooth translation of position and subtle rotation for natural feel
  useFrame((_, delta) => {
    if (vegetableRef.current) {
      // Lerp position
      vegetableRef.current.position.x = THREE.MathUtils.lerp(
        vegetableRef.current.position.x,
        targetX,
        delta * 4.5
      );

      // Rotate slowly for visual interest
      vegetableRef.current.rotation.y += delta * 0.4;
    }
  });

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

      {/* Laser Scanner Station */}
      <ScannerLaser active={phase === 'scanning'} />

      {/* Radiation Tunnel Station */}
      <RadiationBeam active={phase === 'irradiation'} />

      {/* Dynamic Vegetable Mesh */}
      {simulationData && (
        <group ref={vegetableRef} position={[targetX, 0.05, 0]}>
          <VegetableModel
            meshData={simulationData.datos_renderizado_malla_grafica}
            phase={phase}
            attenuationProfile={simulationData.simulacion_dosimetria_radiacion.perfil_atenuacion_profundidad_lineal_kGy}
            tipoItem={simulationData.clasificacion_alimento.tipo_item_detectado}
            dimensiones={simulationData.geometria_espacial_3d.dimensiones_caja_borde_cm}
            textureUrl={simulationData.geometria_espacial_3d.ruta_imagen_plana_textura}
          />
        </group>
      )}
    </group>
  );
};

export const SimulationScene: React.FC = () => {
  return (
    <div className="h-72 w-full rounded-lg overflow-hidden relative border border-border-dim bg-surface-void/45">
      {/* Simulation HUD/Overlay */}
      <div className="absolute top-3 left-4 z-10 font-mono text-[10px] text-cyan-light select-none animate-pulse">
        <span>SISTEMA DE ESCANEO 3D & DOSIMETRÍA EN TIEMPO REAL</span>
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 2.5, 4.5], fov: 40 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Cosmic Dark background particles */}
        <color attach="background" args={['#05070F']} />
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0.5} fade speed={1} />
        
        <AnimatedSceneContent />
        
        <OrbitControls
          enableZoom={true}
          maxDistance={12}
          minDistance={3}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
    </div>
  );
};
