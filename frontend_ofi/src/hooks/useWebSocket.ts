import { useEffect, useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import type { SimulationData } from '../types/jsonData';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const { startProcessingSimulation } = useSimulationStore();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: number;

    function connect() {
      // Use standard WebSocket protocol matched with the browser protocol (relative path under Vite proxy)
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      const wsUrl = `${protocol}${window.location.host}/ws`;

      console.log(`[RADIOGUARD WS] Conectando a ${wsUrl}...`);
      
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setConnected(true);
          console.log('[RADIOGUARD WS] Conectado en tiempo real al backend!');
        };

        ws.onmessage = (event) => {
          try {
            console.log('[RADIOGUARD WS] Datos recibidos de la camara local!');
            const data: SimulationData = JSON.parse(event.data);
            
            if (data && typeof data === 'object') {
              // Trigger the premium analytical simulation flow in the store
              startProcessingSimulation(data);
            }
          } catch (err) {
            console.error('[RADIOGUARD WS] Error al procesar datos del socket:', err);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          console.log('[RADIOGUARD WS] Desconectado del backend, reintentando en 3 segundos...');
          reconnectTimeout = window.setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.error('[RADIOGUARD WS] Error en el socket:', err);
        };
      } catch (e) {
        console.error('[RADIOGUARD WS] Fallo conexion socket:', e);
        reconnectTimeout = window.setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [startProcessingSimulation]);

  return { connected };
}
