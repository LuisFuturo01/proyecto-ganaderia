import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { ShieldAlert, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const BeforePanel: React.FC = () => {
  const { simulationData } = useSimulationStore();
  const { t } = useTranslation();

  if (!simulationData) return null;

  const { analisis_color_superficie } = simulationData;

  return (
    <Card className="p-5 border-rose-dark/30 bg-surface-base/40 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-dark/30 pb-2">
          <div className="flex items-center space-x-2 text-rose-default">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider">
              {t('panel_before_title')}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-rose-default tracking-wider bg-rose-dark/20 border border-rose-dark/40 px-2 py-0.5 rounded">
            {t('panel_before_badge')}
          </span>
        </div>

        {/* Pathogens and Hazards list */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center bg-surface-elevated/30 p-2.5 rounded border border-border-dim/40">
            <span className="text-text-secondary flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-default" />
              {t('panel_before_bact')}
            </span>
            <span className="text-rose-default font-bold text-sm">
              10⁵.⁴ UFC/g
            </span>
          </div>

          <div className="flex justify-between items-center bg-surface-elevated/30 p-2.5 rounded border border-border-dim/40">
            <span className="text-text-secondary flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-radiation-amber" />
              {t('panel_before_germ')}
            </span>
            <span className="text-radiation-amber font-bold">
              {t('panel_before_germ_val')}
            </span>
          </div>

          <div className="flex justify-between items-center bg-surface-elevated/30 p-2.5 rounded border border-border-dim/40">
            <span className="text-text-secondary">
              {t('panel_before_anom')}
            </span>
            <span className="text-white font-bold">
              {analisis_color_superficie.porcentaje_superficie_piel_danada.toFixed(2)}%
            </span>
          </div>

          <div className="flex justify-between items-center bg-surface-elevated/30 p-2.5 rounded border border-border-dim/40">
            <span className="text-text-secondary">
              {t('panel_before_lifetime')}
            </span>
            <span className="text-rose-default font-bold">
              {t('panel_before_lifetime_val')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-border-dim/40 text-[9px] font-mono text-text-muted flex justify-between">
        <span>{t('panel_before_footer_tech')}</span>
        <span>{t('panel_before_footer_alert')}</span>
      </div>
    </Card>
  );
};
