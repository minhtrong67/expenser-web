import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SwipeableItem, { ItemActions } from '../components/ui/SwipeableItem';
import { CardSkeleton } from '../components/ui/Skeleton';
import WalletFormModal from '../components/WalletFormModal';
import TransferModal from '../components/TransferModal';
import { useData } from '../contexts/DataContext';
import { useT } from '../i18n';
import { formatMoney } from '../utils/format';

export default function WalletsPage() {
  const t = useT();
  const { wallets, transactions, deleteWallet, loading } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const total = wallets.reduce((s, w) => s + (Number(w.balance) || 0), 0);

  const usageByWallet = useMemo(() => {
    const map = new Map();
    const bump = (id) => id && map.set(id, (map.get(id) || 0) + 1);
    transactions.forEach((tx) => {
      bump(tx.walletId);
      bump(tx.fromWalletId);
      bump(tx.toWalletId);
    });
    return map;
  }, [transactions]);

  function openForm(wallet = null) {
    setEditing(wallet);
    setFormOpen(true);
  }

  async function handleDelete() {
    const used = usageByWallet.get(deleteTarget.id) || 0;
    if (used > 0) {
      toast.error(t('wallet.inUse', { n: used }));
      setDeleteTarget(null);
      return;
    }
    if (wallets.length <= 1) {
      toast.error(t('wallet.keepOne'));
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await deleteWallet(deleteTarget.id);
      toast.success(t('wallet.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('wallet.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="flex flex-col gap-4 rounded-2xl border border-brand/20 bg-primary-container p-5 text-on-primary-container sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-label-lg opacity-80">{t('wallet.totalAll')}</p>
          <p className="mt-1 text-headline-sm font-bold tabular-nums sm:text-headline-md">{formatMoney(total)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outlined" icon="sync_alt" className="!border-on-primary-container/40 !text-on-primary-container" onClick={() => setTransferOpen(true)} disabled={wallets.length < 2}>
            {t('wallet.transfer')}
          </Button>
          <Button icon="add" onClick={() => openForm()}>
            {t('wallet.add')}
          </Button>
        </div>
      </section>

      {wallets.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card">
          <EmptyState icon="account_balance_wallet" text={t('wallet.empty')} action={{ label: t('wallet.addFirst'), onClick: () => openForm() }} />
        </div>
      ) : (
        <>
          <p className="px-1 text-body-sm text-on-surface-variant">{t('common.swipeHint')}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((w, idx) => (
              <SwipeableItem key={w.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }} onEdit={() => openForm(w)} onDelete={() => setDeleteTarget(w)}>
                <div className="rounded-2xl border border-line bg-card p-5 transition-colors duration-200 hover:bg-surface-container">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${w.color}26`, color: w.color }}>
                      <Icon name={w.icon} size={24} />
                    </span>
                    <ItemActions onEdit={() => openForm(w)} onDelete={() => setDeleteTarget(w)} />
                  </div>
                  <p className="text-title-sm text-on-surface-variant">{w.name}</p>
                  <p className="mt-1 text-title-lg font-bold tabular-nums text-on-surface">{formatMoney(w.balance)}</p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{t('wallet.usage', { n: usageByWallet.get(w.id) || 0 })}</p>
                </div>
              </SwipeableItem>
            ))}
          </div>
        </>
      )}

      <WalletFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} message={t('wallet.confirmDelete', { name: deleteTarget?.name || '' })} />
    </div>
  );
}
