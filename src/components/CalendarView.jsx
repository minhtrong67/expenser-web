import { useMemo, useState } from 'react';
import Icon from './ui/Icon';
import IconButton from './ui/IconButton';
import Emoji from './ui/Emoji';
import Modal from './ui/Modal';
import EmptyState from './ui/EmptyState';
import { CalendarSkeleton } from './ui/Skeleton';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../i18n';
import { useSessionState } from '../hooks/useSessionState';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import { formatMoney, formatDate, formatTime, formatCompactMoney, formatMonthYear } from '../utils/format';

export default function CalendarView() {
  const { t } = useI18n();
  const { transactions, getCategory, getWallet, loading } = useData();
  // Remembered across page changes; stored as a timestamp (JSON-safe).
  const [cursorTs, setCursorTs] = useSessionState('calendar.cursor', () => Date.now());
  const [selectedDay, setSelectedDay] = useState(null);

  const cursor = useMemo(() => new Date(cursorTs), [cursorTs]);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const dayMap = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      if (tx.type === 'transfer' || tx.date.getFullYear() !== year || tx.date.getMonth() !== month) return;
      const d = tx.date.getDate();
      if (!map[d]) map[d] = { income: 0, expense: 0, items: [] };
      map[d][tx.type === 'income' ? 'income' : 'expense'] += tx.amount;
      map[d].items.push(tx);
    });
    return map;
  }, [transactions, year, month]);

  const monthTotals = useMemo(
    () => Object.values(dayMap).reduce((acc, d) => ({ income: acc.income + d.income, expense: acc.expense + d.expense }), { income: 0, expense: 0 }),
    [dayMap],
  );

  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const weekdays = t('calendar.weekdays').split(',');

  const changeMonth = (delta) => setCursorTs(new Date(year, month + delta, 1).getTime());
  const selectedItems = selectedDay ? [...(dayMap[selectedDay]?.items || [])].sort((a, b) => b.date - a.date) : [];

  const selectedTotals = selectedDay ? dayMap[selectedDay] || { income: 0, expense: 0 } : { income: 0, expense: 0 };

  if (loading) return <CalendarSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-2">
        <IconButton icon="chevron_left" label={t('stats.prev')} onClick={() => changeMonth(-1)} />
        <button onClick={() => setCursorTs(Date.now())} className="state-layer flex flex-col items-center rounded-lg px-4 py-1">
          <span className="text-title-md text-on-surface">{formatMonthYear(cursor)}</span>
          {!isCurrentMonth && <span className="text-label-sm text-brand">{t('calendar.today')}</span>}
        </button>
        <IconButton icon="chevron_right" label={t('stats.next')} onClick={() => changeMonth(1)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-income-container p-4 text-on-income-container">
          <Icon name="arrow_upward" size={22} />
          <div className="min-w-0">
            <p className="text-label-md opacity-80">{t('calendar.monthIncome')}</p>
            <p className="wrap-any text-title-md font-bold tabular-nums">{formatMoney(monthTotals.income)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-expense-container p-4 text-on-expense-container">
          <Icon name="arrow_downward" size={22} />
          <div className="min-w-0">
            <p className="text-label-md opacity-80">{t('calendar.monthExpense')}</p>
            <p className="wrap-any text-title-md font-bold tabular-nums">{formatMoney(monthTotals.expense)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-3 sm:p-5">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-label-md text-on-surface-variant">
          {weekdays.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const data = dayMap[day];
            const isToday = isCurrentMonth && today.getDate() === day;
            const tone = !data ? '' : data.income - data.expense >= 0 ? 'bg-income-container/70 text-on-income-container' : 'bg-expense-container/70 text-on-expense-container';
            return (
              <button
                key={day}
                onClick={() => data && setSelectedDay(day)}
                disabled={!data}
                aria-label={`${day}`}
                className={`state-layer flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-center transition-colors disabled:cursor-default ${tone} ${
                  isToday ? 'ring-2 ring-brand' : ''
                }`}
              >
                <span className={`text-label-md ${isToday ? 'font-bold text-brand' : data ? '' : 'text-on-surface-variant'}`}>{day}</span>
                {data?.income > 0 && <span className="text-[9px] font-bold leading-none sm:text-[10px]">+{formatCompactMoney(data.income)}</span>}
                {data?.expense > 0 && <span className="text-[9px] font-bold leading-none sm:text-[10px]">-{formatCompactMoney(data.expense)}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-outline-variant pt-3 text-label-md text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-income" /> {t('calendar.positiveDay')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-expense" /> {t('calendar.negativeDay')}
          </span>
        </div>
      </div>

      <Modal open={!!selectedDay} onClose={() => setSelectedDay(null)} title={selectedDay ? formatDate(new Date(year, month, selectedDay)) : ''} variant="drawer">
        {selectedItems.length === 0 ? (
          <EmptyState icon="event_busy" text={t('calendar.noTx')} />
        ) : (
          <div className="space-y-3 pb-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-income-container p-3 text-on-income-container">
                <p className="text-label-md opacity-80">{t('tx.income')}</p>
                <p className="wrap-any text-title-sm font-bold tabular-nums">{formatMoney(selectedTotals.income)}</p>
              </div>
              <div className="rounded-2xl bg-expense-container p-3 text-on-expense-container">
                <p className="text-label-md opacity-80">{t('tx.expense')}</p>
                <p className="wrap-any text-title-sm font-bold tabular-nums">{formatMoney(selectedTotals.expense)}</p>
              </div>
            </div>
          <div className="divide-y divide-outline-variant">
            {selectedItems.map((tx) => {
              const cat = getCategory(tx.categoryId);
              const wallet = getWallet(tx.walletId);
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${cat?.color || '#64748B'}26` }}>
                    <Emoji size={20}>{getCategoryEmoji(cat)}</Emoji>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="wrap-any text-title-sm text-on-surface">
                      {cat?.name || t('common.other')} {tx.note ? `· ${tx.note}` : ''}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {wallet?.name} · {formatTime(tx.date)}
                    </p>
                  </div>
                  <span className={`text-title-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'income' ? '+' : '-'}
                    {formatMoney(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
