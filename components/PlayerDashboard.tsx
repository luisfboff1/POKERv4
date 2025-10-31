'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSessions, usePlayers } from '@/hooks/useApi';
import type { Session, SessionPlayerData } from '@/lib/types';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Trophy, 
  Calendar,
  Target,
  BarChart3,
  Clock,
  Star
} from 'lucide-react';

interface PlayerDashboardProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    player_id?: number;
  };
  playerId: number;
}

export default function PlayerDashboard({ user, playerId }: PlayerDashboardProps) {
  const { sessions, loading: sessionsLoading } = useSessions();
  const { players, loading: playersLoading } = usePlayers();

  // Encontrar dados do jogador
  const playerData = players.find(p => p.id === playerId);
  
  // Filtrar sessões onde o jogador participou
  const playerSessions = sessions.filter((session: Session) => {
    if (!Array.isArray(session.players_data)) return false;
    return session.players_data.some((pd: SessionPlayerData) => pd.id === playerId);
  });

  // Calcular métricas do jogador
  const playerStats = playerSessions.reduce((acc, session: Session) => {
    if (!Array.isArray(session.players_data)) return acc;
    
    const playerInSession = session.players_data.find((pd: SessionPlayerData) => pd.id === playerId);
    if (!playerInSession) return acc;

    acc.totalSessions += 1;
    acc.totalBuyin += playerInSession.buyin || 0;
    acc.totalCashout += playerInSession.cashout || 0;
    
    const sessionProfit = (playerInSession.cashout || 0) - (playerInSession.buyin || 0);
    acc.totalProfit += sessionProfit;
    
    if (sessionProfit > 0) acc.winSessions += 1;
    if (sessionProfit > acc.bestSession) acc.bestSession = sessionProfit;
    if (sessionProfit < acc.worstSession) acc.worstSession = sessionProfit;
    
    return acc;
  }, {
    totalSessions: 0,
    totalBuyin: 0,
    totalCashout: 0,
    totalProfit: 0,
    winSessions: 0,
    bestSession: 0,
    worstSession: 0
  });

  const winRate = playerStats.totalSessions > 0 
    ? (playerStats.winSessions / playerStats.totalSessions * 100).toFixed(1)
    : '0.0';

  // Últimas 5 sessões
  const recentPlayerSessions = playerSessions.slice(0, 5);

  // Ranking entre jogadores (baseado nas sessões por enquanto)
  const playersRanking = players
    .filter(p => p.total_sessions && p.total_sessions > 0)
    .sort((a, b) => (b.total_sessions || 0) - (a.total_sessions || 0));
  
  const playerRank = playersRanking.findIndex(p => p.id === playerId) + 1;

  if (sessionsLoading || playersLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header personalizado */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Olá, {playerData?.name || user?.name}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suas estatísticas pessoais e histórico de jogos
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Total</CardTitle>
            {playerStats.totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              playerStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {playerStats.totalProfit >= 0 ? '+' : ''}R$ {playerStats.totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Em {playerStats.totalSessions} sessões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {playerStats.winSessions} vitórias de {playerStats.totalSessions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Sessão</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +R$ {playerStats.bestSession.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sua melhor performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking</CardTitle>
            <Trophy className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{playerRank || '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Entre {playersRanking.length} jogadores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e estatísticas detalhadas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Resumo financeiro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
            <CardDescription>
              Sua movimentação financeira total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total investido (Buy-in)</span>
              <span className="font-medium">R$ {playerStats.totalBuyin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total sacado (Cash-out)</span>
              <span className="font-medium">R$ {playerStats.totalCashout.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Resultado líquido</span>
                <span className={`font-bold ${
                  playerStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {playerStats.totalProfit >= 0 ? '+' : ''}R$ {playerStats.totalProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sessões Recentes
            </CardTitle>
            <CardDescription>
              Suas últimas {recentPlayerSessions.length} participações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPlayerSessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma sessão encontrada
              </p>
            ) : (
              <div className="space-y-3">
                {recentPlayerSessions.map((session: Session) => {
                  const playerInSession = session.players_data?.find(
                    (pd: SessionPlayerData) => pd.id === playerId
                  );
                  const profit = playerInSession 
                    ? (playerInSession.cashout || 0) - (playerInSession.buyin || 0)
                    : 0;

                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(session.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm text-muted-foreground">{session.location}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {playerInSession?.buyin || 0} → {playerInSession?.cashout || 0}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/history">
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Ver Histórico Completo
                </Button>
              </Link>
              <Link href="/dashboard/ranking">
                <Button variant="outline" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Ranking Geral
                </Button>
              </Link>
              {user?.role === 'admin' && (
                <Link href="/dashboard/new">
                  <Button className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Nova Sessão
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Jogos
            </CardTitle>
            <CardDescription>
              Sessões agendadas - confirme sua presença
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum jogo agendado</p>
              <p className="text-sm mt-1">
                Quando houver jogos futuros, você poderá confirmar sua presença aqui
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}