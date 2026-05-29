/**
 * RADIOGUARD - Store Global (Zustand)
 * 
 * Gestiona todo el estado de la simulación:
 * - Datos JSON del backend
 * - Fase actual del flujo (reception → output)
 * - Vista activa del menú lateral
 * - Estado del modal de procesamiento
 * - Indicadores de carga y progreso
 * - targetPhase para animación de deslizamiento por la cinta
 */

import { create } from 'zustand';
import type {
  SimulationData,
  SimulationPhase,
  ActiveView,
  ProcessingStep,
} from '../types/jsonData';

// ─────────────────────────────────────────────────────
// Estaciones de la cinta transportadora con posiciones X
// ─────────────────────────────────────────────────────

export interface BeltStation {
  id: SimulationPhase;
  x: number;
}

export const BELT_STATIONS: BeltStation[] = [
  { id: 'reception',   x: -4.5 },
  { id: 'scanning',    x: -1.5 },
  { id: 'irradiation', x:  1.5 },
  { id: 'output',      x:  4.5 },
];

// ─────────────────────────────────────────────────────
// Interfaz del Store
// ─────────────────────────────────────────────────────

interface SimulationStore {
  // Datos de la simulación
  simulationData: SimulationData | null;
  hasData: boolean;

  // Fase actual (donde el objeto ESTÁ ahora en la cinta)
  phase: SimulationPhase;

  // Fase destino (a donde el objeto se DIRIGE — para animación de deslizamiento)
  targetPhase: SimulationPhase;

  // Flag de si el objeto está en movimiento
  isMoving: boolean;

  // Vista activa del sidebar
  activeView: ActiveView;

  // Estado de carga
  isLoading: boolean;
  progress: number; // 0-100

  // Modal de procesamiento
  isProcessingModalOpen: boolean;
  processingStep: ProcessingStep;
  processingProgress: number;

  // Datos asíncronos y estado de simulación activa
  pendingSimulationData: SimulationData | null;
  isSimulating: boolean;

  // FPS counter
  fps: number;

  // Idioma activo
  language: 'es' | 'en';

  // ── Acciones ──────────────────────────────────────

  /** Cargar datos de simulación completos */
  setSimulationData: (data: SimulationData) => void;

  /** Limpiar datos */
  clearSimulationData: () => void;

  /** Cambiar fase actual (llamado internamente durante el deslizamiento) */
  setPhase: (phase: SimulationPhase) => void;

  /** Navegar a una fase destino (el objeto se desliza hasta allá) */
  navigateToPhase: (phase: SimulationPhase) => void;

  /** Marcar si el objeto está en movimiento */
  setIsMoving: (moving: boolean) => void;

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

  /** Iniciar simulación de progreso */
  startProgressSimulation: () => void;

  /** Recibir datos de simulación finales */
  receiveSimulationData: (data: SimulationData) => void;

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
  targetPhase: 'idle',
  isMoving: false,
  activeView: 'dashboard',
  isLoading: false,
  progress: 0,
  isProcessingModalOpen: false,
  processingStep: 'Recepción',
  processingProgress: 0,
  pendingSimulationData: null,
  isSimulating: false,
  fps: 60,
  language: 'es',

  // ── Acciones ──────────────────────────────────────

  setSimulationData: (data) =>
    set({ simulationData: data, hasData: true }),

  clearSimulationData: () =>
    set({ simulationData: INITIAL_EMPTY_DATA, hasData: true, phase: 'idle', targetPhase: 'idle' }),

  setPhase: (phase) => set({ phase }),

  navigateToPhase: (targetPhase) => {
    set({ targetPhase, isMoving: true });
  },

  setIsMoving: (isMoving) => set({ isMoving }),

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

  startProgressSimulation: () => {
    const store = get();
    // Reiniciar estados de simulación asíncrona
    set({
      isSimulating: true,
      pendingSimulationData: null,
    });

    store.openProcessingModal();
    store.setPhase('reception');
    set({ targetPhase: 'reception', isMoving: false });

    let currentStepIndex = 0;
    let currentProgress = 0;

    const advanceProgress = () => {
      // Si el modal se cerró o ya no estamos simulando, salir
      if (!get().isProcessingModalOpen || !get().isSimulating) return;

      if (currentStepIndex >= PROCESSING_STEPS.length) {
        const finalData = get().pendingSimulationData;
        if (finalData) {
          store.setSimulationData(finalData);
          store.navigateToPhase('output');
          set({ isSimulating: false });
          setTimeout(() => {
            store.closeProcessingModal();
          }, 800);
        }
        return;
      }

      const { step, targetProgress } = PROCESSING_STEPS[currentStepIndex];

      // Si llegamos al último paso o el progreso es >= 95% y no hay datos, pausamos en 95%
      if (currentProgress >= 95 && !get().pendingSimulationData) {
        store.setProcessingStep('Resultados');
        store.setProcessingProgress(95);
        return;
      }

      store.setProcessingStep(step);

      // Sincronizar la fase física 3D con el progreso
      if (step === 'Recepción') {
        store.navigateToPhase('reception');
      } else if (step === 'Escaneo' || step === 'Procesando') {
        store.navigateToPhase('scanning');
      } else if (step === 'Irradiación') {
        store.navigateToPhase('irradiation');
      } else if (step === 'Resultados') {
        store.navigateToPhase('output');
      }

      // Incrementar progreso gradualmente (2.6 segundos para llegar a 95%)
      const incrementInterval = setInterval(() => {
        if (!get().isProcessingModalOpen || !get().isSimulating) {
          clearInterval(incrementInterval);
          return;
        }

        // Si ya alcanzamos 95% y no hay datos, pausar
        if (currentProgress >= 95 && !get().pendingSimulationData) {
          clearInterval(incrementInterval);
          store.setProcessingProgress(95);
          store.setProcessingStep('Resultados');
          return;
        }

        currentProgress += 1;
        
        // El target máximo actual se limita a 95% si no hay datos
        const limitProgress = get().pendingSimulationData ? targetProgress : Math.min(targetProgress, 95);
        store.setProcessingProgress(Math.min(currentProgress, limitProgress));

        if (currentProgress >= limitProgress) {
          clearInterval(incrementInterval);
          currentStepIndex++;
          // Delay de transición rápido entre fases: 150ms
          setTimeout(advanceProgress, 150);
        }
      }, 20);
    };

    // Iniciar después de un breve delay inicial
    setTimeout(advanceProgress, 100);
  },

  receiveSimulationData: (data) => {
    const store = get();
    set({ pendingSimulationData: data });

    // Si el modal está abierto y ya estamos en el hold del progreso final (>= 95)
    if (store.isProcessingModalOpen && store.processingProgress >= 95) {
      let currentProgress = store.processingProgress;
      
      const finalInterval = setInterval(() => {
        if (!get().isProcessingModalOpen) {
          clearInterval(finalInterval);
          return;
        }

        currentProgress += 1;
        store.setProcessingProgress(Math.min(currentProgress, 100));

        if (currentProgress >= 100) {
          clearInterval(finalInterval);
          
          store.setSimulationData(data);
          store.navigateToPhase('output');
          set({ isSimulating: false });

          setTimeout(() => {
            store.closeProcessingModal();
          }, 800);
        }
      }, 30); // 150ms para saltar de 95 a 100
    } else if (!store.isProcessingModalOpen) {
      // Inyectar directamente si el modal se cerró antes
      store.setSimulationData(data);
      store.navigateToPhase('output');
      set({ isSimulating: false });
    }
  },

  startProcessingSimulation: (data) => {
    get().startProgressSimulation();
    get().receiveSimulationData(data);
  },
}));
