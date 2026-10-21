import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import TextInput from '../components/ui/TextInput';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportMenu from '../components/ui/ExportMenu';
import SegmentedButton from '../components/ui/SegmentedButton';
import AuthorCredit from '../components/ui/AuthorCredit';
import { useAuth } from '../contexts/AuthContext';
import { useSettings, THEME_MODES } from '../contexts/SettingsContext';
import { useData } from '../contexts/DataContext';
import { useI18n, LANGUAGES } from '../i18n';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { useSessionState } from '../hooks/useSessionState';
import { isNonEmpty, isStrongPassword } from '../utils/validators';
import { ACCENT_PRESETS, DEFAULT_ACCENT, isValidHex } from '../theme';

const FONT_SIZES = ['sm', 'md', 'lg'];

/**
 * Settings card. With `collapsible` it is an accordion: the header toggles an
 * animated body (open state is remembered for the browser session).
 */
function Section({ id, title, icon, description, collapsible = false, open = true, onToggle, children }) {
  const header = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-title-md text-on-surface">{title}</span>
        {description && <span className="mt-0.5 block text-body-sm text-on-surface-variant">{description}</span>}
      </span>
    </>
  );

  if (!collapsible) {
    return (
      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">{header}</div>
        <div className="flex flex-col gap-4">{children}</div>
      </section>
    );
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`settings-${id}`}
        className="state-layer flex w-full items-center gap-3 p-4 sm:px-5"
      >
        {header}
        <Icon name="expand_more" size={22} className={`shrink-0 text-on-surface-variant transition-transform duration-300 ease-emphasized ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={`settings-${id}`} className={`grid transition-[grid-template-rows] duration-300 ease-emphasized ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className={`flex flex-col gap-4 px-4 pb-5 pt-1 transition-opacity duration-300 sm:px-5 ${open ? 'opacity-100' : 'opacity-0'}`} inert={!open}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Small caption that groups rows inside a section. */
function Group({ children }) {
  return <p className="text-label-md font-semibold text-brand">{children}</p>;
}

function Row({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-title-sm text-on-surface">{label}</p>
        {hint && <p className="mt-0.5 text-body-sm text-on-surface-variant">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const Divider = () => <div className="border-t border-outline-variant" />;

const DEFAULT_OPEN = { account: true, appearance: false, data: false };

function ThemeColorPicker({ value, onChange }) {
  const { t } = useI18n();
  const current = (value || '').toLowerCase();
  const isPreset = ACCENT_PRESETS.some((p) => p.hex.toLowerCase() === current);
  const ring = 'ring-2 ring-brand ring-offset-2 ring-offset-card';
  return (
    <div className="flex flex-wrap items-center gap-3" role="radiogroup" aria-label={t('settings.color')}>
      {ACCENT_PRESETS.map((p) => {
        const active = p.hex.toLowerCase() === current;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(`settings.colors.${p.id}`)}
            title={t(`settings.colors.${p.id}`)}
            onClick={() => onChange(p.hex)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform duration-200 ease-emphasized hover:scale-110 ${active ? ring : ''}`}
            style={{ backgroundColor: p.swatch }}
          >
            {active && <Icon name="check" size={18} />}
          </button>
        );
      })}
      {/* Free colour: any hex via the native colour picker (only its hue is used) */}
      <label
        title={t('settings.colors.custom')}
        className={`relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-outline text-on-surface-variant transition-transform duration-200 ease-emphasized hover:scale-110 ${!isPreset ? ring : ''}`}
        style={!isPreset ? { backgroundColor: value } : undefined}
      >
        <Icon name="colorize" size={18} className={!isPreset ? 'text-white' : ''} />
        <input type="color" value={isPreset ? '#008236' : value} aria-label={t('settings.colors.custom')} onChange={(e) => isValidHex(e.target.value) && onChange(e.target.value.toUpperCase())} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const { user, logout, changePassword } = useAuth();
  const { settings, update, resetSettings } = useSettings();
  const { transactions, categories, loading: dataLoading, getCategory, getWallet, importTransactions, importCategories } = useData();
  const { canInstall, installed, promptInstall } = usePwaInstall();
  // Which accordions are open - remembered while the browser tab lives
  const [openMap, setOpenMap] = useSessionState('settings.open', DEFAULT_OPEN);
  const toggle = (key) => setOpenMap((m) => ({ ...m, [key]: !m[key] }));

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [busy, setBusy] = useState(null); // 'tx-export' | 'cat-export' | 'tx-import' | 'cat-import' | 'all'
  const txFileRef = useRef(null);
  const catFileRef = useRef(null);

  const isGoogleUser = user?.providerData?.[0]?.providerId === 'google.com';
  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  async function handleChangePassword(e) {
    e.preventDefault();
    const errs = {};
    if (!isNonEmpty(pwForm.current)) errs.current = t('settings.pwCurrentRequired');
    if (!isStrongPassword(pwForm.next)) errs.next = t('settings.pwMin');
    if (pwForm.confirm !== pwForm.next) errs.confirm = t('settings.pwMismatch');
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPwSaving(true);
    const res = await changePassword(pwForm.current, pwForm.next);
    setPwSaving(false);
    if (res.success) {
      toast.success(t('settings.pwChanged'));
      setPwForm({ current: '', next: '', confirm: '' });
      setPwOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  async function handleInstallClick() {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (accepted) toast.success(t('settings.installed'));
    else if (!canInstall) toast.error(t('settings.installUnsupported'));
  }

  // Runs an async data task with a busy flag + uniform error toast.
  async function run(key, fn, errorKey) {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      toast.error(t(errorKey));
    } finally {
      setBusy(null);
    }
  }

  const realTx = transactions.filter((tx) => tx.type !== 'transfer');

  function exportTransactions(type) {
    if (realTx.length === 0) return toast.error(t('settings.exportEmpty'));
    return run('tx-export', async () => {
      const { exportCSV, exportExcel, exportJSON } = await import('../utils/exportImport');
      const file = 'expenser-transactions';
      if (type === 'csv') exportCSV(realTx, getCategory, getWallet, file, t);
      if (type === 'excel') await exportExcel(realTx, getCategory, getWallet, file, t);
      if (type === 'json') exportJSON(realTx, getCategory, getWallet, file, t);
      toast.success(t('settings.exported'));
    }, 'settings.exportError');
  }

  function exportCats(type) {
    if (categories.length === 0) return toast.error(t('settings.catExportEmpty'));
    return run('cat-export', async () => {
      const { exportCategories } = await import('../utils/exportImport');
      await exportCategories(categories, type, 'expenser-categories', t);
      toast.success(t('settings.exported'));
    }, 'settings.exportError');
  }

  function exportEverything() {
    if (realTx.length === 0 && categories.length === 0) return toast.error(t('settings.exportEmpty'));
    return run('all', async () => {
      const { exportAll } = await import('../utils/exportImport');
      await exportAll({ transactions, categories, getCategory, getWallet, t });
      toast.success(t('settings.exportAllDone'));
    }, 'settings.exportError');
  }

  async function pickFile(e, key, work) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await run(key, () => work(file), 'settings.importError');
  }

  const importTx = (e) =>
    pickFile(e, 'tx-import', async (file) => {
      const { parseImportFile } = await import('../utils/exportImport');
      const { rows, errors } = await parseImportFile(file, t);
      const imported = await importTransactions(rows);
      if (imported > 0) toast.success(t('settings.imported', { n: imported }));
      if (errors.length) toast.error(t('settings.importSkipped', { n: errors.length }));
      if (rows.length === 0 && errors.length === 0) toast.error(t('settings.importEmpty'));
    });

  const importCats = (e) =>
    pickFile(e, 'cat-import', async (file) => {
      const { parseCategoryFile } = await import('../utils/exportImport');
      const { rows, errors } = await parseCategoryFile(file, t);
      const added = await importCategories(rows);
      if (added > 0) toast.success(t('settings.catImported', { n: added }));
      else if (errors.length === 0) toast(t('settings.catImportNone'));
      if (errors.length) toast.error(t('settings.importSkipped', { n: errors.length }));
    });

  const txFormats = [
    { id: 'csv', label: 'CSV', icon: 'description' },
    { id: 'excel', label: 'Excel (.xlsx)', icon: 'table_view' },
    { id: 'json', label: 'JSON', icon: 'code' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-3 pb-4 sm:space-y-4">
      {!installed && (
        <section className="relative overflow-hidden rounded-2xl border border-brand/20 bg-primary-container p-5 text-on-primary-container sm:p-6">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Icon name="install_mobile" size={24} />
              </span>
              <div>
                <h2 className="text-title-md">{t('settings.installTitle')}</h2>
                <p className="mt-1 max-w-md text-body-md opacity-85">{isIos && !canInstall ? t('settings.installIos') : t('settings.installDesc')}</p>
              </div>
            </div>
            {(canInstall || !isIos) && (
              <Button onClick={handleInstallClick} loading={installing} icon="download" className="shrink-0">
                {t('settings.installNow')}
              </Button>
            )}
          </div>
        </section>
      )}

      <Section id="account" collapsible open={!!openMap.account} onToggle={() => toggle('account')} title={t('settings.account')} icon="person" description={t('settings.accountDesc')}>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-title-lg font-bold text-on-primary-container">
            {user?.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : (user?.displayName || user?.email || '?')[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="wrap-any text-title-md text-on-surface">{user?.displayName || t('settings.noName')}</p>
            <p className="wrap-any text-body-sm text-on-surface-variant">{user?.email}</p>
          </div>
        </div>

        {!isGoogleUser && (
          <>
            <Divider />
            <Row label={t('settings.password')} hint={t('settings.passwordHint')}>
              <Button variant="outlined" size="sm" onClick={() => setPwOpen((o) => !o)}>
                {pwOpen ? t('common.close') : t('settings.changePassword')}
              </Button>
            </Row>
            {pwOpen && (
              <form onSubmit={handleChangePassword} className="grid animate-slide-up grid-cols-1 gap-4 rounded-2xl bg-surface-container p-4" noValidate>
                <TextInput type="password" icon="lock" label={t('settings.pwCurrent')} value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} error={pwErrors.current} autoComplete="current-password" />
                <TextInput type="password" icon="lock_reset" label={t('settings.pwNew')} hint={t('settings.pwMinHint')} value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} error={pwErrors.next} autoComplete="new-password" />
                <TextInput type="password" icon="lock_reset" label={t('settings.pwConfirm')} value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} error={pwErrors.confirm} autoComplete="new-password" />
                <Button type="submit" icon="check" loading={pwSaving} className="sm:self-end">
                  {t('common.save')}
                </Button>
              </form>
            )}
          </>
        )}

        <Divider />
        <Row label={t('common.logout')} hint={t('settings.logoutHint')}>
          <Button variant="outlined-danger" size="sm" icon="logout" onClick={() => setLogoutOpen(true)}>
            {t('common.logout')}
          </Button>
        </Row>
      </Section>

      <Section title={t('settings.language')} icon="translate" description={t('settings.languageDesc')}>
        <SegmentedButton ariaLabel={t('settings.language')} value={settings.language} onChange={(language) => update({ language })} options={LANGUAGES.map((l) => ({ id: l.id, label: l.label }))} />
      </Section>

      <Section id="appearance" collapsible open={!!openMap.appearance} onToggle={() => toggle('appearance')} title={t('settings.appearance')} icon="palette" description={t('settings.appearanceDesc')}>
        <div>
          <p className="mb-2 text-title-sm text-on-surface">{t('settings.mode')}</p>
          <SegmentedButton ariaLabel={t('settings.mode')} value={settings.themeMode} onChange={(themeMode) => update({ themeMode })} options={THEME_MODES.map((m) => ({ id: m.id, label: t(m.labelKey), icon: m.icon }))} />
        </div>
        <Divider />
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-title-sm text-on-surface">{t('settings.color')}</p>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">{t('settings.colorHint')}</p>
            </div>
            {settings.accentColor !== DEFAULT_ACCENT && (
              <Button variant="text" size="sm" icon="restart_alt" onClick={() => update({ accentColor: DEFAULT_ACCENT })} className="shrink-0">
                {t('settings.colorReset')}
              </Button>
            )}
          </div>
          <ThemeColorPicker value={settings.accentColor} onChange={(accentColor) => update({ accentColor })} />
        </div>
        <Divider />
        <div>
          <p className="mb-2 text-title-sm text-on-surface">{t('settings.fontSize')}</p>
          <SegmentedButton ariaLabel={t('settings.fontSize')} value={settings.fontSize} onChange={(fontSize) => update({ fontSize })} options={FONT_SIZES.map((id) => ({ id, label: t(`settings.font.${id}`) }))} />
        </div>
        <Divider />
        <Row label={t('settings.reset')} hint={t('settings.resetHint')}>
          <Button variant="outlined-danger" size="sm" icon="restart_alt" onClick={() => setResetOpen(true)}>
            {t('settings.resetBtn')}
          </Button>
        </Row>
      </Section>

      <Section id="data" collapsible open={!!openMap.data} onToggle={() => toggle('data')} title={t('settings.data')} icon="apps" description={t('settings.dataDesc')}>
        <Group>{t('settings.dataTransactions')}</Group>
        <p className="-mt-2 text-body-sm text-on-surface-variant">{t('settings.importHint')}</p>
        <div className="grid grid-cols-2 gap-3">
          <ExportMenu label={t('settings.export')} variant="tonal" align="left" busyId={busy === 'tx-export' ? 'x' : null} disabled={dataLoading || !!busy} onSelect={exportTransactions} formats={txFormats} />
          <input ref={txFileRef} type="file" accept=".csv,.xlsx,.json" className="hidden" onChange={importTx} />
          <Button variant="tonal" icon="upload_file" loading={busy === 'tx-import'} disabled={dataLoading || !!busy} onClick={() => txFileRef.current?.click()}>
            {t('settings.import')}
          </Button>
        </div>

        <Divider />
        <Group>{t('settings.dataCategories')}</Group>
        <p className="-mt-2 text-body-sm text-on-surface-variant">{t('settings.catImportHint')}</p>
        <div className="grid grid-cols-2 gap-3">
          <ExportMenu label={t('settings.export')} variant="tonal" align="left" busyId={busy === 'cat-export' ? 'x' : null} disabled={dataLoading || !!busy} onSelect={exportCats} formats={txFormats} />
          <input ref={catFileRef} type="file" accept=".csv,.xlsx,.json" className="hidden" onChange={importCats} />
          <Button variant="tonal" icon="upload_file" loading={busy === 'cat-import'} disabled={dataLoading || !!busy} onClick={() => catFileRef.current?.click()}>
            {t('settings.import')}
          </Button>
        </div>

        <Divider />
        <Group>{t('settings.dataBackup')}</Group>
        <p className="-mt-2 text-body-sm text-on-surface-variant">{t('settings.exportAllHint')}</p>
        <Button icon="download" loading={busy === 'all'} disabled={dataLoading || !!busy} onClick={exportEverything} className="w-full">
          {t('settings.exportAllBtn')}
        </Button>
      </Section>

      <Section title={t('settings.about')} icon="info" description={t('settings.aboutDesc')}>
        <Row label={t('settings.landing')} hint={t('settings.landingHint')}>
          <a
            href="/landing.html"
            target="_blank"
            rel="noopener noreferrer"
            className="state-layer inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-secondary-container px-3 text-label-lg text-on-secondary-container"
          >
            <Icon name="open_in_new" size={18} />
            {t('settings.landingOpen')}
          </a>
        </Row>
        <Divider />
        <Row label={t('settings.version')}>
          <span className="text-body-md text-on-surface-variant">Expenser · MIT</span>
        </Row>
      </Section>

      {/* The only place the author / AI credit appears in the app */}
      <AuthorCredit />

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
            setLogoutOpen(false);
          }
        }}
        loading={loggingOut}
        confirmText={t('common.logout')}
        confirmIcon="logout"
        message={t('settings.logoutConfirm')}
      />
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetSettings();
          setResetOpen(false);
          toast.success(t('settings.resetDone'));
        }}
        danger={false}
        confirmText={t('settings.resetBtn')}
        confirmIcon="restart_alt"
        message={t('settings.resetConfirm')}
      />
    </div>
  );
}
