import { forwardRef, type InputHTMLAttributes } from 'react';
import s from './Input.module.css';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return <input ref={ref} {...props} className={[s.control, className].filter(Boolean).join(' ')} />;
  },
);
