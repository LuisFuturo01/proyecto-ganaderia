import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Eye, AlertTriangle } from 'lucide-react';
import { useTranslation, type TranslationKey } from '../../hooks/useTranslation';

export const SurfacePanel: React.FC = () => {
  const { simulationData } = useSimulationStore();
  const { t } = useTranslation();

  if (!simulationData) return null;

  const { analisis_color_superficie } = simulationData;
  const dmg = analisis_color_superficie.porcentaje_superficie_piel_danada;

  const getDmgSeverity = (val: number): { status: string; color: 'nuclear' | 'amber' | 'rose'; labelKey: TranslationKey } => {
    if (val < 5) return { status: 'safe', color: 'nuclear', labelKey: 'surf_severity_safe' };
    if (val < 15) return { status: 'warning', color: 'amber', labelKey: 'surf_severity_warning' };
    return { status: 'critical', color: 'rose', labelKey: 'surf_severity_critical' };
  };

  const severity = getDmgSeverity(dmg);

  // Simple HSV to CSS converter for demonstration swatch (approximate)
  const [h, s, v] = analisis_color_superficie.espacio_color_hsv_promedio;
  const cssH = Math.round((h / 179) * 360);
  const cssS = Math.round((s / 255) * 100);
  const cssV = Math.round((v / 255) * 100);
  // Using hsl approximation for swatch
  const swatchStyle = {
    backgroundColor: `hsl(${cssH}, ${cssS}%, ${cssV / 2}%)`,
  };

  return (
    <Card className="p-4 h-full flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-dim/50 pb-2">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-cyan-rad" />
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              {t('surf_title')}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-light tracking-wider bg-cyan-dark/20 border border-cyan-dark/50 px-2 py-0.5 rounded">
            RGB SENSOR
          </span>
        </div>

        {/* Colorimetry & Damage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-text-muted uppercase">{t('surf_avg_color')}</span>
              <div className="text-xs font-mono font-bold text-text-primary flex items-center space-x-2">
                <span className="h-3 w-3 rounded border border-border-dim inline-block" style={swatchStyle} />
                <span>[{h}, {s}, {v}]</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-text-muted block uppercase">{t('surf_spots')}</span>
              <span className="text-sm font-mono font-bold text-text-primary">
                {analisis_color_superficie.conteo_manchas_aisladas} {t('surf_spots_unit')}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border-dim/30 pt-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary flex items-center gap-1">
                <AlertTriangle className={`h-3.5 w-3.5 ${dmg > 10 ? 'text-radiation-red' : 'text-radiation-amber'}`} />
                {t('surf_damaged_area')}
              </span>
              <span className={`font-bold ${dmg > 15 ? 'text-rose-default' : dmg > 5 ? 'text-radiation-amber' : 'text-nuclear-bright'}`}>
                {dmg.toFixed(2)}%
              </span>
            </div>
            <ProgressBar progress={dmg} color={severity.color} size="sm" showPercentage={false} />
            <div className="flex justify-between text-[9px] font-mono text-text-muted mt-1">
              <span>{t('surf_fitosanitario')}</span>
              <span className={`font-bold ${dmg > 15 ? 'text-rose-default' : dmg > 5 ? 'text-radiation-amber' : 'text-nuclear-bright'}`}>
                {t(severity.labelKey)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border-dim/50 text-[10px] font-mono text-text-muted flex items-center justify-between">
        <span>{t('surf_footer_cam')}</span>
        <span>Espacio: HSV (Hue, Sat, Val)</span>
      </div>
    </Card>
  );
};
