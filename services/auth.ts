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
