import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import type { DatosRenderizadoMallaGrafica } from '../../types/jsonData';

interface VegetableModelProps {
  meshData?: DatosRenderizadoMallaGrafica;
  phase: string;
  attenuationProfile: number[];
  tipoItem?: string;
  dimensiones?: { ancho: number; alto: number; espesor_profundidad_estimada: number };
  textureUrl?: string;
}

export const VegetableModel: React.FC<VegetableModelProps> = ({
  meshData,
  phase,
  attenuationProfile,
  tipoItem = 'papa',
  dimensiones,
  textureUrl,
}) => {
  const [customTexture, setCustomTexture] = useState<THREE.Texture | null>(null);

  // Dynamic texture loading from python backend
  useEffect(() => {
    if (!textureUrl || textureUrl === 'No disponible') {
      setCustomTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        setCustomTexture(tex);
        console.log('[RADIOGUARD 3D] Textura real mapeada con exito:', textureUrl);
      },
      undefined,
      (err) => {
        console.error('[RADIOGUARD 3D] Error cargando textura real, usando fallback procedimental:', err);
        setCustomTexture(null);
      }
    );
  }, [textureUrl]);

  // Check if real custom mesh data exists from the backend
  const hasRealMesh = meshData && meshData.arreglo_posicion_vertices && meshData.arreglo_posicion_vertices.length >= 30;

  // 1. Generate premium fallback procedural texture based on vegetable class
  const fallbackTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const isPotato = tipoItem.toLowerCase().includes('papa') || tipoItem.toLowerCase().includes('potato');
      const isOnion = tipoItem.toLowerCase().includes('cebolla') || tipoItem.toLowerCase().includes('onion');
      
      if (isPotato) {
        // Base color - potato brown
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#a67c52');
        gradient.addColorStop(0.5, '#8b6914');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Add organic skin spots
        for (let i = 0; i < 3000; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 512;
          const size = Math.random() * 2 + 1;
          const br = Math.random() * 0.3 + 0.7;
          ctx.fillStyle = `rgba(${Math.floor(101 * br)}, ${Math.floor(67 * br)}, ${Math.floor(33 * br)}, 0.45)`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (isOnion) {
        // Purplish or Golden onion skin stripes
        ctx.fillStyle = '#b05e3b';
        ctx.fillRect(0, 0, 512, 512);
        
        // Horizontal/vertical micro-veins
        for (let i = 0; i < 512; i += 6) {
          ctx.strokeStyle = Math.random() > 0.5 ? '#7b2c1d' : '#d28f6c';
          ctx.lineWidth = Math.random() * 1.5 + 0.5;
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + (Math.random() * 10 - 5), 512);
          ctx.stroke();
        }
      } else {
        // Apple - premium red/yellow gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#e11d48'); // bright red
        gradient.addColorStop(0.6, '#b91c1c');
        gradient.addColorStop(1, '#eab308'); // yellow bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Apple pores (specks)
        for (let i = 0; i < 2000; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 512;
          const size = Math.random() * 1.5 + 0.5;
          ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [tipoItem]);

  // 2. Dynamically build Geometry (Sphere deformed into Papa, Cebolla, or Apple)
  const geometry = useMemo(() => {
    if (hasRealMesh && meshData) {
      // Use custom geometry from python meshData
      const geo = new THREE.BufferGeometry();
      const vertices = new Float32Array(meshData.arreglo_posicion_vertices);
      const normals = new Float32Array(meshData.arreglo_direccion_normales_vertices);
      const uvs = new Float32Array(meshData.arreglo_coordenadas_uv_textura);
      const indices = new Uint16Array(meshData.arreglo_indices_caras_poligonos);

      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      return geo;
    }

    // Procedural organic geometries
    const isPotato = tipoItem.toLowerCase().includes('papa') || tipoItem.toLowerCase().includes('potato');
    const isOnion = tipoItem.toLowerCase().includes('cebolla') || tipoItem.toLowerCase().includes('onion');

    if (isPotato) {
      // Deformed Ellipsoid for potato
      const geo = new THREE.SphereGeometry(0.5, 32, 32);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        // Elongate along Y axis
        pos.setY(i, y * 1.35);
        // Add random natural bumps
        const factor = 1.0 + Math.sin(y * 3) * 0.05 + Math.cos(x * 4) * 0.03;
        pos.setX(i, x * factor);
        pos.setZ(i, z * factor);
      }
      geo.computeVertexNormals();
      return geo;
    } else if (isOnion) {
      // Tear-drop shape for onion (tapered top)
      const geo = new THREE.SphereGeometry(0.5, 32, 32);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        // Taper top (y > 0)
        const taper = y > 0 ? (1.0 - y * 0.5) : 1.0;
        pos.setX(i, x * taper);
        pos.setZ(i, z * taper);
        pos.setY(i, y * 1.1); // Slightly taller
      }
      geo.computeVertexNormals();
      return geo;
    } else {
      // Apple shape with top and bottom indentations
      const geo = new THREE.SphereGeometry(0.5, 32, 32);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        // Hendiduras en polos y abultamiento en hombros
        const distToCenter = Math.sqrt(x*x + z*z);
        const factor = 1.0 - 0.12 * Math.exp(-y * y * 5);
        pos.setX(i, x * factor);
        pos.setZ(i, z * factor);
      }
      geo.computeVertexNormals();
      return geo;
    }
  }, [hasRealMesh, meshData, tipoItem]);

  // 3. Dynamic scaling based on dimensions returned by python backend
  const meshScale = useMemo(() => {
    if (!dimensiones) {
      return [1.0, 1.0, 1.0] as [number, number, number];
    }
    
    // Normalize scales to keep model within reasonable screen sizes
    // Python returns real cm (e.g. 7.5cm x 6.2cm x 5.8cm)
    const { ancho, alto, espesor_profundidad_estimada } = dimensiones;
    const maxDim = Math.max(ancho, alto, espesor_profundidad_estimada, 1);
    
    // Target maximum scale multiplier
    const norm = 1.15 / maxDim;
    return [ancho * norm, alto * norm, espesor_profundidad_estimada * norm] as [number, number, number];
  }, [dimensiones]);

  // 4. Compute Monte Carlo dose absorption heatmap colors
  const colors = useMemo(() => {
    const positions = geometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;
    const colorArray = new Float32Array(vertexCount * 3);

    const interpolateColor = (val: number) => {
      // 0.0 (blue/low dose) -> Green -> Yellow -> Orange -> 1.0 (red/high dose)
      if (val >= 0.75) {
        const t = (val - 0.75) / 0.25;
        return [1.0, 0.25 * (1 - t), 0];
      } else if (val >= 0.5) {
        const t = (val - 0.5) / 0.25;
        return [1.0, 0.8 * (1 - t) + 0.25 * t, 0];
      } else if (val >= 0.25) {
        const t = (val - 0.25) / 0.25;
        return [0.8 * t, 0.8, 0];
      } else {
        const t = val / 0.25;
        return [0, 0.8 * t + 0.3 * (1 - t), 1.0 * (1 - t)];
      }
    };

    let maxRadius = 0.001;
    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r > maxRadius) maxRadius = r;
    }

    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const radius = Math.sqrt(x * x + y * y + z * z);
      const normalizedDist = radius / maxRadius;

      // Beer-Lambert decay layer mapping
      const profileIndex = Math.min(
        attenuationProfile.length - 1,
        Math.floor((1 - normalizedDist) * attenuationProfile.length)
      );
      const dose = attenuationProfile[profileIndex] || 0;
      const maxDose = Math.max(...attenuationProfile, 0.01);
      const normalizedDose = Math.min(1.0, dose / maxDose);

      const [r, g, b] = interpolateColor(normalizedDose);
      colorArray[i * 3] = r;
      colorArray[i * 3 + 1] = g;
      colorArray[i * 3 + 2] = b;
    }

    return colorArray;
  }, [geometry, attenuationProfile]);

  const showHeatmap = phase === 'irradiation' || phase === 'output' || phase === 'comparative';

  useMemo(() => {
    if (showHeatmap) {
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    } else if (geometry.hasAttribute('color')) {
      geometry.deleteAttribute('color');
    }
  }, [geometry, colors, showHeatmap]);

  const finalTexture = customTexture || fallbackTexture;

  return (
    <mesh geometry={geometry} castShadow receiveShadow scale={meshScale}>
      {showHeatmap ? (
        <meshStandardMaterial
          vertexColors
          roughness={0.25}
          metalness={0.2}
          transparent={phase === 'irradiation'}
          opacity={phase === 'irradiation' ? 0.8 : 1.0}
          emissive={phase === 'irradiation' ? '#ff3300' : '#000000'}
          emissiveIntensity={phase === 'irradiation' ? 0.35 : 0}
        />
      ) : (
        <meshStandardMaterial
          map={finalTexture}
          roughness={0.65}
          metalness={0.08}
          bumpScale={0.015}
        />
      )}
    </mesh>
  );
};
