import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { THEME_MODES, useSettings } from '../contexts/SettingsContext';
import { LANGUAGES, useI18n } from '../i18n';
import { ACCENT_PRESETS } from '../theme';
import { useCountUp, useInView } from '../hooks/useInView';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatMoney, formatNumber, getAmountSuggestions } from '../utils/format';

// ---- small building blocks -----------------------------------------------------------
function Reveal({ delay = 0, className = '', children, as: Tag = 'div' }) {
  const [ref, inView] = useInView();
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`} style={{ '--reveal-delay': `${delay}ms` }}>
      {children}
    </Tag>
  );
}

const BTN = 'state-layer inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-transform duration-200 ease-emphasized active:scale-[0.98]';
const BTN_FILLED = `${BTN} bg-primary text-on-primary`;
const BTN_OUTLINED = `${BTN} border border-outline bg-background text-on-surface`;

function SectionHead({ kicker, title, sub, center = true }) {
  return (
    <Reveal className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className="text-label-lg font-semibold text-brand">{kicker}</p>
      <h2 className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-tight text-on-surface">{title}</h2>
      {sub && <p className="mt-3 text-body-lg text-on-surface-variant">{sub}</p>}
    </Reveal>
  );
}

// ---- navigation ------------------------------------------------------------------------
function Nav({ user }) {
  const { t, lang } = useI18n();
  const { settings, cycleThemeMode, toggleLanguage } = useSettings();
  const mode = THEME_MODES.find((m) => m.id === settings.themeMode) || THEME_MODES[2];
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const links = [
    ['features', t('landing.nav.features')],
    ['demo', t('landing.nav.demo')],
    ['themes', t('landing.nav.themes')],
    ['faq', t('landing.nav.faq')],
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${scrolled || open ? 'border-line bg-background/85 backdrop-blur-md' : 'border-transparent'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <a href="#top" className="mr-auto flex items-center gap-2.5 text-title-lg font-bold tracking-tight text-on-surface" aria-label="Expenser">
          <img src="/icons/icon-192.png" alt="" width="30" height="30" className="h-[30px] w-[30px]" />
          Expenser
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="state-layer rounded-lg px-3 py-2 text-label-lg text-on-surface-variant transition-colors hover:text-on-surface">
              {label}
            </a>
          ))}
        </nav>
        <button onClick={toggleLanguage} aria-label={t('topbar.switchLanguage')} className="state-layer flex h-10 items-center gap-1 rounded-lg px-2.5 text-label-lg text-on-surface-variant">
          <Icon name="translate" size={18} />
          {lang.toUpperCase()}
        </button>
        <button onClick={cycleThemeMode} aria-label={`${t('topbar.themeMode')}: ${t(mode.labelKey)}`} className="state-layer flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant">
          <Icon name={mode.icon} size={20} />
        </button>
        <Link to={user ? '/' : '/login'} className={`${BTN_FILLED} ml-1 hidden h-10 px-4 text-label-lg sm:inline-flex`}>
          {user ? t('landing.openApp') : t('landing.login')}
        </Link>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu" className="state-layer flex h-10 w-10 items-center justify-center rounded-lg text-on-surface md:hidden">
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
      </div>
      {open && (
        <div className="animate-slide-up border-t border-line bg-background px-4 pb-4 pt-2 md:hidden">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="state-layer block rounded-lg px-3 py-3 text-title-sm text-on-surface">
              {label}
            </a>
          ))}
          <Link to={user ? '/' : '/login'} className={`${BTN_FILLED} mt-2 h-11 w-full text-label-lg sm:hidden`}>
            {user ? t('landing.openApp') : t('landing.login')}
          </Link>
        </div>
      )}
    </header>
  );
}

// ---- hero ------------------------------------------------------------------------------
function PhoneMock() {
  const { t } = useI18n();
  const [ref, inView] = useInView({ threshold: 0.2 });
  const balance = useCountUp(33_500_000, inView);
  const bars = [38, 62, 46, 80, 58, 92, 70];
  const rows = [
    ['🍜', t('landing.phone.t1'), '-25.000', 'text-expense'],
    ['💰', t('landing.phone.t2'), '+18.000.000', 'text-income'],
    ['☕', t('landing.phone.t3'), '-45.000', 'text-expense'],
  ];
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[320px]">
      <div className="float-slow rounded-[2.5rem] border border-outline bg-background p-3 shadow-elev-3">
        <div className="overflow-hidden rounded-[2rem] border border-line bg-surface px-4 pb-5 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-title-md font-bold">Expenser</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-label-lg font-semibold text-on-primary-container">M</span>
          </div>
          <div className="rounded-2xl border border-brand/20 bg-primary-container p-4 text-on-primary-container">
            <p className="text-label-md opacity-80">{t('landing.phone.balance')}</p>
            <p className="mt-0.5 text-[1.6rem] font-bold tabular-nums leading-tight">{formatMoney(balance)}</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-line bg-income-container p-3 text-on-income-container">
              <p className="text-label-sm opacity-80">{t('landing.phone.income')}</p>
              <p className="text-title-sm font-bold tabular-nums">21,1M</p>
            </div>
            <div className="rounded-xl border border-line bg-expense-container p-3 text-on-expense-container">
              <p className="text-label-sm opacity-80">{t('landing.phone.expense')}</p>
              <p className="text-title-sm font-bold tabular-nums">9,4M</p>
            </div>
          </div>
          <div className="my-4 flex h-20 items-end gap-1.5" aria-hidden="true">
            {bars.map((h, i) => (
              <span
                key={i}
                className="bar-grow flex-1 rounded-t-md bg-primary"
                style={{ height: `${h}%`, opacity: i % 2 ? 0.55 : 1, animationDelay: inView ? `${200 + i * 90}ms` : '99999s' }}
              />
            ))}
          </div>
          <ul className="space-y-1">
            {rows.map(([emoji, name, amount, color], i) => (
              <li key={name} className="row-in flex items-center gap-3 py-1.5" style={{ animationDelay: inView ? `${700 + i * 160}ms` : '99999s' }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-base">{emoji}</span>
                <span className="flex-1 text-body-md">{name}</span>
                <span className={`text-label-lg font-semibold tabular-nums ${color}`}>{amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="float-slower absolute -left-12 top-[42%] hidden items-center gap-3 rounded-xl border border-line bg-popover px-3.5 py-2.5 shadow-elev-2 sm:flex" aria-hidden="true">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container"><Icon name="notifications_active" size={18} /></span>
        <span>
          <span className="block text-label-lg font-semibold">{t('landing.float1.t')}</span>
          <span className="block text-label-sm text-on-surface-variant">{t('landing.float1.d')}</span>
        </span>
      </div>
      <div className="float-slow absolute -bottom-8 -right-6 hidden items-center gap-3 rounded-xl border border-line bg-popover px-3.5 py-2.5 shadow-elev-2 sm:flex" aria-hidden="true">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-income-container text-on-income-container"><Icon name="trending_down" size={18} /></span>
        <span>
          <span className="block text-label-lg font-semibold">{t('landing.float2.t')}</span>
          <span className="block text-label-sm text-on-surface-variant">{t('landing.float2.d')}</span>
        </span>
      </div>
    </div>
  );
}

function Hero({ user }) {
  const { t } = useI18n();
  const badges = [
    ['wifi_off', t('landing.badge.offline')],
    ['install_mobile', t('landing.badge.pwa')],
    ['language', t('landing.badge.lang')],
    ['brightness_auto', t('landing.badge.dark')],
  ];
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-36">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="landing-glow pointer-events-none absolute inset-x-0 top-0 h-[560px]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28">
        <div className="text-center lg:text-left">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-label-md text-on-surface-variant">
              <span className="pulse-ring h-2 w-2 rounded-full bg-brand" />
              {t('landing.chip')}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-[clamp(2.4rem,6.4vw,4.2rem)] font-bold leading-[1.05] tracking-tight text-on-surface">
              {t('landing.h1a')}
              <span className="block text-brand">{t('landing.h1b')}</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-body-lg text-on-surface-variant sm:text-[1.0625rem] lg:mx-0">{t('landing.lead')}</p>
          </Reveal>
          <Reveal delay={240} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link to={user ? '/' : '/login'} className={`${BTN_FILLED} h-12 px-6 text-title-sm`}>
              {user ? t('landing.openApp') : t('landing.getStarted')}
              <Icon name="arrow_forward" size={18} />
            </Link>
            <a href="#features" className={`${BTN_OUTLINED} h-12 px-6 text-title-sm`}>{t('landing.seeFeatures')}</a>
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3 text-body-md text-on-surface-variant lg:justify-start">
              {badges.map(([icon, label]) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon name={icon} size={16} className="text-brand" />
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <PhoneMock />
        </Reveal>
      </div>
    </section>
  );
}

// ---- features --------------------------------------------------------------------------
const FEATURES = [
  ['bolt', 'f1'],
  ['account_balance_wallet', 'f2'],
  ['bar_chart', 'f3'],
  ['picture_as_pdf', 'f4'],
  ['notifications_active', 'f5'],
  ['calendar_month', 'f6'],
  ['install_mobile', 'f7'],
  ['palette', 'f8'],
  ['shield', 'f9'],
];

function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="scroll-mt-16 border-y border-line bg-card/50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead kicker={t('landing.feat.kicker')} title={t('landing.feat.title')} sub={t('landing.feat.sub')} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([icon, key], i) => (
            <Reveal key={key} delay={(i % 3) * 90}>
              <article className="group h-full rounded-2xl border border-line bg-background p-6 transition-colors duration-300 hover:border-outline hover:bg-card">
                <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container text-on-primary-container transition-transform duration-300 ease-emphasized group-hover:scale-110">
                  <Icon name={icon} size={22} />
                </span>
                <h3 className="text-title-md font-semibold text-on-surface">{t(`landing.${key}.t`)}</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">{t(`landing.${key}.d`)}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- interactive amount demo -----------------------------------------------------------
function AmountDemo() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [digits, setDigits] = useState('');
  const [type, setType] = useState('expense');
  const [focused, setFocused] = useState(false);
  const value = Number(digits || 0);
  const suggestions = getAmountSuggestions(value);
  const cats = type === 'expense' ? [['🍜', 0], ['🚗', 1], ['🛍️', 2], ['🏠', 3]] : [['💰', 0], ['🎁', 1], ['💻', 2], ['📈', 3]];
  const [cat, setCat] = useState(0);
  const bullets = ['landing.demo.b1', 'landing.demo.b2', 'landing.demo.b3'];

  return (
    <section id="demo" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHead center={false} kicker={t('landing.demo.kicker')} title={t('landing.demo.title')} sub={t('landing.demo.sub')} />
          <Reveal delay={120}>
            <ul className="mt-7 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-3 text-body-lg text-on-surface">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container text-on-primary-container"><Icon name="check" size={14} /></span>
                  {t(b)}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <div className="rounded-2xl border border-line bg-card p-5 shadow-elev-2 sm:p-6">
            <div className="mb-5 flex gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-surface-container-highest" />)}
            </div>
            <div role="radiogroup" className="mb-4 flex gap-1 rounded-lg bg-surface-container p-1">
              {['expense', 'income'].map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={type === k}
                  onClick={() => { setType(k); setCat(0); }}
                  className={`state-layer flex-1 rounded-md py-1.5 text-label-lg transition-colors ${type === k ? (k === 'expense' ? 'bg-expense-container text-on-expense-container' : 'bg-income-container text-on-income-container') : 'text-on-surface-variant'}`}
                >
                  {t(`landing.demo.${k}`)}
                </button>
              ))}
            </div>
            <div className={`rounded-xl border bg-background px-4 pb-2 pt-2 transition-shadow ${focused ? 'border-brand shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_20%,transparent)]' : 'border-outline'}`}>
              <label htmlFor="demo-amount" className={`block text-label-sm ${focused ? 'text-brand' : 'text-on-surface-variant'}`}>{t('landing.demo.label')} *</label>
              <div className="flex items-center gap-2">
                <input
                  id="demo-amount"
                  inputMode="numeric"
                  autoComplete="off"
                  value={digits ? formatNumber(value) : ''}
                  placeholder="0"
                  onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="w-full bg-transparent text-title-lg font-medium tabular-nums text-on-surface outline-none placeholder:text-on-surface-variant/50"
                />
                <span className="text-title-md text-on-surface-variant">₫</span>
              </div>
            </div>
            <div className="mt-3 min-h-[2.5rem]">
              {suggestions.length > 0 ? (
                <div role="group" onMouseDown={(e) => e.preventDefault()} className="no-scrollbar flex animate-fade-in gap-2 overflow-x-auto">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => setDigits(String(s))} className="state-layer h-9 shrink-0 rounded-lg border border-line bg-background px-3 text-label-lg tabular-nums text-on-surface">
                      {formatNumber(s)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-body-sm text-on-surface-variant"><Icon name="auto_awesome" size={14} className="text-brand" />{t('landing.demo.hint')}</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              {cats.map(([emoji, i]) => (
                <button key={emoji} type="button" onClick={() => setCat(i)} aria-pressed={cat === i} className={`state-layer flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors ${cat === i ? 'border-brand/50 bg-primary-container' : 'border-line bg-background'}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => navigate('/login')} className={`${BTN_FILLED} mt-5 h-11 w-full text-label-lg`}>
              <Icon name="check" size={18} />
              {t('landing.demo.save')}
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---- themes playground -----------------------------------------------------------------
function Themes() {
  const { t } = useI18n();
  const { settings, update } = useSettings();
  const current = (settings.accentColor || '').toLowerCase();
  const seg = 'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-label-lg transition-colors';
  return (
    <section id="themes" className="scroll-mt-16 border-y border-line bg-card/50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
        <Reveal delay={100} className="order-2 lg:order-1">
          <div className="rounded-2xl border border-line bg-background p-5 shadow-elev-2 sm:p-6">
            <p className="text-label-lg font-semibold text-on-surface">{t('landing.theme.accent')}</p>
            <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-label={t('landing.theme.accent')}>
              {ACCENT_PRESETS.map((p) => {
                const active = p.hex.toLowerCase() === current;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={t(`settings.colors.${p.id}`)}
                    onClick={() => update({ accentColor: p.hex })}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform duration-200 ease-emphasized hover:scale-110 ${active ? 'ring-2 ring-brand ring-offset-2 ring-offset-background' : ''}`}
                    style={{ backgroundColor: p.swatch }}
                  >
                    {active && <Icon name="check" size={18} />}
                  </button>
                );
              })}
            </div>
            <p className="mt-6 text-label-lg font-semibold text-on-surface">{t('landing.theme.mode')}</p>
            <div role="radiogroup" className="mt-3 flex gap-1 rounded-lg bg-surface-container p-1">
              {THEME_MODES.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={settings.themeMode === m.id} onClick={() => update({ themeMode: m.id })} className={`${seg} ${settings.themeMode === m.id ? 'bg-background text-on-surface shadow-elev-1' : 'text-on-surface-variant'}`}>
                  <Icon name={m.icon} size={16} />
                  {t(m.labelKey)}
                </button>
              ))}
            </div>
            <p className="mt-6 text-label-lg font-semibold text-on-surface">{t('landing.theme.lang')}</p>
            <div role="radiogroup" className="mt-3 flex gap-1 rounded-lg bg-surface-container p-1">
              {LANGUAGES.map((l) => (
                <button key={l.id} type="button" role="radio" aria-checked={settings.language === l.id} onClick={() => update({ language: l.id })} className={`${seg} ${settings.language === l.id ? 'bg-background text-on-surface shadow-elev-1' : 'text-on-surface-variant'}`}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-brand/20 bg-primary-container p-4 text-on-primary-container">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary"><Icon name="account_balance_wallet" size={20} /></span>
              <span className="flex-1">
                <span className="block text-label-md opacity-80">{t('landing.phone.balance')}</span>
                <span className="block text-title-md font-bold tabular-nums">{formatMoney(33_500_000)}</span>
              </span>
              <span className="rounded-full bg-primary px-3 py-1 text-label-md text-on-primary">+12%</span>
            </div>
          </div>
        </Reveal>
        <div className="order-1 lg:order-2">
          <SectionHead center={false} kicker={t('landing.theme.kicker')} title={t('landing.theme.title')} sub={t('landing.theme.sub')} />
        </div>
      </div>
    </section>
  );
}

// ---- reminders -------------------------------------------------------------------------
function Reminders() {
  const { t } = useI18n();
  const [ref, inView] = useInView({ threshold: 0.25 });
  const bullets = ['landing.remind.b1', 'landing.remind.b2', 'landing.remind.b3'];
  return (
    <section id="reminders" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHead center={false} kicker={t('landing.remind.kicker')} title={t('landing.remind.title')} sub={t('landing.remind.sub')} />
          <Reveal delay={120}>
            <ul className="mt-7 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-3 text-body-lg text-on-surface">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container text-on-primary-container"><Icon name="check" size={14} /></span>
                  {t(b)}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div ref={ref} className="relative mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-line bg-card p-4 shadow-elev-2" aria-hidden="true">
            <div className={`${inView ? 'notif-in' : 'opacity-0'} overflow-hidden rounded-2xl border border-line bg-background shadow-elev-1`} style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-2 px-4 pt-3 text-label-md text-on-surface-variant">
                <img src="/icons/icon-192.png" alt="" width="18" height="18" className="h-[18px] w-[18px] rounded" />
                <span className="font-medium">{t('landing.remind.app')}</span>
                <span>· 06:00</span>
                <span className="ml-auto">{t('landing.remind.now')}</span>
              </div>
              <div className="px-4 pb-3 pt-2">
                <p className="text-title-sm font-semibold text-on-surface">{t('reminder.n.title')}</p>
                <p className="mt-0.5 text-body-md text-on-surface-variant">{t('reminder.n.b1')}</p>
              </div>
              <img src="/notif-banner.png" alt="" loading="lazy" className="aspect-[2/1] w-full object-cover" />
              <div className="flex gap-2 p-3">
                <span className="flex-1 rounded-lg bg-primary-container py-2 text-center text-label-lg text-on-primary-container">{t('reminder.n.expense')}</span>
                <span className="flex-1 rounded-lg bg-secondary-container py-2 text-center text-label-lg text-on-surface">{t('reminder.n.income')}</span>
              </div>
            </div>
            <div className={`${inView ? 'notif-in' : 'opacity-0'} mt-3 flex items-center gap-3 rounded-2xl border border-line bg-background p-4`} style={{ animationDelay: '550ms' }}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container"><Icon name="notifications_active" size={20} /></span>
              <span className="flex-1">
                <span className="block text-title-sm font-semibold text-on-surface">{t('reminder.title')}</span>
                <span className="block text-body-sm text-on-surface-variant">{t('reminder.time')} · 06:00</span>
              </span>
              <span className="relative h-7 w-12 rounded-full bg-primary"><span className="absolute left-0.5 top-0.5 h-6 w-6 translate-x-5 rounded-full bg-white shadow-elev-1" /></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- how it works / stats --------------------------------------------------------------
function HowItWorks() {
  const { t } = useI18n();
  const stats = [
    ['0₫', t('landing.stat.free')],
    ['2', t('landing.stat.lang')],
    ['3', t('landing.stat.export')],
    ['100%', t('landing.stat.offline')],
  ];
  return (
    <section className="border-y border-line bg-card/50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead kicker={t('landing.how.kicker')} title={t('landing.how.title')} />
        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {['s1', 's2', 's3'].map((k, i) => (
            <Reveal key={k} as="li" delay={i * 100} className="list-none">
              <div className="h-full rounded-2xl border border-line bg-background p-6">
                <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-title-sm font-semibold text-on-primary">{i + 1}</span>
                <h3 className="text-title-md font-semibold text-on-surface">{t(`landing.${k}.t`)}</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">{t(`landing.${k}.d`)}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={150}>
          <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-line bg-background px-4 py-6 text-center">
                <dt className="text-[clamp(1.8rem,4.5vw,2.6rem)] font-bold leading-none tracking-tight text-brand">{value}</dt>
                <dd className="mt-2 text-body-md text-on-surface-variant">{label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

// ---- FAQ -------------------------------------------------------------------------------
function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead kicker={t('landing.faq.kicker')} title={t('landing.faq.title')} />
        <div className="mt-12 divide-y divide-outline-variant overflow-hidden rounded-2xl border border-line bg-card">
          {[1, 2, 3, 4, 5, 6].map((n, i) => {
            const isOpen = open === i;
            return (
              <div key={n}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${n}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="state-layer flex w-full items-center gap-4 px-5 py-4 text-left text-title-sm font-semibold text-on-surface"
                  >
                    <span className="flex-1">{t(`landing.q${n}`)}</span>
                    <Icon name="expand_more" size={20} className={`shrink-0 text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <div id={`faq-${n}`} role="region" className="faq-body" data-open={isOpen}>
                  <div>
                    <p className="px-5 pb-5 text-body-md text-on-surface-variant">{t(`landing.a${n}`)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---- final CTA + footer ----------------------------------------------------------------
function FinalCta({ user }) {
  const { t } = useI18n();
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28">
      <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-on-primary sm:py-20">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
        <h2 className="relative text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-tight tracking-tight">{t('landing.cta.title')}</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-body-lg opacity-90">{t('landing.cta.sub')}</p>
        <Link to={user ? '/' : '/login'} className={`${BTN} relative mt-8 h-12 bg-on-primary px-7 text-title-sm text-primary`}>
          {user ? t('landing.openApp') : t('landing.getStarted')}
          <Icon name="arrow_forward" size={18} />
        </Link>
      </Reveal>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-2.5">
          <img src="/icons/icon-192.png" alt="" width="26" height="26" className="h-[26px] w-[26px]" />
          <div>
            <p className="text-title-sm font-bold text-on-surface">Expenser</p>
            <p className="text-body-sm text-on-surface-variant">{t('landing.footer.made')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-body-sm text-on-surface-variant">
          <span>© 2026 · {t('landing.footer.license')}</span>
          <a href="#top" className="state-layer inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-label-lg text-on-surface">
            <Icon name="expand_less" size={16} />
            {t('landing.top')}
          </a>
        </div>
      </div>
    </footer>
  );
}

// ---- page ------------------------------------------------------------------------------
export default function Landing() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  usePageTitle(t('meta.title'));

  // Keep the document language + description in sync with the language switch.
  useEffect(() => {
    document.documentElement.lang = lang;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.description'));
  }, [lang, t]);

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      <Nav user={user} />
      <main>
        <Hero user={user} />
        <Features />
        <AmountDemo />
        <Themes />
        <Reminders />
        <HowItWorks />
        <Faq />
        <FinalCta user={user} />
      </main>
      <Footer />
    </div>
  );
}
