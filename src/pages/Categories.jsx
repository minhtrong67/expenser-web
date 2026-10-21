import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Emoji from '../components/ui/Emoji';
import TextInput from '../components/ui/TextInput';
import SegmentedButton from '../components/ui/SegmentedButton';
import Fab from '../components/ui/Fab';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SwipeableItem, { ItemActions } from '../components/ui/SwipeableItem';
import { TableSkeleton } from '../components/ui/Skeleton';
import CategoryFormModal from '../components/CategoryFormModal';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../i18n';
import { useSessionState } from '../hooks/useSessionState';
import { getCategoryEmoji } from '../utils/categoryEmoji';

export default function CategoriesPage() {
  const { t, locale } = useI18n();
  const { categories, transactions, deleteCategory, loading } = useData();
  // Remembered across page changes (sessionStorage)
  const [tab, setTab] = useSessionState('categories.tab', 'expense');
  const [search, setSearch] = useSessionState('categories.search', '');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .filter((c) => c.type === tab && (!q || c.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [categories, tab, search, locale]);

  // One pass over the transactions instead of one scan per category card.
  const usageByCategory = useMemo(() => {
    const map = new Map();
    transactions.forEach((tx) => map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + 1));
    return map;
  }, [transactions]);

  function openForm(category = null) {
    setEditing(category);
    setFormOpen(true);
  }

  async function handleDelete() {
    const used = usageByCategory.get(deleteTarget.id) || 0;
    if (used > 0) {
      toast.error(t('cat.inUse', { n: used }));
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      toast.success(t('cat.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('cat.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SegmentedButton
        className="sm:max-w-sm"
          ariaLabel={t('cat.type')}
          value={tab}
          onChange={setTab}
          options={[
            { id: 'expense', label: t('cat.expenseTab'), activeClass: 'bg-expense-container text-on-expense-container' },
            { id: 'income', label: t('cat.incomeTab'), activeClass: 'bg-income-container text-on-income-container' },
          ]}
        />

      <TextInput icon="search" label={t('cat.search')} value={search} onChange={(e) => setSearch(e.target.value)} />

      {loading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card">
          {search.trim() ? (
            <EmptyState icon="search_off" text={t('cat.noMatch', { q: search.trim() })} action={{ label: t('common.clearSearch'), onClick: () => setSearch('') }} />
          ) : (
            <EmptyState icon="category" text={t('cat.empty')} action={{ label: t('cat.addShort'), onClick: () => openForm() }} />
          )}
        </div>
      ) : (
        <>
          <p className="px-1 text-body-sm text-on-surface-variant">{t('common.swipeHint')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c, idx) => (
              <SwipeableItem key={c.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }} onEdit={() => openForm(c)} onDelete={() => setDeleteTarget(c)}>
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 transition-colors duration-200 hover:bg-surface-container">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${c.color}26`, color: c.color }}>
                    <Emoji size={24}>{getCategoryEmoji(c)}</Emoji>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="wrap-any text-title-sm text-on-surface">{c.name}</p>
                    <p className="text-body-sm text-on-surface-variant">{t('cat.usage', { n: usageByCategory.get(c.id) || 0 })}</p>
                  </div>
                  <ItemActions onEdit={() => openForm(c)} onDelete={() => setDeleteTarget(c)} />
                </div>
              </SwipeableItem>
            ))}
          </div>
        </>
      )}

      <Fab label={t('cat.add')} onClick={() => openForm()} />

      <CategoryFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        editing={editing}
        defaultType={tab}
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} message={t('cat.confirmDelete', { name: deleteTarget?.name || '' })} />
    </div>
  );
}
