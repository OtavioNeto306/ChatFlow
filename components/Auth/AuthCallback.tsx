import React from 'react'
import { supabase } from '../../services/supabaseClient'
import { useNavigate } from 'react-router-dom'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [message, setMessage] = React.useState('Processando autenticação...')

  React.useEffect(() => {
    // Callback de autenticação utilizado para fluxos OAuth (ex.: Google) e redirecionamentos de email (confirmação/reset).
    // Motivo do desligamento do Google: simplificar e priorizar email/senha.
    // Para reativar Google OAuth: habilite VITE_ENABLE_GOOGLE_AUTH=true e garanta que o provedor Google esteja ativo no Supabase.
    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const err = params.get('error_description') || params.get('error')
      if (err) { setMessage(err); return }

      const code = params.get('code')
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) { setMessage(error.message); return }
        } catch (e: any) {
          setMessage(String(e?.message || 'Falha ao autenticar'))
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      if (data.session) { navigate('/', { replace: true }); return }
      navigate('/login', { replace: true })
    }
    run()
  }, [navigate])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
        <div className="text-slate-700">{message}</div>
      </div>
    </div>
  )
}

