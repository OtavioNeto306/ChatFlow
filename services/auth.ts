import { supabase } from './supabaseClient'

export async function createUserWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
  })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  // Google Auth desativado por padrão controlado por VITE_ENABLE_GOOGLE_AUTH
  // Motivo do desligamento: focar em email/senha e reduzir dependências externas no login inicial.
  // Instruções para reativação: defina VITE_ENABLE_GOOGLE_AUTH=true, mantenha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY configurados
  // e habilite o provedor Google no projeto Supabase com redirect para `${window.location.origin}/auth/callback`.
  const enableGoogleAuth = (import.meta as any).env?.VITE_ENABLE_GOOGLE_AUTH === 'true'
  if (!enableGoogleAuth) {
    throw new Error('Google Auth desativado por configuração. Para reativar, defina VITE_ENABLE_GOOGLE_AUTH=true.')
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: true }
  })
  if (error) throw error
  const url = data?.url
  if (url) {
    window.location.href = url
    return
  }
  throw new Error('URL de redirecionamento não recebida')
}
