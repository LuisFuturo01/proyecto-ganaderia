import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Ruler, Box, Sparkles, Orbit } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const GeometryPanel: React.FC = () => {
  const { simulationData } = useSimulationStore();
  const { t } = useTranslation();

  if (!simulationData) return null;

  const { geometria_espacial_3d } = simulationData;

  return (
    <Card className="p-4 h-full flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-dim/50 pb-2">
          <div className="flex items-center space-x-2">
            <Ruler className="h-4 w-4 text-cyan-rad" />
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              {t('geom_title')}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-light tracking-wider bg-cyan-dark/20 border border-cyan-dark/50 px-2 py-0.5 rounded">
            {t('geom_laser_active')}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 bg-surface-elevated/45 p-2.5 rounded border border-border-dim/50">
            <div className="flex items-center space-x-1 text-[10px] font-mono text-text-secondary uppercase">
              <Box className="h-3 w-3 text-cyan-rad" />
              <span>{t('geom_volume')}</span>
            </div>
            <div className="text-lg font-mono font-bold text-text-primary">
              {geometria_espacial_3d.volumen_calculado_cm3.toFixed(2)}
              <span className="text-xs font-sans text-text-secondary ml-1">cm³</span>
            </div>
          </div>

          <div className="space-y-1 bg-surface-elevated/45 p-2.5 rounded border border-border-dim/50">
            <div className="flex items-center space-x-1 text-[10px] font-mono text-text-secondary uppercase">
              <Orbit className="h-3 w-3 text-cyan-rad" />
              <span>{t('geom_area')}</span>
            </div>
            <div className="text-lg font-mono font-bold text-text-primary">
              {geometria_espacial_3d.area_superficie_calculada_cm2.toFixed(2)}
              <span className="text-xs font-sans text-text-secondary ml-1">cm²</span>
            </div>
          </div>

          <div className="space-y-1 bg-surface-elevated/45 p-2.5 rounded border border-border-dim/50">
            <div className="flex items-center space-x-1 text-[10px] font-mono text-text-secondary uppercase">
              <Sparkles className="h-3 w-3 text-cyan-rad" />
              <span>{t('geom_sphericity')}</span>
            </div>
            <div className="text-lg font-mono font-bold text-text-primary">
              {geometria_espacial_3d.indice_forma_esfericidad.toFixed(3)}
            </div>
            <div className="text-[9px] font-mono text-text-muted">
              {geometria_espacial_3d.indice_forma_esfericidad >= 0.85 
                ? t('geom_sphericity_spherical') 
                : t('geom_sphericity_irregular')}
            </div>
          </div>

          <div className="space-y-1 bg-surface-elevated/45 p-2.5 rounded border border-border-dim/50">
            <div className="flex items-center space-x-1 text-[10px] font-mono text-text-secondary uppercase">
              <Ruler className="h-3 w-3 text-cyan-rad" />
              <span>{t('geom_concavities')}</span>
            </div>
            <div className="text-lg font-mono font-bold text-text-primary">
              {geometria_espacial_3d.conteo_cavidades_concavidades_profundas ?? 0}
            </div>
            <div className="text-[9px] font-mono text-text-muted">{t('geom_concavities_sub')}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border-dim/50 text-[10px] font-mono text-text-muted flex items-center justify-between">
        <span>{t('geom_footer_mesh')}</span>
        <span>{t('geom_footer_hw')}</span>
      </div>
    </Card>
  );
};
