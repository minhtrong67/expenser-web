// Generates a full Material Design 3 colour scheme (light + dark) from a seed
// colour, using Google's official material-color-utilities. This module is
// dynamically imported, so the ~60 kB library only loads when a user picks a
// custom theme colour — the default blue theme ships pre-computed.
import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeTonalSpot,
  MaterialDynamicColors as M,
  customColor,
} from '@material/material-color-utilities';

const ROLES = {
  primary: M.primary, onPrimary: M.onPrimary,
  primaryContainer: M.primaryContainer, onPrimaryContainer: M.onPrimaryContainer,
  secondary: M.secondary, onSecondary: M.onSecondary,
  secondaryContainer: M.secondaryContainer, onSecondaryContainer: M.onSecondaryContainer,
  tertiary: M.tertiary, onTertiary: M.onTertiary,
  tertiaryContainer: M.tertiaryContainer, onTertiaryContainer: M.onTertiaryContainer,
  error: M.error, onError: M.onError,
  errorContainer: M.errorContainer, onErrorContainer: M.onErrorContainer,
  background: M.background, onBackground: M.onBackground,
  surface: M.surface, onSurface: M.onSurface,
  surfaceVariant: M.surfaceVariant, onSurfaceVariant: M.onSurfaceVariant,
  outline: M.outline, outlineVariant: M.outlineVariant,
  shadow: M.shadow, scrim: M.scrim,
  inverseSurface: M.inverseSurface, inverseOnSurface: M.inverseOnSurface,
  inversePrimary: M.inversePrimary,
  surfaceTint: M.primary,
  surfaceDim: M.surfaceDim, surfaceBright: M.surfaceBright,
  surfaceContainerLowest: M.surfaceContainerLowest, surfaceContainerLow: M.surfaceContainerLow,
  surfaceContainer: M.surfaceContainer, surfaceContainerHigh: M.surfaceContainerHigh,
  surfaceContainerHighest: M.surfaceContainerHighest,
};

// Income is the only extra colour (green, so its meaning never shifts with the theme). Expense reuses the theme's own error roles..
export const SEMANTIC = { income: '#2E9E5B' };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateScheme(seedHex) {
  const source = argbFromHex(seedHex);
  const out = {};
  [false, true].forEach((dark) => {
    const scheme = new SchemeTonalSpot(Hct.fromInt(source), dark, 0);
    const roles = {};
    Object.entries(ROLES).forEach(([key, dc]) => {
      roles[key] = hexFromArgb(dc.getArgb(scheme)).toUpperCase();
    });
    Object.entries(SEMANTIC).forEach(([name, hex]) => {
      const c = customColor(source, { name, value: argbFromHex(hex), blend: false });
      const v = dark ? c.dark : c.light;
      roles[name] = hexFromArgb(v.color).toUpperCase();
      roles[`on${cap(name)}`] = hexFromArgb(v.onColor).toUpperCase();
      roles[`${name}Container`] = hexFromArgb(v.colorContainer).toUpperCase();
      roles[`on${cap(name)}Container`] = hexFromArgb(v.onColorContainer).toUpperCase();
    });
    roles.expense = roles.error;
    roles.onExpense = roles.onError;
    roles.expenseContainer = roles.errorContainer;
    roles.onExpenseContainer = roles.onErrorContainer;
    out[dark ? 'dark' : 'light'] = roles;
  });
  return out;
}
