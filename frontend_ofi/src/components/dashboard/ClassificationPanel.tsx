import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { Cpu, Target } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const ClassificationPanel: React.FC = () => {
  const { simulationData } = useSimulationStore();
  const { t, tVegetable } = useTranslation();

  if (!simulationData) return null;

  const { clasificacion_alimento } = simulationData;
  const confidencePercent = clasificacion_alimento.puntaje_confianza_modelo * 100;

  return (
    <Card className="p-4 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-dim/50 pb-2">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-nuclear" />
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              {t('class_title')}
            </h3>
          </div>
          <StatusBadge status="normal" label={t('class_status')} />
        </div>

        {/* Alimento Detected Info */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-text-muted uppercase">{t('class_detected')}</span>
          <div className="text-lg font-heading font-bold text-nuclear-bright text-glow-green uppercase">
            {tVegetable(clasificacion_alimento.tipo_item_detectado)}
          </div>
        </div>

        {/* Confidence level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-secondary flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-cyan-rad" />
              {t('class_confidence')}
            </span>
            <span className="text-nuclear-bright font-bold">
              {confidencePercent.toFixed(2)}%
            </span>
          </div>
          <ProgressBar progress={confidencePercent} color="nuclear" size="sm" showPercentage={false} />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border-dim/50 text-[10px] font-mono text-text-muted flex items-center justify-between">
        <span>{t('class_footer_net')}</span>
        <span>ID: HNB-2026-YOLO</span>
      </div>
    </Card>
  );
};
