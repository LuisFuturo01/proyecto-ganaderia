import React from 'react';

interface StatusBadgeProps {
  status: 'normal' | 'advertencia' | 'critico' | 'procesando' | 'completado';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const getStyles = () => {
    switch (status) {
      case 'completado':
      case 'normal':
        return {
          bg: 'bg-nuclear-container/30 border-nuclear-dark/50 text-nuclear-bright',
          dot: 'bg-nuclear-bright animate-glow-pulse',
          text: label || 'SEGURO / NOMINAL',
        };
      case 'advertencia':
        return {
          bg: 'bg-radiation-amber/10 border-radiation-amber/35 text-radiation-amber',
          dot: 'bg-radiation-amber animate-pulse',
          text: label || 'ADVERTENCIA',
        };
      case 'critico':
        return {
          bg: 'bg-rose-dark/20 border-rose-dark/50 text-rose-default',
          dot: 'bg-rose-default animate-ping',
          text: label || 'ALERTA / ANÓMALO',
        };
      case 'procesando':
        return {
          bg: 'bg-cyan-dark/20 border-cyan-dark/50 text-cyan-light',
          dot: 'bg-cyan-rad animate-spin border-t-transparent rounded-full h-1.5 w-1.5 border-2',
          text: label || 'ESCANEANDO',
        };
      default:
        return {
          bg: 'bg-surface-elevated border-border-dim text-text-secondary',
          dot: 'bg-text-muted',
          text: label || 'INACTIVO',
        };
    }
  };

  const config = getStyles();

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-wider uppercase ${config.bg} ${className}`}
    >
      {status === 'procesando' ? (
        <div className="h-1.5 w-1.5 rounded-full border border-cyan-rad border-t-transparent animate-spin" />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      )}
      <span>{config.text}</span>
    </div>
  );
};
