import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { generateAttenuationChartData } from '../../lib/mockData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingDown } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const AttenuationChart: React.FC = () => {
  const { simulationData } = useSimulationStore();
  const { t } = useTranslation();

  if (!simulationData) return null;

  const { simulacion_dosimetria_radiacion } = simulationData;
  const rawProfile = simulacion_dosimetria_radiacion.perfil_atenuacion_profundidad_lineal_kGy;
  const chartData = generateAttenuationChartData(rawProfile);

  return (
    <Card className="p-4 h-full flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-dim/50 pb-2">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4 text-cyan-rad" />
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              {t('chart_title')}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-light tracking-wider bg-cyan-dark/20 border border-cyan-dark/50 px-2 py-0.5 rounded">
            {t('chart_badge')}
          </span>
        </div>

        {/* Chart Viewport */}
        <div className="h-48 w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d2fd" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00d2fd" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 55, 0.4)" />
              <XAxis
                dataKey="profundidad"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af' }}
                unit="cm"
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af' }}
                unit="kGy"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#10131c',
                  border: '1px solid rgba(0, 210, 253, 0.3)',
                  borderRadius: '4px',
                  color: '#e1e2ee',
                }}
                labelFormatter={(value) => `${t('chart_tooltip_depth')} ${value} cm`}
                formatter={(value) => [`${Number(value).toFixed(3)} kGy`, t('chart_tooltip_dose')]}
              />
              <Area
                type="monotone"
                dataKey="dosis"
                stroke="#00d2fd"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#glowColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border-dim/50 text-[10px] font-mono text-text-muted flex items-center justify-between">
        <span>{t('chart_footer_res')}</span>
        <span>{t('chart_footer_alg')}</span>
      </div>
    </Card>
  );
};
