import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout, { AuthCard } from './AuthLayout';
import TextInput from '../components/ui/TextInput';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../i18n';
import { isValidEmail, isNonEmpty } from '../utils/validators';

export default function ForgotPassword() {
  const t = useT();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!isNonEmpty(trimmed)) return setError(t('auth.emailRequired'));
    if (!isValidEmail(trimmed)) return setError(t('auth.error.invalidEmail'));
    setError('');
    setLoading(true);
    const res = await resetPassword(trimmed);
    setLoading(false);
    if (res.success) {
      setSent(true);
      toast.success(t('auth.resetSent'));
    } else toast.error(res.error);
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-headline-sm text-on-surface">{t('auth.forgotTitle')}</h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">{t('auth.forgotSub')}</p>

        {sent ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-primary-container px-5 py-8 text-center text-on-primary-container">
            <Icon name="mark_email_read" size={36} />
            <p className="text-body-md">{t('auth.resetSentTo', { email })}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <TextInput label="Email" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" />
            <Button type="submit" size="lg" loading={loading} className="w-full">
              {t('auth.sendReset')}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-body-md">
          <Link to="/login" className="font-bold text-brand hover:underline">
            ← {t('auth.backToLogin')}
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
