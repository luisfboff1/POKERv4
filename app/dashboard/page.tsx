'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, History, Trophy, Users } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bem-vindo, {user?.name}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize sessões, acompanhe o PokerBot e mantenha controle financeiro em tempo real
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Card className="transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
            <Link href="/dashboard/new" className="block">
              <CardHeader className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">Nova sessão</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Configure mesas, blinds e jogadores em minutos
              </CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>
        )}

        <Card className="transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
          <Link href="/dashboard/history" className="block">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Histórico</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Consulte estatísticas passadas e exporte relatórios
              </CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
          <Link href="/dashboard/ranking" className="block">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Ranking</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Acompanhe desempenho, ganhos e constância
              </CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>

        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Card className="transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
            <Link href="/dashboard/invites" className="block">
              <CardHeader className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">Convites</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Envie convites e acompanhe aprovações em tempo real
              </CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>
        )}
      </div>

      {/* Recent Sessions */}
      <Card className="bg-surface text-surface-foreground">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessões recentes</CardTitle>
              <CardDescription>
                Visualize rapidamente o status das últimas mesas
              </CardDescription>
            </div>
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/new">
                  <Plus className="mr-2 h-4 w-4" />Nova sessão
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-surface py-12 text-center text-sm text-muted-foreground">
            <History className="h-10 w-10 text-primary/60" />
            <div>
              <p className="text-base font-medium text-foreground">Nenhuma sessão encontrada</p>
              <p className="mt-1 text-muted-foreground">
                Assim que registrar sessões, elas aparecerão aqui automaticamente.
              </p>
            </div>
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <Button asChild variant="secondary">
                <Link href="/dashboard/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira sessão
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

