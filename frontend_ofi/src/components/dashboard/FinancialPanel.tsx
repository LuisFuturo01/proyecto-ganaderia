import React from 'react';
import { Coins, Clock, TrendingUp, HeartPulse, ShieldCheck, DollarSign } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Card } from '../ui/Card';

export const FinancialPanel: React.FC = () => {
  const { simulationData } = useSimulationStore();
  const { t } = useTranslation();

  if (!simulationData) return null;

  // Destructure direct fields from real backend or calculate smart mocks
  const lifeData = simulationData.prediccion_vida_util_post_irradiacion || {
    dias_vida_util_restante: 0.0,
    dias_ganados_por_irradiacion: 0.0,
    estado_proyeccion: '--',
  };

  const finData = simulationData.simulacion_impacto_financiero_operativo || {
    dosis_estandar_industria_kGy: 0.0,
    tiempo_procesamiento_ahorrado_segundos: 0.0,
    ahorro_directo_por_unidad_usd: 0.0,
    ahorro_proyectado_por_tonelada_usd: 0.0,
    porcentaje_optimizacion_throughput: 0.0,
  };

  return (
    <Card className="p-5 border-cyan-rad/20 bg-surface-elevated/40 backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 border-b border-border-dim/40 pb-2">
        <Coins className="h-4.5 w-4.5 text-cyan-rad animate-pulse" />
        <h3 className="text-xs font-bold font-heading uppercase text-text-primary tracking-widest">
          {t('fin_title')}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side: Shelf Life */}
        <div className="space-y-3 bg-surface-void/40 p-3 rounded border border-border-dim/20">
          <h4 className="text-[10px] font-bold font-mono text-nuclear-bright uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="h-3.5 w-3.5" />
            {t('fin_shelf_life')}
          </h4>

          <div className="space-y-2 font-mono text-xs text-text-secondary">
            <div className="flex justify-between items-center border-b border-border-dim/20 pb-1">
              <span>{t('fin_days_remaining')}</span>
              <span className="text-white font-bold">{lifeData.dias_vida_util_restante} {t('panel_before_lifetime_val').includes('days') || t('panel_before_lifetime_val').includes('días') ? 'días' : 'days'}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-border-dim/20 pb-1">
              <span>{t('fin_days_gained')}</span>
              <span className="text-nuclear-bright font-bold">+{lifeData.dias_ganados_por_irradiacion}</span>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span>{t('fin_projection_status')}</span>
              <span className="text-cyan-light font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-rad" />
                {lifeData.estado_proyeccion}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Financial & Throughput */}
        <div className="space-y-3 bg-surface-void/40 p-3 rounded border border-border-dim/20">
          <h4 className="text-[10px] font-bold font-mono text-cyan-rad uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            B2B OPERACIONES & AHORRO
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-elevated/20 p-2 rounded border border-border-dim/10">
              <div className="flex items-center gap-1 text-[8px] font-mono text-text-muted uppercase">
                <Clock className="h-3 w-3 text-cyan-rad" />
                {t('fin_time_saved')}
              </div>
              <div className="text-sm font-mono font-bold text-white mt-1">
                {finData.tiempo_procesamiento_ahorrado_segundos}s
              </div>
            </div>

            <div className="bg-surface-elevated/20 p-2 rounded border border-border-dim/10">
              <div className="flex items-center gap-1 text-[8px] font-mono text-text-muted uppercase">
                <Coins className="h-3 w-3 text-nuclear" />
                {t('fin_throughput')}
              </div>
              <div className="text-sm font-mono font-bold text-nuclear-bright mt-1">
                +{finData.porcentaje_optimizacion_throughput}%
              </div>
            </div>

            <div className="bg-surface-elevated/20 p-2 rounded border border-border-dim/10">
              <div className="flex items-center gap-1 text-[8px] font-mono text-text-muted uppercase">
                <DollarSign className="h-3 w-3 text-cyan-rad" />
                {t('fin_direct_savings')}
              </div>
              <div className="text-sm font-mono font-bold text-white mt-1">
                ${finData.ahorro_directo_por_unidad_usd.toFixed(4)}
              </div>
            </div>

            <div className="bg-surface-elevated/20 p-2 rounded border border-border-dim/10">
              <div className="flex items-center gap-1 text-[8px] font-mono text-text-muted uppercase">
                <Coins className="h-3 w-3 text-cyan-rad" />
                {t('fin_projected_savings')}
              </div>
              <div className="text-sm font-mono font-bold text-cyan-light mt-1">
                ${finData.ahorro_proyectado_por_tonelada_usd.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
