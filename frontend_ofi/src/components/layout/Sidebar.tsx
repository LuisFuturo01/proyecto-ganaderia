import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import {
  LayoutDashboard,
  Box,
  Zap,
  Columns,
  FileSpreadsheet,
  History,
  Activity,
} from 'lucide-react';
import type { ActiveView } from '../../types/jsonData';
import { useTranslation, type TranslationKey } from '../../hooks/useTranslation';

interface SidebarItem {
  id: ActiveView;
  labelKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  descKey: TranslationKey;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: 'dashboard',
    labelKey: 'menu_dashboard',
    icon: LayoutDashboard,
    descKey: 'sidebar_desc_dashboard',
  },
  {
    id: 'analysis3d',
    labelKey: 'menu_analysis3d',
    icon: Box,
    descKey: 'sidebar_desc_analysis3d',
  },
  {
    id: 'dosimetry',
    labelKey: 'menu_dosimetry',
    icon: Zap,
    descKey: 'sidebar_desc_dosimetry',
  },
  {
    id: 'comparative',
    labelKey: 'menu_comparative',
    icon: Columns,
    descKey: 'sidebar_desc_comparative',
  },
  {
    id: 'reports',
    labelKey: 'menu_reports',
    icon: FileSpreadsheet,
    descKey: 'sidebar_desc_reports',
  },
  {
    id: 'history',
    labelKey: 'menu_history',
    icon: History,
    descKey: 'sidebar_desc_history',
  },
];

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, hasData } = useSimulationStore();
  const { t } = useTranslation();

  return (
    <aside className="glass border-r border-border-dim w-full md:w-64 flex flex-col justify-between py-6 select-none shrink-0">
      {/* Menu Options */}
      <div className="space-y-6 px-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-heading font-bold px-3">
            {t('menu_title')}
          </span>
          <nav className="mt-3 space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              // Disable detailed views if no simulation data is loaded
              const isDisabled = !hasData && item.id !== 'dashboard' && item.id !== 'history';

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && setActiveView(item.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md font-mono text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-nuclear-container/20 border border-nuclear/40 text-nuclear-bright glow-green/10'
                      : isDisabled
                      ? 'text-text-muted cursor-not-allowed opacity-40'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50 border border-transparent'
                  }`}
                  title={isDisabled ? t('sidebar_disabled_tooltip') : t(item.descKey)}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-nuclear-bright' : 'text-text-secondary'}`} />
                  <span className="text-left flex-1">{t(item.labelKey)}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-nuclear-bright animate-glow-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Telemetry Status Footer inside Sidebar */}
      <div className="px-6 border-t border-border-dim/50 pt-4 mt-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-text-secondary">
          <Activity className="h-4 w-4 text-cyan-rad animate-pulse" />
          <span className="font-bold">{t('telemetry_title')}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-text-muted">
          <div>
            <span>{t('telemetry_status')}</span>
            <span className="block text-nuclear-bright font-bold">{t('telemetry_status_val')}</span>
          </div>
          <div>
            <span>{t('telemetry_hz')}</span>
            <span className="block text-cyan-light font-bold">60.00 FPS</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
