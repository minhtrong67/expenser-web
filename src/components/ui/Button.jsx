import Icon from './Icon';

// Minimalist button types: flat fills, hairline outlines, no elevation
const VARIANTS = {
  filled: 'bg-primary text-on-primary',
  tonal: 'bg-secondary-container text-on-secondary-container',
  outlined: 'border border-outline bg-background text-on-surface',
  text: 'text-on-surface',
  danger: 'bg-error text-on-error',
  'outlined-danger': 'border border-outline text-error',
  'text-danger': 'text-error',
};

const SIZES = {
  sm: 'h-9 px-3 text-label-lg',
  md: 'h-10 px-4 text-label-lg',
  lg: 'h-12 px-6 text-title-sm',
};

export default function Button({
  children,
  variant = 'filled',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`state-layer inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-colors duration-200 ease-emphasized disabled:cursor-not-allowed disabled:bg-on-surface/10 disabled:text-on-surface/40 disabled:shadow-none disabled:[border-color:transparent] ${VARIANTS[variant]} ${SIZES[size]} ${icon || loading ? 'pl-3' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <Icon name={icon} size={18} />
      ) : null}
      {children}
    </button>
  );
}
