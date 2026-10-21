import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout, { AuthCard } from './AuthLayout';
import TextInput from '../components/ui/TextInput';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import { GoogleIcon } from './Login';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../i18n';
import { isValidEmail, isNonEmpty, isStrongPassword, maxLength } from '../utils/validators';

export default function Register() {
  const t = useT();
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function validate() {
    const errs = {};
    const name = form.name.trim();
    const email = form.email.trim();
    if (!isNonEmpty(name)) errs.name = t('settings.nameRequired');
    else if (!maxLength(name, 60)) errs.name = t('settings.nameMax');
    if (!isNonEmpty(email)) errs.email = t('auth.emailRequired');
    else if (!isValidEmail(email)) errs.email = t('auth.error.invalidEmail');
    if (!isNonEmpty(form.password)) errs.password = t('auth.passwordRequired');
    else if (!isStrongPassword(form.password)) errs.password = t('settings.pwMin');
    if (form.confirm !== form.password) errs.confirm = t('settings.pwMismatch');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const res = await register(form.name, form.email.trim(), form.password);
    setLoading(false);
    if (res.success) {
      toast.success(t('auth.registered'));
      navigate('/', { replace: true });
    } else toast.error(res.error);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      toast.success(t('auth.registered'));
      navigate('/', { replace: true });
    } else if (res.error) toast.error(res.error);
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-headline-sm text-on-surface">{t('auth.registerTitle')}</h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">{t('auth.registerSub')}</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <TextInput label={t('settings.fullName')} icon="person" value={form.name} onChange={set('name')} onBlur={(e) => setForm((f) => ({ ...f, name: e.target.value.trim() }))} error={errors.name} autoComplete="name" />
          <TextInput label="Email" icon="mail" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          <TextInput
            label={t('auth.password')}
            icon="lock"
            type={showPw ? 'text' : 'password'}
            hint={t('settings.pwMinHint')}
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            autoComplete="new-password"
            trailing={<IconButton icon={showPw ? 'visibility_off' : 'visibility'} label={showPw ? t('auth.hidePassword') : t('auth.showPassword')} onClick={() => setShowPw((s) => !s)} className="-mr-2" />}
          />
          <TextInput label={t('settings.pwConfirm')} icon="lock_reset" type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
          <Button type="submit" size="lg" loading={loading} className="w-full">
            {t('auth.createAccount')}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-body-sm text-on-surface-variant">
          <div className="h-px flex-1 bg-outline-variant" />
          {t('auth.or')}
          <div className="h-px flex-1 bg-outline-variant" />
        </div>

        <Button type="button" variant="outlined" size="lg" className="w-full !text-on-surface" loading={googleLoading} onClick={handleGoogle}>
          <GoogleIcon /> {t('auth.googleRegister')}
        </Button>

        <p className="mt-6 text-center text-body-md text-on-surface-variant">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-bold text-brand hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
