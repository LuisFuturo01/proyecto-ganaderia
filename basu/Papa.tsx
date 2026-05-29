import * as THREE from 'three';
import type { AlimentoData } from './types';

export const crearMeshPapa = async (data: AlimentoData): Promise<THREE.Mesh> => {
  const geo3D = data.geometria_espacial_3d;

  return new Promise((resolve) => {
    const imageLoader = new THREE.ImageLoader();
    imageLoader.load(`/${geo3D.ruta_imagen_plana_textura}`, (image) => {
      
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(image, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;

      const rBase = 180, gBase = 142, bBase = 85;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 20 && pixels[i+1] < 20 && pixels[i+2] < 20) {
          const ruidoColor = (Math.random() - 0.5) * 30;
          pixels[i] = Math.min(255, Math.max(0, rBase + ruidoColor));
          pixels[i+1] = Math.min(255, Math.max(0, gBase + ruidoColor));
          pixels[i+2] = Math.min(255, Math.max(0, bBase + ruidoColor));
          pixels[i+3] = 255; 
        }
      }
      ctx.putImageData(imgData, 0, 0);

      const texturaProcesada = new THREE.CanvasTexture(canvas);
      texturaProcesada.colorSpace = THREE.SRGBColorSpace;

      const geometry = new THREE.SphereGeometry(1, 128, 128);
      const factorRuido = 1.0 - geo3D.indice_forma_esfericidad; 
      const pos = geometry.attributes.position;
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
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        map: texturaProcesada,
        bumpMap: texturaProcesada, 
        bumpScale: 0.08,           
        roughness: 0.95,           
        metalness: 0.0,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const { ancho, alto, espesor_profundidad_estimada } = geo3D.dimensiones_caja_borde_cm;
      const escalaFactor = 0.1; 
      mesh.scale.set(
        ancho * escalaFactor,
        alto * escalaFactor,
        espesor_profundidad_estimada * escalaFactor
      );

      resolve(mesh);
    });
  });
};