import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { SimulationPhase } from '../../types/jsonData';
import { Package, Scan, Zap, PackageCheck, Columns } from 'lucide-react';
import { useTranslation, type TranslationKey } from '../../hooks/useTranslation';

interface PhaseStep {
  id: SimulationPhase;
  labelKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  descKey: TranslationKey;
}

const PHASES: PhaseStep[] = [
  { id: 'reception', labelKey: 'phase_1', icon: Package, descKey: 'phase_1_desc' },
  { id: 'scanning', labelKey: 'phase_2', icon: Scan, descKey: 'phase_2_desc' },
  { id: 'irradiation', labelKey: 'phase_3', icon: Zap, descKey: 'phase_3_desc' },
  { id: 'output', labelKey: 'phase_4', icon: PackageCheck, descKey: 'phase_4_desc' },
  { id: 'comparative', labelKey: 'phase_5', icon: Columns, descKey: 'phase_5_desc' },
];

export const PhaseNavigation: React.FC = () => {
  const { phase, setPhase, hasData } = useSimulationStore();
  const { t } = useTranslation();

  if (!hasData) return null;

  return (
    <div className="glass border border-border-dim rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 md:gap-4 select-none">
      <div className="flex items-center space-x-2">
        <span className="text-[10px] font-mono font-bold text-cyan-light tracking-wider bg-cyan-dark/20 border border-cyan-dark/50 px-2 py-0.5 rounded">
          {t('nav_title')}
        </span>
      </div>

      <div className="flex items-center flex-1 justify-end gap-1 md:gap-2">
        {PHASES.map((p) => {
          const Icon = p.icon;
          const isActive = phase === p.id;
          const isCompleted = PHASES.findIndex((x) => x.id === phase) > PHASES.findIndex((x) => x.id === p.id);

          return (
            <button
              key={p.id}
              onClick={() => setPhase(p.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all duration-200 cursor-pointer font-mono text-[11px] font-bold border ${
                isActive
                  ? 'bg-nuclear-container/20 border-nuclear text-nuclear-bright glow-green/5'
                  : isCompleted
                  ? 'bg-surface-elevated/40 border-border-dim/50 text-text-secondary hover:text-text-primary'
                  : 'bg-transparent border-transparent text-text-muted hover:text-text-secondary'
              }`}
              title={`${t(p.labelKey)}: ${t(p.descKey)}`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-nuclear-bright animate-pulse' : 'text-current'}`} />
              <span className="hidden sm:inline">
                {t(p.labelKey).includes('. ') ? t(p.labelKey).split('. ')[1] : t(p.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
