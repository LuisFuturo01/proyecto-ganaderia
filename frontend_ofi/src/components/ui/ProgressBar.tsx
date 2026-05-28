import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'nuclear' | 'cyan' | 'rose' | 'amber';
  showPercentage?: boolean;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'nuclear',
  showPercentage = false,
  animate = true,
  size = 'md',
  className = '',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const getColorClasses = () => {
    switch (color) {
      case 'cyan':
        return 'bg-cyan-rad glow-cyan';
      case 'rose':
        return 'bg-rose-default shadow-[0_0_10px_rgba(255,179,182,0.4)]';
      case 'amber':
        return 'bg-radiation-amber shadow-[0_0_10px_rgba(255,170,0,0.4)]';
      case 'nuclear':
      default:
        return 'bg-nuclear glow-green';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-1';
      case 'lg':
        return 'h-3';
      case 'md':
      default:
        return 'h-2';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span className="text-xs font-mono font-bold text-text-primary ml-auto">
            {clampedProgress.toFixed(0)}%
          </span>
        )}
      </div>
      <div className={`w-full bg-surface-elevated rounded-full overflow-hidden border border-border-dim ${getSizeClass()}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${getColorClasses()} ${
            animate ? 'relative overflow-hidden' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        >
          {animate && (
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-scan-line" />
          )}
        </div>
      </div>
    </div>
  );
};
