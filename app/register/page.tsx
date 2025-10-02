'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        router.push('/login?registered=true');
      } else {
        setError(response.message || 'Erro ao criar conta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
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
              Já tem conta?{' '}
              <Link href="/login" className="font-medium text-primary">
                Fazer login
              </Link>
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="relative hidden min-h-screen flex-1 flex-col justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-12 py-24 text-foreground lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" aria-hidden />
          <div className="relative z-10 max-w-lg space-y-10">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Cadastro em minutos
              </span>
              <h1 className="text-4xl font-bold tracking-tight">Crie sua conta e organize o clube com facilidade</h1>
              <p className="text-base text-muted-foreground/80">
                Configure times, convites e acompanhamento financeiro em um ambiente seguro e performático.
              </p>
            </div>

            <ul className="space-y-4 text-sm">
              {[
                'Convites com aprovação automática ou manual por papel',
                'Visão consolidada das transações por jogador',
                'PokerBot integrado com recomendações estratégicas',
                'Suporte a temas claro e escuro para todas as telas'
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
                <CardTitle className="text-2xl font-semibold">Criar conta</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Cadastre-se para acompanhar suas partidas com o Poker Manager
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm text-destructive">
                    <span className="text-lg leading-none">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome"
                      required
                      disabled={loading}
                    />
                  </div>

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
                        placeholder="Mínimo 6 caracteres"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Repita a senha"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" disabled={loading || !formData.email || !formData.password || !formData.name} className="w-full">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current" />
                        Criando conta...
                      </div>
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </form>

                <div className="pt-2 text-center text-sm text-muted-foreground">
                  <p>
                    Já tem uma conta?{' '}
                    <Link href="/login" className="font-medium text-primary">
                      Fazer login
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

