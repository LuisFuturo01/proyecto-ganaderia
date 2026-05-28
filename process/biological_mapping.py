import math

def calcular_dosis_biologica_continua(producto, porcentaje_dano):
    """
    Transforma el % de daño superficial en una dosis kGy continua 
    usando una función de saturación logística (Sigmoide).
    """
    # Constantes maestras validadas con el ingeniero de la planta
    LIMITES = {
        "papa": {"d_min": 0.12, "d_max": 2.50, "k": 0.15, "p_50": 20.0},
        "manzana": {"d_min": 0.20, "d_max": 3.00, "k": 0.12, "p_50": 25.0}
    }
    
    producto = producto.lower()
    if producto not in LIMITES:
        raise ValueError(f"Producto no soportado: {producto}")
        
    if porcentaje_dano < 0:
        porcentaje_dano = 0.0
        
    d_min = LIMITES[producto]["d_min"]
    d_max = LIMITES[producto]["d_max"]
    k = LIMITES[producto]["k"]
    p_50 = LIMITES[producto]["p_50"]
    
    exponente = -k * (porcentaje_dano - p_50)
    dosis_calculada = d_min + (d_max - d_min) / (1.0 + math.exp(exponente))
    return round(dosis_calculada, 3)

if __name__ == "__main__":
    dano_ia_1 = 4.15   # Papa casi sana
    dano_ia_2 = 14.90  # Papa con daño medio
    dano_ia_3 = 15.10  # Papa con un poquito más de daño
    
    print(f"Daño {dano_ia_1}% -> Dosis: {calcular_dosis_biologica_continua('papa', dano_ia_1)} kGy")
    print(f"Daño {dano_ia_2}% -> Dosis: {calcular_dosis_biologica_continua('papa', dano_ia_2)} kGy")
    print(f"Daño {dano_ia_3}% -> Dosis: {calcular_dosis_biologica_continua('papa', dano_ia_3)} kGy")
