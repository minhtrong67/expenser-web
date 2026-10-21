import { useState } from 'react';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';
import Emoji from '../components/ui/Emoji';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import RecurringFormModal from '../components/RecurringFormModal';
import { EmptyState } from './Dashboard';
import { useData } from '../contexts/DataContext';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import { formatMoney, formatDate } from '../utils/format';

const FREQ_LABEL = { daily: 'Hàng ngày', weekly: 'Hàng tuần', monthly: 'Hàng tháng', yearly: 'Hàng năm' };

export default function RecurringPage() {
  const { recurring, getCategory, getWallet, updateRecurring, deleteRecurring, loading } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function toggleActive(r) {
    try {
      await updateRecurring(r.id, { ...r, active: !r.active });
      toast.success(r.active ? 'Đã tạm dừng.' : 'Đã kích hoạt lại.');
    } catch {
      toast.error('Không thể cập nhật.');
    }
  }

  async function handleDelete() {
    try {
      await deleteRecurring(deleteTarget.id);
      toast.success('Đã xóa giao dịch định kỳ.');
    } catch {
      toast.error('Không thể xóa.');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">Giao dịch sẽ tự động được tạo khi đến kỳ hạn mỗi khi bạn mở ứng dụng.</p>
        <Button size="sm" icon="add" onClick={() => { setEditing(null); setFormOpen(true); }}>Thêm định kỳ</Button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : recurring.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <EmptyState icon="autorenew" text="Chưa có giao dịch định kỳ nào." action={{ label: 'Thêm giao dịch định kỳ', onClick: () => setFormOpen(true) }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {recurring.map((r) => {
            const cat = getCategory(r.categoryId);
            const wallet = getWallet(r.walletId);
            return (
              <div key={r.id} className={`rounded-2xl border bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-zinc-200/60 dark:bg-zinc-900 dark:hover:shadow-black/20 ${r.active ? 'border-zinc-100 dark:border-zinc-800' : 'border-zinc-100 opacity-60 dark:border-zinc-800'}`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}>
                    <Emoji size={22}>{getCategoryEmoji(cat)}</Emoji>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{cat?.name || 'Đã xóa'}</p>
                      <span className={`text-sm font-bold tabular-nums ${r.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {r.type === 'income' ? '+' : '-'}{formatMoney(r.amount)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">{wallet?.name} · {r.note}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <Icon name="autorenew" size={12} className="mr-1 align-middle" />{FREQ_LABEL[r.frequency]}
                      </span>
                      <span className="text-zinc-400">Bắt đầu: {formatDate(r.startDate)}</span>
                      {r.lastRun && <span className="text-zinc-400">· Lần cuối: {formatDate(r.lastRun)}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-50 pt-3 dark:border-zinc-800">
                  <button onClick={() => toggleActive(r)} className={`flex items-center gap-1.5 text-xs font-semibold ${r.active ? 'text-amber-600' : 'text-emerald-600'}`}>
                    <Icon name={r.active ? 'pause_circle' : 'play_circle'} size={16} />
                    {r.active ? 'Tạm dừng' : 'Kích hoạt'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(r); setFormOpen(true); }} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-accent-600 dark:hover:bg-zinc-800">
                      <Icon name="edit" size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(r)} className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecurringFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editing={editing} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} message="Bạn có chắc muốn xóa giao dịch định kỳ này?" />
    </div>
  );
}
