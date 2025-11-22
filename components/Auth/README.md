# Autenticação – Google OAuth (toggle)

Este módulo suporta autenticação por email/senha e Google OAuth via Supabase. Por padrão, o login com Google está desativado e pode ser habilitado por flag.

## Como reativar o login com Google

1. Configure no ambiente: defina `VITE_ENABLE_GOOGLE_AUTH=true`.
2. Garanta que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estejam corretamente definidos (use `.env`, nunca commite valores).
3. No dashboard do Supabase, ative o provedor Google em Authentication → Providers e informe `Client ID` e `Client Secret` do Google.
4. Configure os Redirect URLs do Supabase, incluindo: `https://SEU_DOMINIO/auth/callback` e o ambiente de desenvolvimento: `http://localhost:PORTA/auth/callback`.
5. Reinicie o ambiente de desenvolvimento e verifique que o botão “Entrar com Google” aparece habilitado.

## Pré-requisitos

- Projeto Supabase ativo com autenticação habilitada.
- Credenciais do Google OAuth (Client ID/Secret) criadas no Google Cloud Console para o(s) domínio(s) usado(s).
- Variáveis de ambiente definidas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ENABLE_GOOGLE_AUTH`.
- Redirect URLs configurados no Supabase compatíveis com `window.location.origin` (ex.: `http://localhost:5173/auth/callback` em dev, `https://app.exemplo.com/auth/callback` em prod).

## Passos de configuração detalhados

1. Crie credenciais OAuth no Google Cloud Console (OAuth Consent, OAuth Client):
   - Tipo: Web Application
   - Authorized redirect URIs: inclua `https://SEU_DOMINIO/auth/callback` e `http://localhost:PORTA/auth/callback`.
2. No Supabase, em Authentication → Providers → Google:
   - Preencha `Client ID` e `Client Secret`.
   - Salve e garanta que o provedor esteja toggled como ativo.
3. Em `.env` do projeto (não commitar):
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
   - `VITE_ENABLE_GOOGLE_AUTH=true`
4. Inicie a aplicação e teste o fluxo:
   - Na tela de login, clique em “Entrar com Google”.
   - Após o redirecionamento, o callback em `/auth/callback` fará a troca de código por sessão.

## Considerações de segurança

- Nunca commite `.env` com valores reais; use apenas `.env.example` sem segredos.
- Restrinja os domínios e redirect URIs às origens necessárias.
- Habilite PKCE (já configurado no cliente Supabase) para fortalecer o fluxo OAuth.
- Não logue tokens ou dados sensíveis no console; erros devem ser tratados de forma genérica.
- Revogue/rotacione `Client Secret` se houver indícios de vazamento.
- Em produção, use HTTPS sempre; evite origens não confiáveis.

## Onde está o código

- UI do botão Google: `components/Auth/LoginForm.tsx`
- Handler OAuth: `services/auth.ts` (`signInWithGoogle`)
- Callback pós-auth: `components/Auth/AuthCallback.tsx`
- Config Supabase: `services/supabaseClient.ts`
- Variáveis de ambiente: `.env` e `.env.example`