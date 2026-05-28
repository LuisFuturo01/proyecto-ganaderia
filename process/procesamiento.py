import cv2
import numpy as np
import math
import json
import tensorflow as tf
import os
import shutil
from pathlib import Path
from process.biological_mapping import calcular_dosis_biologica_continua
from process.dosimetry_engine import calcular_dosis_emision_3d
from process.shelf_life_predictor import calcular_vida_util
from process.b2b_simulator import calcular_impacto_financiero

# Sincronización automática de los archivos del modelo desde modelo_ml a la carpeta local
src_model_path = r"d:\xampp\htdocs\UMSA\iA\modelo_ml\model\3"
legacy_model_path = r"d:\xampp\htdocs\UMSA\iA\proyecto-ganaderia\model"

try:
    if os.path.exists(src_model_path):
        os.makedirs(legacy_model_path, exist_ok=True)
        src_vars = os.path.join(src_model_path, "variables")
        dest_vars = os.path.join(legacy_model_path, "variables")
        
        # Copiar variables si no existen localmente en el proyecto
        if not os.path.exists(dest_vars) and os.path.exists(src_vars):
            print(f"[INFO] Copiando variables del modelo de producción desde {src_vars} a {dest_vars}...")
            shutil.copytree(src_vars, dest_vars, dirs_exist_ok=True)
            print("[SUCCESS] Variables del modelo sincronizadas con éxito!")
            
        # Copiar archivos pb si faltan
        for f_name in ["saved_model.pb", "keras_metadata.pb", "fingerprint.pb"]:
            src_f = os.path.join(src_model_path, f_name)
            dest_f = os.path.join(legacy_model_path, f_name)
            if os.path.exists(src_f) and not os.path.exists(dest_f):
                shutil.copy2(src_f, dest_f)
                print(f"[SUCCESS] Archivo {f_name} copiado al modelo local en proyecto-ganaderia.")
except Exception as e:
    print(f"[WARNING] No se pudo realizar la sincronización automática del modelo: {e}")

# Cargar el modelo v3 de producción usando TFSMLayer desde la ruta local de proyecto-ganaderia (Requerido en Keras 3 / TensorFlow 2.16+)
try:
    tfsmlayer = tf.keras.layers.TFSMLayer(legacy_model_path, call_endpoint='serving_default')
    # Envolverlo en un modelo funcional para una carga limpia y llamadas estándares
    inputs = tf.keras.Input(shape=(256, 256, 3))
    outputs = tfsmlayer(inputs)
    MODELO_GLOBAL = tf.keras.Model(inputs, outputs)
    print(f"[SUCCESS] Modelo TensorFlow v3 cargado con éxito desde '{legacy_model_path}' mediante TFSMLayer!")
    
    # Pre-calentar el modelo con una inferencia dummy para forzar el trazado inicial del grafo de TensorFlow/Keras
    try:
        dummy_tensor = tf.zeros((1, 256, 256, 3), dtype=tf.float32)
        _ = MODELO_GLOBAL(dummy_tensor, training=False)
        print("[SUCCESS] Modelo de producción pre-calentado e inicializado con éxito!")
    except Exception as warmup_err:
        print(f"[WARNING] No se pudo realizar el pre-calentamiento del modelo: {warmup_err}")
except Exception as e:
    print(f"[WARNING] Error al inicializar TFSMLayer: {e}. Intentando carga directa heredada...")
    MODELO_GLOBAL = tf.keras.models.load_model(legacy_model_path)
    try:
        dummy_tensor = tf.zeros((1, 256, 256, 3), dtype=tf.float32)
        _ = MODELO_GLOBAL(dummy_tensor, training=False)
        print("[SUCCESS] Modelo heredado pre-calentado con éxito!")
    except Exception:
        pass

TAMANO_ENTRADA = 256  # Resolución de entrada del modelo (256x256)

# Clases del modelo en el orden de salida del softmax.
# ➜ Si la predicción no coincide, ajustar este orden.
CLASES_MODELO = [
    "apple_level_0",
    "apple_level_1",
    "apple_level_2",
    "potato_level_0",
    "potato_level_1",
    "potato_level_2"
]

FACTOR_CONVERSION = 0.01 

DIRECTORIO_DATASET = "analyze"
os.makedirs(DIRECTORIO_DATASET, exist_ok=True)

# ======================================================================
# FUNCIONES DE PROCESAMIENTO DE IMAGEN (GrabCut + Join)
# ======================================================================
# Basado en los scripts probados recor.py y join.py
# ======================================================================

def recortar_objeto_grabcut(img_bgr):
    """
    Aísla el objeto (papa o manzana) de la imagen usando GrabCut de OpenCV,
    guiado por detección de color HSV para los tonos típicos del producto
    (café/marrón para papas, rojo/verde para manzanas).
    Retorna la imagen recortada con fondo negro (BGR).
    Si falla, retorna la imagen original.
    Basado en: recor.py
    """
    h, w, _ = img_bgr.shape
    
    # Crear máscaras y buffers para el algoritmo GrabCut
    mascara = np.zeros((h, w), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    
    try:
        # ================================================================
        # FASE 1: Detección de color HSV para guiar GrabCut
        # Buscamos los colores típicos de papas y manzanas para marcar
        # probable foreground, evitando que GrabCut invierta la segmentación
        # ================================================================
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        
        # --- Rangos HSV para los colores de los productos ---
        # Café/Marrón (papas): H=10-30, S=40-200, V=40-200
        mascara_cafe = cv2.inRange(hsv, np.array([10, 40, 40]), np.array([30, 200, 200]))
        
        # Rojo bajo (manzanas rojas): H=0-10, S=50-255, V=50-255
        mascara_rojo_bajo = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([10, 255, 255]))
        
        # Rojo alto (manzanas rojas): H=160-180, S=50-255, V=50-255
        mascara_rojo_alto = cv2.inRange(hsv, np.array([160, 50, 50]), np.array([180, 255, 255]))
        
        # Verde (manzanas verdes): H=30-85, S=40-255, V=40-255
        mascara_verde = cv2.inRange(hsv, np.array([30, 40, 40]), np.array([85, 255, 255]))
        
        # Amarillo/Naranja (papas claras, manzanas amarillas): H=15-35, S=50-255, V=80-255
        mascara_amarillo = cv2.inRange(hsv, np.array([15, 50, 80]), np.array([35, 255, 255]))
        
        # Combinar todas las máscaras de color del producto
        mascara_color = mascara_cafe | mascara_rojo_bajo | mascara_rojo_alto | mascara_verde | mascara_amarillo
        
        # Limpiar la máscara con operaciones morfológicas
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        mascara_color = cv2.morphologyEx(mascara_color, cv2.MORPH_CLOSE, kernel, iterations=3)
        mascara_color = cv2.morphologyEx(mascara_color, cv2.MORPH_OPEN, kernel, iterations=2)
        
        # Calcular cuántos píxeles de producto detectamos
        pixeles_producto = cv2.countNonZero(mascara_color)
        porcentaje_producto = pixeles_producto / (h * w)
        
        # ================================================================
        # FASE 2: GrabCut con máscara guiada o con rectángulo
        # ================================================================
        if porcentaje_producto > 0.03:  # Si detectamos al menos 3% de píxeles de producto
            # Usar la máscara de color para guiar GrabCut (GC_INIT_WITH_MASK)
            # Marcar: 0=fondo seguro, 1=frente seguro, 2=probable fondo, 3=probable frente
            
            # Empezar con todo como probable fondo
            mascara[:] = cv2.GC_PR_BGD  # 2
            
            # Marcar los bordes exteriores (4% del borde) como fondo seguro
            borde = int(min(h, w) * 0.04)
            mascara[:borde, :] = cv2.GC_BGD  # 0 - borde superior
            mascara[h-borde:, :] = cv2.GC_BGD  # 0 - borde inferior
            mascara[:, :borde] = cv2.GC_BGD  # 0 - borde izquierdo
            mascara[:, w-borde:] = cv2.GC_BGD  # 0 - borde derecho
            
            # Marcar los píxeles de color del producto como probable frente
            mascara[mascara_color > 0] = cv2.GC_PR_FGD  # 3
            
            # Erosionar la máscara de color para encontrar el centro sólido del producto
            kernel_centro = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
            centro_solido = cv2.erode(mascara_color, kernel_centro, iterations=2)
            
            # Marcar el centro sólido como frente seguro
            mascara[centro_solido > 0] = cv2.GC_FGD  # 1
            
            cv2.grabCut(img_bgr, mascara, None, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_MASK)
            print(f"    [GrabCut] Modo GUIADO por color ({porcentaje_producto*100:.1f}% píxeles de producto detectados)")
        else:
            # Fallback: usar rectángulo como en recor.py original
            rectangulo = (int(w * 0.04), int(h * 0.04), int(w * 0.92), int(h * 0.92))
            cv2.grabCut(img_bgr, mascara, rectangulo, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
            print(f"    [GrabCut] Modo RECTÁNGULO (fallback, {porcentaje_producto*100:.1f}% píxeles de color)")
        
        # Filtrar los píxeles que pertenecen al objeto (seguros y probables)
        mascara_binaria = np.where((mascara == 2) | (mascara == 0), 0, 1).astype('uint8') * 255
        
        # ================================================================
        # FASE 3: Validación y recorte (idéntico a recor.py)
        # ================================================================
        # Encontrar los contornos del objeto aislado
        contornos, _ = cv2.findContours(mascara_binaria, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contornos:
            print("⚠️ GrabCut: No se detectó ningún objeto central en la imagen.")
            return img_bgr
            
        # Obtener el contorno más grande (el fruto)
        c = max(contornos, key=cv2.contourArea)
        x, y, w_box, h_box = cv2.boundingRect(c)
        
        # --- PROTECCIÓN DE LÍMITES (R_Safe) ---
        # Añadimos un colchón de 15 píxeles para no dejar el recorte al ras
        margen = 15
        x_min = max(0, x - margen)
        y_min = max(0, y - margen)
        x_max = min(w, x + w_box + margen)
        y_max = min(h, y + h_box + margen)
        
        # Aplicar la máscara para limpiar completamente el fondo a negro puro absoluto
        objeto_limpio = cv2.bitwise_and(img_bgr, img_bgr, mask=mascara_binaria)
        
        # Extraer el recorte final perfecto
        recorte_perfecto = objeto_limpio[y_min:y_max, x_min:x_max]
        return recorte_perfecto
        
    except Exception as e:
        print(f"⚠️ Error durante GrabCut: {e}. Usando imagen original.")
        return img_bgr


def extraer_borde_objeto(img_bgr):
    """
    Extrae el bounding box ajustado del objeto sobre fondo negro.
    Retorna la imagen recortada al borde del objeto.
    Basado en: join.py
    """
    gris = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Umbral para separar el objeto del fondo negro
    _, umbral = cv2.threshold(gris, 15, 255, cv2.THRESH_BINARY)
    
    # Encontrar los contornos del objeto
    contornos, _ = cv2.findContours(umbral, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contornos:
        return img_bgr  # Si falla, devuelve la imagen original
        
    # Obtener el contorno más grande
    c = max(contornos, key=cv2.contourArea)
    
    # Calcular la caja de recorte exacta (Bounding Box)
    x, y, w, h = cv2.boundingRect(c)
    
    # Retornar el objeto recortado eliminando excesos de fondo negro
    return img_bgr[y:y+h, x:x+w]


def generar_mapa_plano_superficie(imagenes_recortadas_bgr):
    """
    Toma una lista de imágenes recortadas (BGR, fondo negro),
    extrae el objeto de cada una, las escala a altura uniforme,
    toma la franja central del 75%, y las concatena horizontalmente.
    Retorna la imagen del mapa plano (BGR) o None si falla.
    Basado en: join.py
    """
    if len(imagenes_recortadas_bgr) < 2:
        print("⚠️ Insuficientes vistas para generar mapa plano.")
        return None
    
    # 1. Extraer el borde del objeto de cada imagen recortada
    objetos_puros = []
    for img in imagenes_recortadas_bgr:
        obj = extraer_borde_objeto(img)
        objetos_puros.append(obj)
    
    if len(objetos_puros) < 2:
        return None
    
    # 2. Encontrar el alto promedio para estandarizar la escala
    alto_objetivo = int(np.mean([img.shape[0] for img in objetos_puros]))
    
    franjas_listas = []
    for img in objetos_puros:
        # Escalar proporcionalmente manteniendo el aspecto original
        alto_actual, ancho_actual, _ = img.shape
        escala = alto_objetivo / alto_actual
        ancho_nuevo = int(ancho_actual * escala)
        img_escalada = cv2.resize(img, (ancho_nuevo, alto_objetivo))
        
        # Tomar la franja representativa (75% central)
        w_f = img_escalada.shape[1]
        ancho_franja = int(w_f * 0.75)
        inicio_x = int((w_f - ancho_franja) / 2)
        
        franja = img_escalada[0:alto_objetivo, inicio_x:inicio_x+ancho_franja]
        franjas_listas.append(franja)
    
    # 3. Concatenar las caras alineadas horizontalmente
    mapa_plano = np.hstack(franjas_listas)
    return mapa_plano
# ======================================================================

def corregir_tipo_por_color(img_bgr, predicted_class):
    """
    Analiza los colores del objeto recortado para validar y corregir
    la clasificación entre manzana y papa.
    """
    try:
        # Convertir a escala de grises para encontrar la máscara del objeto
        gris = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        _, mask_objeto = cv2.threshold(gris, 15, 255, cv2.THRESH_BINARY)
        
        total_px = cv2.countNonZero(mask_objeto)
        if total_px == 0:
            return predicted_class, "no_objeto"
            
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        
        # Máscaras de color dentro de la zona del objeto
        # Rojo (Manzanas rojas): H=0-10 y H=160-180
        mascara_rojo = cv2.bitwise_and(
            (cv2.inRange(hsv, np.array([0, 50, 40]), np.array([10, 255, 255])) |
             cv2.inRange(hsv, np.array([160, 50, 40]), np.array([180, 255, 255]))),
            mask_objeto
        )
        # Verde (Manzanas verdes): H=30-85
        mascara_verde = cv2.bitwise_and(
            cv2.inRange(hsv, np.array([30, 40, 40]), np.array([85, 255, 255])),
            mask_objeto
        )
        # Café/Marrón (Papas): H=10-28, S=30-200, V=30-180
        mascara_cafe = cv2.bitwise_and(
            cv2.inRange(hsv, np.array([10, 30, 30]), np.array([28, 200, 180])),
            mask_objeto
        )
        # Amarillo/Naranja (Papas claras, piel de papa limpia): H=15-35
        mascara_amarillo = cv2.bitwise_and(
            cv2.inRange(hsv, np.array([15, 40, 60]), np.array([35, 255, 255])),
            mask_objeto
        )
        
        px_rojo = cv2.countNonZero(mascara_rojo)
        px_verde = cv2.countNonZero(mascara_verde)
        px_cafe = cv2.countNonZero(mascara_cafe)
        px_amarillo = cv2.countNonZero(mascara_amarillo)
        
        pct_rojo = px_rojo / total_px
        pct_verde = px_verde / total_px
        pct_cafe = px_cafe / total_px
        pct_amarillo = px_amarillo / total_px
        
        print(f"    [Color Analysis] Red: {pct_rojo:.2%}, Green: {pct_verde:.2%}, Brown: {pct_cafe:.2%}, Yellow: {pct_amarillo:.2%}")
        
        partes = predicted_class.split('_')
        tipo_actual = partes[0]        # 'apple' o 'potato'
        nivel_dano = partes[-1]        # '0', '1', '2'
        
        # Si se predijo manzana (apple)
        if tipo_actual == "apple":
            # Pero tiene mucho café o amarillo y muy poco rojo y verde
            if (pct_cafe > 0.15 or pct_amarillo > 0.20) and (pct_rojo < 0.05 and pct_verde < 0.05):
                print(f"    [Color Correction] 🔄 Corrección por color: Detectado perfil de PAPA (Brown/Yellow) en predicción de MANZANA.")
                return f"potato_level_{nivel_dano}", "corrected_to_potato"
                
        # Si se predijo papa (potato)
        elif tipo_actual == "potato":
            # Pero tiene un color rojo o verde muy marcado
            if pct_rojo > 0.08 or pct_verde > 0.12:
                print(f"    [Color Correction] 🔄 Corrección por color: Detectado perfil de MANZANA (Red/Green) en predicción de PAPA.")
                return f"apple_level_{nivel_dano}", "corrected_to_apple"
                
        return predicted_class, "verified"
    except Exception as e:
        print(f"    ⚠️ Error en corrección por color: {e}")
        return predicted_class, "error"

def obtener_siguiente_id_consecuente():
    dirs = [d for d in os.listdir(DIRECTORIO_DATASET) if os.path.isdir(os.path.join(DIRECTORIO_DATASET, d))]
    ids_existentes = []
    
    for d in dirs:
        partes_dir = d.split('-')
        if partes_dir:
            try:
                ids_existentes.append(int(partes_dir[-1]))
            except ValueError:
                continue
                
    siguiente_id = max(ids_existentes) + 1 if ids_existentes else 1
    return f"{siguiente_id:05d}"

def consolidar_analisis_360(lista_imagenes, model=MODELO_GLOBAL):
    if not lista_imagenes or len(lista_imagenes) == 0:
        return '{"error": "No hay imágenes para procesar"}'

    lista_alimentos = []
    lista_niveles_dano = []
    lista_confianzas = []
    
    suma_areas = 0
    anchos = []
    altos = []
    hsv_acumulado = [0, 0, 0]
    caras_validas = 0

    # --- GUARDADO ESTRUCTURADO (se prepara antes del loop para guardar recortes) ---
    # Se hace una primera pasada rápida de inferencia provisional para determinar el tipo/nivel
    # pero el guardado definitivo y la inferencia real se hacen después del GrabCut.
    
    # Primero: crear las carpetas de guardado (necesitamos el tipo para el nombre)
    # Para eso, hacemos una inferencia rápida sobre la primera imagen original
    tipo_provisional = "desconocido"
    nivel_provisional = 0
    try:
        img_prov = cv2.cvtColor(lista_imagenes[0], cv2.COLOR_BGR2RGB)
        img_prov = cv2.resize(img_prov, (TAMANO_ENTRADA, TAMANO_ENTRADA))
        img_prov_batch = np.expand_dims(img_prov.astype(np.float32), axis=0)
        preds_prov = model.predict(img_prov_batch, verbose=0)
        if isinstance(preds_prov, dict):
            pred_prov_logits = preds_prov[list(preds_prov.keys())[0]][0]
        else:
            pred_prov_logits = preds_prov[0]
        class_id_prov = int(np.argmax(pred_prov_logits))
        if class_id_prov < len(CLASES_MODELO):
            partes_prov = CLASES_MODELO[class_id_prov].split('_')
            tipo_provisional = partes_prov[0]
            nivel_provisional = int(partes_prov[-1])
    except Exception:
        pass

    tipo_carpeta = "manzana" if tipo_provisional == "apple" else "papa" if tipo_provisional == "potato" else "desconocido"
    id_consecuente = obtener_siguiente_id_consecuente()
    
    # Nombre provisional (se ajustará con el resultado final si cambia)
    nombre_raiz_objeto = f"{tipo_carpeta}-level_{nivel_provisional}-{id_consecuente}"
    ruta_raiz_objeto = os.path.join(DIRECTORIO_DATASET, nombre_raiz_objeto)
    
    ruta_originales = os.path.join(ruta_raiz_objeto, "originales")
    ruta_recortadas = os.path.join(ruta_raiz_objeto, "recortadas")
    
    os.makedirs(ruta_originales, exist_ok=True)
    os.makedirs(ruta_recortadas, exist_ok=True)

    # Lista para almacenar las imágenes recortadas por GrabCut (para el mapa plano)
    imagenes_recortadas_bgr = []

    for idx, img in enumerate(lista_imagenes):
        # 1. GUARDAR IMAGEN ORIGINAL
        cv2.imwrite(os.path.join(ruta_originales, f"vista_{idx+1}.jpg"), img)
        
        # 2. RECORTE CON GRABCUT (reemplaza rembg)
        print(f"[INFO] Aplicando GrabCut a vista {idx+1}...")
        img_recortada = recortar_objeto_grabcut(img)
        
        # Guardar la imagen recortada
        ruta_recorte = os.path.join(ruta_recortadas, f"recorte_{idx+1}.png")
        cv2.imwrite(ruta_recorte, img_recortada)
        print(f"    -> Recorte guardado: {ruta_recorte}")
        
        # Almacenar para el mapa plano posterior
        imagenes_recortadas_bgr.append(img_recortada)
        
        # 3. INFERENCIA IA SOBRE LA IMAGEN RECORTADA (no la original)
        tipo_item, nivel_dano, confianza = "desconocido", 0, 0.0
        
        try:
            # Preprocesar: BGR→RGB, resize, batch dim
            # NOTA: El modelo ya incluye Rescaling(1./255) internamente.
            #       NO normalizar aquí para evitar doble normalización.
            img_rgb = cv2.cvtColor(img_recortada, cv2.COLOR_BGR2RGB)
            img_resized = cv2.resize(img_rgb, (TAMANO_ENTRADA, TAMANO_ENTRADA))
            img_batch = np.expand_dims(img_resized.astype(np.float32), axis=0)
            
            preds = model.predict(img_batch, verbose=0)
            
            # En Keras 3 con TFSMLayer, la predicción retorna un diccionario de tensores.
            # Extraemos los logits del tensor correspondiente (ej. la primera clave)
            if isinstance(preds, dict):
                first_key = list(preds.keys())[0]
                pred_logits = preds[first_key][0]
            else:
                pred_logits = preds[0]

            class_id = int(np.argmax(pred_logits))
            confianza = float(pred_logits[class_id])
            
            if class_id < len(CLASES_MODELO):
                label_name = CLASES_MODELO[class_id]
                
                # Validar y corregir la clasificación macro de fruto/tubérculo por color HSV
                label_name, _ = corregir_tipo_por_color(img_recortada, label_name)
                
                partes = label_name.split('_')
                tipo_item = partes[0]       # 'apple' o 'potato'
                nivel_dano = int(partes[-1]) # 0, 1 o 2
        except Exception as e:
            print(f"⚠️ Error en inferencia TF: {e}")

        lista_alimentos.append(tipo_item)
        lista_niveles_dano.append(nivel_dano)
        lista_confianzas.append(confianza)

        # 4. OPENCV GEOMETRÍA SOBRE LA IMAGEN RECORTADA
        gray = cv2.cvtColor(img_recortada, cv2.COLOR_BGR2GRAY)
        
        # Umbral simple para fondo negro (consistente con GrabCut output)
        _, thresh = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
        
        contornos, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contornos:
            c = max(contornos, key=cv2.contourArea)
            suma_areas += cv2.contourArea(c)
            x, y, w, h = cv2.boundingRect(c)
            anchos.append(w)
            altos.append(h)
            
            mascara = np.zeros(gray.shape, np.uint8)
            cv2.drawContours(mascara, [c], -1, 255, -1)
            hsv_img = cv2.cvtColor(img_recortada, cv2.COLOR_BGR2HSV)
            mean_hsv = cv2.mean(hsv_img, mask=mascara)
            hsv_acumulado[0] += mean_hsv[0]
            hsv_acumulado[1] += mean_hsv[1]
            hsv_acumulado[2] += mean_hsv[2]
            caras_validas += 1

    tipo_final = max(set(lista_alimentos), key=lista_alimentos.count)
    peor_dano = max(lista_niveles_dano) 
    confianza_promedio = sum(lista_confianzas) / len(lista_confianzas)

    alimento_dict = "MANZANA" if tipo_final == "apple" else "PAPA" if tipo_final == "potato" else "DESCONOCIDO"
    severidad_dict = f"level {peor_dano}"

    # --- RENOMBRAR CARPETA SI EL RESULTADO FINAL DIFIERE DEL PROVISIONAL ---
    tipo_carpeta_final = "manzana" if tipo_final == "apple" else "papa" if tipo_final == "potato" else "desconocido"
    nombre_raiz_final = f"{tipo_carpeta_final}-level_{peor_dano}-{id_consecuente}"
    
    if nombre_raiz_final != nombre_raiz_objeto:
        ruta_raiz_final = os.path.join(DIRECTORIO_DATASET, nombre_raiz_final)
        try:
            os.rename(ruta_raiz_objeto, ruta_raiz_final)
            ruta_raiz_objeto = ruta_raiz_final
            nombre_raiz_objeto = nombre_raiz_final
            ruta_originales = os.path.join(ruta_raiz_objeto, "originales")
            ruta_recortadas = os.path.join(ruta_raiz_objeto, "recortadas")
            print(f"[INFO] Carpeta renombrada a: {nombre_raiz_final}")
        except Exception as e:
            print(f"⚠️ No se pudo renombrar la carpeta: {e}")

    # ====================================================================
    # 3.5. GENERACIÓN DE IMAGEN AGRUPADA (LOTE 360 EN REJILLA 2x2)
    # ====================================================================
    ruta_agrupada = os.path.join(ruta_raiz_objeto, f"{nombre_raiz_objeto}-agrupada.png")
    try:
        h_std, w_std = 360, 640
        resized_imgs = []
        for img in lista_imagenes:
            res = cv2.resize(img, (w_std, h_std))
            resized_imgs.append(res)
        # Asegurar que tengamos exactamente 4 imágenes en la lista
        while len(resized_imgs) < 4:
            blank = np.zeros((h_std, w_std, 3), dtype=np.uint8)
            resized_imgs.append(blank)
            
        # Crear la cuadrícula 2x2
        fila_sup = np.hstack((resized_imgs[0], resized_imgs[1]))
        fila_inf = np.hstack((resized_imgs[2], resized_imgs[3]))
        grid_agrupado = np.vstack((fila_sup, fila_inf))
        
        # Añadir bordes divisorios sutiles (color gris oscuro premium)
        cv2.line(grid_agrupado, (w_std, 0), (w_std, h_std * 2), (64, 64, 64), 4)
        cv2.line(grid_agrupado, (0, h_std), (w_std * 2, h_std), (64, 64, 64), 4)
        
        # Agregar etiquetas de texto premium en cada cuadrante (Vista 1, Vista 2, Vista 3, Vista 4)
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.8
        color = (255, 255, 255)
        thickness = 2
        
        # Dibujar sombras y textos para cada vista
        etiquetas = ["VISTA 1 (0 deg)", "VISTA 2 (90 deg)", "VISTA 3 (180 deg)", "VISTA 4 (270 deg)"]
        posiciones = [
            (20, 40),                     # Vista 1
            (w_std + 20, 40),             # Vista 2
            (20, h_std + 40),             # Vista 3
            (w_std + 20, h_std + 40)      # Vista 4
        ]
        
        for i, (label, pos) in enumerate(zip(etiquetas, posiciones)):
            # Sombra negra
            cv2.putText(grid_agrupado, label, (pos[0] + 1, pos[1] + 1), font, font_scale, (0, 0, 0), thickness + 1, cv2.LINE_AA)
            # Texto blanco
            cv2.putText(grid_agrupado, label, pos, font, font_scale, color, thickness, cv2.LINE_AA)
            
        cv2.imwrite(ruta_agrupada, grid_agrupado)
        print(f"[SUCCESS] Imagen agrupada guardada con exito en: {ruta_agrupada}")
    except Exception as e:
        print(f"[WARNING] No se pudo crear la imagen agrupada: {e}")
        ruta_agrupada = None

    # ====================================================================
    # 4. GENERACIÓN DE MAPA PLANO DE SUPERFICIE (basado en join.py)
    # ====================================================================
    ruta_plano = os.path.join(ruta_raiz_objeto, f"{nombre_raiz_objeto}-plano.png")
    
    try:
        mapa_plano = generar_mapa_plano_superficie(imagenes_recortadas_bgr)
        
        if mapa_plano is not None:
            cv2.imwrite(ruta_plano, mapa_plano)
            print(f"🗺️  Mapa plano de superficie generado: {ruta_plano}")
        else:
            print("⚠️  No se pudo generar el mapa plano de superficie.")
            ruta_plano = None
            
    except Exception as e:
        print(f"❌ Error generando mapa plano: {e}")
        ruta_plano = None

    if caras_validas > 0:
        area_px_promedio = suma_areas / caras_validas
        ancho_px_prom = sum(anchos) / caras_validas
        alto_px_prom = sum(altos) / caras_validas
        hsv_promedio = [int(v / caras_validas) for v in hsv_acumulado]
    else:
        area_px_promedio, ancho_px_prom, alto_px_prom = 0, 0, 0
        hsv_promedio = [0, 0, 0]

    ancho_cm = ancho_px_prom * FACTOR_CONVERSION
    alto_cm = alto_px_prom * FACTOR_CONVERSION
    
    max_dim = max(ancho_px_prom, alto_px_prom)
    esfericidad = round(min(ancho_px_prom, alto_px_prom) / max_dim, 2) if max_dim > 0 else 0.0
    
    radio_mayor = max(ancho_cm, alto_cm) / 2
    radio_menor = min(ancho_cm, alto_cm) / 2
    volumen_cm3 = round((4/3) * math.pi * (radio_menor ** 2) * radio_mayor, 2)
    area_cm2 = round(area_px_promedio * (FACTOR_CONVERSION ** 2), 2)

    # ====================================================================
    # 5. DOSIMETRÍA NUCLEAR CORREGIDA (Módulos SciML del Hackatom)
    # ====================================================================
    
    # Porcentaje de daño detectado por nivel de severidad
    porcentaje_dano_ia = 15.5 if severidad_dict == "level 1" else 45.0 if severidad_dict == "level 2" else 0.0
    
    # A. TRADUCTOR BIOLÓGICO (Curva Sigmoide continua → dosis kGy)
    try:
        dosis_objetivo_centro_kGy = calcular_dosis_biologica_continua(alimento_dict, porcentaje_dano_ia)
        proposito = "Inhibición de germinación" if alimento_dict == "PAPA" else "Retraso de maduración"
        if porcentaje_dano_ia > 30:
            proposito = "Desinfestación de plagas" if alimento_dict == "PAPA" else "Control microbiano"
    except ValueError:
        dosis_objetivo_centro_kGy = 0.5
        proposito = "Tratamiento estándar"

    # B. MOTOR FÍSICO 3D (Beer-Lambert volumétrica → dosis emisión + indicadores)
    try:
        resultados_fisica = calcular_dosis_emision_3d(dosis_objetivo_centro_kGy, alimento_dict, volumen_cm3)
    except ValueError:
        resultados_fisica = {
            "dosis_emision_requerida_kGy": dosis_objetivo_centro_kGy * 1.5,
            "profundidad_penetrada_cm": radio_menor,
            "energia_depositada_total_Joules": 0.0,
            "masa_calculada_kg": 0.0,
            "mu_lineal_cm_inv": 0.0,
            "densidad_g_cm3": 0.0,
            "perfil_atenuacion_kGy": [0.0],
            "uniformidad_dosis_ratio": 1.0,
            "reduccion_logaritmica_bacteriana": 0.0
        }

    # C. PREDICCIÓN DE VIDA ÚTIL POST-IRRADIACIÓN (Cinética SciML)
    try:
        vida_util_resultado = calcular_vida_util(alimento_dict, porcentaje_dano_ia, dosis_objetivo_centro_kGy)
    except Exception as e:
        print(f"⚠️ Error en predicción de vida útil: {e}")
        vida_util_resultado = {
            "dias_vida_util_restante": 0,
            "dias_ganados_por_irradiacion": 0,
            "estado_proyeccion": "Desconocido"
        }

    # D. SIMULACIÓN DE IMPACTO FINANCIERO OPERATIVO (Planta de Irradiación)
    try:
        impacto_financiero_resultado = calcular_impacto_financiero(
            alimento_dict, dosis_objetivo_centro_kGy, resultados_fisica["masa_calculada_kg"]
        )
    except Exception as e:
        print(f"⚠️ Error en simulación de impacto financiero: {e}")
        impacto_financiero_resultado = {
            "dosis_estandar_industria_kGy": 0.0,
            "tiempo_procesamiento_ahorrado_segundos": 0.0,
            "ahorro_directo_por_unidad_usd": 0.0,
            "ahorro_proyectado_por_tonelada_usd": 0.0,
            "porcentaje_optimizacion_throughput": 0.0
        }

    # ====================================================================
    # 6. JSON DE SALIDA — Formato del diccionario-json del contrato API
    # ====================================================================
    json_salida = {
        "clasificacion_alimento": {
            "tipo_item_detectado": alimento_dict.lower(),
            "puntaje_confianza_modelo": round(confianza_promedio, 2)
        },
        "analisis_color_superficie": {
            "espacio_color_hsv_promedio": hsv_promedio,
            "porcentaje_superficie_piel_danada": porcentaje_dano_ia,
            "conteo_manchas_aisladas": 2 if severidad_dict == "level 1" else 7 if severidad_dict == "level 2" else 0
        },
        "geometria_espacial_3d": {
            "volumen_calculado_cm3": volumen_cm3,
            "area_superficie_calculada_cm2": area_cm2,
            "indice_forma_esfericidad": esfericidad,
            "dimensiones_caja_borde_cm": {
                "ancho": round(ancho_cm, 2),
                "alto": round(alto_cm, 2),
                "espesor_profundidad_estimada": round(radio_menor * 2, 2)
            },
            "ruta_imagen_plana_textura": ("/" + ruta_plano.replace("\\", "/")) if ruta_plano else "No disponible",
            "ruta_imagen_agrupada": ("/" + ruta_agrupada.replace("\\", "/")) if ruta_agrupada else "No disponible"
        },
        "simulacion_dosimetria_radiacion": {
            "dosis_superficie_objetivo_kGy": resultados_fisica["dosis_emision_requerida_kGy"],
            "proposito_fitosanitario_asignado": proposito,
            "perfil_atenuacion_profundidad_lineal_kGy": resultados_fisica["perfil_atenuacion_kGy"],
            "indicadores_dosimetria_fisico_biologica": {
                "energia_depositada_total_Joules": resultados_fisica["energia_depositada_total_Joules"],
                "coeficiente_atenuacion_lineal_mu": resultados_fisica["mu_lineal_cm_inv"],
                "uniformidad_dosis_ratio_Dmax_Dmin": resultados_fisica["uniformidad_dosis_ratio"],
                "densidad_masa_estimada_g_cm3": resultados_fisica["densidad_g_cm3"],
                "reduccion_logaritmica_carga_bacteriana": resultados_fisica["reduccion_logaritmica_bacteriana"]
            }
        },
        "prediccion_vida_util_post_irradiacion": {
            "dias_vida_util_restante": vida_util_resultado["dias_vida_util_restante"],
            "dias_ganados_por_irradiacion": vida_util_resultado["dias_ganados_por_irradiacion"],
            "estado_proyeccion": vida_util_resultado["estado_proyeccion"]
        },
        "simulacion_impacto_financiero_operativo": {
            "dosis_estandar_industria_kGy": impacto_financiero_resultado["dosis_estandar_industria_kGy"],
            "tiempo_procesamiento_ahorrado_segundos": impacto_financiero_resultado["tiempo_procesamiento_ahorrado_segundos"],
            "ahorro_directo_por_unidad_usd": impacto_financiero_resultado["ahorro_directo_por_unidad_usd"],
            "ahorro_proyectado_por_tonelada_usd": impacto_financiero_resultado["ahorro_proyectado_por_tonelada_usd"],
            "porcentaje_optimizacion_throughput": impacto_financiero_resultado["porcentaje_optimizacion_throughput"]
        }
    }

    return json.dumps(json_salida, indent=4, ensure_ascii=False)