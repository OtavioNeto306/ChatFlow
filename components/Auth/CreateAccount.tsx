import React from 'react'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { isValidEmail } from '../../utils/validation'
import { createUserWithEmail } from '../../services/auth'
import { Link, useNavigate } from 'react-router-dom'

export const CreateAccount: React.FC = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const navigate = useNavigate()

  const emailValid = isValidEmail(email)
  const passwordValid = password.length >= 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!emailValid) { setError('Email inválido'); return }
    if (!passwordValid) { setError('Senha deve ter ao menos 6 caracteres'); return }
    setLoading(true)
    try {
      await createUserWithEmail(email, password)
      setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
      setTimeout(() => { navigate('/login') }, 1500)
    } catch (err: any) {
      const msg = String(err?.message || 'Falha ao criar conta')
      if (/already/i.test(msg) || /exist/i.test(msg)) setError('Email já cadastrado')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-4">Criar Conta</h1>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Create account form">
          <div>
            <label htmlFor="email" className="text-sm text-slate-600">Email</label>
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
              <div id="email-error" className="text-xs text-red-600 mt-1" aria-live="polite">Email inválido</div>
            )}
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-slate-600">Senha</label>
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
                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            {!passwordValid && password.length > 0 && (
              <div id="password-error" className="text-xs text-red-600 mt-1" aria-live="polite">Senha deve ter ao menos 6 caracteres</div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600" role="alert" aria-live="assertive">{error}</div>
          )}
          {success && (
            <div className="text-sm text-green-600" role="status" aria-live="polite">{success}</div>
          )}

          <button
            type="submit"
            disabled={!emailValid || !passwordValid || loading}
            className="w-full py-3 rounded-xl bg-[#6A5AE0] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar conta
          </button>

          <div className="flex items-center justify-between">
            <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-700">Voltar ao login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

