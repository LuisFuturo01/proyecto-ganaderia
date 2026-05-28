/**
 * RADIOGUARD - Hook de API
 * 
 * Gestiona la comunicación con el backend de Python.
 * Permite subir de 1 a 4 imágenes del vegetal para el análisis 360°.
 * En caso de fallo o modo offline, hace un fallback seguro a los datos mock.
 */

import { useCallback, useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { MOCK_SIMULATION_DATA } from '../lib/mockData';
import type { SimulationData } from '../types/jsonData';

// URL base del backend (soporta VITE_API_URL y VITE_API_BASE_URL, fallback a localhost:8000)
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '';

interface UseApiReturn {
  /** Sube una lista de imágenes (1 a 4) y obtiene los datos de simulación */
  uploadImagesAndGetSimulation: (files: File[]) => Promise<void>;
  /** Carga datos mock directamente (para demo) */
  loadMockData: () => void;
  /** Estado de error */
  error: string | null;
  /** Limpia el error */
  clearError: () => void;
}

export function useApi(): UseApiReturn {
  const [error, setError] = useState<string | null>(null);
  const { startProcessingSimulation } = useSimulationStore();

  /**
   * Sube múltiples imágenes al backend (predict-360) y obtiene los datos de simulación.
   */
  const uploadImagesAndGetSimulation = useCallback(
    async (files: File[]) => {
      setError(null);

      if (files.length === 0) {
        setError('No se seleccionaron archivos');
        return;
      }

      try {
        let data: SimulationData;

        // Si no hay archivos o estamos en desarrollo forzado sin backend (probando offline)
        // Pero primero intentaremos hacer fetch.
        const formData = new FormData();
        files.forEach((file, index) => {
          // El backend espera file1, file2, file3, file4
          formData.append(`file${index + 1}`, file);
        });

        // Hacemos el request con un timeout usando AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos

        try {
          const response = await fetch(`${API_BASE_URL}/predict-360`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
          }

          data = await response.json();

          if (data && typeof data === 'object' && 'error' in data) {
            throw new Error(String((data as Record<string, unknown>).error));
          }
        } catch (fetchErr) {
          console.warn('[RADIOGUARD API] Fallo conexión o procesamiento real, usando fallback mock:', fetchErr);
          // Si falla, levantamos el error para que la UI se entere,
          // pero cargamos mock data de todas formas para la demo fluida.
          setError(`Fallo conexión con backend. Usando simulación simulada.`);
          data = { ...MOCK_SIMULATION_DATA };
        }

        // Iniciar simulación de procesamiento con los datos
        startProcessingSimulation(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        console.error('[RADIOGUARD API]', message);
      }
    },
    [startProcessingSimulation]
  );

  /**
   * Carga datos mock directamente sin archivo.
   */
  const loadMockData = useCallback(() => {
    setError(null);
    startProcessingSimulation({ ...MOCK_SIMULATION_DATA });
  }, [startProcessingSimulation]);

  const clearError = useCallback(() => setError(null), []);

  return {
    uploadImagesAndGetSimulation,
    loadMockData,
    error,
    clearError,
  };
}
