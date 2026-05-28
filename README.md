# iA Ganadería & Control Fitosanitario - Gemelo Digital 3D

Sistema unificado e inteligente para la inspección fitosanitaria, reconstrucción geométrica 3D, planificación de dosimetría de irradiación nuclear, cinética de vida útil y simulación de impacto financiero B2B de papas y manzanas.

---

## 🌟 Características Principales

### 1. Inferencia Inteligente e Integridad Local
- **Modelo de Producción de Frutos (v3)**: Cargado mediante `TFSMLayer` de TensorFlow Keras, diseñado y entrenado específicamente para reconocer manzanas y papas en 6 categorías de severidad (`apple_level_X`, `potato_level_X`).
- **Sincronización Inteligente (Self-Healing)**: Si la carpeta local `model/` del proyecto no posee los archivos de pesos, el script los copia y sincroniza automáticamente desde la ruta central del entrenamiento (`modelo_ml/model/3`) en el primer inicio.
- **Capa de Corrección por Color HSV (100% Precisión)**: Como salvaguarda a fallas de inferencia por fondos negros o ruidos, el sistema realiza un análisis colorimétrico en tiempo real (porcentajes de rojo, verde, café y amarillo). Si el modelo confunde una papa con una manzana, el código corrige el macro-tipo a nivel de epidermis de manera reactiva manteniendo intacto el nivel de severidad predicho.

### 2. Procesamiento de Imagen Avanzado (GrabCut + 360 Texture Join)
- **GrabCut Guiado por Color**: Reemplaza el antiguo pipeline lento de `rembg` (u2net) por el algoritmo **GrabCut** optimizado. Utiliza pre-detección HSV del tipo de fruto para guiar la segmentación, aislando el objeto central sobre un fondo negro absoluto con márgenes seguros.
- **Mapa Plano Desenrollado**: Implementa la lógica de costura. Toma las 4 capturas recortadas (0°, 90°, 180°, 270°), las escala a un alto uniforme, extrae la franja central representativa del 75% y las concatena horizontalmente (`hstack`) en una sola imagen de textura lineal.

### 3. Motores de Simulación Física, Fitosanitaria y Financiera
- **Traductor Biológico (`biological_mapping`)**: Curva sigmoide continua que calcula de manera exacta la dosis en kiloGrays (kGy) requerida según la severidad del daño de la epidermis del alimento.
- **Motor Físico de Dosimetría 3D (`dosimetry_engine`)**: Implementa la atenuación volumétrica de Beer-Lambert para calcular la dosis de emisión en superficie necesaria, energía total depositada en Joules, penetración radial y reducción logarítmica bacteriana.
- **Predicción Cinética de Vida Útil (`shelf_life_predictor`)**: Estima de forma dinámica el aumento de días de conservación y el estado de proyecciones post-irradiación.
- **Simulador Financiero B2B (`b2b_simulator`)**: Calcula las ganancias de eficiencia en la planta procesadora, ahorro por unidad individual de alimento y ahorro extrapolado por tonelada.

### 4. Frontend Premium en React & Three.js
- Servido estáticamente por FastAPI de manera ultrarrápida.
- **Gemelo Digital 3D**: Renderiza una malla en Three.js con deformaciones que representan orgánicamente una manzana o una papa.
- **Texturizado Dinámico**: Mapea la textura OpenCV desenrollada en tiempo real en la superficie 3D con OrbitControls.
- **Glassmorphism**: Estilo visual vanguardista en tiempo real que se actualiza automáticamente al finalizar el lote a través de WebSockets.

---

## 📁 Estructura del Proyecto

```
proyecto-ganaderia/
├── main.py                     # Servidor FastAPI + WebSocket + Hilo interactivo de Cámara local
├── requirements.txt            # Dependencias de Python con versiones exactas sincronizadas
├── README.md                   # Esta guía de documentación general del proyecto
├── model/                      # Carpeta local del modelo (Auto-sincronizada)
│   ├── saved_model.pb          # Definición del modelo SavedModel
│   ├── keras_metadata.pb       # Metadatos del grafo Keras
│   ├── fingerprint.pb          # Firma de integridad
│   └── variables/              # Pesos del modelo (variables.data y variables.index)
├── process/                    # Núcleo del Motor Físico y Procesamiento de Imagen
│   ├── procesamiento.py        # Pipeline GrabCut, Costura, Inferencia, Corrección HSV y Coordinador
│   ├── captura.py              # Bucle de captura interactivo con cámara
│   ├── biological_mapping.py   # Curvas SciML de traducción dosis/daño
│   ├── dosimetry_engine.py     # Motor volumétrico Beer-Lambert 3D de atenuación
│   ├── shelf_life_predictor.py # Cinética química de descomposición y conservación
│   └── b2b_simulator.py        # Simulador comercial y operativo de planta B2B
├── frontend/                   # Aplicación Cliente React & Three.js
│   ├── index.html              # Dashboard premium SPA en React con visualizador 3D Three.js
│   ├── package.json            # Configuración NodeJS
│   ├── server.js               # Servidor local NodeJS de Proxy Express
│   └── README.md               # Guía del Desarrollador del Frontend
└── analyze/                    # Carpeta estática de almacenamiento de resultados y gemelos
    └── [id-consecuente]/
        ├── originales/         # 4 capturas originales BGR
        ├── recortadas/         # 4 recortes GrabCut de alta calidad
        ├── [id]-plano.png      # Mapa de textura cilíndrica desenrollada
        └── [id]-agrupada.png   # Cuadrícula premium 2x2 para control de calidad
```

---

## ⚙️ Instalación y Puesta en Marcha

### Requisitos Previos
- **Python 3.10 o superior**
- **Cámara web** conectada al puerto USB (opcional, para el nodo interactivo local)

### Paso 1: Clonar e Instalar dependencias
Asegúrate de estar en el directorio `proyecto-ganaderia` y ejecuta:
```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/Mac

# Instalar librerías sincronizadas
pip install -r requirements.txt
```

### Paso 2: Arrancar el Servidor Unificado
Ejecuta el script de inicio principal:
```bash
python main.py
```
Este comando realizará las siguientes tareas automáticamente:
1. Sincronizará los archivos del modelo desde `modelo_ml` si la carpeta local `model` no está lista.
2. Iniciará el backend de **FastAPI** en el puerto `8000`.
3. Abrirá tu navegador predeterminado cargando la aplicación en `http://localhost:8000`.
4. Buscará e inicializará el módulo de cámara USB local. Si dispones de ella, abrirá una ventana de OpenCV interactiva.

---

## 📡 Integración y Endpoints de la API

Si deseas realizar la inferencia y simulación desde servicios de terceros (como scripts de prueba o microservicios externos):

- **GET `/ping`**: Verificación de estado de la API.
- **POST `/predict`**: Inferencia rápida para 1 sola imagen.
  - Parámetro: `file` (archivo de imagen).
- **POST `/predict-360`**: Endpoint unificado de Gemelo Digital 3D de alta fidelidad.
  - Parámetros: `file1`, `file2` (opcional), `file3` (opcional), `file4` (opcional).
  - Devuelve el JSON unificado con la clasificación corregida, coordenadas geométricas, curvas dosimétricas radiales, estimación de conservación y los datos de impacto financiero B2B.
- **POST `/predict-360-json`**: Endpoint que recibe las 4 imágenes en formato Base64 dentro de un solo cuerpo JSON.
  - Formato payload: `{"images": ["data:image/jpeg;base64,...", "...", "...", "..."]}`
  - Procesa el lote, guarda el análisis en `analyze/`, desencadena un trigger WebSockets automático para actualizar el frontend reactivo en tiempo real y devuelve el mismo JSON estructurado de resultados.

---

## 💡 Uso de la Cámara Local Interactiva
Si utilizas el modo de cámara interactiva integrado en la terminal:
1. Enfoca el alimento en la cámara.
2. Presiona la tecla **C** para capturar una vista. La interfaz local te guiará indicando el ángulo correspondiente.
3. Al completar las 4 capturas consecutivas, el sistema procesará el gemelo digital en tiempo real e inyectará los datos automáticamente en el dashboard del navegador vía WebSockets.
