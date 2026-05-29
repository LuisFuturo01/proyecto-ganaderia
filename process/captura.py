import cv2
import time

def esperar_y_capturar_objeto(cap, intervalo_segundos=1.0, num_fotos=4):
    """
    Mantiene la transmisión RTSP activa en tiempo real y gestiona una ráfaga manual.
    Cada pulsación de la tecla 'C' captura una vista. El punto central y recuadro cambian de 
    color según el progreso: Rojo (0 fotos), Amarillo (1-3 fotos), Verde (4 fotos/cooldown).
    """
    alto_ventana = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    ancho_ventana = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    
    if alto_ventana == 0 or ancho_ventana == 0:
        alto_ventana, ancho_ventana = 480, 640
        
    cx, cy = ancho_ventana // 2, alto_ventana // 2
    radio_roi = 60 

    imagenes_capturadas = []
    fotos_tomadas = 0
    tiempo_inicio_cooldown = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error de lectura en el stream RTSP. Verificando conexión...")
            return None

        vista = frame.copy()

        # 🟢 LÓGICA DE ESTADOS CROMÁTICOS POR CONTEO DE CAPTURAS
        if fotos_tomadas == 0:
            color_interfaz = (0, 0, 255) # Rojo (BGR)
            texto_guia = "PRESIONE 'C' PARA CAPTURAR VISTA 1/4 (PUNTO ROJO)"
            
        elif 0 < fotos_tomadas < num_fotos:
            color_interfaz = (0, 165, 255) # Amarillo/Naranja (BGR)
            texto_guia = f"GIRE EL OBJETO Y PRESIONE 'C' ({fotos_tomadas}/{num_fotos} AMARILLO)"
            
        else:
            # Inicializar el tiempo de cooldown solo una vez cuando se alcancen las 4 fotos
            if tiempo_inicio_cooldown == 0:
                tiempo_inicio_cooldown = time.time()
                print("\n[INFO] 4 vistas completadas de forma manual. Procesando aislamiento de máscara...")
                
            color_interfaz = (0, 255, 0) # Verde (BGR)
            tiempo_transcurrido = time.time() - tiempo_inicio_cooldown
            tiempo_restante = max(0.0, 4.0 - tiempo_transcurrido)
            texto_guia = f"PROCESANDO... REINICIO EN: {round(tiempo_restante, 1)}s (PUNTO VERDE)"
            
            if tiempo_transcurrido >= 4.0:
                break # Rompe el ciclo para entregar las imágenes capturadas

        # Renderizado de la interfaz de guía en pantalla
        cv2.rectangle(vista, (cx-radio_roi, cy-radio_roi), (cx+radio_roi, cy+radio_roi), color_interfaz, 2)
        cv2.circle(vista, (cx, cy), 6, color_interfaz, -1)
        cv2.putText(vista, texto_guia, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_interfaz, 2)

        # Telemetría de control inferior
        texto_telemetria = f"Modo: Manual por Teclado | Fotos en RAM: {fotos_tomadas}/{num_fotos}"
        cv2.putText(vista, texto_telemetria, (15, alto_ventana - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        cv2.imshow("Scanner Logistico 360", vista)
        key = cv2.waitKey(1) & 0xFF
        
        # Disparador síncrono controlado: requiere una pulsación física por cada foto
        if key == ord('c') and fotos_tomadas < num_fotos:
            imagenes_capturadas.append(frame.copy())
            fotos_tomadas += 1
            print(f"📸 [PULSACIÓN 'C'] Vista {fotos_tomadas}/{num_fotos} capturada de forma manual.")
            if fotos_tomadas == 1:
                try:
                    import requests
                    requests.post("http://localhost:8000/api/update", json={"status": "scanning"})
                    print("[INFO] Evento trigger 'scanning' enviado al frontend con éxito!")
                except Exception as e:
                    print(f"[WARNING] No se pudo notificar el inicio de escaneo: {e}")
            
        elif key == ord('q'):
            return None

    return imagenes_capturadas