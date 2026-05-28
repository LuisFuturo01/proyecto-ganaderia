import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import { Box, Scan, Zap, PackageCheck } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const SimulationPlaceholder: React.FC = () => {
  const { phase, hasData } = useSimulationStore();
  const { t } = useTranslation();

  const getPositionForPhase = () => {
    switch (phase) {
      case 'reception': return 15;
      case 'scanning': return 38;
      case 'irradiation': return 62;
      case 'output':
      case 'comparative':
        return 85;
      case 'idle':
      default:
        return 15;
    }
  };

  const currentPos = getPositionForPhase();

  return (
    <Card className="p-6 relative overflow-hidden h-72 flex flex-col justify-between border-cyan-rad/20 bg-surface-base/20 select-none">
      {/* Background grids and layout */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,55,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,55,0.07)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />

      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-dim/50 pb-2 z-10">
        <div className="flex items-center space-x-2">
          <Scan className="h-4 w-4 text-cyan-rad animate-pulse" />
          <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
            {t('place_title')}
          </h3>
        </div>
        <div className="text-[10px] font-mono text-cyan-light tracking-wider bg-cyan-dark/20 border border-cyan-dark/50 px-2 py-0.5 rounded">
          {t('place_badge')}
        </div>
      </div>

      {/* Main 2D conveyor scene with animations */}
      <div className="relative flex-1 flex items-center justify-center my-4">
        {/* Conveyor Belt line */}
        <div className="absolute h-3 bg-surface-high border-y border-border-dim/80 w-full bottom-8 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.15)_25%,transparent_25%)] bg-size-[16px_16px] animate-[scan-line_4s_linear_infinite]" />
        </div>

        {/* Stations along the belt */}
        <div className="absolute w-full bottom-14 flex justify-between px-10">
          {/* Station 1: Reception */}
          <div className="flex flex-col items-center space-y-1">
            <div className={`p-1.5 rounded-full border transition-all duration-300 ${
              phase === 'reception'
                ? 'bg-cyan-dark/30 border-cyan-rad text-cyan-rad shadow-[0_0_10px_rgba(0,210,253,0.3)]'
                : 'bg-surface-elevated border-border-dim text-text-muted'
            }`}>
              <Box className="h-4 w-4" />
            </div>
            <span className="text-[8px] font-mono font-bold text-text-muted">{t('place_tunnel_reception')}</span>
          </div>

          {/* Station 2: Laser Scan */}
          <div className="flex flex-col items-center space-y-1">
            <div className={`p-1.5 rounded-full border transition-all duration-300 ${
              phase === 'scanning'
                ? 'bg-cyan-dark/30 border-cyan-rad text-cyan-rad shadow-[0_0_10px_rgba(0,210,253,0.3)]'
                : 'bg-surface-elevated border-border-dim text-text-muted'
            }`}>
              <Scan className="h-4 w-4" />
            </div>
            <span className="text-[8px] font-mono font-bold text-text-muted">{t('place_tunnel_scan')}</span>
          </div>

          {/* Station 3: Irradiation */}
          <div className="flex flex-col items-center space-y-1">
            <div className={`p-1.5 rounded-full border transition-all duration-300 ${
              phase === 'irradiation'
                ? 'bg-rose-dark/30 border-rose-default text-rose-default shadow-[0_0_10px_rgba(255,179,182,0.3)]'
                : 'bg-surface-elevated border-border-dim text-text-muted'
            }`}>
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-[8px] font-mono font-bold text-text-muted">{t('place_tunnel_irrad')}</span>
          </div>

          {/* Station 4: Output */}
          <div className="flex flex-col items-center space-y-1">
            <div className={`p-1.5 rounded-full border transition-all duration-300 ${
              phase === 'output' || phase === 'comparative'
                ? 'bg-nuclear-container/30 border-nuclear text-nuclear-bright shadow-[0_0_10px_rgba(0,255,159,0.3)]'
                : 'bg-surface-elevated border-border-dim text-text-muted'
            }`}>
              <PackageCheck className="h-4 w-4" />
            </div>
            <span className="text-[8px] font-mono font-bold text-text-muted">{t('place_tunnel_output')}</span>
          </div>
        </div>

        {/* Animated Crop Element moving along the conveyor belt */}
        {hasData && (
          <motion.div
            className="absolute bottom-[44px]"
            initial={{ left: '15%' }}
            animate={{ left: `${currentPos}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          >
            <div className="relative group">
              {/* Potato model shape approximation */}
              <div className={`h-10 w-12 rounded-full border bg-radial transition-all duration-500 ${
                phase === 'irradiation'
                  ? 'from-radiation-orange/80 to-radiation-red/90 border-radiation-orange scale-110 glow-orange'
                  : phase === 'output' || phase === 'comparative'
                  ? 'from-nuclear/40 to-nuclear-dark/80 border-nuclear glow-green'
                  : 'from-amber-800 to-amber-950 border-amber-900 shadow-lg'
              }`}>
                {/* Simulated Laser scanner line scan effect */}
                {phase === 'scanning' && (
                  <div className="absolute inset-x-0 h-0.5 bg-cyan-rad glow-cyan animate-[scan-line_1s_infinite] top-1/2" />
                )}
                {/* Simulated Nuclear beam scanning effect */}
                {phase === 'irradiation' && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                )}
              </div>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-text-primary uppercase bg-surface-elevated px-1 rounded border border-border-dim whitespace-nowrap">
                {phase === 'irradiation' ? t('place_dosing') : phase === 'scanning' ? t('place_scanning') : t('place_batch_label')}
              </span>
            </div>
          </motion.div>
        )}

        {/* Tunnel Box for Scanner & Irradiation visually in background */}
        <div className="absolute w-[20%] h-24 border border-dashed border-cyan-rad/20 bg-cyan-dark/5 bottom-8 left-[30%] pointer-events-none rounded-t" />
        <div className="absolute w-[20%] h-24 border border-dashed border-rose-default/20 bg-rose-dark/5 bottom-8 left-[52%] pointer-events-none rounded-t" />
      </div>

      <div className="pt-3 border-t border-border-dim/50 text-[10px] font-mono text-text-muted flex items-center justify-between z-10">
        <span>{t('place_footer_cam')}</span>
        <span>{t('place_footer_mode')}</span>
      </div>
    </Card>
  );
};
