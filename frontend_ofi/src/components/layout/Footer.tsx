import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Cpu, Terminal, Disc } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const Footer: React.FC = () => {
  const { fps, phase } = useSimulationStore();
  const { t, tPhase } = useTranslation();

  return (
    <footer className="glass border-t border-border-dim px-6 py-3 flex flex-col md:flex-row md:items-center justify-between text-[10px] font-mono text-text-muted gap-2 select-none shrink-0">
      {/* Platform metadata */}
      <div className="flex items-center space-x-4">
        <span className="flex items-center space-x-1">
          <Terminal className="h-3 w-3 text-cyan-rad" />
          <span>{t('footer_core_status')}</span>
          <span className="text-nuclear-bright font-bold">{t('footer_core_nominal')}</span>
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="flex items-center space-x-1">
          <Cpu className="h-3 w-3 text-cyan-rad" />
          <span>{t('footer_engine')}</span>
          <span className="text-text-primary font-bold">THREE.JS / WEBGL2</span>
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-4 self-end md:self-auto">
        <span className="flex items-center space-x-1">
          <Disc className="h-3 w-3 text-nuclear-bright animate-spin" style={{ animationDuration: '4s' }} />
          <span>{t('footer_phase')}</span>
          <span className="text-cyan-light font-bold uppercase">{tPhase(phase)}</span>
        </span>
        <span>•</span>
        <span>
          {t('footer_fps')} <span className="text-nuclear-bright font-bold">{fps.toFixed(2)}</span>
        </span>
        <span>•</span>
        <span>HNB © 2026 RADIOGUARD</span>
      </div>
    </footer>
  );
};
