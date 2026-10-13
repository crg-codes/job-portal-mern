import React, { forwardRef } from 'react';

export const Textarea = forwardRef(({ 
  label, 
  error, 
  className = '', 
  id,
  rows = 4,
  ...props 
}, ref) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={`flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-950 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-shadow resize-y ${
          error ? 'border-error-700 focus:ring-error-700' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-error-700 font-medium">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
