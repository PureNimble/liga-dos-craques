import { forwardRef, type SelectHTMLAttributes } from 'react';
import s from './Select.module.css';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...props }, ref) {
    return (
      <select ref={ref} {...props} className={[s.control, className].filter(Boolean).join(' ')}>
        {children}
      </select>
    );
  },
);
