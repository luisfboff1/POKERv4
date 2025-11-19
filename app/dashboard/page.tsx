'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useSessions, usePlayers } from '@/hooks/useApi';
import type { Session, SessionPlayerData } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, History, Trophy, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import PlayerDashboard from '@/components/PlayerDashboard';
import { cn } from '@/lib/utils';
import { MobileStatCard } from '@/components/ui/mobile-card';
import { MobileList } from '@/components/ui/mobile-list';
import { FAB } from '@/components/ui/fab';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { getResponsiveTypography, mobileGrid, horizontalScroll } from '@/lib/mobile-utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { sessions, loading, refetch } = useSessions();
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

  // Quick actions
  const quickActions = [
    ...(user?.role === 'admin' || user?.role === 'super_admin' 
      ? [{
          icon: Plus,
          name: 'Nova sessão',
          description: 'Configure mesa e jogadores',
          href: '/dashboard/new',
          color: 'primary' as const
        }]
      : []
    ),
    {
      icon: History,
      name: 'Histórico',
      description: 'Consulte estatísticas',
      href: '/dashboard/history',
      color: 'secondary' as const
    },
    {
      icon: Trophy,
      name: 'Ranking',
      description: 'Desempenho dos jogadores',
      href: '/dashboard/ranking',
      color: 'secondary' as const
    },
    ...(user?.role === 'admin' || user?.role === 'super_admin'
      ? [{
          icon: Users,
          name: 'Convites',
          description: 'Gerencie membros',
          href: '/dashboard/invites',
          color: 'secondary' as const
        }]
      : []
    ),
  ];

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className={cn('space-y-4', 'md:space-y-8')}>
        {/* Header */}
        <div className="space-y-1">
          <h1 className={getResponsiveTypography('display')}>
            Bem-vindo, {user?.name}!
          </h1>
          <p className={getResponsiveTypography('caption')}>
            Organize sessões e mantenha controle financeiro em tempo real
          </p>
        </div>

        {/* Estatísticas principais - Mobile: 2 cols, Desktop: 4 cols */}
        <div className={mobileGrid.stats}>
          <MobileStatCard
            icon={<History className="h-4 w-4" />}
            value={stats.totalSessions}
            label="Sessões"
            subtitle={`${stats.pendingSessions} pendentes`}
          />

          <MobileStatCard
            icon={<Users className="h-4 w-4" />}
            value={stats.totalPlayers}
            label="Jogadores"
            subtitle="membros ativos"
          />

          <MobileStatCard
            icon={<Trophy className="h-4 w-4" />}
            value={`R$ ${financialStats.totalBuyin.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
            label="Volume"
            subtitle="em buy-ins"
          />

          <MobileStatCard
            icon={<Clock className="h-4 w-4" />}
            value={stats.pendingSessions}
            label="Pendências"
            subtitle={
              stats.pendingSessions === 0 ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Tudo em dia
                </span>
              ) : (
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="h-3 w-3" />
                  {stats.pendingSessions === 1 ? '1 pendente' : `${stats.pendingSessions} pendentes`}
                </span>
              )
            }
          />
        </div>

        {/* Quick Actions - Mobile: horizontal scroll, Desktop: grid */}
        <div>
          <h2 className={cn(
            getResponsiveTypography('subtitle'),
            'mb-3 px-3 md:px-0'
          )}>
            Ações rápidas
          </h2>
          <div className={horizontalScroll}>
            <div className="flex gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      // Mobile: compact card in horizontal scroll
                      'flex-shrink-0 w-40 rounded-lg bg-surface/50 p-4',
                      'active:scale-95 transition-transform',
                      // Desktop: full card
                      'md:w-auto md:rounded-xl md:bg-card md:border md:border-border md:p-6 md:shadow-sm',
                      'md:hover:-translate-y-1 md:hover:shadow-lg'
                    )}
                  >
                    <div className="space-y-2 md:space-y-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center md:h-12 md:w-12">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-sm md:text-base">
                          {action.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-3 px-3 md:px-0">
            <div>
              <h2 className={getResponsiveTypography('subtitle')}>
                Sessões recentes
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visualize o status das últimas mesas
              </p>
            </div>
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => router.push('/dashboard/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova sessão
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full border-2 border-border border-t-primary h-8 w-8" />
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            </div>
          ) : stats.recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-surface/30 py-12 text-center mx-3 md:mx-0">
              <History className="h-10 w-10 text-primary/60" />
              <div>
                <p className="text-base font-medium text-foreground">
                  Nenhuma sessão encontrada
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comece criando sua primeira sessão
                </p>
              </div>
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Button onClick={() => router.push('/dashboard/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira sessão
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: List view */}
              <div className="md:hidden px-3">
                <MobileList
                  items={stats.recentSessions.map((session: Session) => {
                    const playerCount = session.players_data?.length || 0;
                    const totalBuyin = session.players_data
                      ? session.players_data.reduce(
                          (sum: number, p: SessionPlayerData) => sum + (p.buyin || 0),
                          0
                        )
                      : 0;

                    const statusColors = {
                      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
                      approved: 'bg-green-500/10 text-green-600 border-green-500/20',
                      closed: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                    };

                    const statusText = {
                      pending: 'Pendente',
                      approved: 'Aprovada',
                      closed: 'Fechada'
                    };

                    return {
                      id: session.id,
                      primary: session.location,
                      secondary: `${new Date(session.date).toLocaleDateString('pt-BR')} • ${playerCount} jogadores`,
                      meta: `R$ ${totalBuyin.toLocaleString('pt-BR')}`,
                      badge: (
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full border',
                          statusColors[session.status]
                        )}>
                          {statusText[session.status]}
                        </span>
                      ),
                      onClick: () => router.push(`/dashboard/history?session=${session.id}`)
                    };
                  })}
                  emptyMessage="Nenhuma sessão recente"
                />
              </div>

              {/* Desktop: Card list */}
              <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm">
                <div className="divide-y divide-border">
                  {stats.recentSessions.map((session: Session) => {
                    const playerCount = session.players_data?.length || 0;
                    const totalBuyin = session.players_data
                      ? session.players_data.reduce(
                          (sum: number, p: SessionPlayerData) => sum + (p.buyin || 0),
                          0
                        )
                      : 0;

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/history?session=${session.id}`)}
                      >
                        <div>
                          <div className="font-medium">{session.location}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString('pt-BR')} • {playerCount} jogadores
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">R$ {totalBuyin.toLocaleString('pt-BR')}</div>
                          <div
                            className={cn(
                              'text-sm',
                              session.status === 'pending' && 'text-yellow-600',
                              session.status === 'approved' && 'text-green-600',
                              session.status === 'closed' && 'text-gray-600'
                            )}
                          >
                            {session.status === 'pending' ? 'Pendente' :
                             session.status === 'approved' ? 'Aprovada' : 'Fechada'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard/history')}
                  >
                    Ver todas as sessões
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FAB for mobile - Nova Sessão */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <FAB
            icon={<Plus className="h-5 w-5" />}
            label="Nova Sessão"
            onClick={() => router.push('/dashboard/new')}
            position="bottomRight"
          />
        )}
      </div>
    </PullToRefresh>
  );
}
