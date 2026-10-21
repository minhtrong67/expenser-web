import { useId } from 'react';
import Icon from './Icon';

/** Native <select> styled as an outlined field (best picker UX on mobile). */
export default function SelectField({ label, value, onChange, children, className = '' }) {
  const id = useId();
  return (
    <div className={`md-field md-field-floated ${className}`}>
      <div className="relative min-w-0 flex-1">
        <select id={id} value={value} onChange={onChange} className="md-input">
          {children}
        </select>
        <label htmlFor={id} className="md-label">
          {label}
        </label>
      </div>
      <Icon name="expand_more" className="pointer-events-none text-on-surface-variant" />
    </div>
  );
}
