'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Implement password recovery API endpoint
      // await api.requestPasswordReset({ email });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email de recuperação');
    } finally {
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
          </div>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-md">
          <Card className="border-none bg-surface text-surface-foreground shadow-[var(--shadow-soft)]">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold">Recuperar senha</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Digite seu email para receber instruções de recuperação
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-md border border-green-500/50 bg-green-500/15 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <span>Email de recuperação enviado com sucesso!</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                  </p>
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar para login
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" disabled={loading || !email} className="w-full">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current" />
                        Enviando...
                      </div>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar link de recuperação
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
                <p>
                  Lembrou sua senha?{' '}
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
  );
}
