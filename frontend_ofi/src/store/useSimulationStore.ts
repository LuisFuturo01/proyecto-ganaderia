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

import { MOCK_SIMULATION_DATA } from '../lib/mockData';

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Estado inicial con datos mock por defecto para mostrar el dashboard completo de inmediato
  simulationData: MOCK_SIMULATION_DATA,
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
    set({ simulationData: null, hasData: false, phase: 'idle' }),

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
