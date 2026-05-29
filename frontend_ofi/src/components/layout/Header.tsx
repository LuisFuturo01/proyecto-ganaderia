import { useSimulationStore } from '../../store/useSimulationStore';
import { StatusBadge } from '../ui/StatusBadge';
import { Shield, Cpu } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const Header: React.FC = () => {
  const { phase, language, setLanguage } = useSimulationStore();
  const { t } = useTranslation();

  const getSystemStatus = () => {
    if (phase === 'idle') return <StatusBadge status="normal" label={t('sys_status_ready')} />;
    if (phase === 'reception' || phase === 'scanning' || phase === 'irradiation') {
      return <StatusBadge status="procesando" label={t('sys_status_processing')} />;
    }
    return <StatusBadge status="completado" label={t('sys_status_completed')} />;
  };

  return (
    <header className="glass border-b border-border-dim px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 select-none">
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded bg-nuclear-container/20 border border-nuclear/35 text-nuclear-bright shadow-[0_0_10px_rgba(0,255,159,0.2)]">
          <Shield className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold font-heading tracking-tight text-white flex items-center">
              RADIO<span className="text-nuclear text-glow-green">GUARD</span>
            </h1>
            <div className="hidden sm:block">
              {getSystemStatus()}
            </div>
          </div>
          <p className="text-[10px] md:text-xs font-mono tracking-widest text-cyan-light/80 uppercase">
            {t('sys_sub')}
          </p>
        </div>
      </div>

      {/* Connection & Actions */}
      <div className="flex items-center space-x-4 self-end md:self-auto">
        {/* Language Switcher */}
        <div className="flex items-center bg-surface-void/50 border border-border-dim p-0.5 rounded overflow-hidden">
          <button
            onClick={() => setLanguage('es')}
            className={`px-2 py-1 text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer rounded ${
              language === 'es'
                ? 'bg-nuclear-container/30 border border-nuclear-dark text-nuclear-bright shadow-[0_0_5px_rgba(0,255,159,0.2)] animate-pulse'
                : 'text-text-muted hover:text-text-secondary border border-transparent'
            }`}
          >
            ES
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer rounded ${
              language === 'en'
                ? 'bg-cyan-dark/30 border border-cyan-dark text-cyan-rad shadow-[0_0_5px_rgba(0,210,253,0.2)] animate-pulse'
                : 'text-text-muted hover:text-text-secondary border border-transparent'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
};
