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
          borderRadius: 10,
          border: `1px solid ${colors.outlineVariant}`,
          fontSize: 12,
          background: colors.popover,
          color: colors.onSurface,
          boxShadow: '0 8px 24px -8px rgb(var(--shadow-color) / 0.25)',
        },
        itemStyle: { color: colors.onSurface },
        labelStyle: { color: colors.onSurface, fontWeight: 600 },
      },
      cursor: { fill: colors.onSurface, fillOpacity: 0.06 },
    }),
    [colors],
  );
}
