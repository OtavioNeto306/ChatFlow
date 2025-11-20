import React from 'react'
import { supabase } from '../../services/supabaseClient'
import { useNavigate } from 'react-router-dom'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  React.useEffect(() => {
    const run = async () => {
      await supabase.auth.getSession()
      navigate('/login', { replace: true })
    }
    run()
  }, [navigate])
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
        <div className="text-slate-700">Processando autenticação...</div>
      </div>
    </div>
  )
}

