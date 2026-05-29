import { useState } from 'react';
import { useSimulationStore } from './store/useSimulationStore';
import { useApi } from './hooks/useApi';
import { useWebSocket } from './hooks/useWebSocket';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProcessingModal } from './components/dashboard/ProcessingModal';
import { PhaseNavigation } from './components/dashboard/PhaseNavigation';
import { ClassificationPanel } from './components/dashboard/ClassificationPanel';
import { GeometryPanel } from './components/dashboard/GeometryPanel';
import { SurfacePanel } from './components/dashboard/SurfacePanel';
import { DosimetryIndicators } from './components/dashboard/DosimetryIndicators';
import { AttenuationChart } from './components/dashboard/AttenuationChart';
import { BeforePanel } from './components/dashboard/BeforePanel';
import { AfterPanel } from './components/dashboard/AfterPanel';
import { SimulationScene } from './components/simulation/SimulationScene';
import { Card } from './components/ui/Card';
import { ShieldAlert, Info, Database, FileText } from 'lucide-react';
import { ComparativeView } from './components/comparative/ComparativeView';
import { useTranslation } from './hooks/useTranslation';

import { ImageUploader } from './components/dashboard/ImageUploader';
import { FinancialPanel } from './components/dashboard/FinancialPanel';

function App() {
  const [showUploader, setShowUploader] = useState(false);
  const { hasData, activeView, simulationData } = useSimulationStore();
  const { error } = useApi();
  const { t, tVegetableSimple } = useTranslation();
  
  // Activate real-time physical camera scanning listening
  useWebSocket();

  const renderActiveView = () => {

    switch (activeView) {
      case 'dosimetry':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttenuationChart />
            <DosimetryIndicators />
          </div>
        );
      case 'comparative':
        return <ComparativeView />;
      case 'history':
        return (
          <Card className="p-6 space-y-4 max-w-2xl mx-auto border-border-dim">
            <div className="flex items-center space-x-2 text-text-primary border-b border-border-dim pb-2">
              <Database className="h-5 w-5 text-nuclear" />
              <h3 className="font-heading font-bold uppercase text-sm">{t('hist_title')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono text-text-secondary">
                <thead>
                  <tr className="border-b border-border-dim text-left text-text-muted">
                    <th className="py-2">{t('hist_th_id')}</th>
                    <th className="py-2">{t('hist_th_date')}</th>
                    <th className="py-2">{t('hist_th_var')}</th>
                    <th className="py-2">{t('hist_th_dose')}</th>
                    <th className="py-2">{t('hist_th_status')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-dim/40 hover:text-white">
                    <td className="py-2">HNB-2026-L04</td>
                    <td className="py-2">2026-05-27</td>
                    <td className="py-2">{tVegetableSimple('papa')}</td>
                    <td className="py-2">0.12 kGy</td>
                    <td className="py-2 text-nuclear-bright">{t('hist_completed')}</td>
                  </tr>
                  <tr className="border-b border-border-dim/40 hover:text-white opacity-60">
                    <td className="py-2">HNB-2026-L03</td>
                    <td className="py-2">2026-05-26</td>
                    <td className="py-2">{tVegetableSimple('tomate')}</td>
                    <td className="py-2">0.85 kGy</td>
                    <td className="py-2 text-nuclear-bright">{t('hist_completed')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        );
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-elevated/40 border border-border-dim/40 p-4 rounded-xl backdrop-blur gap-4 animate-fade-in">
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-rad animate-pulse" />
                  MÓDULO DE ESCANEO / CARGA MANUAL
                </h4>
                <p className="text-[10px] font-mono text-text-muted">
                  Sube múltiples vistas o conecta tu dispositivo de captura para procesar el fruto en tiempo real.
                </p>
              </div>
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-dark/25 hover:bg-cyan-dark/45 border border-cyan-rad/50 hover:border-cyan-rad text-cyan-rad rounded text-xs font-mono font-bold transition-all duration-200 cursor-pointer shadow active:scale-95"
              >
                <span>{showUploader ? 'Ocultar Panel de Carga' : 'Abrir Panel de Carga'}</span>
              </button>
            </div>

            {showUploader && (
              <div className="animate-fade-in">
                <ImageUploader />
              </div>
            )}

            <PhaseNavigation />

            {/* Top row: 3D belt + Classification & Geometry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SimulationScene />
              </div>
              <div className="grid grid-rows-2 gap-6">
                <ClassificationPanel />
                <GeometryPanel />
              </div>
            </div>

            {/* Bottom row: Surface + Attenuation Chart + Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SurfacePanel />
              <AttenuationChart />
              <DosimetryIndicators />
            </div>

            {/* B2B Financial & Shelf Life Impact */}
            <FinancialPanel />

            {/* Registro de Vistas Consolidadas (imagen agrupada) */}
            {simulationData?.geometria_espacial_3d?.ruta_imagen_agrupada && (
              <Card className="p-6 border-cyan-rad/30 bg-surface-void/45">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-cyan-rad border-b border-border-dim/40 pb-2">
                    <Database className="h-5 w-5 text-cyan-rad" />
                    <h4 className="text-xs font-mono font-bold tracking-widest uppercase">
                      CONSOLIDACIÓN MULTI-VISTA 360° (REGISTRO AGRUPADO)
                    </h4>
                  </div>
                  <p className="text-[10px] font-mono text-text-secondary leading-relaxed">
                    Fotografías secuenciales del objeto (papa o manzana) capturadas a intervalos equidistantes de 90°
                    y procesadas por el motor de segmentación IA.
                  </p>
                  <div className="flex justify-center mt-2">
                    <div className="max-w-2xl w-full border border-border-dim/50 rounded-lg overflow-hidden shadow-2xl bg-black/60">
                      <img
                        src={simulationData.geometria_espacial_3d.ruta_imagen_agrupada}
                        alt="Consolidación de Vistas 360"
                        className="w-full h-auto object-contain max-h-[350px] select-none hover:scale-[1.01] transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Comparativo Quick-View */}
            <div className="border-t border-border-dim/30 pt-6">
              <h4 className="text-xs font-mono font-bold tracking-widest text-text-muted uppercase mb-4">
                {t('comp_subtitle')}
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BeforePanel />
                <AfterPanel />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {/* Global API error notification */}
      {error && (
        <Card variant="base" className="border-rose-dark bg-rose-dark/15 text-rose-default p-4 flex items-start space-x-3 mb-6 animate-pulse">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div className="text-xs font-mono">
            <span className="font-bold">ERROR DE COMUNICACIÓN API:</span> {error}
          </div>
        </Card>
      )}

      {/* Primary viewport renderer */}
      {renderActiveView()}

      {/* Stepper simulation modal overlay */}
      <ProcessingModal />
    </DashboardLayout>
  );
}

export default App;
