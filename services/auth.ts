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

