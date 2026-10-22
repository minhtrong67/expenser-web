/** @type {import('tailwindcss').Config} */

// Colour roles (bg-surface, text-on-surface-variant, bg-primary-container ...)
// are all declared in src/theme/theme.css (the single colour file).
// They are full CSS colours (oklch / color-mix), so opacity modifiers such as
// `bg-on-surface/12` are applied with color-mix instead of the rgb() alpha slot.
const role = (name) => `color-mix(in oklab, var(--md-${name}) calc(<alpha-value> * 100%), transparent)`;

const ROLES = [
  'primary', 'on-primary', 'primary-container', 'on-primary-container',
  'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
  'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
  'error', 'on-error', 'error-container', 'on-error-container',
  'background', 'on-background',
  'surface', 'on-surface', 'surface-variant', 'on-surface-variant',
  'outline', 'outline-variant', 'shadow', 'scrim',
  'inverse-surface', 'inverse-on-surface', 'inverse-primary', 'surface-tint',
  'surface-dim', 'surface-bright',
  'surface-container-lowest', 'surface-container-low', 'surface-container',
  'surface-container-high', 'surface-container-highest',
  // Semantic money colours
  'income', 'on-income', 'income-container', 'on-income-container',
  'expense', 'on-expense', 'expense-container', 'on-expense-container',
];

// Raw tokens from theme.css, for the minimalist surfaces:
//   card / popover = panels, line = hairline borders, brand = readable accent (text, icons, focus).
const token = (name) => `color-mix(in oklab, var(--${name}) calc(<alpha-value> * 100%), transparent)`;
const EXTRA_COLORS = {
  card: token('card'),
  popover: token('popover'),
  line: token('border'),
  brand: token('brand'),
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
      },
      colors: { ...Object.fromEntries(ROLES.map((r) => [r, role(r)])), ...EXTRA_COLORS },
      // Type scale
      fontSize: {
        'display-sm': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '0' }],
        'headline-lg': ['2rem', { lineHeight: '2.5rem', letterSpacing: '0' }],
        'headline-md': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '0' }],
        'headline-sm': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0' }],
        'title-lg': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        'title-md': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0', fontWeight: '500' }],
        'title-sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '500' }],
        'label-lg': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '500' }],
        'label-md': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0', fontWeight: '500' }],
        'label-sm': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0', fontWeight: '500' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'body-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
      },
      // Radii follow --radius (0.625rem) from the theme: calmer corners than Material's pills.
      borderRadius: {
        sm: 'calc(var(--radius) - 6px)',
        DEFAULT: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 4px)',
        lg: 'calc(var(--radius) - 2px)',
        xl: 'var(--radius)',
        '2xl': 'calc(var(--radius) + 2px)',
        '3xl': 'calc(var(--radius) + 4px)',
        '4xl': 'calc(var(--radius) + 6px)',
      },
      // Minimalist: depth comes from hairline borders; shadows are only for floating layers.
      boxShadow: {
        'elev-1': '0 1px 2px 0 rgb(var(--shadow-color) / 0.05)',
        'elev-2': '0 4px 12px -2px rgb(var(--shadow-color) / 0.10), 0 2px 4px -2px rgb(var(--shadow-color) / 0.06)',
        'elev-3': '0 16px 40px -8px rgb(var(--shadow-color) / 0.22), 0 4px 10px -4px rgb(var(--shadow-color) / 0.10)',
      },
      transitionTimingFunction: {
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        'emphasized-decel': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        'emphasized-accel': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'fade-through': {
          '0%': { opacity: 0, transform: 'scale(0.98) translateY(4px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'sheet-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.92)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'menu-in': {
          '0%': { opacity: 0, transform: 'scale(0.95) translateY(-4px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.2, 0, 0, 1)',
        'fade-through': 'fade-through 300ms cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'slide-up': 'slide-up 350ms cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'sheet-up': 'sheet-up 350ms cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'sheet-right': 'sheet-right 350ms cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'scale-in': 'scale-in 220ms cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'menu-in': 'menu-in 160ms cubic-bezier(0.05, 0.7, 0.1, 1) both',
        shimmer: 'shimmer 1.6s infinite linear',
      },
    },
  },
  plugins: [],
};
