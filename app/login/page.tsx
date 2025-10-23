'use client';

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trackPokerEvent } from '@/lib/analytics';
import { Target, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiredWarning, setExpiredWarning] = useState(false);

  const { login, loginWithGoogle, loginWithMicrosoft, user, loading: authLoading } = useAuth();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!authLoading && user) {
      const sp = new URLSearchParams(window.location.search);
      const redirectParam = sp.get('redirect');
      // Validate that redirect is a relative path starting with / and not a full URL
      const redirect = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//') 
        ? redirectParam 
        : '/dashboard';
      router.push(redirect);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get('expired') === 'true') setExpiredWarning(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(formData);
      // Rastrear login bem-sucedido
      trackPokerEvent.login();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login com Google');
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithMicrosoft();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login com Microsoft');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-page text-page-foreground">
      <div className="absolute inset-x-0 top-0 z-10 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Poker Manager
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <ThemeToggle />
            <span>
              Não tem conta?{' '}
              <Link href="/register" className="font-medium text-primary">
                Cadastre-se
              </Link>
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="relative hidden min-h-screen flex-1 flex-col justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-12 py-24 text-foreground lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" aria-hidden />
          <div className="relative z-10 max-w-lg space-y-10">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Plataforma completa
              </span>
              <h1 className="text-4xl font-bold tracking-tight">Gerencie suas sessões de poker como um profissional</h1>
              <p className="text-base text-muted-foreground/80">
                Centralize estatísticas, convites e inteligência do PokerBot em uma única interface moderna e responsiva.
              </p>
            </div>

            <ul className="space-y-4 text-sm">
              {[
                'Controle detalhado de buy-ins, cash-outs e resultados',
                'Rankings automáticos com gráficos e insights',
                'Convites e aprovação por papel com notificações',
                'PokerBot com recomendações otimizadas a cada sessão'
              ].map((feature, index) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {index + 1}
                  </div>
                  <span className="leading-relaxed text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex w-full flex-1 items-center justify-center bg-surface px-6 py-24 shadow-inner lg:bg-transparent">
          <div className="w-full max-w-md">
            <Card className="border-none bg-surface text-surface-foreground shadow-[var(--shadow-soft)]">
              <CardHeader className="space-y-3 text-center">
                <CardTitle className="text-2xl font-semibold">Fazer login</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Acesse sua conta para continuar gerenciando suas sessões
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {expiredWarning && (
                  <div className="flex items-center gap-3 rounded-md border border-yellow-500/50 bg-yellow-500/15 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>Sua sessão expirou. Por favor, faça login novamente.</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Sua senha"
                        required
                        disabled={loading}
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                        disabled={loading}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading || !formData.email || !formData.password} className="w-full">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current" />
                        Entrando...
                      </div>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface px-2 text-muted-foreground">Ou continue com</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMicrosoftLogin}
                    disabled={loading}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                    Microsoft
                  </Button>
                </div>

                <div className="space-y-4 pt-2 text-center text-sm text-muted-foreground">
                  <p>
                    Esqueceu sua senha?{' '}
                    <Link href="/forgot-password" className="font-medium text-primary">
                      Recuperar acesso
                    </Link>
                  </p>

                  <div className="border-t border-border pt-4">
                    <p className="mb-1">Novo por aqui?</p>
                    <Link href="/register" className="font-medium text-primary">
                      Criar conta gratuita
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

