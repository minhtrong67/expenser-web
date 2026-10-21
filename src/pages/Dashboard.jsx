import { useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import Icon from '../components/ui/Icon';
import Emoji from '../components/ui/Emoji';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../i18n';
import { useChartTheme } from '../hooks/useChartTheme';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import { formatMoney, formatDateShort, formatTime } from '../utils/format';

function ChangeBadge({ current, previous }) {
  const { t } = useI18n();
  if (!previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-surface/60 px-2 py-0.5 text-label-sm font-bold">
      <Icon name={up ? 'trending_up' : 'trending_down'} size={13} />
      {Math.abs(pct)}%<span className="hidden font-normal sm:inline">&nbsp;{t('dashboard.vsLastMonth')}</span>
    </span>
  );
}

function SummaryCard({ icon, label, value, tone, badge, valueClass = '' }) {
  return (
    <div className={`rounded-xl border border-line p-4 sm:p-5 ${tone}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface/60">
          <Icon name={icon} size={20} />
        </span>
        {badge}
      </div>
      <p className="text-label-md opacity-80">{label}</p>
      <p className={`mt-1 wrap-any text-title-md font-bold tabular-nums leading-tight sm:text-title-lg lg:text-headline-sm ${valueClass}`}>{value}</p>
    </div>
  );
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-title-md text-on-surface">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const chart = useChartTheme();
  const { transactions, categories, wallets, stats, loading, getCategory } = useData();
  const { openAddTx } = useOutletContext();

  // This month's income vs expenses, as the two slices of a donut.
  const incomeExpense = useMemo(() => {
    const total = stats.monthIncome + stats.monthExpense;
    return [
      { key: 'income', name: t('tx.income'), value: stats.monthIncome, color: chart.income, pct: total ? Math.round((stats.monthIncome / total) * 100) : 0 },
      { key: 'expense', name: t('tx.expense'), value: stats.monthExpense, color: chart.expense, pct: total ? Math.round((stats.monthExpense / total) * 100) : 0 },
    ];
  }, [stats.monthIncome, stats.monthExpense, chart.income, chart.expense, t]);

  const categoryBreakdown = useMemo(() => {
    const byCategory = {};
    stats.thisMonthTx.forEach((tx) => {
      if (tx.type === 'expense') byCategory[tx.categoryId] = (byCategory[tx.categoryId] || 0) + tx.amount;
    });
    return Object.entries(byCategory)
      .map(([id, value]) => {
        const cat = getCategory(id);
        return { name: cat?.name || t('common.other'), value, color: cat?.color || '#94A3B8' };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [stats.thisMonthTx, getCategory, t]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  const recent = transactions.slice(0, 6);
  const remaining = stats.monthIncome - stats.monthExpense;

  return (
    <div className="space-y-4 sm:space-y-5">
      {(wallets.length === 0 || categories.length === 0) && (
        <div className="flex items-start gap-3 rounded-2xl bg-tertiary-container p-4 text-body-md text-on-tertiary-container">
          <Icon name="info" className="mt-0.5" />
          <span>{t('dashboard.initializing')}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SummaryCard icon="account_balance_wallet" label={t('dashboard.totalBalance')} value={formatMoney(stats.totalBalance)} tone="bg-primary-container text-on-primary-container" />
        <SummaryCard
          icon="arrow_upward"
          label={t('dashboard.monthIncome')}
          value={formatMoney(stats.monthIncome)}
          tone="bg-income-container text-on-income-container"
          badge={<ChangeBadge current={stats.monthIncome} previous={stats.lastMonthIncome} />}
        />
        <SummaryCard
          icon="arrow_downward"
          label={t('dashboard.monthExpense')}
          value={formatMoney(stats.monthExpense)}
          tone="bg-expense-container text-on-expense-container"
          badge={<ChangeBadge current={stats.monthExpense} previous={stats.lastMonthExpense} />}
        />
        <SummaryCard icon="savings" label={t('dashboard.remaining')} value={formatMoney(remaining)} tone="bg-tertiary-container text-on-tertiary-container" valueClass={remaining < 0 ? 'text-expense' : ''} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <Card title={t('dashboard.incomeExpense')}>
          {stats.monthIncome + stats.monthExpense === 0 ? (
            <EmptyState icon="donut_large" text={t('dashboard.noMonthTx')} />
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={incomeExpense} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={incomeExpense.every((x) => x.value > 0) ? 3 : 0} stroke="none" isAnimationActive={false}>
                      {incomeExpense.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...chart.tooltip} formatter={(v) => formatMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
                  <span className="text-label-md text-on-surface-variant">{t('dashboard.remaining')}</span>
                  <span className={`wrap-any text-title-md font-bold tabular-nums ${remaining < 0 ? 'text-expense' : 'text-on-surface'}`}>{formatMoney(remaining)}</span>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {incomeExpense.map((x) => (
                  <li key={x.key} className="flex items-center justify-between gap-3 text-body-md">
                    <span className="flex min-w-0 items-center gap-2 text-on-surface-variant">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: x.color }} />
                      <span className="wrap-any">{x.name}</span>
                      <span className="text-label-md">({x.pct}%)</span>
                    </span>
                    <span className="font-medium tabular-nums text-on-surface">{formatMoney(x.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title={t('dashboard.byCategory')}>
          {categoryBreakdown.length === 0 ? (
            <EmptyState icon="donut_large" text={t('dashboard.noExpense')} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2} stroke="none" isAnimationActive={false}>
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...chart.tooltip} formatter={(v) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 space-y-2">
                {categoryBreakdown.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-body-sm">
                    <span className="flex min-w-0 items-center gap-2 text-on-surface-variant">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="wrap-any">{c.name}</span>
                    </span>
                    <span className="font-medium tabular-nums text-on-surface">{formatMoney(c.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-line bg-card lg:col-span-2">
          <div className="flex items-center justify-between px-5 pb-2 pt-5">
            <h3 className="text-title-md text-on-surface">{t('dashboard.recent')}</h3>
            <Link to="/transactions" className="state-layer rounded-lg px-3 py-1.5 text-label-lg text-brand">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon="receipt_long" text={t('dashboard.noTx')} action={{ label: t('tx.addTitle'), onClick: openAddTx }} />
          ) : (
            <ul className="pb-2">
              {recent.map((tx, idx) => {
                const cat = getCategory(tx.categoryId);
                const isTransfer = tx.type === 'transfer';
                return (
                  <li key={tx.id} className="flex animate-slide-up items-center gap-3 px-5 py-3" style={{ animationDelay: `${idx * 40}ms` }}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${cat?.color || '#94A3B8'}26` }}>
                      {isTransfer ? <Icon name="sync_alt" className="text-on-surface-variant" /> : <Emoji size={20}>{getCategoryEmoji(cat)}</Emoji>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="wrap-any text-title-sm text-on-surface">
                        {isTransfer ? t('tx.transfer') : cat?.name || t('common.other')} {tx.note ? `· ${tx.note}` : ''}
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        {formatDateShort(tx.date)} · {formatTime(tx.date)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-title-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-on-surface-variant'}`}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatMoney(tx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Card title={t('dashboard.walletBalances')}>
          <ul className="space-y-3">
            {wallets.map((w) => (
              <li key={w.id} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${w.color}26`, color: w.color }}>
                  <Icon name={w.icon} size={20} />
                </span>
                <span className="flex-1 wrap-any text-body-md text-on-surface-variant">{w.name}</span>
                <span className="text-title-sm font-bold tabular-nums text-on-surface">{formatMoney(w.balance)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
