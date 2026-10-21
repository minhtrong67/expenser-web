import { useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';

/** Recharts styling derived from the active theme (follows light/dark + custom colour). */
export function useChartTheme() {
  const { colors } = useSettings();
  return useMemo(
    () => ({
      income: colors.income,
      expense: colors.expense,
      primary: colors.brand,
      grid: colors.outlineVariant,
      tick: { fontSize: 11, fill: colors.onSurfaceVariant },
      tooltip: {
        contentStyle: {
          borderRadius: 8,
          border: 'none',
          fontSize: 12,
          background: colors.inverseSurface,
          color: colors.inverseOnSurface,
          boxShadow: '0 4px 16px rgba(0,0,0,.18)',
        },
        itemStyle: { color: colors.inverseOnSurface },
        labelStyle: { color: colors.inverseOnSurface, fontWeight: 600 },
      },
      cursor: { fill: colors.onSurface, fillOpacity: 0.06 },
    }),
    [colors],
  );
}
