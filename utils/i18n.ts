type Locale = 'pt-BR' | 'en-US';

const ptBR = {
  email: 'Email',
  password: 'Senha',
  show: 'Mostrar',
  hide: 'Esconder',
  signIn: 'Entrar',
  forgotPassword: 'Esqueci minha senha',
  or: 'ou',
  signInWithGoogle: 'Entrar com Google',
  signInWithGithub: 'Entrar com GitHub',
  invalidEmail: 'Email inválido',
  requiredPassword: 'Senha é obrigatória',
  unverified: 'Conta não verificada',
  invalidCredentials: 'Credenciais inválidas',
  sendingEmail: 'Enviando email...',
  emailSent: 'Email enviado',
  continue: 'Continuar',
  welcome: 'Bem-vindo ao NoolaSpeak'
};

const enUS = {
  email: 'Email',
  password: 'Password',
  show: 'Show',
  hide: 'Hide',
  signIn: 'Sign In',
  forgotPassword: 'Forgot password',
  or: 'or',
  signInWithGoogle: 'Sign in with Google',
  signInWithGithub: 'Sign in with GitHub',
  invalidEmail: 'Invalid email',
  requiredPassword: 'Password is required',
  unverified: 'Account not verified',
  invalidCredentials: 'Invalid credentials',
  sendingEmail: 'Sending email...',
  emailSent: 'Email sent',
  continue: 'Continue',
  welcome: 'Welcome to NoolaSpeak'
};

const dict = { 'pt-BR': ptBR, 'en-US': enUS } as const;

export function t(key: keyof typeof ptBR, locale: Locale = 'pt-BR') {
  return dict[locale][key];
}
