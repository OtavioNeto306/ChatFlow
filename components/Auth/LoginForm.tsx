import React from 'react';
import { Eye, EyeOff, Mail, Lock, Chrome } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { isValidEmail, isNonEmpty } from '../../utils/validation';
import { t } from '../../utils/i18n';
import { Link } from 'react-router-dom';
import { signInWithGoogle } from '../../services/auth';

interface LoginFormProps {
  locale?: 'pt-BR' | 'en-US';
  onAuthenticated: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ locale = 'pt-BR', onAuthenticated }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailInfo, setEmailInfo] = React.useState<string | null>(null);

  const emailValid = isValidEmail(email);
  const passwordValid = isNonEmpty(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailValid) { setError(t('invalidEmail', locale)); return; }
    if (!passwordValid) { setError(t('requiredPassword', locale)); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message || t('invalidCredentials', locale)); return; }
    if (data.session) onAuthenticated();
  };

  const handleForgotPassword = async () => {
    if (!emailValid) { setEmailInfo(t('invalidEmail', locale)); return; }
    setEmailInfo(t('sendingEmail', locale));
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) { setEmailInfo(error.message); return; }
    setEmailInfo(t('emailSent', locale));
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(String(e?.message || 'Falha ao iniciar login com Google'));
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-4">{t('welcome', locale)}</h1>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
          <div>
            <label htmlFor="email" className="text-sm text-slate-600">{t('email', locale)}</label>
            <div className="mt-1 relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!emailValid}
                aria-describedby="email-error"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="email@exemplo.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            </div>
            {!emailValid && email.length > 0 && (
              <div id="email-error" className="text-xs text-red-600 mt-1" aria-live="polite">{t('invalidEmail', locale)}</div>
            )}
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-slate-600">{t('password', locale)}</label>
            <div className="mt-1 relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!passwordValid}
                aria-describedby="password-error"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-2 top-2.5 p-1 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? t('hide', locale) : t('show', locale)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            {!passwordValid && password.length === 0 && (
              <div id="password-error" className="text-xs text-red-600 mt-1" aria-live="polite">{t('requiredPassword', locale)}</div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600" role="alert" aria-live="assertive">{error}</div>
          )}

          <button
            type="submit"
            disabled={!emailValid || !passwordValid || loading}
            className="w-full py-3 rounded-xl bg-primary text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('signIn', locale)}
          </button>

          <div className="flex items-center justify-between">
            <Link to="/create-account" className="text-sm text-indigo-600 hover:text-indigo-700">Criar conta</Link>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={handleForgotPassword} className="text-sm text-indigo-600 hover:text-indigo-700">
              {t('forgotPassword', locale)}
            </button>
            {emailInfo && <span className="text-xs text-slate-500" aria-live="polite">{emailInfo}</span>}
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="flex-1 h-px bg-slate-200" />
            <span>{t('or', locale)}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleGoogle}
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800"
              aria-label="Continuar com o Google"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.9-6.4 8.5-11.8 8.5-6.9 0-12.5-5.6-12.5-12.5S16.6 11.5 23.5 11.5c3.1 0 6 .8 8.5 2.8l5.7-5.7C34.2 5.6 29 4 23.5 4 12.3 4 3 13.3 3 24.5S12.3 45 23.5 45c11.1 0 20.5-9 20.5-20.5 0-1.3-.1-2.4-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.8 11.5 23.5 11.5c3.1 0 6 .8 8.5 2.8l5.7-5.7C34.2 5.6 29 4 23.5 4 15.9 4 9.1 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M23.5 45c5.5 0 10.7-2.1 14.3-5.8l-6.6-5.4c-2 1.4-4.6 2.3-7.7 2.3-5.3 0-10-3.6-11.7-8.5l-6.7 5.2C9.1 40.8 15.9 45 23.5 45z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.9-6.4 8.5-11.8 8.5-6.9 0-12.5-5.6-12.5-12.5S16.6 11.5 23.5 11.5c3.1 0 6 .8 8.5 2.8l5.7-5.7C34.2 5.6 29 4 23.5 4 12.3 4 3 13.3 3 24.5S12.3 45 23.5 45c11.1 0 20.5-9 20.5-20.5 0-1.3-.1-2.4-.4-4z"/>
              </svg>
              <span className="text-sm">Continuar com o Google</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

