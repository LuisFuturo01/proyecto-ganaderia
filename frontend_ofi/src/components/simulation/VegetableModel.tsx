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
  esfericidad?: number;
}

/**
 * Procesa una imagen de textura: detecta píxeles de fondo negro y los rellena
 * con un color coherente (promedio o base) para eliminar artefactos visuales.
 */
const processTextureImage = (
  image: HTMLImageElement,
  tipoItem: string
): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imgData.data;

  const isPotato = tipoItem.toLowerCase().includes('papa') || tipoItem.toLowerCase().includes('potato');

  // Calcular color promedio de los píxeles NO-fondo
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] > 25 || pixels[i + 1] > 25 || pixels[i + 2] > 25) {
      rSum += pixels[i];
      gSum += pixels[i + 1];
      bSum += pixels[i + 2];
      count++;
    }
  }

  const rAvg = count > 0 ? rSum / count : (isPotato ? 180 : 150);
  const gAvg = count > 0 ? gSum / count : (isPotato ? 142 : 180);
  const bAvg = count > 0 ? bSum / count : (isPotato ? 85 : 50);

  // Rellenar fondo negro con color coherente + ruido sutil
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] < 25 && pixels[i + 1] < 25 && pixels[i + 2] < 25) {
      const noise = (Math.random() - 0.5) * (isPotato ? 30 : 10);
      pixels[i] = Math.min(255, Math.max(0, rAvg + noise));
      pixels[i + 1] = Math.min(255, Math.max(0, gAvg + noise));
      pixels[i + 2] = Math.min(255, Math.max(0, bAvg + noise));
      pixels[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  if (isPotato) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  } else {
    tex.wrapS = THREE.MirroredRepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }

  return tex;
};

export const VegetableModel: React.FC<VegetableModelProps> = ({
  meshData,
  phase,
  attenuationProfile,
  tipoItem = 'papa',
  dimensiones,
  textureUrl,
  esfericidad = 0.75,
}) => {
  const [processedTexture, setProcessedTexture] = useState<THREE.CanvasTexture | null>(null);

  // Load and process real texture from backend
  useEffect(() => {
    if (!textureUrl || textureUrl === 'No disponible' || textureUrl === '') {
      setProcessedTexture(null);
      return;
    }

    const imageLoader = new THREE.ImageLoader();
    imageLoader.load(
      textureUrl,
      (image) => {
        const tex = processTextureImage(image, tipoItem);
        setProcessedTexture(tex);
        console.log('[RADIOGUARD 3D] Textura real procesada con éxito:', textureUrl);
      },
      undefined,
      (err) => {
        console.error('[RADIOGUARD 3D] Error cargando textura, usando fallback:', err);
        setProcessedTexture(null);
      }
    );
  }, [textureUrl, tipoItem]);

  // Detect vegetable type
  const isPotato = tipoItem.toLowerCase().includes('papa') || tipoItem.toLowerCase().includes('potato');
  const isOnion = tipoItem.toLowerCase().includes('cebolla') || tipoItem.toLowerCase().includes('onion');
  const isApple = !isPotato && !isOnion;

  // Fallback procedural texture (only used when no real texture)
  const fallbackTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (isPotato) {
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#a67c52');
        gradient.addColorStop(0.5, '#8b6914');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
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
        ctx.fillStyle = '#b05e3b';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 512; i += 6) {
          ctx.strokeStyle = Math.random() > 0.5 ? '#7b2c1d' : '#d28f6c';
          ctx.lineWidth = Math.random() * 1.5 + 0.5;
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + (Math.random() * 10 - 5), 512);
          ctx.stroke();
        }
      } else {
        // Apple
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#e11d48');
        gradient.addColorStop(0.6, '#b91c1c');
        gradient.addColorStop(1, '#eab308');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
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
  }, [isPotato, isOnion]);

  // Build geometry using basu/ pattern — optimized with 64 segments for belt view
  const geometry = useMemo(() => {
    const SEG = 64; // Optimized: 64 instead of 128 for performance in belt scene

    if (isPotato) {
      // === PAPA: Deformación orgánica basada en esfericidad (basu/Papa.tsx) ===
      const geo = new THREE.SphereGeometry(1, SEG, SEG);
      const factorRuido = 1.0 - esfericidad;
      const pos = geo.attributes.position;
      const vec = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        vec.fromBufferAttribute(pos, i);

        const montañas = Math.sin(vec.y * 3.5) * Math.cos(vec.z * 3.5) * factorRuido * 0.7;
        const ondulaciones = Math.sin(vec.x * 6.0 + vec.y * 5.0) * factorRuido * 0.3;
        const aspereza = Math.cos(vec.x * 30.0) * Math.sin(vec.z * 30.0) * 0.015;

        const desplazamiento = 1.0 + montañas + ondulaciones + aspereza;
        vec.normalize().multiplyScalar(desplazamiento);
        pos.setXYZ(i, vec.x, vec.y, vec.z);
      }
      geo.computeVertexNormals();
      return geo;

    } else if (isApple) {
      // === MANZANA: Perfil acorazonado con hundimiento de polos (basu/Manzana.tsx) ===
      const geo = new THREE.SphereGeometry(1, SEG, SEG);
      const pos = geo.attributes.position;
      const vec = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        vec.fromBufferAttribute(pos, i);

        // Perfil acorazonado suave
        const anchoPerfil = 1.0 + 0.15 * vec.y - 0.1 * (vec.y * vec.y);

        // Hundimiento de polos
        const radioPlanoXZ = Math.sqrt(vec.x * vec.x + vec.z * vec.z);
        if (radioPlanoXZ < 0.45) {
          const factorDepresion = (Math.cos((radioPlanoXZ / 0.45) * Math.PI) + 1.0) * 0.5;
          if (vec.y > 0.5) {
            vec.y -= factorDepresion * 0.18;
          } else if (vec.y < -0.5) {
            vec.y += factorDepresion * 0.10;
          }
        }

        vec.x *= anchoPerfil;
        vec.z *= anchoPerfil;

        // Micro-ondulaciones orgánicas
        vec.x += Math.sin(vec.y * 5.0) * 0.03 + Math.cos(vec.x * 50.0) * 0.003;
        vec.z += Math.cos(vec.y * 4.0) * 0.03 + Math.sin(vec.z * 50.0) * 0.003;

        pos.setXYZ(i, vec.x, vec.y, vec.z);
      }
      geo.computeVertexNormals();
      return geo;

    } else {
      // === CEBOLLA: Forma de gota ===
      const geo = new THREE.SphereGeometry(1, SEG, SEG);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const taper = y > 0 ? (1.0 - y * 0.5) : 1.0;
        pos.setX(i, x * taper);
        pos.setZ(i, z * taper);
        pos.setY(i, y * 1.1);
      }
      geo.computeVertexNormals();
      return geo;
    }
  }, [isPotato, isApple, isOnion, esfericidad]);

  // Dynamic scaling based on backend dimensions (reduced further to fit perfectly within the radial arch)
  const meshScale = useMemo(() => {
    if (!dimensiones) {
      return [0.5, 0.5, 0.5] as [number, number, number];
    }
    const { ancho, alto, espesor_profundidad_estimada } = dimensiones;
    const maxDim = Math.max(ancho, alto, espesor_profundidad_estimada, 1);
    const norm = 0.55 / maxDim; // Reduced by approx 50% from original to fit perfectly
    return [ancho * norm, alto * norm, espesor_profundidad_estimada * norm] as [number, number, number];
  }, [dimensiones]);

  if (!tipoItem || tipoItem === '') {
    return null;
  }

  const finalTexture = processedTexture || fallbackTexture;

  // Apple uses MeshPhysicalMaterial for clearcoat shine (basu pattern)
  // All other items use MeshStandardMaterial
  // NO heatmap during irradiation — the radiation machine emits light instead
  return (
    <mesh geometry={geometry} castShadow receiveShadow scale={meshScale}>
      {isApple ? (
        <meshPhysicalMaterial
          map={finalTexture}
          bumpMap={finalTexture}
          bumpScale={0.02}
          roughness={0.4}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
        />
      ) : (
        <meshStandardMaterial
          map={finalTexture}
          bumpMap={finalTexture}
          bumpScale={isPotato ? 0.08 : 0.04}
          roughness={isPotato ? 0.95 : 0.65}
          metalness={isPotato ? 0.0 : 0.08}
        />
      )}
    </mesh>
  );
};
