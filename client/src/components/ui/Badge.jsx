import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-primary-50 text-primary-800 border-primary-200',
    success: 'bg-success-50 text-success-700 border-success-200', // e.g., Hired, Published
    warning: 'bg-warning-50 text-warning-700 border-warning-200', // e.g., Interview, Draft
    error: 'bg-error-50 text-error-700 border-error-200', // e.g., Rejected, Deleted
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
