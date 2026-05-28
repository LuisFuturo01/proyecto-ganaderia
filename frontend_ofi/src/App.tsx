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
  const { hasData, activeView } = useSimulationStore();
  const { error } = useApi();
  const { t, tVegetableSimple } = useTranslation();
  
  // Activate real-time physical camera scanning listening
  useWebSocket();

  const renderActiveView = () => {
    // If no data loaded, show interactive image uploader dashboard
    if (!hasData) {
      return (
        <div className="space-y-8 py-6">
          <ImageUploader />
          
          <Card className="p-5 text-center max-w-2xl mx-auto space-y-3 border-border-dim/40 bg-surface-void/35">
            <p className="text-xs text-text-muted leading-relaxed font-mono">
              {t('start_desc')}
            </p>
            <div className="flex justify-center gap-4 text-[10px] font-mono text-text-muted/80 pt-1">
              <span className="flex items-center gap-1">
                <Database className="h-4 w-4 text-cyan-rad" />
                {t('start_yolo')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Info className="h-4 w-4 text-cyan-rad" />
                {t('start_atten')}
              </span>
            </div>
          </Card>
        </div>
      );
    }

    switch (activeView) {
      case 'analysis3d':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SimulationScene />
            </div>
            <div>
              <GeometryPanel />
            </div>
          </div>
        );
      case 'dosimetry':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttenuationChart />
            <DosimetryIndicators />
          </div>
        );
      case 'comparative':
        return <ComparativeView />;
      case 'reports':
        return (
          <Card className="p-6 space-y-4 max-w-xl mx-auto border-cyan-rad/30">
            <div className="flex items-center space-x-2 text-cyan-rad border-b border-border-dim pb-2">
              <FileText className="h-5 w-5" />
              <h3 className="font-heading font-bold uppercase text-sm">{t('rep_title')}</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              {t('rep_generating')}
              <br />
              {t('rep_class')}
              <br />
              {t('rep_dose')}
              <br />
              {t('rep_microb')}
              <br />
              {t('rep_approved')}
            </p>
            <button className="px-3 py-1.5 bg-cyan-dark/30 hover:bg-cyan-dark/50 border border-cyan-rad text-cyan-light rounded font-mono text-xs font-bold transition-all">
              {t('rep_btn_download')}
            </button>
          </Card>
        );
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
