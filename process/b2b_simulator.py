def calcular_impacto_financiero(producto, dosis_dinamica_kGy, masa_kg):
    """
    Simula el ahorro operativo de una planta de irradiación al usar 
    el modelo SciML frente al estándar industrial ciego.
    """
    # Parámetros operativos de una planta (Ej. simulando Planta El Alto)
    # USD por segundo de operación de la cinta transportadora y sistemas auxiliares
    COSTO_OPERATIVO_SEGUNDO_USD = 0.015 
    TIEMPO_RESIDENCIA_POR_KGY = 120  # Segundos necesarios para absorber 1 kGy
    
    # Dosis estándar máxima que la industria usa "a ciegas" para asegurar inocuidad
    DOSIS_ESTANDAR_CIEGA = {
        "papa": 2.50,    
        "manzana": 3.00  
    }
    
    producto = producto.lower()
    dosis_estandar = DOSIS_ESTANDAR_CIEGA.get(producto, 2.50)
    
    # 1. Simulación del proceso tradicional (Ciego)
    tiempo_estandar_segundos = dosis_estandar * TIEMPO_RESIDENCIA_POR_KGY
    costo_estandar_usd = tiempo_estandar_segundos * COSTO_OPERATIVO_SEGUNDO_USD
    
    # 2. Simulación del proceso optimizado (Nuestro Software)
    tiempo_dinamico_segundos = dosis_dinamica_kGy * TIEMPO_RESIDENCIA_POR_KGY
    costo_dinamico_usd = tiempo_dinamico_segundos * COSTO_OPERATIVO_SEGUNDO_USD
    
    # 3. Métricas de Impacto
    tiempo_ahorrado_seg = tiempo_estandar_segundos - tiempo_dinamico_segundos
    dinero_ahorrado_usd = costo_estandar_usd - costo_dinamico_usd
    porcentaje_optimizacion = (dinero_ahorrado_usd / costo_estandar_usd) * 100 if costo_estandar_usd > 0 else 0
    
    # Extrapolación industrial: ¿Cuánto ahorrarían si procesan 1 tonelada (1000 kg)?
    factor_escala_tonelada = 1000.0 / masa_kg if masa_kg > 0 else 0
    ahorro_por_tonelada_usd = dinero_ahorrado_usd * factor_escala_tonelada
    
    return {
        "dosis_estandar_industria_kGy": dosis_estandar,
        "tiempo_procesamiento_ahorrado_segundos": round(tiempo_ahorrado_seg, 1),
        "ahorro_directo_por_unidad_usd": round(dinero_ahorrado_usd, 4),
        "ahorro_proyectado_por_tonelada_usd": round(ahorro_por_tonelada_usd, 2),
        "porcentaje_optimizacion_throughput": round(porcentaje_optimizacion, 1)
    }
