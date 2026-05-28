import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { AnimatePresence, motion } from 'framer-motion';
import { Package, Scan, Cpu, Zap, Award, X } from 'lucide-react';
import type { ProcessingStep } from '../../types/jsonData';
import { useTranslation } from '../../hooks/useTranslation';

interface ModalStep {
  label: ProcessingStep;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: ModalStep[] = [
  { label: 'Recepción', icon: Package },
  { label: 'Escaneo', icon: Scan },
  { label: 'Procesando', icon: Cpu },
  { label: 'Irradiación', icon: Zap },
  { label: 'Resultados', icon: Award },
];

export const ProcessingModal: React.FC = () => {
  const {
    isProcessingModalOpen,
    processingStep,
    processingProgress,
    closeProcessingModal,
  } = useSimulationStore();
  const { t, tStep } = useTranslation();

  if (!isProcessingModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeProcessingModal}
          className="absolute inset-0 bg-surface-void/80 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="w-full max-w-lg z-10"
        >
          <Card variant="glow-cyan" className="p-6 relative select-none">
            {/* Close Button */}
            <button
              onClick={closeProcessingModal}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title block */}
            <div className="space-y-1 mb-6">
              <h2 className="text-lg font-bold font-heading text-white tracking-wide uppercase">
                {t('modal_title')}
              </h2>
              <p className="text-[10px] font-mono text-cyan-light tracking-wider uppercase">
                {t('modal_subtitle')}
              </p>
            </div>

            {/* Stepper block */}
            <div className="flex justify-between items-center relative mb-8 px-2">
              {/* Stepper bar background */}
              <div className="absolute left-6 right-6 h-0.5 bg-surface-elevated top-[18px] -z-10" />

              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isCurrent = processingStep === step.label;
                const isDone = STEPS.findIndex((s) => s.label === processingStep) > idx;

                return (
                  <div key={step.label} className="flex flex-col items-center space-y-1.5 z-10">
                    <div
                      className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? 'bg-cyan-dark/40 border-cyan-rad text-cyan-rad shadow-[0_0_10px_rgba(0,210,253,0.4)] scale-110'
                          : isDone
                          ? 'bg-nuclear-container/30 border-nuclear text-nuclear-bright'
                          : 'bg-surface-void border-border-dim text-text-muted'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                        isCurrent
                          ? 'text-cyan-rad font-black'
                          : isDone
                          ? 'text-nuclear-bright'
                          : 'text-text-muted'
                      }`}
                    >
                      {tStep(step.label)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress metrics and display */}
            <div className="space-y-4 bg-surface-elevated/20 border border-border-dim p-4 rounded mb-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary">{t('modal_step_label')}</span>
                <span className="text-cyan-light font-bold uppercase tracking-wider animate-pulse">
                  {tStep(processingStep)} ({processingProgress.toFixed(0)}%)
                </span>
              </div>

              <ProgressBar progress={processingProgress} color="cyan" size="md" showPercentage={false} />

              <div className="flex justify-between text-[10px] font-mono text-text-muted">
                <span>{t('modal_footer_status')}</span>
                <span>{t('modal_footer_remaining')} {Math.max(0, Math.ceil((100 - processingProgress) * 0.15))}s</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeProcessingModal}
                className="px-4 py-2 border border-border-dim hover:border-rose-dark hover:bg-rose-dark/10 rounded font-mono text-xs font-bold text-text-secondary hover:text-rose-default transition-all duration-200 cursor-pointer active:scale-95"
              >
                {t('btn_cancel_sim')}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
