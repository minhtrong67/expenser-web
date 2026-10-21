import { useMemo } from 'react';
import Button from './ui/Button';
import Icon from './ui/Icon';
import TextInput from './ui/TextInput';
import SelectField from './ui/SelectField';
import { useI18n } from '../i18n';

/**
 * Filter accordion: the header toggles the panel (animated height) and shows
 * a reset shortcut whenever a filter is active; the panel has its own reset
 * button too.
 */
export default function TransactionFilters({ filters, setFilters, categories, wallets, open, onToggle, activeCount, onReset }) {
  const { t, locale } = useI18n();
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name, locale)), [categories, locale]);
  const sortedWallets = useMemo(() => [...wallets].sort((a, b) => a.name.localeCompare(b.name, locale)), [wallets, locale]);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-1 pr-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="tx-filters-panel"
          className="state-layer flex h-14 min-w-0 flex-1 items-center gap-3 px-4 text-left"
        >
          <Icon name="tune" size={20} className="text-on-surface-variant" />
          <span className="text-title-sm text-on-surface">{t('filters.title')}</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-label-sm font-bold text-on-primary">{activeCount}</span>
          )}
          <Icon name="expand_more" size={22} className={`ml-auto text-on-surface-variant transition-transform duration-300 ease-emphasized ${open ? 'rotate-180' : ''}`} />
        </button>
        {activeCount > 0 && (
          <Button variant="text" size="sm" icon="filter_alt_off" onClick={onReset} className="shrink-0">
            {t('filters.resetShort')}
          </Button>
        )}
      </div>

      <div id="tx-filters-panel" className={`grid transition-[grid-template-rows] duration-300 ease-emphasized ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className={`flex flex-col gap-3 px-4 pb-4 pt-1 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} inert={!open}>
            <TextInput
              icon="search"
              label={t('filters.search')}
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
              trailing={
                filters.search && (
                  <button type="button" onClick={() => set({ search: '' })} aria-label={t('common.clear')} className="state-layer flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant">
                    <Icon name="close" size={18} />
                  </button>
                )
              }
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SelectField label={t('filters.type')} value={filters.type} onChange={(e) => set({ type: e.target.value })}>
                <option value="all">{t('filters.allTypes')}</option>
                <option value="income">{t('tx.income')}</option>
                <option value="expense">{t('tx.expense')}</option>
                <option value="transfer">{t('tx.transfer')}</option>
              </SelectField>
              <SelectField label={t('tx.category')} value={filters.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
                <option value="all">{t('filters.allCategories')}</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label={t('tx.wallet')} value={filters.walletId} onChange={(e) => set({ walletId: e.target.value })}>
                <option value="all">{t('filters.allWallets')}</option>
                {sortedWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SelectField label={t('filters.sort')} value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
                <option value="desc">{t('tx.sortNewest')}</option>
                <option value="asc">{t('tx.sortOldest')}</option>
              </SelectField>
              <TextInput type="date" label={t('filters.from')} value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} />
              <TextInput type="date" label={t('filters.to')} value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <Button variant="tonal" size="sm" icon="restart_alt" onClick={onReset} disabled={activeCount === 0}>
                {t('filters.reset')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
