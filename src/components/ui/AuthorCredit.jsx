import { useT } from '../../i18n';
import Icon from './Icon';

export const AUTHOR = 'minhtrong67';

/** Highlighted credit: the author and the AI that helped build the app. Shown ONLY at the end of Settings. */
export default function AuthorCredit({ className = '' }) {
  const t = useT();

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-brand/25 bg-primary-container p-5 text-on-primary-container ${className}`}
    >
      <p className="relative text-label-md font-semibold">{t('credit.title')}</p>
      <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-line bg-card p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
            <Icon name="code" size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-label-md text-on-surface-variant">{t('credit.author')}</p>
            <p className="wrap-any text-title-lg font-bold text-brand">{AUTHOR}</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-line bg-card p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-surface">
            <Icon name="auto_awesome" size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-label-md text-on-surface-variant">{t('credit.ai')}</p>
            <p className="wrap-any text-title-lg font-bold text-on-surface">
              Claude <span className="text-label-md font-medium text-on-surface-variant">· Anthropic</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
