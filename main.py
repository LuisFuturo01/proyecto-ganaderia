import os
import sys
import cv2
import json
import numpy as np
import tensorflow as tf
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List

# Importaciones locales del motor de procesamiento
from process.captura import esperar_y_capturar_objeto
from process.procesamiento import consolidar_analisis_360, CLASES_MODELO, TAMANO_ENTRADA

# Inicialización de la aplicación FastAPI
app = FastAPI(
    title="iA Ganadería & Control Fitosanitario API",
    description="Servicio unificado de gemelo digital, dosimetría nuclear, estimación de vida útil y simulación financiera B2B.",
    version="1.0.0"
)

# Gestor de conexiones WebSocket en tiempo real para el trigger del Frontend
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# Configuración de CORS para integraciones frontend (como React o Three.js)
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reutilizar el modelo v3 de producción ya cargado por el módulo de procesamiento
from process.procesamiento import MODELO_GLOBAL

# Servir archivos estáticos del frontend en la raíz del servidor
if os.path.exists("frontend"):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    
    app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")
    
    @app.get("/")
    async def get_index():
        return FileResponse("frontend/index.html")

# Servir la carpeta de análisis (analyze) de forma estática para cargar imágenes en el frontend
if os.path.exists("analyze") or not os.path.exists("analyze"):
    # Crear carpeta analyze si no existiera por seguridad
    os.makedirs("analyze", exist_ok=True)
    from fastapi.staticfiles import StaticFiles
    app.mount("/analyze", StaticFiles(directory="analyze"), name="analyze")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Endpoint WebSocket para empujar en tiempo real los resultados de inferencia al Frontend.
    """
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/update")
async def post_update(data: dict):
    """
    Recibe el JSON de inferencia y lo transmite a todos los clientes frontend conectados.
    """
    await manager.broadcast(json.dumps(data))
    return {"status": "broadcasted"}

@app.get("/ping")
async def ping():
    """
    Endpoint de comprobación de estado para verificar que la API está en vivo.
    """
    return "Holaa, Estoy en vivo"

def read_file_as_image(data) -> np.ndarray:
    """
    Lee los bytes de un archivo subido, los decodifica como imagen,
    los convierte a RGB y los redimensiona al tamaño de entrada del modelo.
    """
    image = Image.open(BytesIO(data))
    image = image.convert("RGB")
    image = image.resize((TAMANO_ENTRADA, TAMANO_ENTRADA))
    return np.array(image)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Inferencia básica para una sola imagen subida.
    Retorna la clase predicha y el nivel de confianza de la clasificación.
    """
    try:
        image = read_file_as_image(await file.read())
        
        # Agregar la dimensión de batch (de 256x256x3 a 1x256x256x3)
        img_batch = np.expand_dims(image.astype(np.float32), 0)
        
        # Realizar la predicción
        predictions = MODELO_GLOBAL.predict(img_batch, verbose=0)
        
        # En Keras 3 con TFSMLayer, la predicción retorna un diccionario de tensores.
        # Extraemos los logits del tensor correspondiente (ej. la primera clave)
        if isinstance(predictions, dict):
            first_key = list(predictions.keys())[0]
            pred_logits = predictions[first_key][0]
        else:
            pred_logits = predictions[0]

        class_id = int(np.argmax(pred_logits))
        predicted_class = CLASES_MODELO[class_id]
        confidence = float(pred_logits[class_id])
        
        return {
            'class': predicted_class,
            'confidence': confidence
        }
    except Exception as e:
        return {"error": f"Error en inferencia rápida: {str(e)}"}

@app.post("/predict-360")
async def predict_360(
    file1: UploadFile = File(...),
    file2: UploadFile = File(None),
    file3: UploadFile = File(None),
    file4: UploadFile = File(None)
):
    """
    Endpoint unificado de alta fidelidad.
    Recibe hasta 4 imágenes de vistas diferentes, realiza el aislamiento por rembg,
    la costura de textura plana para Three.js, y calcula las simulaciones físicas,
    biológicas, dosimétricas, de vida útil y financieras.
    """
    uploaded_files = [file1, file2, file3, file4]
    cv2_images = []
    
    try:
        for idx, f in enumerate(uploaded_files):
            if f is not None:
                content = await f.read()
                # Decodificar bytes usando OpenCV en formato BGR de alta calidad
                nparr = np.frombuffer(content, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is not None:
                    cv2_images.append(img)
        
        if not cv2_images:
            return {"error": "No se proporcionó ninguna imagen válida para el análisis."}
        
        # Ejecutar consolidación física y matemática del gemelo digital
        print(f"[INFO] Procesando lote 360 con {len(cv2_images)} vistas de entrada...")
        resultado_json_str = consolidar_analisis_360(cv2_images, model=MODELO_GLOBAL)
        
        # Parsear a JSON real para enviarlo estructurado de vuelta
        return json.loads(resultado_json_str)
        
    except Exception as e:
        return {"error": f"Error procesando el lote 360: {str(e)}"}

def iniciar_sistema_continuo():
    """
    Flujo tradicional: Abre ventana OpenCV interactiva para capturar imágenes guiadas
    por teclado local y procesar el gemelo digital en tiempo real local.
    """
    print("="*50)
    print("INICIANDO NODO DE ESCANEO CONTINUO 360 (CAMARA LOCAL)")
    print("="*50)

    # Configuración de cámara local con fallback inteligente a índice 0
    indice_camara_local = 1
    print(f"[INFO] Intentando abrir cámara local en índice: {indice_camara_local}...")
    cap = cv2.VideoCapture(indice_camara_local)
    
    if not cap.isOpened():
        print(f"[WARNING] No se pudo abrir la cámara en el índice {indice_camara_local}. Probando fallback en índice 0...")
        indice_camara_local = 0
        cap = cv2.VideoCapture(indice_camara_local)
        
    if not cap.isOpened():
        print("[ERROR] No se pudo acceder a ninguna cámara local (índices 1 y 0).")
        print("Verifica la conexión física del dispositivo o permisos de la webcam.")
        return
    
    # Optimización de resolución nativa para hardware local
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    try:
        while True:
            # 1. Ejecutar captura manual secuencial por pfulsación de 'C' (Rojo -> Amarillo -> Verde)
            imagenes = esperar_y_capturar_objeto(cap, intervalo_segundos=1.0, num_fotos=4)

            if not imagenes:
                print("\n[INFO] Apagando sistema o pérdida de acceso a la cámara...")
                break
                
            print("\n[INFO] Flujo manual completado. Procesando y guardando gemelo digital...")
            import time
            start_time = time.time()
            
            # 2. Inferencia TensorFlow v3 + Procesamiento CV en /analyze
            resultado_json = consolidar_analisis_360(imagenes, model=MODELO_GLOBAL)
            
            tiempo_total = round(time.time() - start_time, 2)

            print(f"[INFO] Análisis finalizado en {tiempo_total} segundos.")
            print("[INFO] JSON RESULTANTE:")
            print(resultado_json)
            
            # Enviar trigger al frontend a través de la API local
            try:
                import requests
                requests.post("http://localhost:8000/api/update", json=json.loads(resultado_json))
                print("[INFO] Evento de trigger transmitido al frontend por WebSockets con exito!")
            except Exception as e:
                print(f"[WARNING] No se pudo notificar al frontend: {e} (Asegurate de que 'python main.py' este corriendo como servidor en otra ventana)")

            print("\n" + "-"*50)
            print("Reiniciando escaner para el siguiente objeto...")
            print("-" * 50 + "\n")
            
            time.sleep(1) 

    finally:
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    import threading
    import time
    import webbrowser

    HOST = "0.0.0.0"
    PORT = 8000

    print("")
    print("=" * 64)
    print("  iA GANADERÍA & CONTROL FITOSANITARIO — SISTEMA UNIFICADO")
    print("=" * 64)
    print("")
    print("  Iniciando todos los servicios con un solo comando...")
    print("")

    # 1. Iniciar el servidor FastAPI en un hilo secundario (para que reciba/empuje WebSockets)
    def run_api_server():
        uvicorn.run(app, host=HOST, port=PORT, log_level="info")

    server_thread = threading.Thread(target=run_api_server, daemon=True)
    server_thread.start()

    # Pequeña espera para que el puerto se inicialice
    time.sleep(2.0)

    print("")
    print("=" * 64)
    print(f"  ✅ SERVIDOR BACKEND (FastAPI + WebSockets) → ACTIVO")
    print(f"     API:       http://localhost:{PORT}")
    print(f"     Ping:      http://localhost:{PORT}/ping")
    print(f"     WebSocket: ws://localhost:{PORT}/ws")
    print("")
    print(f"  🌐 FRONTEND DASHBOARD (Servido desde FastAPI)")
    print(f"     ➜  http://localhost:{PORT}")
    print("")
    print(f"  📡 ENDPOINTS DE LA API:")
    print(f"     POST /predict      → Inferencia rápida (1 imagen)")
    print(f"     POST /predict-360  → Análisis completo 360° (4 imágenes)")
    print(f"     POST /api/update   → Trigger manual de datos al frontend")
    print("=" * 64)
    print("")

    # 2. Abrir el navegador automáticamente apuntando al frontend
    try:
        webbrowser.open(f"http://localhost:{PORT}")
        print("  🚀 Navegador abierto automáticamente en el frontend.")
    except Exception:
        print(f"  ℹ️  Abre manualmente: http://localhost:{PORT}")

    print("")

    # 3. Intentar iniciar el escaneo por cámara local (si hay cámara disponible)
    print("-" * 64)
    print("  📷 MÓDULO DE CÁMARA LOCAL")
    print("-" * 64)

    try:
        iniciar_sistema_continuo()
    except Exception as e:
        print(f"")
        print(f"  ⚠️  No se pudo iniciar la cámara local: {e}")
        print(f"  ℹ️  El sistema sigue activo SIN cámara.")
        print(f"  ℹ️  Puedes enviar imágenes al endpoint POST /predict-360")
        print(f"      o usar el frontend en http://localhost:{PORT}")
        print(f"")
        print("=" * 64)
        print("  🟢 SERVIDOR EN EJECUCIÓN — Presiona Ctrl+C para detener")
        print("=" * 64)

        # Mantener el proceso vivo para que el servidor no muera
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n  🛑 Servidor detenido por el usuario.")