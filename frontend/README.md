# Dashboard Fitosanitario 3D (React & Three.js)

Este es el panel interactivo de gemelo digital, dosimetría nuclear, vida útil y simulación B2B para la inspección fitosanitaria de papas y manzanas.

## 🚀 Tecnologías Core
1. **React 18**: Gestiona el estado reactivo del dashboard (conexión WebSocket, estados de espera, e inyección de datos dinámicos).
2. **Three.js (r128)**: Renderiza el **Gemelo Digital 3D** en tiempo real.
3. **OrbitControls**: Permite al usuario interactuar libremente con el modelo 3D (arrastrar para rotar, rueda para hacer zoom, click derecho para desplazar).
4. **Vanilla CSS (Glassmorphism)**: Interfaz de diseño premium con fondos traslúcidos, efectos de desenfoque (`backdrop-filter`) y gradientes de color de alta calidad.

---

## 🛠️ Características del Frontend

### 1. Gemelo Digital 3D Dinámico (`GemeloDigital3D`)
El componente principal de Three.js renderiza una geometría que se deforma orgánicamente según el tipo de alimento detectado por la IA:
- **Papa**: Modifica una esfera original para elongarla en el eje Y y añadir distorsiones sinusoidales e irregularidades que simulan un tubérculo real.
- **Manzana**: Modifica una esfera para generar la hendidura característica en la base y el tope superior del fruto.
- **Mapeo de Textura 360°**: Carga de forma dinámica la textura cilíndrica desenrollada generada por OpenCV (`ruta_imagen_plana_textura`) y la aplica como un mapa de textura (`MeshStandardMaterial.map`), envolviendo el modelo en 3D para reflejar su aspecto real.

### 2. Conexión WebSocket Real-Time
Se conecta al canal `/ws` de FastAPI. Al recibir el contrato JSON, pasa el estado de espera (Trigger) al Dashboard en milisegundos de forma transparente y reactiva.

### 3. Visualizaciones Avanzadas
- **Capa de Atenuación Radial**: Renderizado dinámico de 8 bloques de color que reflejan la atenuación de la radiación ionizante según la penetración lineal (kGy).
- **Control de Piel Dañada**: Barra de progreso premium con degradados de color en función del nivel de daño (Verde/Éxito, Amarillo/Advertencia, Rojo/Peligro).
- **Simulador Comercial B2B**: Tarjetas que destacan el ahorro por unidad y el ahorro escalado a nivel de planta por tonelada de producto procesado.

---

## 💻 Desarrollo y Despliegue
Para mantener el proyecto extremadamente ágil, portable y fácil de compartir sin lidiar con pesadas carpetas `node_modules` ni complejos scripts de compilación, el frontend se ejecuta en **modo in-browser de alta velocidad**:
- Utiliza CDNs estables de confianza para React, Babel y Three.js.
- Es servido directamente por el backend de Python en el puerto `8000` (`http://localhost:8000`).
- Si deseas ejecutarlo de forma aislada en NodeJS, puedes hacerlo mediante:
  ```bash
  npm install
  npm start
  ```
  Esto levantará un servidor Express en el puerto `3000` que actúa como un proxy del backend.
