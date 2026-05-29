/**
 * RADIOGUARD - Store Global (Zustand)
 * 
 * Gestiona todo el estado de la simulación:
 * - Datos JSON del backend
 * - Fase actual del flujo (reception → comparative)
 * - Vista activa del menú lateral
 * - Estado del modal de procesamiento
 * - Indicadores de carga y progreso
 */

import { create } from 'zustand';
import type {
  SimulationData,
  SimulationPhase,
  ActiveView,
  ProcessingStep,
} from '../types/jsonData';

// ─────────────────────────────────────────────────────
// Interfaz del Store
// ─────────────────────────────────────────────────────

interface SimulationStore {
  // Datos de la simulación
  simulationData: SimulationData | null;
  hasData: boolean;

  // Fase del flujo de simulación
  phase: SimulationPhase;

  // Vista activa del sidebar
  activeView: ActiveView;

  // Estado de carga
  isLoading: boolean;
  progress: number; // 0-100

  // Modal de procesamiento
  isProcessingModalOpen: boolean;
  processingStep: ProcessingStep;
  processingProgress: number;

  // FPS counter
  fps: number;

  // Idioma activo
  language: 'es' | 'en';

  // ── Acciones ──────────────────────────────────────

  /** Cargar datos de simulación completos */
  setSimulationData: (data: SimulationData) => void;

  /** Limpiar datos */
  clearSimulationData: () => void;

  /** Cambiar fase del flujo */
  setPhase: (phase: SimulationPhase) => void;

  /** Cambiar vista activa */
  setActiveView: (view: ActiveView) => void;

  /** Cambiar idioma */
  setLanguage: (lang: 'es' | 'en') => void;

  /** Control de carga */
  setLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;

  /** Control del modal de procesamiento */
  openProcessingModal: () => void;
  closeProcessingModal: () => void;
  setProcessingStep: (step: ProcessingStep) => void;
  setProcessingProgress: (progress: number) => void;

  /** Actualizar FPS */
  setFps: (fps: number) => void;

  /** Simular el flujo completo de procesamiento */
  startProcessingSimulation: (data: SimulationData) => void;
}

// ─────────────────────────────────────────────────────
// Pasos de procesamiento con sus porcentajes
// ─────────────────────────────────────────────────────

const PROCESSING_STEPS: { step: ProcessingStep; targetProgress: number }[] = [
  { step: 'Recepción', targetProgress: 15 },
  { step: 'Escaneo', targetProgress: 35 },
  { step: 'Procesando', targetProgress: 65 },
  { step: 'Irradiación', targetProgress: 85 },
  { step: 'Resultados', targetProgress: 100 },
];

// ─────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────

export const INITIAL_EMPTY_DATA: SimulationData = {
  clasificacion_alimento: {
    tipo_item_detectado: '' as any, // Vacío para no renderizar vegetal en la cinta 3D
    puntaje_confianza_modelo: 0,
  },
  analisis_color_superficie: {
    espacio_color_hsv_promedio: [0, 0, 0],
    porcentaje_superficie_piel_danada: 0,
    conteo_manchas_aisladas: 0,
  },
  geometria_espacial_3d: {
    volumen_calculado_cm3: 0,
    area_superficie_calculada_cm2: 0,
    indice_forma_esfericidad: 0,
    dimensiones_caja_borde_cm: { ancho: 0, alto: 0, espesor_profundidad_estimada: 0 },
    ruta_imagen_plana_textura: '',
    ruta_imagen_agrupada: '',
  },
  simulacion_dosimetria_radiacion: {
    dosis_superficie_objetivo_kGy: 0,
    proposito_fitosanitario_asignado: '--',
    perfil_atenuacion_profundidad_lineal_kGy: [0, 0, 0, 0, 0],
    indicadores_dosimetria_fisico_biologica: {
      energia_depositada_total_Joules: 0,
      coeficiente_atenuacion_lineal_mu: 0,
      uniformidad_dosis_ratio_Dmax_Dmin: 0,
      densidad_masa_estimada_g_cm3: 0,
      efectividad_biologica_relativa_EBR: 1.0,
      reduccion_logaritmica_carga_bacteriana: 0,
    },
  },
  prediccion_vida_util_post_irradiacion: {
    dias_vida_util_restante: 0,
    dias_ganados_por_irradiacion: 0,
    estado_proyeccion: '--',
  },
  simulacion_impacto_financiero_operativo: {
    dosis_estandar_industria_kGy: 0,
    tiempo_procesamiento_ahorrado_segundos: 0,
    ahorro_directo_por_unidad_usd: 0,
    ahorro_proyectado_por_tonelada_usd: 0,
    porcentaje_optimizacion_throughput: 0,
  },
};

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Estado inicial con datos estructurados vacíos para mostrar el dashboard sin crasheos y sin vegetal en 3D
  simulationData: INITIAL_EMPTY_DATA,
  hasData: true,
  phase: 'idle',
  activeView: 'dashboard',
  isLoading: false,
  progress: 0,
  isProcessingModalOpen: false,
  processingStep: 'Recepción',
  processingProgress: 0,
  fps: 60,
  language: 'es',

  // ── Acciones ──────────────────────────────────────

  setSimulationData: (data) =>
    set({ simulationData: data, hasData: true }),

  clearSimulationData: () =>
    set({ simulationData: INITIAL_EMPTY_DATA, hasData: true, phase: 'idle' }),

  setPhase: (phase) => set({ phase }),

  setActiveView: (view) => set({ activeView: view }),

  setLanguage: (language) => set({ language }),

  setLoading: (isLoading) => set({ isLoading }),

  setProgress: (progress) => set({ progress }),

  openProcessingModal: () =>
    set({
      isProcessingModalOpen: true,
      processingStep: 'Recepción',
      processingProgress: 0,
    }),

  closeProcessingModal: () =>
    set({ isProcessingModalOpen: false }),

  setProcessingStep: (processingStep) => set({ processingStep }),

  setProcessingProgress: (processingProgress) => set({ processingProgress }),

  setFps: (fps) => set({ fps }),

  /**
   * Simula el flujo completo de procesamiento con animación de progreso.
   * Recorre cada paso con delays para crear efecto realista.
   */
  startProcessingSimulation: (data) => {
    const store = get();

    // Abrir modal y empezar
    store.openProcessingModal();
    store.setPhase('reception');

    let currentStepIndex = 0;
    let currentProgress = 0;

    const advanceProgress = () => {
      if (currentStepIndex >= PROCESSING_STEPS.length) {
        // Finalizado: cargar datos y cerrar modal
        store.setSimulationData(data);
        store.setPhase('comparative');

        setTimeout(() => {
          store.closeProcessingModal();
        }, 800);
        return;
      }

      const { step, targetProgress } = PROCESSING_STEPS[currentStepIndex];
      store.setProcessingStep(step);

      // Sincronizar la fase física 3D con el progreso
      if (step === 'Recepción') {
        store.setPhase('reception');
      } else if (step === 'Escaneo' || step === 'Procesando') {
        store.setPhase('scanning');
      } else if (step === 'Irradiación') {
        store.setPhase('irradiation');
      } else if (step === 'Resultados') {
        store.setPhase('output');
      }

      // Incrementar progreso gradualmente
      const incrementInterval = setInterval(() => {
        currentProgress += 1;
        store.setProcessingProgress(Math.min(currentProgress, targetProgress));

        if (currentProgress >= targetProgress) {
          clearInterval(incrementInterval);
          currentStepIndex++;
          // Delay entre pasos
          setTimeout(advanceProgress, 400);
        }
      }, 60);
    };

    // Iniciar después de un breve delay
    setTimeout(advanceProgress, 300);
  },
}));
