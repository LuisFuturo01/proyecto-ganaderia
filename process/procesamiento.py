import cv2
import numpy as np
import math
import json
import tensorflow as tf
import os
from pathlib import Path
from PIL import Image
from rembg import remove, new_session
from process.biological_mapping import calcular_dosis_biologica_continua
from process.dosimetry_engine import calcular_dosis_emision_3d
from process.shelf_life_predictor import calcular_vida_util
from process.b2b_simulator import calcular_impacto_financiero

# Cargar el modelo v3 de producción usando TFSMLayer (Requerido en Keras 3 / TensorFlow 2.16+)
try:
    legacy_model_path = r"d:\xampp\htdocs\UMSA\iA\modelo_ml\model\3"
    tfsmlayer = tf.keras.layers.TFSMLayer(legacy_model_path, call_endpoint='serving_default')
    # Envolverlo en un modelo funcional para una carga limpia y llamadas estándares
    inputs = tf.keras.Input(shape=(256, 256, 3))
    outputs = tfsmlayer(inputs)
    MODELO_GLOBAL = tf.keras.Model(inputs, outputs)
    print("[SUCCESS] Modelo TensorFlow v3 cargado con exito en Keras 3 mediante TFSMLayer!")
except Exception as e:
    print(f"[WARNING] Error al inicializar TFSMLayer: {e}. Intentando carga directa heredada...")
    MODELO_GLOBAL = tf.keras.models.load_model(r"d:\xampp\htdocs\UMSA\iA\modelo_ml\model\3")

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
# PANEL DE CONTROL — Sensibilidad de detección del objeto
# ======================================================================
# Modificar estos valores para ajustar cómo se detecta y recorta el objeto.
#
# CLAHE_CLIP_LIMIT: Intensidad del realce de contraste local (CLAHE).
#   - Rango: 1.0 a 10.0
#   - Bajo (1.0): Contraste casi sin cambios. Poco efecto.
#   - Medio (2.0-3.0): Realce suave. Recomendado por defecto.
#   - Alto (5.0-10.0): Contraste agresivo. Útil si el objeto es muy similar al fondo.
#   ➜ Aumentar si el objeto se confunde con el fondo.
CLAHE_CLIP_LIMIT = 2.0

# BLUR_KERNEL: Tamaño del suavizado gaussiano antes del umbralizado.
#   - Valores posibles: 3, 5, 7, 9, 11 (siempre impar)
#   - Bajo (3): Más sensible a detalles finos y texturas. Puede captar ruido.
#   - Medio (5): Balance entre detalle y limpieza. Recomendado.
#   - Alto (7-11): Suaviza más. Pierde bordes finos pero ignora ruido.
#   ➜ Reducir para más sensibilidad a bordes. Aumentar si hay mucho ruido.
BLUR_KERNEL = 5

# MORPH_KERNEL: Tamaño del kernel para operaciones morfológicas (CLOSE/OPEN).
#   - Valores posibles: 3, 5, 7, 9 (siempre impar)
#   - Bajo (3): Conserva detalles finos del contorno. Puede dejar huecos.
#   - Medio (5): Buen balance. Recomendado.
#   - Alto (7-9): Contornos más suaves. Puede unir objetos separados.
#   ➜ Reducir si el contorno se deforma. Aumentar si el contorno tiene huecos.
MORPH_KERNEL = 5

# MORPH_CLOSE_ITER: Iteraciones de CLOSE (rellena huecos dentro del objeto).
#   - Rango: 1 a 5
#   - Bajo (1): Relleno mínimo. Puede quedar con agujeros internos.
#   - Medio (2): Relleno suficiente para la mayoría de casos.
#   - Alto (3-5): Relleno agresivo. Puede expandir el contorno.
#   ➜ Aumentar si el objeto tiene huecos internos en la detección.
MORPH_CLOSE_ITER = 2

# MORPH_OPEN_ITER: Iteraciones de OPEN (elimina ruido/puntos sueltos).
#   - Rango: 1 a 3
#   - Bajo (1): Limpieza suave. Recomendado.
#   - Alto (2-3): Elimina más ruido pero puede erosionar bordes del objeto.
#   ➜ Aumentar solo si hay muchos puntos de ruido sueltos.
MORPH_OPEN_ITER = 1

# MARGEN_RECORTE: Porcentaje de margen alrededor del bounding box al recortar.
#   - Rango: 0.0 a 0.40 (0% a 40%)
#   - Bajo (0.05-0.10): Recorte ajustado. Puede cortar bordes del objeto.
#   - Medio (0.15-0.20): Margen cómodo. Recomendado.
#   - Alto (0.30-0.40): Mucho espacio extra. Incluye más fondo.
#   ➜ Aumentar si el objeto se corta en los bordes.
MARGEN_RECORTE = 0.20
# ======================================================================

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
    
    lista_regiones_borde = []
    lista_contornos_maximos = [] 
    
    suma_areas = 0
    anchos = []
    altos = []
    hsv_acumulado = [0, 0, 0]
    caras_validas = 0

    for img in lista_imagenes:
        # 1. INFERENCIA IA POR CARA (TensorFlow)
        tipo_item, nivel_dano, confianza = "desconocido", 0, 0.0
        
        try:
            # Preprocesar: BGR→RGB, resize, batch dim
            # NOTA: El modelo ya incluye Rescaling(1./255) internamente.
            #       NO normalizar aquí para evitar doble normalización.
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
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
                partes = label_name.split('_')
                tipo_item = partes[0]       # 'apple' o 'potato'
                nivel_dano = int(partes[-1]) # 0, 1 o 2
        except Exception as e:
            print(f"⚠️ Error en inferencia TF: {e}")

        lista_alimentos.append(tipo_item)
        lista_niveles_dano.append(nivel_dano)
        lista_confianzas.append(confianza)

        # 2. OPENCV GEOMETRÍA POR CARA
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP_LIMIT, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        
        blurred = cv2.GaussianBlur(gray, (BLUR_KERNEL, BLUR_KERNEL), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        kernel_morph = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (MORPH_KERNEL, MORPH_KERNEL))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel_morph, iterations=MORPH_CLOSE_ITER)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel_morph, iterations=MORPH_OPEN_ITER)
        
        contornos, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contornos:
            c = max(contornos, key=cv2.contourArea)
            suma_areas += cv2.contourArea(c)
            x, y, w, h = cv2.boundingRect(c)
            anchos.append(w)
            altos.append(h)
            
            lista_regiones_borde.append((x, y, w, h))
            lista_contornos_maximos.append(c)
            
            mascara = np.zeros(gray.shape, np.uint8)
            cv2.drawContours(mascara, [c], -1, 255, -1)
            hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            mean_hsv = cv2.mean(hsv_img, mask=mascara)
            hsv_acumulado[0] += mean_hsv[0]
            hsv_acumulado[1] += mean_hsv[1]
            hsv_acumulado[2] += mean_hsv[2]
            caras_validas += 1
        else:
            lista_regiones_borde.append(None)
            lista_contornos_maximos.append(None)

    tipo_final = max(set(lista_alimentos), key=lista_alimentos.count)
    peor_dano = max(lista_niveles_dano) 
    confianza_promedio = sum(lista_confianzas) / len(lista_confianzas)

    alimento_dict = "MANZANA" if tipo_final == "apple" else "PAPA" if tipo_final == "potato" else "DESCONOCIDO"
    severidad_dict = f"level {peor_dano}"

    # --- GUARDADO ESTRUCTURADO CON RECORTE PRECISO POR MÁSCARA ---
    tipo_carpeta = "manzana" if tipo_final == "apple" else "papa" if tipo_final == "potato" else "desconocido"
    id_consecuente = obtener_siguiente_id_consecuente()
    
    nombre_raiz_objeto = f"{tipo_carpeta}-level_{peor_dano}-{id_consecuente}"
    ruta_raiz_objeto = os.path.join(DIRECTORIO_DATASET, nombre_raiz_objeto)
    
    ruta_originales = os.path.join(ruta_raiz_objeto, "originales")
    ruta_recortadas = os.path.join(ruta_raiz_objeto, "recortadas")
    
    os.makedirs(ruta_originales, exist_ok=True)
    os.makedirs(ruta_recortadas, exist_ok=True)
    
    # Sesión de rembg inicializada una sola vez (evita recargar el modelo por cada vista)
    session_rembg = new_session("u2net")

    # Lista para almacenar las imágenes procesadas (para el unwrap posterior)
    imagenes_procesadas_rgba = []

    for idx, img in enumerate(lista_imagenes):
        cv2.imwrite(os.path.join(ruta_originales, f"vista_{idx+1}.jpg"), img)
        
        region = lista_regiones_borde[idx]
        contorno = lista_contornos_maximos[idx]
        
        if region is not None and contorno is not None:
            x, y, w, h = region
            alto_img, ancho_img = img.shape[:2]
            
            # Margen adaptativo para no cortar bordes del objeto
            margen_x = int(w * MARGEN_RECORTE)
            margen_y = int(h * MARGEN_RECORTE)
            x1 = max(0, x - margen_x)
            y1 = max(0, y - margen_y)
            x2 = min(ancho_img, x + w + margen_x)
            y2 = min(alto_img, y + h + margen_y)
            
            img_recortada_bgr = img[y1:y2, x1:x2]
            
            # Centrar el recorte en un canvas cuadrado con fondo blanco
            h_crop, w_crop = img_recortada_bgr.shape[:2]
            lado = max(h_crop, w_crop)
            lado_canvas = int(lado * 1.10)  # 10% extra para que rembg trabaje mejor
            
            canvas = np.ones((lado_canvas, lado_canvas, 3), dtype=np.uint8) * 255
            offset_x = (lado_canvas - w_crop) // 2
            offset_y = (lado_canvas - h_crop) // 2
            canvas[offset_y:offset_y + h_crop, offset_x:offset_x + w_crop] = img_recortada_bgr
            
            # Eliminación de fondo con rembg sobre imagen centrada
            try:
                canvas_rgb = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB)
                imagen_centrada = Image.fromarray(canvas_rgb)
                
                imagen_sin_fondo = remove(imagen_centrada, session=session_rembg)
                
                # Limpieza del canal alfa para bordes más definidos
                resultado_np = np.array(imagen_sin_fondo)
                if resultado_np.shape[2] == 4:
                    alfa = resultado_np[:, :, 3]
                    kernel_alfa = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                    alfa = cv2.morphologyEx(alfa, cv2.MORPH_CLOSE, kernel_alfa)
                    alfa = cv2.GaussianBlur(alfa, (3, 3), 0)
                    resultado_np[:, :, 3] = alfa
                    imagen_sin_fondo = Image.fromarray(resultado_np)
                
                ruta_salida_png = os.path.join(ruta_recortadas, f"recorte_{idx+1}.png")
                imagen_sin_fondo.save(ruta_salida_png, "PNG")
                
                # Guardar en memoria para el unwrap cilíndrico
                imagenes_procesadas_rgba.append(resultado_np)
                
            except Exception as e:
                print(f"❌ Error durante el procesamiento con rembg: {e}")
                cv2.imwrite(os.path.join(ruta_recortadas, f"recorte_{idx+1}.jpg"), canvas)
        else:
            cv2.imwrite(os.path.join(ruta_recortadas, f"recorte_{idx+1}.jpg"), img)

    # ====================================================================
    # 3.5. GENERACIÓN DE IMAGEN AGRUPADA (LOTE 360 EN REJILLA 2x2)
    # ====================================================================
    ruta_agrupada = os.path.join(DIRECTORIO_DATASET, f"{id_consecuente}.png")
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
    # 4. GENERACIÓN DE TEXTURA PLANA (Unwrap cilíndrico de las 4 vistas)
    # ====================================================================
    ruta_plano = os.path.join(ruta_raiz_objeto, f"{nombre_raiz_objeto}-plano.png")
    
    if len(imagenes_procesadas_rgba) >= 2:
        try:
            tiras_corregidas = []
            
            for img_rgba in imagenes_procesadas_rgba:
                h_img, w_img = img_rgba.shape[:2]
                
                # Encontrar el bounding box del objeto usando el canal alfa
                alfa_canal = img_rgba[:, :, 3]
                coords_objeto = np.where(alfa_canal > 20)
                
                if len(coords_objeto[0]) == 0:
                    continue
                
                y_min_obj = coords_objeto[0].min()
                y_max_obj = coords_objeto[0].max()
                x_min_obj = coords_objeto[1].min()
                x_max_obj = coords_objeto[1].max()
                
                # Recortar al objeto detectado por alfa
                recorte_alfa = img_rgba[y_min_obj:y_max_obj+1, x_min_obj:x_max_obj+1]
                h_obj, w_obj = recorte_alfa.shape[:2]
                
                if h_obj == 0 or w_obj == 0:
                    continue
                
                # Extraer la franja central (60% del ancho) para evitar distorsión de bordes
                margen_franja = int(w_obj * 0.20)
                franja = recorte_alfa[:, margen_franja:w_obj - margen_franja]
                h_franja, w_franja = franja.shape[:2]
                
                if w_franja < 2 or h_franja < 2:
                    continue
                
                # Corrección cilíndrica: arcsin para revertir la perspectiva
                # Genera un mapa de remapeo que "estira" los bordes comprimidos por la curvatura
                x_coords = np.arange(w_franja, dtype=np.float32)
                y_coords = np.arange(h_franja, dtype=np.float32)
                map_y, map_x = np.meshgrid(y_coords, x_coords, indexing='ij')
                
                # Normalizar x a [-1, 1], aplicar arcsin, desnormalizar
                nx = (map_x / w_franja) * 2.0 - 1.0
                nx_corregido = np.arcsin(np.clip(nx * 0.95, -1.0, 1.0)) / (np.pi / 2.0)
                map_x_corregido = ((nx_corregido + 1.0) / 2.0 * w_franja).astype(np.float32)
                map_y_corregido = map_y.astype(np.float32)
                
                franja_corregida = cv2.remap(franja, map_x_corregido, map_y_corregido, cv2.INTER_LINEAR, 
                                             borderMode=cv2.BORDER_REFLECT_101)
                
                tiras_corregidas.append(franja_corregida)
            
            if tiras_corregidas:
                # Normalizar todas las tiras a la misma altura
                altura_objetivo = max(t.shape[0] for t in tiras_corregidas)
                tiras_normalizadas = []
                
                for tira in tiras_corregidas:
                    if tira.shape[0] != altura_objetivo:
                        nuevo_ancho = int(tira.shape[1] * (altura_objetivo / tira.shape[0]))
                        tira = cv2.resize(tira, (nuevo_ancho, altura_objetivo), interpolation=cv2.INTER_LANCZOS4)
                    tiras_normalizadas.append(tira)
                
                # Unir horizontalmente todas las tiras
                textura_plana = np.hstack(tiras_normalizadas)
                
                # Guardar como PNG con transparencia
                imagen_plana = Image.fromarray(textura_plana)
                imagen_plana.save(ruta_plano, "PNG")
                print(f"🗺️  Textura plana generada: {ruta_plano}")
            else:
                print("⚠️  No se pudieron generar tiras para la textura plana.")
                ruta_plano = None
                
        except Exception as e:
            print(f"❌ Error generando textura plana: {e}")
            ruta_plano = None
    else:
        print("⚠️  Insuficientes vistas procesadas para generar textura plana.")
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
            "conteo_cavidades_concavidades_profundas": 0,
            "dimensiones_caja_borde_cm": {
                "ancho": round(ancho_cm, 2),
                "alto": round(alto_cm, 2),
                "espesor_profundidad_estimada": round(radio_menor * 2, 2)
            }
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
                "efectividad_biologica_relativa_EBR": 1.0,
                "reduccion_logaritmica_carga_bacteriana": resultados_fisica["reduccion_logaritmica_bacteriana"]
            }
        },
        "datos_renderizado_malla_grafica": {
            "info_renderizado": "Datos listos para Three.js",
            "escala_molde_3d": {
                "x": esfericidad,
                "y": 1.0,
                "z": esfericidad
            },
            "ruta_imagen_plana_textura": ruta_plano if ruta_plano else "No disponible",
            "ruta_imagen_agrupada": ruta_agrupada if ruta_agrupada else "No disponible"
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