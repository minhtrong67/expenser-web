import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useT } from '../i18n';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFound() {
  const t = useT();
  usePageTitle(`${t('notFound.title')} · Expenser`);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        <Icon name="search_off" size={36} />
      </span>
      <h1 className="text-headline-sm text-on-surface">{t('notFound.title')}</h1>
      <p className="max-w-sm text-body-lg text-on-surface-variant">{t('notFound.desc')}</p>
      <Link to="/" className="state-layer inline-flex h-10 items-center rounded-lg bg-primary px-4 text-label-lg text-on-primary">
        {t('notFound.home')}
      </Link>
    </div>
  );
}
