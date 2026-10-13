import React, { forwardRef } from 'react';

export const Select = forwardRef(({ 
  label, 
  error, 
  options, 
  className = '', 
  id,
  placeholder = 'Select an option',
  ...props 
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-950 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-shadow ${
          error ? 'border-error-700 focus:ring-error-700' : ''
        } ${className}`}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-error-700 font-medium">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
