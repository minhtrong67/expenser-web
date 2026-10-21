import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';
import Emoji from '../components/ui/Emoji';
import Button from '../components/ui/Button';
import SegmentedButton from '../components/ui/SegmentedButton';
import Fab from '../components/ui/Fab';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SwipeableItem, { ItemActions } from '../components/ui/SwipeableItem';
import { TableSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import TransactionFormModal from '../components/TransactionFormModal';
import TransactionFilters from '../components/TransactionFilters';
import CalendarView from '../components/CalendarView';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../i18n';
import { useSessionState } from '../hooks/useSessionState';
import { formatMoney, formatDayHeader, formatTime, dayKey, monthStartInput, monthEndInput, parseLocalDate, parseLocalDateEnd } from '../utils/format';
import { getCategoryEmoji } from '../utils/categoryEmoji';

const PAGE = 60; // transactions rendered per "page" of the list

const defaultFilters = () => ({
  search: '',
  type: 'all',
  categoryId: 'all',
  walletId: 'all',
  dateFrom: monthStartInput(),
  dateTo: monthEndInput(),
  sort: 'desc', // 'desc' = newest first, 'asc' = oldest first
});

export default function TransactionsPage() {
  const { t } = useI18n();
  const { transactions, categories, wallets, stats, getCategory, getWallet, deleteTransaction, loading } = useData();
  const { openAddTx } = useOutletContext();

  // Filters, view, sort and panel state are kept in sessionStorage so they
  // survive navigating to another page and back.
  const [view, setView] = useSessionState('transactions.view', 'list');
  const [filters, setFiltersRaw] = useSessionState('transactions.filters', defaultFilters);
  const [filtersOpen, setFiltersOpen] = useSessionState('transactions.filtersOpen', false);

  const [limit, setLimit] = useState(PAGE);
  const [editingTx, setEditingTx] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilters = useCallback(
    (updater) => {
      setFiltersRaw(updater);
      setLimit(PAGE);
    },
    [setFiltersRaw],
  );

  const defaults = defaultFilters();
  const activeFilterCount = Object.keys(defaults).filter((k) => filters[k] !== defaults[k]).length;

  const filtered = useMemo(() => {
    const fromDate = filters.dateFrom ? parseLocalDate(filters.dateFrom) : null;
    const toDate = filters.dateTo ? parseLocalDateEnd(filters.dateTo) : null;
    const q = filters.search.trim().toLowerCase();
    const list = transactions.filter((tx) => {
      if (filters.type !== 'all' && tx.type !== filters.type) return false;
      if (filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) return false;
      if (filters.walletId !== 'all' && tx.walletId !== filters.walletId && tx.fromWalletId !== filters.walletId && tx.toWalletId !== filters.walletId) return false;
      if (fromDate && tx.date < fromDate) return false;
      if (toDate && tx.date > toDate) return false;
      if (q) {
        const catName = getCategory(tx.categoryId)?.name?.toLowerCase() || '';
        if (!(tx.note || '').toLowerCase().includes(q) && !catName.includes(q)) return false;
      }
      return true;
    });
    return list.sort((a, b) => (filters.sort === 'asc' ? a.date - b.date : b.date - a.date));
  }, [transactions, filters, getCategory]);

  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit]);
  const hasMore = filtered.length > limit;

  // Infinite scroll: reveal the next page when the sentinel comes into view.
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!hasMore || !el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && setLimit((l) => l + PAGE), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, visible.length]);

  // Group the sorted list into day sections with a net total per day.
  const groups = useMemo(() => {
    const map = new Map();
    visible.forEach((tx) => {
      const key = dayKey(tx.date);
      if (!map.has(key)) map.set(key, { key, date: tx.date, items: [], income: 0, expense: 0 });
      const g = map.get(key);
      g.items.push(tx);
      if (tx.type === 'income') g.income += tx.amount;
      else if (tx.type === 'expense') g.expense += tx.amount;
    });
    return Array.from(map.values());
  }, [visible]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget);
      toast.success(t('tx.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('tx.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  const editTx = (tx) => {
    setEditingTx(tx);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-income-container p-4 text-on-income-container">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-income text-on-income">
                <Icon name="arrow_upward" size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-label-md opacity-80">{t('tx.monthIncome')}</p>
                <p className="wrap-any text-title-md font-bold tabular-nums leading-tight sm:text-title-lg">{formatMoney(stats.monthIncome)}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-expense-container p-4 text-on-expense-container">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-expense text-on-expense">
                <Icon name="arrow_downward" size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-label-md opacity-80">{t('tx.monthExpense')}</p>
                <p className="wrap-any text-title-md font-bold tabular-nums leading-tight sm:text-title-lg">{formatMoney(stats.monthExpense)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <SegmentedButton
        className="sm:max-w-xs"
        ariaLabel={t('tx.view')}
        value={view}
        onChange={setView}
        options={[
          { id: 'list', label: t('tx.viewList'), icon: 'receipt_long' },
          { id: 'calendar', label: t('tx.viewCalendar'), icon: 'calendar_month' },
        ]}
      />

      {view === 'calendar' ? (
        <CalendarView />
      ) : (
        <>
          <div>
            <div>
              <TransactionFilters
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                wallets={wallets}
                open={filtersOpen}
                onToggle={() => setFiltersOpen((o) => !o)}
                activeCount={activeFilterCount}
                onReset={() => setFilters(defaultFilters())}
              />
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card">
              {transactions.length > 0 ? (
                <EmptyState
                  icon="filter_alt_off"
                  text={t('tx.noMatch')}
                  action={{
                    label: t('tx.showAll'),
                    onClick: () => {
                      setFilters((f) => ({ ...f, search: '', type: 'all', categoryId: 'all', walletId: 'all', dateFrom: '', dateTo: '' }));
                      setFiltersOpen(true);
                    },
                  }}
                />
              ) : (
                <EmptyState icon="receipt_long" text={t('dashboard.noTx')} action={{ label: t('tx.addTitle'), onClick: openAddTx }} />
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <p className="px-1 text-body-sm text-on-surface-variant">
                {t('tx.resultCount', { n: filtered.length })} · {t('common.swipeHint')}
              </p>
              {groups.map((group) => {
                const net = group.income - group.expense;
                return (
                  <section key={group.key}>
                    <div className="mb-2 flex items-center justify-between gap-2 px-1">
                      <h3 className="text-label-lg uppercase tracking-wide text-on-surface-variant">{formatDayHeader(group.date)}</h3>
                      {(group.income > 0 || group.expense > 0) && (
                        <span className={`text-label-lg font-bold tabular-nums ${net >= 0 ? 'text-income' : 'text-expense'}`}>
                          {net >= 0 ? '+' : '-'}
                          {formatMoney(Math.abs(net))}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {group.items.map((tx) => {
                        const cat = getCategory(tx.categoryId);
                        const wallet = getWallet(tx.walletId) || getWallet(tx.fromWalletId);
                        const isTransfer = tx.type === 'transfer';
                        return (
                          <SwipeableItem
                            key={tx.id}
                            rounded="rounded-2xl"
                            className="cv-auto"
                                                        onEdit={isTransfer ? undefined : () => editTx(tx)}
                            onDelete={isTransfer ? undefined : () => setDeleteTarget(tx)}
                          >
                            <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${cat?.color || '#64748B'}26`, color: cat?.color || '#64748B' }}>
                                {isTransfer ? <Icon name="sync_alt" size={20} /> : <Emoji size={22}>{getCategoryEmoji(cat)}</Emoji>}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="wrap-any text-title-sm text-on-surface">{isTransfer ? t('tx.transfer') : cat?.name || t('common.other')}</p>
                                <p className="wrap-any text-body-sm text-on-surface-variant">
                                  {formatTime(tx.date)} · {wallet?.name || ''}
                                </p>
                                {tx.note && <p className="wrap-any text-body-sm text-on-surface-variant">{tx.note}</p>}
                              </div>
                              <span className={`shrink-0 text-title-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-on-surface-variant'}`}>
                                {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                                {formatMoney(tx.amount)}
                              </span>
                              {!isTransfer && <ItemActions onEdit={() => editTx(tx)} onDelete={() => setDeleteTarget(tx)} />}
                            </div>
                          </SwipeableItem>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  <Button variant="tonal" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                    {t('common.loadMore')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Fab label={t('tx.addTitle')} onClick={openAddTx} />

      <TransactionFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTx(null);
        }}
        editingTx={editingTx}
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} message={t('tx.confirmDelete')} />
    </div>
  );
}
