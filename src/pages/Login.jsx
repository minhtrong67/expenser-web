import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout, { AuthCard } from './AuthLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../i18n';

export default function Login() {
  const t = useT();
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [googleLoading, setGoogleLoading] = useState(false);
  const redirectTo = location.state?.from || '/';

  async function handleGoogle() {
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      toast.success(t('auth.loginSuccess'));
      navigate(redirectTo, { replace: true });
    } else if (res.error) {
      toast.error(res.error);
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <img src="/icons/icon-192.png" alt="" width="48" height="48" className="mb-6 h-12 w-12 rounded-xl" />
        <p className="text-label-lg font-semibold text-brand">{t('auth.kicker')}</p>
        <h1 className="mt-1 text-headline-sm font-bold tracking-tight text-on-surface">{t('auth.title2')}</h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">{t('auth.sub2')}</p>

        <Button type="button" variant="outlined" size="lg" className="mt-8 w-full !text-on-surface" loading={googleLoading} onClick={handleGoogle}>
          <GoogleIcon />
          {t('auth.google')}
        </Button>

        <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-body-sm text-on-surface-variant">
          <Icon name="shield" size={14} className="text-brand" />
          <span>{t('auth.secure')}</span>
        </div>

        <p className="mt-6 text-center text-body-sm text-on-surface-variant">{t('auth.terms')}</p>
      </AuthCard>
    </AuthLayout>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.5 4 24 4c-7.5 0-14 4.1-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-1.8 14.1-5l-6.5-5.5c-2 1.4-4.6 2.3-7.6 2.3-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.9 39.9 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.4 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
