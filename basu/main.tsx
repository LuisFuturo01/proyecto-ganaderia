import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import type { AlimentoData } from './types';
import { crearMeshPapa } from './papa';
import { crearMeshManzana } from './manzana';

export const VisorAlimento3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup del Escenario
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 2. Setup de Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5e6, 3.5);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.bias = -0.001; 
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x90b0ff, 0.8);
    fillLight.position.set(-5, 2, -2);
    scene.add(fillLight);

    // 3. Orquestador de Datos y Mallas
    const contenedorAlimentos = new THREE.Group();
    scene.add(contenedorAlimentos);

    // --- PETICIÓN PARA LA PAPA ---
    fetch('/analyze/papa-level_1-00001/data.json')
      .then(res => {
        if (!res.ok) throw new Error("JSON de papa no encontrado");
        return res.json();
      })
      .then(async (dataPapa: AlimentoData) => {
        const papaMesh = await crearMeshPapa(dataPapa);
        papaMesh.position.x = -1.5; 
        contenedorAlimentos.add(papaMesh);
      })
      .catch(err => console.error("Error al cargar la papa:", err));

    // --- PETICIÓN PARA LA MANZANA ---
    // Verifica si tu carpeta aquí usa 4 ceros (00001) o 3 ceros (0001)
    fetch('/analyze/manzana-level_1-00001/data.json')
      .then(res => {
        if (!res.ok) throw new Error("JSON de manzana no encontrado");
        return res.json();
      })
      .then(async (dataManzana: AlimentoData) => {
        const manzanaMesh = await crearMeshManzana(dataManzana);
        manzanaMesh.position.x = 1.5; 
        contenedorAlimentos.add(manzanaMesh);
      })
      .catch(err => console.error("Error al cargar la manzana:", err));

    // 4. Bucle de Renderizado
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      contenedorAlimentos.rotation.y += 0.0015; 
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <VisorAlimento3D />
    </React.StrictMode>
  );
}