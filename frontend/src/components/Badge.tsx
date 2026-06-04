import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants: Record<string, string> = {
    default: 'bg-gray-100 text-gray-700 border border-gray-200',
    primary: 'bg-[#EBF0FF] text-[#1936A1] border border-[#D6E0FF]',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
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
