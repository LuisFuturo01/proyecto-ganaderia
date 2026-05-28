/**
 * RADIOGUARD - Datos Mock Enriquecidos
 * 
 * Valores que coinciden con las imágenes de referencia del Figma
 * para que el dashboard luzca realista durante el desarrollo.
 */

import type { SimulationData } from '../types/jsonData';

export const MOCK_SIMULATION_DATA: SimulationData = {
  clasificacion_alimento: {
    tipo_item_detectado: 'papa',
    puntaje_confianza_modelo: 0.987,
  },

  analisis_color_superficie: {
    espacio_color_hsv_promedio: [22, 110, 145],
    porcentaje_superficie_piel_danada: 8.4,
    conteo_manchas_aisladas: 12,
  },

  geometria_espacial_3d: {
    volumen_calculado_cm3: 312.45,
    area_superficie_calculada_cm2: 285.7,
    indice_forma_esfericidad: 0.81,
    conteo_cavidades_concavidades_profundas: 2,
  },

  simulacion_dosimetria_radiacion: {
    dosis_superficie_objetivo_kGy: 0.12,
    proposito_fitosanitario_asignado: 'Inhibicion de germinacion',
    perfil_atenuacion_profundidad_lineal_kGy: [
      0.12, 0.11, 0.09, 0.07, 0.06, 0.04, 0.02, 0.0,
    ],

    indicadores_dosimetria_fisico_biologica: {
      energia_depositada_total_Joules: 12.45,
      coeficiente_atenuacion_lineal_mu: 0.58,
      uniformidad_dosis_ratio_Dmax_Dmin: 6.0,
      densidad_masa_estimada_g_cm3: 1.04,
      efectividad_biologica_relativa_EBR: 1.0,
      reduccion_logaritmica_carga_bacteriana: 4.2,
    },
  },

  datos_renderizado_malla_grafica: {
    arreglo_posicion_vertices: [
      0.0, 1.2, -0.5, 0.3, 1.1, -0.4, -0.2, 0.9, -0.3,
      0.5, 0.8, -0.1, -0.4, 1.0, 0.2, 0.1, 0.7, 0.4,
    ],
    arreglo_direccion_normales_vertices: [
      0.0, 1.0, 0.0, 0.1, 0.9, 0.1, -0.1, 0.95, -0.05,
      0.2, 0.85, 0.0, -0.15, 0.92, 0.1, 0.05, 0.88, 0.15,
    ],
    arreglo_indices_caras_poligonos: [0, 1, 2, 1, 3, 4, 2, 4, 5, 0, 2, 5],
    arreglo_coordenadas_uv_textura: [
      0.0, 0.0, 0.5, 1.0, 0.25, 0.5,
      0.75, 0.8, 0.1, 0.3, 0.6, 0.6,
    ],
    url_textura_superficie_desenrollada:
      'http://localhost:8000/static/texturas/cache_actual.jpg',
  },
};

/**
 * Datos para el gráfico de Perfil de Atenuación.
 * Genera puntos equidistantes a lo largo de la profundidad.
 */
export function generateAttenuationChartData(
  profile: number[]
): { profundidad: number; dosis: number }[] {
  const maxDepth = 3.0; // cm
  return profile.map((dosis, i) => ({
    profundidad: Number(((i * maxDepth) / (profile.length - 1)).toFixed(1)),
    dosis,
  }));
}

/**
 * Datos para el gráfico de Distribución de Dosis (donut).
 */
export function generateDoseDistribution(profile: number[]) {
  const max = Math.max(...profile);
  let alta = 0, media = 0, baja = 0;

  profile.forEach((d) => {
    if (d >= max * 0.66) alta++;
    else if (d >= max * 0.33) media++;
    else baja++;
  });

  const total = profile.length;
  return [
    { name: `Alta (${(max * 0.66).toFixed(2)} - ${max.toFixed(2)} kGy)`, value: Math.round((alta / total) * 100), fill: '#ff4444' },
    { name: `Media (${(max * 0.33).toFixed(2)} - ${(max * 0.66).toFixed(2)} kGy)`, value: Math.round((media / total) * 100), fill: '#ffcc00' },
    { name: `Baja (0 - ${(max * 0.33).toFixed(2)} kGy)`, value: Math.round((baja / total) * 100), fill: '#0066ff' },
  ];
}
