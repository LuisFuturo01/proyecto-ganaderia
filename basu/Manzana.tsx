import * as THREE from 'three';
import type { AlimentoData } from './types';

export const crearMeshManzana = async (data: AlimentoData): Promise<THREE.Mesh | null> => {
  const geo3D = data.geometria_espacial_3d;

  return new Promise((resolve) => {
    const imageLoader = new THREE.ImageLoader();
    imageLoader.load(`/${geo3D.ruta_imagen_plana_textura}`, (image) => {
      
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(image, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;

      // =========================================================
      // 1. CALCULAR EL COLOR PROMEDIO REAL DE LA MANZANA
      // =========================================================
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      
      for (let i = 0; i < pixels.length; i += 4) {
        // Ignorar el fondo negro para el cálculo
        if (pixels[i] > 25 || pixels[i+1] > 25 || pixels[i+2] > 25) {
          rSum += pixels[i];
          gSum += pixels[i+1];
          bSum += pixels[i+2];
          count++;
        }
      }
      
      // Obtenemos el tono general (En tu caso, detectará el verde/amarillo)
      const rAvg = count > 0 ? rSum / count : 150;
      const gAvg = count > 0 ? gSum / count : 180;
      const bAvg = count > 0 ? bSum / count : 50;

      // =========================================================
      // 2. RELLENAR EL FONDO UNIFORMEMENTE
      // =========================================================
      for (let i = 0; i < pixels.length; i += 4) {
        // Si el píxel es negro (fondo vacío)
        if (pixels[i] < 25 && pixels[i+1] < 25 && pixels[i+2] < 25) {
          // Rellenamos con el promedio dinámico + ruido mínimo para textura
          const noise = (Math.random() - 0.5) * 10;
          pixels[i] = Math.min(255, Math.max(0, rAvg + noise));
          pixels[i+1] = Math.min(255, Math.max(0, gAvg + noise));
          pixels[i+2] = Math.min(255, Math.max(0, bAvg + noise));
          pixels[i+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      const texturaProcesada = new THREE.CanvasTexture(canvas);
      texturaProcesada.colorSpace = THREE.SRGBColorSpace;

      // =========================================================
      // 3. ENVOLTURA SIN DISTORSIÓN
      // =========================================================
      texturaProcesada.wrapS = THREE.MirroredRepeatWrapping; 
      texturaProcesada.wrapT = THREE.ClampToEdgeWrapping;
      // Quitamos los zooms y offsets anteriores que estaban revelando la base
      
      const geometry = new THREE.SphereGeometry(1, 128, 128);
      const pos = geometry.attributes.position;
      const vec = new THREE.Vector3();
      
      for (let i = 0; i < pos.count; i++) {
        vec.fromBufferAttribute(pos, i);
        
        // Perfil acorazonado suave
        const anchoPerfil = 1.0 + 0.15 * vec.y - 0.1 * (vec.y * vec.y);
        
        // Hundimiento de Polos (Suavizado para evitar estiramientos de textura)
        const radioPlanoXZ = Math.sqrt(vec.x * vec.x + vec.z * vec.z);
        if (radioPlanoXZ < 0.45) {
          const factorDepresion = (Math.cos((radioPlanoXZ / 0.45) * Math.PI) + 1.0) * 0.5;
          if (vec.y > 0.5) {
            vec.y -= factorDepresion * 0.18; // Depresión del tallo ajustada
          } else if (vec.y < -0.5) {
            vec.y += factorDepresion * 0.10; // Depresión de la base ajustada
          }
        }
        
        vec.x *= anchoPerfil;
        vec.z *= anchoPerfil;
        
        vec.x += Math.sin(vec.y * 5.0) * 0.03 + Math.cos(vec.x * 50.0) * 0.003;
        vec.z += Math.cos(vec.y * 4.0) * 0.03 + Math.sin(vec.z * 50.0) * 0.003;

        pos.setXYZ(i, vec.x, vec.y, vec.z);
      }
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhysicalMaterial({
        map: texturaProcesada,
        bumpMap: texturaProcesada,
        bumpScale: 0.02,         
        roughness: 0.4,          
        clearcoat: 0.6,          
        clearcoatRoughness: 0.2,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const { ancho, alto, espesor_profundidad_estimada } = geo3D.dimensiones_caja_borde_cm;
      const escalaFactor = 0.1;
      mesh.scale.set(ancho * escalaFactor, alto * escalaFactor, espesor_profundidad_estimada * escalaFactor);

      resolve(mesh);
    }, 
    undefined, 
    () => {
      console.error("❌ Error cargando la imagen de la MANZANA:", `/${geo3D.ruta_imagen_plana_textura}`);
      resolve(null);
    });
  });
};