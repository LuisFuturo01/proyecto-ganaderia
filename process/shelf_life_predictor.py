import math

def calcular_vida_util(producto, porcentaje_dano, dosis_aplicada_kGy):
    """
    Calcula la fecha de caducidad proyectada (en días) utilizando
    modelos de cinética de degradación de primer orden.
    """
    # Constantes cinéticas empíricas
    # dias_base: Vida útil natural sin irradiar y sin daño
    # ganancia_por_kGy: Días extra ganados por cada kGy absorbido
    # penalizacion_dano: Factor de aceleración de pudrición por daño físico
    CINETICA = {
        "papa": {"dias_base": 45, "ganancia_por_kGy": 25, "penalizacion_dano": 0.8},
        "manzana": {"dias_base": 30, "ganancia_por_kGy": 15, "penalizacion_dano": 0.6}
    }

    producto = producto.lower()
    if producto not in CINETICA:
        return {"dias_vida_util_restante": 0, "estado_proyeccion": "Desconocido"}

    params = CINETICA[producto]
    
    # 1. Calculamos la extensión por irradiación
    # Usamos una curva logarítmica porque más dosis no significa vida infinita (se satura)
    dias_ganados = params["ganancia_por_kGy"] * math.log1p(dosis_aplicada_kGy)
    
    # 2. Calculamos la pérdida por el daño que ya traía el producto de la cosecha
    dias_perdidos = params["penalizacion_dano"] * porcentaje_dano
    
    # 3. Vida útil final proyectada
    dias_totales = params["dias_base"] + dias_ganados - dias_perdidos
    dias_totales = max(1.0, round(dias_totales, 1)) # Nunca puede ser menor a 1 día
    
    estado = "Óptimo para exportación" if dias_totales > 40 else "Consumo local a corto plazo"

    return {
        "dias_vida_util_restante": dias_totales,
        "dias_ganados_por_irradiacion": round(dias_ganados, 1),
        "estado_proyeccion": estado
    }
