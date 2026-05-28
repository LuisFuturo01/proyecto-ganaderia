import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'elevated' | 'glow-nuclear' | 'glow-cyan';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'base',
  children,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'elevated':
        return 'glass-elevated';
      case 'glow-nuclear':
        return 'glass glow-green border-nuclear/30';
      case 'glow-cyan':
        return 'glass glow-cyan border-cyan-rad/30';
      case 'base':
      default:
        return 'glass border-gradient';
    }
  };

  return (
    <div
      className={`rounded-lg overflow-hidden transition-all duration-300 ${getVariantClass()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
