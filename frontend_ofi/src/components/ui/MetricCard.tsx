import React from 'react';
import { Card } from './Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  subtext?: string;
  loading?: boolean;
  variant?: 'base' | 'glow-nuclear' | 'glow-cyan';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon,
  subtext,
  loading = false,
  variant = 'base',
  className = '',
}) => {
  return (
    <Card variant={variant} className={`p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-text-secondary font-heading font-medium">
            {label}
          </span>
          <div className="flex items-baseline space-x-1">
            {loading ? (
              <span className="text-2xl font-bold font-mono animate-pulse text-text-muted">
                ---
              </span>
            ) : (
              <>
                <span className="text-2xl font-bold font-mono tracking-tight text-text-primary">
                  {value}
                </span>
                {unit && (
                  <span className="text-sm font-medium text-text-secondary ml-0.5">
                    {unit}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {icon && (
          <div className={`p-2 rounded bg-surface-elevated border border-border-dim text-cyan-rad`}>
            {icon}
          </div>
        )}
      </div>
      {subtext && (
        <div className="mt-2 text-xs text-text-muted font-mono flex items-center">
          {subtext}
        </div>
      )}
    </Card>
  );
};
