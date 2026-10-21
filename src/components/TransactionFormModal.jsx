import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './ui/Modal';
import Button from './ui/Button';
import MoneyInput from './ui/MoneyInput';
import TextInput from './ui/TextInput';
import Textarea from './ui/Textarea';
import ChoiceSelect from './ui/ChoiceSelect';
import SegmentedButton from './ui/SegmentedButton';
import Emoji from './ui/Emoji';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useT, useI18n } from '../i18n';
import { useRecentEntries } from '../hooks/useRecentEntries';
import { validateTransaction, trimValue } from '../utils/validators';
import { toInputDateTimeLocal, formatNumber } from '../utils/format';
import { getCategoryEmoji } from '../utils/categoryEmoji';

function emptyForm() {
  return { type: 'expense', amount: '', categoryId: '', walletId: '', datetime: toInputDateTimeLocal(new Date()), note: '' };
}

export default function TransactionFormModal({ open, onClose, editingTx }) {
  const t = useT();
  const { locale } = useI18n();
  const { categories, wallets, getCategory, addTransaction, updateTransaction } = useData();
  const { user } = useAuth();
  const { forType, remember } = useRecentEntries(user?.uid);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingTx) {
      setForm({
        type: editingTx.type,
        amount: editingTx.amount,
        categoryId: editingTx.categoryId,
        walletId: editingTx.walletId,
        datetime: toInputDateTimeLocal(editingTx.date),
        note: editingTx.note || '',
      });
    } else {
      setForm({ ...emptyForm(), walletId: wallets[0]?.id || '' });
    }
    setErrors({});
    // Only re-initialise when the dialog opens / the edited item changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingTx]);

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.type === form.type)
        .map((c) => ({ id: c.id, name: c.name, emoji: getCategoryEmoji(c), color: c.color }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [categories, form.type, locale],
  );

  const walletOptions = useMemo(
    () => wallets.map((w) => ({ id: w.id, name: w.name, icon: w.icon, color: w.color })).sort((a, b) => a.name.localeCompare(b.name, locale)),
    [wallets, locale],
  );

  function setType(type) {
    setForm((f) => ({ ...f, type, categoryId: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, note: trimValue(form.note), date: new Date(form.datetime) };
    const { valid, errors: errs } = validateTransaction(payload, t);
    setErrors(errs);
    if (!valid) return;
    setSaving(true);
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, payload, editingTx);
        toast.success(t('tx.updated'));
      } else {
        await addTransaction(payload);
        remember(payload);
        toast.success(t('tx.added'));
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t('tx.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const recentForType = !editingTx ? forType(form.type) : [];

  // Quick-fill sets amount/category/wallet only - date & time always stay "now".
  function applyRecent(entry) {
    setForm((f) => ({ ...f, categoryId: entry.categoryId, walletId: entry.walletId, amount: entry.amount, datetime: toInputDateTimeLocal(new Date()) }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTx ? t('tx.editTitle') : t('tx.addTitle')}
      variant="sheet"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="text" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="transaction-form" icon="check" loading={saving}>
            {editingTx ? t('common.save') : t('common.add')}
          </Button>
        </div>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="flex flex-col gap-5 pb-2" noValidate>
        <SegmentedButton
          ariaLabel={t('tx.type')}
          value={form.type}
          onChange={setType}
          options={[
            { id: 'expense', label: t('tx.expense'), icon: 'arrow_downward', activeClass: 'bg-expense-container text-on-expense-container' },
            { id: 'income', label: t('tx.income'), icon: 'arrow_upward', activeClass: 'bg-income-container text-on-income-container' },
          ]}
        />

        {recentForType.length > 0 && (
          <div>
            <p className="mb-2 text-label-md text-on-surface-variant">{t('tx.recent')}</p>
            {/* Two rows that fill column by column and scroll sideways together
                (a single item stays on one row so no empty gap is left) */}
            <div className={`no-scrollbar -mx-4 grid auto-cols-max grid-flow-col ${recentForType.length > 1 ? 'grid-rows-2' : 'grid-rows-1'} gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-6 sm:px-6`}>
              {recentForType.map((r, idx) => {
                const cat = getCategory(r.categoryId);
                return (
                  <button
                    key={`${r.categoryId}-${r.amount}-${r.note}-${idx}`}
                    type="button"
                    onClick={() => applyRecent(r)}
                    className="state-layer flex h-8 items-center gap-2 whitespace-nowrap rounded-lg border border-outline px-3 text-label-md text-on-surface-variant"
                  >
                    <Emoji size={15}>{getCategoryEmoji(cat)}</Emoji>
                    <span>{cat?.name || t('common.other')}</span>
                    <span className="font-bold tabular-nums text-on-surface">{formatNumber(r.amount)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <MoneyInput label={t('tx.amount')} value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} error={errors.amount} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChoiceSelect
            label={t('tx.category')}
            required
            options={categoryOptions}
            value={form.categoryId}
            onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
            error={errors.categoryId}
            emptyLabel={t('tx.noCategory')}
          />
          <ChoiceSelect
            label={t('tx.wallet')}
            required
            options={walletOptions}
            value={form.walletId}
            onChange={(v) => setForm((f) => ({ ...f, walletId: v }))}
            error={errors.walletId}
            emptyLabel={t('tx.noWallet')}
          />
        </div>

        <TextInput
          type="datetime-local"
          label={t('tx.datetime')}
          required
          icon="event"
          max={toInputDateTimeLocal(new Date())}
          value={form.datetime}
          onChange={(e) => setForm((f) => ({ ...f, datetime: e.target.value }))}
          error={errors.date}
        />

        <Textarea
          label={t('tx.note')}
          icon="edit_note"
          hint={t('tx.noteHint')}
          error={errors.note}
          value={form.note}
          maxLength={200}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          onBlur={(e) => setForm((f) => ({ ...f, note: e.target.value.trim() }))}
        />
      </form>
    </Modal>
  );
}
