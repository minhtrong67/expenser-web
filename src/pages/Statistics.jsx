import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import Icon from '../components/ui/Icon';
import IconButton from '../components/ui/IconButton';
import Chip from '../components/ui/Chip';
import ExportMenu from '../components/ui/ExportMenu';
import EmptyState from '../components/ui/EmptyState';
import { ChartSkeleton } from '../components/ui/Skeleton';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../i18n';
import { useSessionState } from '../hooks/useSessionState';
import { useChartTheme } from '../hooks/useChartTheme';
import { formatMoney, formatDateShort, formatMonthYear, formatDayHeader } from '../utils/format';

const RANGES = ['today', 'week', 'month', 'year', 'all'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// The period an anchor date falls into, for the chosen range.
function getPeriod(range, anchorTs) {
  const a = new Date(anchorTs);
  const now = new Date();
  let start;
  let fullEnd;
  if (range === 'today') {
    start = startOfDay(a);
    fullEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
  } else if (range === 'week') {
    const dow = (a.getDay() + 6) % 7; // Monday-based
    start = new Date(a.getFullYear(), a.getMonth(), a.getDate() - dow);
    fullEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
  } else if (range === 'month') {
    start = new Date(a.getFullYear(), a.getMonth(), 1);
    fullEnd = new Date(a.getFullYear(), a.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (range === 'year') {
    start = new Date(a.getFullYear(), 0, 1);
    fullEnd = new Date(a.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(0);
    fullEnd = now;
  }
  return { start, fullEnd, end: fullEnd > now ? now : fullEnd, isCurrent: start <= now && fullEnd >= now };
}

function shiftAnchor(range, anchorTs, delta) {
  const a = new Date(anchorTs);
  if (range === 'today') return new Date(a.getFullYear(), a.getMonth(), a.getDate() + delta).getTime();
  if (range === 'week') return new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7 * delta).getTime();
  if (range === 'month') return new Date(a.getFullYear(), a.getMonth() + delta, 1).getTime();
  return new Date(a.getFullYear() + delta, 0, 1).getTime();
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="animate-fade-in rounded-2xl border border-line bg-card p-5">
      <div className="mb-4">
        <h3 className="text-title-md text-on-surface">{title}</h3>
        {subtitle && <p className="mt-0.5 wrap-any text-body-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

// One labelled progress bar: dot + name on the left, amount + % on the right.
function ProgressRow({ name, color, value, pct }) {
  return (
    <li>
      <div className="mb-1 flex items-center justify-between gap-2 text-body-sm">
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-on-surface">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="wrap-any">{name}</span>
        </span>
        <span className="shrink-0 tabular-nums text-on-surface-variant">
          {formatMoney(value)} · {pct}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest"
        role="progressbar"
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full rounded-full transition-[width] duration-500 ease-emphasized" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </li>
  );
}

export default function StatisticsPage() {
  const { t } = useI18n();
  const chart = useChartTheme();
  const { transactions, categories, getCategory, getWallet, loading } = useData();
  // Remembered across page changes (sessionStorage); the anchor is a timestamp.
  const [range, setRange] = useSessionState('statistics.range', 'month');
  const [anchorTs, setAnchorTs] = useSessionState('statistics.anchor', () => Date.now());
  const [exporting, setExporting] = useState(null);

  // Memoised so downstream useMemo's really are cached (fresh Date objects every render defeated them).
  const period = useMemo(() => getPeriod(range, anchorTs), [range, anchorTs]);
  const { start, end, fullEnd, isCurrent } = period;
  const hasNav = range !== 'all';
  const canGoNext = !isCurrent;

  const periodLabel = useMemo(() => {
    const a = new Date(anchorTs);
    if (range === 'today') return isCurrent ? t('stats.todayLabel', { date: formatDateShort(a) }) : formatDayHeader(a);
    if (range === 'week') return `${formatDateShort(start)} – ${formatDateShort(fullEnd)}/${fullEnd.getFullYear()}`;
    if (range === 'month') return formatMonthYear(a);
    if (range === 'year') return t('stats.yearLabel', { year: a.getFullYear() });
    return t('stats.range.all');
  }, [range, anchorTs, start, fullEnd, isCurrent, t]);

  const shift = (delta) => {
    if (delta > 0 && !canGoNext) return;
    setAnchorTs((ts) => shiftAnchor(range, ts, delta));
  };

  const filtered = useMemo(() => transactions.filter((tx) => tx.type !== 'transfer' && tx.date >= start && tx.date <= end), [transactions, start, end]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  const categoryData = useMemo(() => {
    const map = {};
    filtered.forEach((tx) => {
      if (tx.type === 'expense') map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([id, value]) => {
        const cat = getCategory(id);
        return { name: cat?.name || t('common.other'), value, color: cat?.color || '#94A3B8', pct: total ? Math.round((value / total) * 100) : 0 };
      })
      .sort((a, b) => b.value - a.value);
  }, [filtered, getCategory, t]);

  // Income vs expense as pie slices (zero-value slices are dropped).
  const incomeVsExpense = useMemo(() => {
    const total = totals.income + totals.expense;
    return [
      { name: t('tx.income'), value: totals.income, color: chart.income },
      { name: t('tx.expense'), value: totals.expense, color: chart.expense },
    ]
      .filter((d) => d.value > 0)
      .map((d) => ({ ...d, pct: total ? Math.round((d.value / total) * 100) : 0 }));
  }, [totals, chart.income, chart.expense, t]);

  // Same two figures as progress bars shown under the pie (always both rows, even when one is 0).
  // Expense % is derived from income % so the pair always adds up to exactly 100.
  const incomeExpenseBars = useMemo(() => {
    const total = totals.income + totals.expense;
    const incomePct = total ? Math.round((totals.income / total) * 100) : 0;
    const expensePct = total ? 100 - incomePct : 0;
    return [
      { key: 'income', name: t('tx.income'), value: totals.income, color: chart.income, pct: incomePct },
      { key: 'expense', name: t('tx.expense'), value: totals.expense, color: chart.expense, pct: expensePct },
    ];
  }, [totals, chart.income, chart.expense, t]);

  async function handleExport(format) {
    if (filtered.length === 0) {
      toast.error(t('stats.exportEmpty'));
      return;
    }
    setExporting(format);
    try {
      const { exportRangeReport } = await import('../utils/exportImport');
      await exportRangeReport({ title: periodLabel, start, end, transactions, categories, getCategory, getWallet, format, t });
      toast.success(t('stats.exported'));
    } catch (err) {
      console.error(err);
      toast.error(t('stats.exportError'));
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label={t('stats.rangeLabel')}>
          {RANGES.map((id) => (
            <Chip key={id} selected={range === id} onClick={() => setRange(id)}>
              {t(`stats.range.${id}`)}
            </Chip>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {hasNav && (
            <div className="flex flex-1 items-center justify-between rounded-xl bg-surface-container p-1">
              <IconButton icon="chevron_left" label={t('stats.prev')} variant="tonal" onClick={() => shift(-1)} />
              <button onClick={() => setAnchorTs(Date.now())} disabled={isCurrent} className="state-layer flex min-w-0 flex-col items-center rounded-lg px-4 py-1 disabled:pointer-events-none">
                <span className="wrap-any text-title-sm font-bold text-on-surface">{periodLabel}</span>
                {!isCurrent && <span className="text-label-sm text-brand">{t('stats.backToCurrent')}</span>}
              </button>
              <IconButton icon="chevron_right" label={t('stats.next')} variant="tonal" onClick={() => shift(1)} disabled={!canGoNext} />
            </div>
          )}
          <ExportMenu
            label={t('stats.export')}
            busyId={exporting}
            onSelect={handleExport}
            formats={[
              { id: 'excel', label: 'Excel (.xlsx)', icon: 'table_view' },
              { id: 'pdf', label: 'PDF', icon: 'picture_as_pdf' },
              { id: 'image', label: t('stats.exportImage'), icon: 'image' },
            ]}
            className="sm:w-56"
          />
        </div>
      </div>

      <section className="animate-fade-in rounded-2xl border border-line bg-card p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="min-w-0 rounded-xl bg-surface-container p-3 text-on-surface sm:p-4">
            <p className="flex items-center gap-1 text-label-md text-on-surface-variant">
              <Icon name="receipt_long" size={13} /> {t('stats.transactions')}
            </p>
            <p className="mt-1.5 text-title-lg font-bold tabular-nums sm:text-headline-md">{filtered.length}</p>
          </div>

          <div className="min-w-0 rounded-xl bg-income-container p-3 text-on-income-container sm:p-4">
            <p className="flex items-center gap-1 text-label-md">
              <Icon name="arrow_upward" size={13} /> {t('tx.income')}
            </p>
            <p className="mt-1.5 wrap-any text-title-sm font-bold tabular-nums leading-tight sm:text-title-lg lg:text-headline-sm">{formatMoney(totals.income)}</p>
          </div>

          <div className="min-w-0 rounded-xl bg-expense-container p-3 text-on-expense-container sm:p-4">
            <p className="flex items-center gap-1 text-label-md">
              <Icon name="arrow_downward" size={13} /> {t('tx.expense')}
            </p>
            <p className="mt-1.5 wrap-any text-title-sm font-bold tabular-nums leading-tight sm:text-title-lg lg:text-headline-sm">{formatMoney(totals.expense)}</p>
          </div>
        </div>

        <div
          className={`mt-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-title-sm sm:mt-3 sm:px-4 ${
            totals.net >= 0 ? 'bg-income-container text-on-income-container' : 'bg-expense-container text-on-expense-container'
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Icon name={totals.net >= 0 ? 'trending_up' : 'trending_down'} size={18} />
            <span className="wrap-any">{t('stats.difference')}</span>
          </span>
          <span className="shrink-0 font-bold tabular-nums">
            {totals.net > 0 ? '+' : ''}
            {formatMoney(totals.net)}
          </span>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card">
          <EmptyState icon="bar_chart" text={t('stats.noData')} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title={t('stats.compare')} subtitle={`${t('stats.difference')} ${totals.net >= 0 ? '+' : ''}${formatMoney(totals.net)}`}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={incomeVsExpense} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={2} stroke="none" isAnimationActive={false} label={({ pct }) => (pct >= 4 ? `${pct}%` : '')} labelLine={false} style={{ fontSize: 11, fontWeight: 600 }}>
                    {incomeVsExpense.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...chart.tooltip} formatter={(v, n, { payload }) => [`${formatMoney(v)} (${payload.pct}%)`, payload.name]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>

              {/* Income / expense share as progress bars, right under the pie */}
              <ul className="mt-4 space-y-3 border-t border-line pt-4">
                {incomeExpenseBars.map((b) => (
                  <ProgressRow key={b.key} name={b.name} color={b.color} value={b.value} pct={b.pct} />
                ))}
              </ul>
            </ChartCard>

            <ChartCard title={t('stats.pie')} subtitle={categoryData.length > 0 ? t('stats.pieSubtitle', { total: formatMoney(totals.expense), n: categoryData.length }) : undefined}>
              {categoryData.length === 0 ? (
                <EmptyState icon="donut_large" text={t('stats.noExpense')} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={2} stroke="none" isAnimationActive={false} label={({ pct }) => (pct >= 4 ? `${pct}%` : '')} labelLine={false} style={{ fontSize: 11, fontWeight: 600 }}>
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...chart.tooltip} formatter={(v, n, { payload }) => [`${formatMoney(v)} (${payload.pct}%)`, payload.name]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <ChartCard title={t('stats.categoryPct')} subtitle={categoryData.length > 0 ? t('stats.highest', { name: categoryData[0].name, pct: categoryData[0].pct }) : undefined}>
            {categoryData.length === 0 ? (
              <EmptyState icon="bar_chart" text={t('common.noData')} />
            ) : (
              <ul className="space-y-3">
                {categoryData.map((c) => (
                  <ProgressRow key={c.name} name={c.name} color={c.color} value={c.value} pct={c.pct} />
                ))}
              </ul>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
