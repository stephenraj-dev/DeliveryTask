import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants: Record<string, string> = {
    default: 'bg-gray-800 text-gray-300 border border-gray-700',
    primary: 'bg-blue-900/50 text-blue-300 border border-blue-800',
    success: 'bg-emerald-900/50 text-emerald-300 border border-emerald-800',
    warning: 'bg-amber-900/50 text-amber-300 border border-amber-800',
    danger: 'bg-red-900/50 text-red-300 border border-red-800',
    info: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-0.5 text-[11px] uppercase tracking-wider',
    md: 'px-3 py-1 text-xs uppercase tracking-wider',
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-full transition-colors duration-200 ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
