import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle }) => {
  return (
    <div className={`bg-white rounded-xl card-shadow border border-gray-100 overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-5 border-b border-gray-100 bg-white">
          {title && <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-sm font-medium text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
