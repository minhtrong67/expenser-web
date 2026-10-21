import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';
import Emoji from '../components/ui/Emoji';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/Skeleton';
import BudgetFormModal from '../components/BudgetFormModal';
import { EmptyState } from './Dashboard';
import { useData } from '../contexts/DataContext';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import { formatMoney, monthKey } from '../utils/format';

export default function BudgetPage() {
  const { budgets, categories, transactions, getCategory, deleteBudget, loading } = useData();
  const BUDGET_ALERT_THRESHOLD = 80;
  const [month, setMonth] = useState(monthKey(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const monthBudgets = useMemo(() => budgets.filter((b) => b.month === month), [budgets, month]);

  const spentByCategory = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.type === 'expense' && monthKey(t.date) === month)
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return map;
  }, [transactions, month]);

  const totalLimit = monthBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + (spentByCategory[b.categoryId] || 0), 0);

  async function handleDelete() {
    try {
      await deleteBudget(deleteTarget.id);
      toast.success('Đã xóa ngân sách.');
    } catch {
      toast.error('Không thể xóa ngân sách.');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-700 outline-none focus:border-accent-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
        <Button size="sm" icon="add" onClick={() => { setEditing(null); setFormOpen(true); }}>Tạo ngân sách</Button>
      </div>

      {monthBudgets.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">Tổng ngân sách tháng</span>
            <span className="tabular-nums text-zinc-500">{formatMoney(totalSpent)} / {formatMoney(totalLimit)}</span>
          </div>
          <ProgressBar value={totalSpent} max={totalLimit} />
        </div>
      )}

      {monthBudgets.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <EmptyState icon="pie_chart" text="Chưa có ngân sách nào cho tháng này." action={{ label: 'Tạo ngân sách', onClick: () => setFormOpen(true) }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monthBudgets.map((b) => {
            const cat = getCategory(b.categoryId);
            const spent = spentByCategory[b.categoryId] || 0;
            const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
            const over = spent > b.limit;
            const near = !over && pct >= BUDGET_ALERT_THRESHOLD;
            return (
              <div key={b.id} className="rounded-2xl border border-zinc-100 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:shadow-black/20">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}>
                      <Emoji size={19}>{getCategoryEmoji(cat)}</Emoji>
                    </span>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{cat?.name || 'Đã xóa'}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(b); setFormOpen(true); }} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-accent-600 dark:hover:bg-zinc-800">
                      <Icon name="edit" size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(b)} className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
                <ProgressBar value={spent} max={b.limit} />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="tabular-nums text-zinc-500">{formatMoney(spent)} / {formatMoney(b.limit)}</span>
                  <span className={`font-semibold ${over ? 'text-rose-500' : near ? 'text-amber-500' : 'text-emerald-600'}`}>{pct}%</span>
                </div>
                {over && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-500">
                    <Icon name="error" size={14} /> Đã vượt ngân sách {formatMoney(spent - b.limit)}
                  </p>
                )}
                {near && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-500">
                    <Icon name="warning" size={14} /> Sắp đạt hạn mức ngân sách
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BudgetFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editing={editing} currentMonth={month} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} message="Bạn có chắc muốn xóa ngân sách này?" />
    </div>
  );
}

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const over = value > max;
  const near = !over && pct >= 80;
  const color = over ? 'bg-rose-500' : near ? 'bg-amber-500' : 'bg-accent-500';
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
