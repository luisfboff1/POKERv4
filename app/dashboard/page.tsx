'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSessions, usePlayers } from '@/hooks/useApi';
import type { Session, SessionPlayerData } from '@/lib/types';
import Link from 'next/link';
import { Plus, History, Trophy, Users } from 'lucide-react';
import PlayerDashboard from '@/components/PlayerDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { sessions, loading } = useSessions();
  const { players } = usePlayers();

  // Se o usuário tem um jogador vinculado, mostrar dashboard de jogador
  if (user && user.player_id) {
    return <PlayerDashboard user={user} playerId={user.player_id} />;
  }
  
  // Estatísticas gerais para admins
  const stats = {
    totalSessions: sessions.length,
    pendingSessions: sessions.filter((s: Session) => s.status === 'pending').length,
    totalPlayers: players.length,
    recentSessions: sessions.slice(0, 5) as Session[]
  };

  // Calcular estatísticas financeiras
  const financialStats = sessions.reduce(
    (acc: { totalBuyin: number; totalCashout: number }, session: Session) => {
      if (Array.isArray(session.players_data)) {
        session.players_data.forEach((player: SessionPlayerData) => {
          acc.totalBuyin += player.buyin || 0;
          acc.totalCashout += player.cashout || 0;
        });
      }
      return acc;
    },
    { totalBuyin: 0, totalCashout: 0 }
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bem-vindo, {user?.name}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize sessões, acompanhe o PokerBot e mantenha controle financeiro em tempo real
        </p>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingSessions} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jogadores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              membros registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {financialStats.totalBuyin.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              em buy-ins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanceamento</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              financialStats.totalBuyin === financialStats.totalCashout ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {financialStats.totalBuyin === financialStats.totalCashout ? '✓' : '⚠'}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats.totalBuyin === financialStats.totalCashout ? 'Perfeito' : 'Verificar'}
            </p>
          </CardContent>
        </Card>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Carregando sessões...</span>
            </div>
          ) : stats.recentSessions.length === 0 ? (
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
          ) : (
            <div className="space-y-4">
              {stats.recentSessions.map((session: Session) => {
                const playerCount = session.players_data ? session.players_data.length : 0;
                const totalBuyin = session.players_data ?
                  session.players_data.reduce((sum: number, p: SessionPlayerData) => sum + (p.buyin || 0), 0) : 0;
                
                return (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{session.location}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(session.date).toLocaleDateString('pt-BR')} • {playerCount} jogadores
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R$ {totalBuyin.toLocaleString('pt-BR')}</div>
                      <div className={`text-sm ${
                        session.status === 'pending' ? 'text-yellow-600' :
                        session.status === 'approved' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {session.status === 'pending' ? 'Pendente' :
                         session.status === 'approved' ? 'Aprovada' : 'Fechada'}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/history">
                    Ver todas as sessões
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

