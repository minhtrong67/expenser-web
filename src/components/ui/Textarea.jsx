import { forwardRef, useEffect, useId, useRef } from 'react';
import Icon from './Icon';
import { SupportingText } from './Field';

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((r) => {
      if (typeof r === 'function') r(node);
      else if (r) r.current = node;
    });
  };
}

/** Outlined textarea that grows with its content. */
const Textarea = forwardRef(function Textarea(
  { label, error, hint, icon, value, onChange, className = '', id, ...rest },
  ref,
) {
  const innerRef = useRef(null);
  const autoId = useId();
  const inputId = id || autoId;

  function resize(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    resize(innerRef.current);
  }, [value]);

  return (
    <div className={className}>
      <div className={`md-field items-start ${error ? 'md-field-error' : ''}`}>
        {icon && <Icon name={icon} className="mt-4 text-on-surface-variant" />}
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={mergeRefs(innerRef, ref)}
            id={inputId}
            rows={1}
            placeholder=" "
            value={value}
            onChange={(e) => {
              resize(e.target);
              onChange?.(e);
            }}
            className="md-input"
            {...rest}
          />
          {label && (
            <label htmlFor={inputId} className="md-label">
              {label}
            </label>
          )}
        </div>
      </div>
      <SupportingText error={error} hint={hint} />
    </div>
  );
});

export default Textarea;
