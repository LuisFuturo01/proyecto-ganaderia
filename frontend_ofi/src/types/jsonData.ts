/**
 * RADIOGUARD - Tipos TypeScript del Contrato de Datos (API)
 * Basado en: diccionario-json.txt y ejemplo-json-data.json
 * 
 * Estructura del JSON unificado que envía el backend de Python
 * para alimentar la interfaz de dosimetría predictiva.
 */

// ─────────────────────────────────────────────────────
// 1. Clasificación del Alimento
// ─────────────────────────────────────────────────────

/** Identificación básica del vegetal detectado por YOLOv8-seg */
export interface ClasificacionAlimento {
  /** Etiqueta del alimento identificado por el modelo IA */
  tipo_item_detectado: 'papa' | 'manzana' | 'tomate' | 'cebolla' | 'planta';
  /** Grado de certeza del modelo (0.00 - 1.00, multiplicar por 100 en frontend) */
  puntaje_confianza_modelo: number;
}

// ─────────────────────────────────────────────────────
// 2. Análisis de Color y Superficie
// ─────────────────────────────────────────────────────

/** Datos de colorimetría y defectos superficiales analizados en 2D */
export interface AnalisisColorSuperficie {
  /** Color promedio HSV de la epidermis [H:0-179, S:0-255, V:0-255] */
  espacio_color_hsv_promedio: [number, number, number];
  /** Proporción de piel con anomalías (0.00 - 100.00 %) */
  porcentaje_superficie_piel_danada: number;
  /** Cantidad de puntos/islas de daño independientes */
  conteo_manchas_aisladas: number;
}

// ─────────────────────────────────────────────────────
// 3. Geometría Espacial 3D
// ─────────────────────────────────────────────────────

/** Dimensiones de la caja delimitadora del objeto */
export interface DimensionesCajaBorde {
  ancho: number;
  alto: number;
  espesor_profundidad_estimada: number;
}

/** Métricas físicas reales extraídas de la reconstrucción tridimensional */
export interface GeometriaEspacial3D {
  /** Volumen físico real del alimento (cm³) */
  volumen_calculado_cm3: number;
  /** Área total exterior del objeto digitalizado (cm²) */
  area_superficie_calculada_cm2: number;
  /** Esfericidad: 1.0 = esfera perfecta, <0.7 = irregular (adimensional) */
  indice_forma_esfericidad: number;
  /** Conteo de depresiones o huecos abruptos en la malla 3D (opcional, mock only) */
  conteo_cavidades_concavidades_profundas?: number;
  /** Dimensiones de la caja delimitadora en cm (enviado por backend real) */
  dimensiones_caja_borde_cm?: DimensionesCajaBorde;
  /** Ruta de la imagen plana de textura generada por el backend */
  ruta_imagen_plana_textura?: string;
  /** Ruta de la imagen agrupada de vistas 360 */
  ruta_imagen_agrupada?: string;
}

// ─────────────────────────────────────────────────────
// 4. Indicadores de Dosimetría Físico-Biológica
// ─────────────────────────────────────────────────────

/** Métricas nucleares rigurosas para validación científica */
export interface IndicadoresDosimetriaFisicoBiologica {
  /** Energía absoluta absorbida por la masa total (1.0 - 500.0 J) */
  energia_depositada_total_Joules: number;
  /** Coeficiente macroscópico μ de interacción (0.15 - 0.25 cm⁻¹) */
  coeficiente_atenuacion_lineal_mu: number;
  /** Razón Dmax/Dmin, uniformidad del haz (1.00 - 2.00, ideal = 1.00) */
  uniformidad_dosis_ratio_Dmax_Dmin: number;
  /** Densidad aparente del blanco (0.80 - 1.20 g/cm³) */
  densidad_masa_estimada_g_cm3: number;
  /** Factor de ponderación de la radiación (1.0 fijo para gamma/X/electrones) */
  efectividad_biologica_relativa_EBR?: number;
  /** Decaimiento microbiológico predictivo log10 (1.0 - 6.0) */
  reduccion_logaritmica_carga_bacteriana: number;
}

// ─────────────────────────────────────────────────────
// 4. Simulación de Dosimetría de Radiación
// ─────────────────────────────────────────────────────

/** Parámetros lógicos calculados para la dosificación y simulación física */
export interface SimulacionDosimetriaRadiacion {
  /** Dosis de radiación recomendada en superficie (0.01 - 10.00 kGy) */
  dosis_superficie_objetivo_kGy: number;
  /** Razón agronómica por la cual se determinó aplicar la dosis */
  proposito_fitosanitario_asignado: string;
  /** Perfil 1D de atenuación: cómo decae la radiación hacia el núcleo (kGy por capa) */
  perfil_atenuacion_profundidad_lineal_kGy: number[];
  /** Métricas nucleares del panel comparativo */
  indicadores_dosimetria_fisico_biologica: IndicadoresDosimetriaFisicoBiologica;
}

// ─────────────────────────────────────────────────────
// 5. Datos de Renderizado de Malla Gráfica (Three.js / WebGL)
// ─────────────────────────────────────────────────────

/** Vectores nativos para el motor gráfico 3D */
export interface DatosRenderizadoMallaGrafica {
  /** Coordenadas de vértices [x1,y1,z1, x2,y2,z2, ...] en mm */
  arreglo_posicion_vertices: number[];
  /** Vectores normales unitarios [nx1,ny1,nz1, ...] rango -1.0 a 1.0 */
  arreglo_direccion_normales_vertices: number[];
  /** Índices de triángulos [i1,i2,i3, ...] para BufferGeometry */
  arreglo_indices_caras_poligonos: number[];
  /** Coordenadas UV de textura [u1,v1, u2,v2, ...] rango 0.0 a 1.0 */
  arreglo_coordenadas_uv_textura: number[];
  /** URL del archivo de textura plano para envolver el modelo 3D */
  url_textura_superficie_desenrollada: string;
}

// ─────────────────────────────────────────────────────
// 6. Predicción de Vida Útil Post Irradiación
// ─────────────────────────────────────────────────────

export interface PrediccionVidaUtilPostIrradiacion {
  dias_vida_util_restante: number;
  dias_ganados_por_irradiacion: number;
  estado_proyeccion: string;
}

// ─────────────────────────────────────────────────────
// 7. Simulación de Impacto Financiero y Operativo
// ─────────────────────────────────────────────────────

export interface SimulacionImpactoFinancieroOperativo {
  dosis_estandar_industria_kGy: number;
  tiempo_procesamiento_ahorrado_segundos: number;
  ahorro_directo_por_unidad_usd: number;
  ahorro_proyectado_por_tonelada_usd: number;
  porcentaje_optimizacion_throughput: number;
}

/** JSON unificado completo que envía el backend */
export interface SimulationData {
  clasificacion_alimento: ClasificacionAlimento;
  analisis_color_superficie: AnalisisColorSuperficie;
  geometria_espacial_3d: GeometriaEspacial3D;
  simulacion_dosimetria_radiacion: SimulacionDosimetriaRadiacion;
  datos_renderizado_malla_grafica?: DatosRenderizadoMallaGrafica;
  prediccion_vida_util_post_irradiacion?: PrediccionVidaUtilPostIrradiacion;
  simulacion_impacto_financiero_operativo?: SimulacionImpactoFinancieroOperativo;
}

// ─────────────────────────────────────────────────────
// Tipos de Estado del Frontend
// ─────────────────────────────────────────────────────

/** Fases del flujo de simulación (flujo-frontend.txt) */
export type SimulationPhase =
  | 'idle'
  | 'reception'
  | 'scanning'
  | 'irradiation'
  | 'output'
  | 'comparative';

/** Pasos del modal de procesamiento */
export type ProcessingStep =
  | 'Recepción'
  | 'Escaneo'
  | 'Procesando'
  | 'Irradiación'
  | 'Resultados';

/** Vista activa del dashboard */
export type ActiveView =
  | 'dashboard'
  | 'analysis3d'
  | 'dosimetry'
  | 'comparative'
  | 'reports'
  | 'history';
