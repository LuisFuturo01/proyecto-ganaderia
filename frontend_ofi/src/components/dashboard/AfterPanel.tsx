import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { ShieldCheck, CheckCircle, Sparkles } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const AfterPanel: React.FC = () => {
  const { simulationData } = useSimulationStore();
  const { t } = useTranslation();

  if (!simulationData) return null;

  const { simulacion_dosimetria_radiacion } = simulationData;
  const ind = simulacion_dosimetria_radiacion.indicadores_dosimetria_fisico_biologica;

  // Let's compute remaining bacterial load assuming initial load is 10^5.4
  const initialLoadLog = 5.4;
  const reductionLog = ind.reduccion_logaritmica_carga_bacteriana;
  const finalLoadLog = Math.max(0, initialLoadLog - reductionLog);

  return (
    <Card className="p-5 border-nuclear-dark/30 bg-surface-base/40 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-nuclear-dark/30 pb-2">
          <div className="flex items-center space-x-2 text-nuclear-bright">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider">
              {t('panel_after_title')}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-nuclear-bright tracking-wider bg-nuclear-container/20 border border-nuclear-dark/40 px-2 py-0.5 rounded">
            {t('panel_after_badge')}
          </span>
        </div>

        {/* Treated specs list */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center bg-surface-elevated/30 p-2.5 rounded border border-border-dim/40">
            <span className="text-text-secondary flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-nuclear-bright" />
              {t('panel_after_bact')}
            </span>
            <span className="text-nuclear-bright font-bold text-sm">
              10^{finalLoadLog.toFixed(1)} UFC/g (-{reductionLog.toFixed(1)} log)
            </span>
          </div>

          <div className="flex justify-between items-center bg-surface-elevated/30 p-2.5 rounded border border-border-dim/40">
            <span className="text-text-secondary flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-rad animate-pulse" />
              {t('panel_after_germ')}
            </span>
            <span className="text-nuclear-bright font-bold">
              {t('panel_after_germ_val')}
            </span>
          </div>

          <div className="flex justify-between items-center bg-surface-elevated/30 p-2.5 rounded border border-border-dim/40">
            <span className="text-text-secondary">
              {t('panel_after_disinfest')}
            </span>
            <span className="text-white font-bold">
              {t('panel_after_disinfest_val')}
            </span>
          </div>

          <div className="flex justify-between items-center bg-surface-elevated/30 p-2.5 rounded border border-border-dim/40">
            <span className="text-text-secondary">
              {t('panel_after_lifetime')}
            </span>
            <span className="text-nuclear-bright font-bold text-glow-green">
              {t('panel_after_lifetime_val')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-border-dim/40 text-[9px] font-mono text-text-muted flex justify-between">
        <span>{t('panel_after_footer_status')}</span>
        <span>{t('panel_after_footer_desc')}</span>
      </div>
    </Card>
  );
};
