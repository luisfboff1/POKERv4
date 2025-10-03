'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-page text-page-foreground">
      <div className="absolute inset-x-0 top-0 z-10 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="text-lg font-semibold tracking-tight text-foreground">🎯 Poker Manager</div>
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
        <div className="relative hidden min-h-screen flex-1 flex-col justify-center overflow-hidden bg-linear-to-br from-emerald-800/90 via-emerald-700/70 to-emerald-600/50 dark:from-emerald-900/80 dark:via-emerald-800/60 dark:to-emerald-700/40 px-12 py-24 text-white lg:flex">
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

        <div className="flex w-full flex-1 items-center justify-center bg-background px-6 py-24 lg:bg-background">
          <div className="w-full max-w-md">
            <Card className="border border-border bg-card text-card-foreground shadow-lg">
              <CardHeader className="space-y-3 text-center">
                <CardTitle className="text-2xl font-semibold">Fazer login</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Acesse sua conta para continuar gerenciando suas sessões
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm text-destructive">
                    <span className="text-lg leading-none">⚠️</span>
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
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <Button variant="outline" type="submit" disabled={loading || !formData.email || !formData.password} className="w-full">
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

                <div className="space-y-4 pt-2 text-center text-sm text-muted-foreground">
                  <p>
                    Esqueceu sua senha?{' '}
                    <a href="#" className="font-medium text-primary">
                      Recuperar acesso
                    </a>
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

