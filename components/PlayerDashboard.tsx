'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSessions, usePlayers, useCurrentPeriod } from '@/hooks/useApi';
import type { Session, SessionPlayerData } from '@/lib/types';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Trophy, 
  Calendar,
  Target,
  BarChart3,
  Clock,
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const { currentPeriod, loading: periodLoading } = useCurrentPeriod();
  const [confirmations, setConfirmations] = useState<Record<number, { confirmed: boolean; confirmed_at: string | null }>>({});
  const [confirmingSession, setConfirmingSession] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'cumulative' | 'profit' | 'buyin' | 'cashout' | 'ranking'>('cumulative');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Encontrar dados do jogador
  const playerData = players.find(p => p.id === playerId);

  // Filtrar sessões onde o jogador participou E pelo período atual
  const playerSessions = sessions.filter((session: Session) => {
    if (!Array.isArray(session.players_data)) return false;

    // Check if player participated
    const participated = session.players_data.some((pd: SessionPlayerData) => {
      // Try matching by ID (handle both number and string)
      if (pd.id && (pd.id === playerId || pd.id === playerId.toString() || Number(pd.id) === playerId)) {
        return true;
      }
      // Fallback: try matching by name if player name matches
      if (playerData && pd.name && pd.name.toLowerCase() === playerData.name.toLowerCase()) {
        return true;
      }
      return false;
    });

    if (!participated) return false;

    // ⚠️ IMPORTANTE: Filtrar por período atual
    if (currentPeriod) {
      const sessionDate = new Date(session.date);
      const startDate = new Date(currentPeriod.start_date);
      const endDate = new Date(currentPeriod.end_date);
      return sessionDate >= startDate && sessionDate <= endDate;
    }

    // ⚠️ IMPORTANTE: Se não houver período, NÃO mostrar sessões
    // (requisito: "Nada/vazio")
    return false;
  });

  // Calcular métricas do jogador
  const playerStats = playerSessions.reduce((acc, session: Session) => {
    if (!Array.isArray(session.players_data)) return acc;
    
    const playerInSession = session.players_data.find((pd: SessionPlayerData) => {
      // Match by ID (handle both number and string)
      if (pd.id && (pd.id === playerId || pd.id === playerId.toString() || Number(pd.id) === playerId)) {
        return true;
      }
      // Fallback: match by name
      if (playerData && pd.name && pd.name.toLowerCase() === playerData.name.toLowerCase()) {
        return true;
      }
      return false;
    });
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

  // Filtrar sessões agendadas futuras (próximos jogos) - memoizado para evitar re-renders
  const upcomingSessions = useMemo(() => {
    return sessions.filter((session: Session) => {
      if (!session.scheduled_date) return false;
      return new Date(session.scheduled_date) > new Date();
    }).sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime());
  }, [sessions]);

  // Carregar confirmações para sessões futuras
  useEffect(() => {
    const loadConfirmations = async () => {
      if (upcomingSessions.length === 0) return;

      try {
        const confirmationPromises = upcomingSessions.map(session =>
          api.sessions.getConfirmations(session.id)
        );
        const results = await Promise.all(confirmationPromises);

        const newConfirmations: Record<number, { confirmed: boolean; confirmed_at: string | null }> = {};
        results.forEach((_result: unknown, index: number) => {
          const sessionId = upcomingSessions[index].id;
          const result = _result as { data?: unknown[] };
          const confirmations = result.data || [];
          const playerConfirmation = confirmations.find((c: unknown) => {
            const confirmation = c as { player_id?: number; confirmed?: boolean; confirmed_at?: string | null };
            return confirmation.player_id === playerId;
          }) as { player_id: number; confirmed: boolean; confirmed_at: string | null } | undefined;
          if (playerConfirmation) {
            newConfirmations[sessionId] = {
              confirmed: playerConfirmation.confirmed,
              confirmed_at: playerConfirmation.confirmed_at
            };
          }
        });
        setConfirmations(newConfirmations);
      } catch (error) {
        console.error('Erro ao carregar confirmações:', error);
      }
    };

    loadConfirmations();
  }, [upcomingSessions, playerId]);

  // Função para confirmar presença
  const handleConfirmPresence = async (sessionId: number, confirmed: boolean) => {
    setConfirmingSession(sessionId);
    try {
      await api.sessions.confirmPlayer(sessionId, playerId, confirmed);
      setConfirmations(prev => ({
        ...prev,
        [sessionId]: {
          confirmed,
          confirmed_at: confirmed ? new Date().toISOString() : null
        }
      }));
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
    } finally {
      setConfirmingSession(null);
    }
  };

  // Função para lidar com mudança de tipo de gráfico
  const handleChartTypeChange = (value: 'cumulative' | 'profit' | 'buyin' | 'cashout' | 'ranking') => {
    setChartType(value);
    setIsMobileModalOpen(false);
  };

  // Ranking entre jogadores baseado no profit total
  // Calculate profit for all players based on their sessions
  const playersProfitMap = new Map<number, { profit: number; sessions: number }>();
  
  sessions.forEach((session: Session) => {
    if (!Array.isArray(session.players_data)) return;
    session.players_data.forEach((pd: SessionPlayerData) => {
      const pId = Number(pd.id);
      if (!pId) return;
      const profit = (pd.cashout || 0) - (pd.buyin || 0);
      const current = playersProfitMap.get(pId) || { profit: 0, sessions: 0 };
      playersProfitMap.set(pId, {
        profit: current.profit + profit,
        sessions: current.sessions + 1
      });
    });
  });
  
  // Create ranking based on profit
  const playersRanking = Array.from(playersProfitMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .filter(p => p.sessions > 0)
    .sort((a, b) => b.profit - a.profit);
  
  const playerRank = playersRanking.findIndex(p => p.id === playerId) + 1;
  
  // Preparar dados para o gráfico de evolução do ranking
  const rankingData = useMemo(() => {
    // Ordenar sessões por data (mais antiga primeiro)
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const rankingHistory = [];
    const currentProfits = new Map<number, number>();

    for (const session of sortedSessions) {
      if (!Array.isArray(session.players_data)) continue;

      // Atualizar profits com esta sessão
      session.players_data.forEach((pd: SessionPlayerData) => {
        const pId = Number(pd.id);
        if (!pId) return;
        const profit = (pd.cashout || 0) - (pd.buyin || 0);
        const current = currentProfits.get(pId) || 0;
        currentProfits.set(pId, current + profit);
      });

      // Calcular ranking atual
      const currentRanking = Array.from(currentProfits.entries())
        .map(([id, profit]) => ({ id, profit }))
        .sort((a, b) => b.profit - a.profit);

      const playerRank = currentRanking.findIndex(p => p.id === playerId) + 1;
      const playerProfit = currentProfits.get(playerId) || 0;

      rankingHistory.push({
        date: new Date(session.date).toLocaleDateString('pt-BR'),
        fullDate: session.date,
        rank: playerRank,
        profit: playerProfit,
        totalPlayers: currentRanking.length,
        location: session.location,
        sessionId: session.id
      });
    }

    return rankingHistory;
  }, [sessions, playerId]);

  // Preparar dados para o gráfico de sessões ao longo do tempo
  const chartData = useMemo(() => {
    // Ordenar sessões por data (mais antiga primeiro)
    const sortedSessions = [...playerSessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulativeProfit = 0;
    return sortedSessions.map((session: Session) => {
      const playerInSession = session.players_data?.find((pd: SessionPlayerData) => {
        // Match by ID (handle both number and string)
        if (pd.id && (pd.id === playerId || pd.id === playerId.toString() || Number(pd.id) === playerId)) {
          return true;
        }
        // Fallback: match by name
        if (playerData && pd.name && pd.name.toLowerCase() === playerData.name.toLowerCase()) {
          return true;
        }
        return false;
      });

      const buyin = playerInSession?.buyin || 0;
      const cashout = playerInSession?.cashout || 0;
      const sessionProfit = cashout - buyin;
      cumulativeProfit += sessionProfit;

      return {
        date: new Date(session.date).toLocaleDateString('pt-BR'),
        fullDate: session.date,
        profit: sessionProfit,
        cumulativeProfit,
        buyin,
        cashout,
        location: session.location,
        sessionId: session.id
      };
    });
  }, [playerSessions, playerId, playerData]);

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

      {/* Period Status Cards */}
      {!periodLoading && !currentPeriod && (
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Nenhum período de ranking ativo
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Atualmente não há um período de ranking ativo. Entre em contato com o administrador para criar períodos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!periodLoading && currentPeriod && (
        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  📊 {currentPeriod.name}
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Estatísticas do período: {new Date(currentPeriod.start_date).toLocaleDateString('pt-BR')} até {new Date(currentPeriod.end_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Gráfico interativo de sessões ao longo do tempo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {chartType === 'cumulative' && 'Performance Acumulada'}
                {chartType === 'profit' && 'Profit por Sessão'}
                {chartType === 'buyin' && 'Buy-in por Sessão'}
                {chartType === 'cashout' && 'Cash-out por Sessão'}
                {chartType === 'ranking' && 'Evolução do Ranking'}
              </CardTitle>
            </div>
            <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-10 h-8 px-2">
                  <span className="text-lg">⋯</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Selecionar Visualização</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2 py-4">
                  {[
                    { value: 'cumulative', label: 'Performance Acumulada' },
                    { value: 'profit', label: 'Profit por Sessão' },
                    { value: 'buyin', label: 'Buy-in por Sessão' },
                    { value: 'cashout', label: 'Cash-out por Sessão' },
                    { value: 'ranking', label: 'Evolução do Ranking' }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={chartType === option.value ? "default" : "outline"}
                      className="justify-start h-12"
                      onClick={() => handleChartTypeChange(option.value as 'cumulative' | 'profit' | 'buyin' | 'cashout' | 'ranking')}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {((chartType === 'ranking' && rankingData.length === 0) || (chartType !== 'ranking' && chartData.length === 0)) ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum dado disponível para o gráfico</p>
              <p className="text-sm mt-1">
                Participe de mais sessões para ver sua evolução gráfica
              </p>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'cumulative' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm mb-2">{`Data: ${label}`}</p>
                              <p className="text-sm text-muted-foreground mb-1">{`Local: ${data.location}`}</p>
                              <p className="text-sm">
                                <span className="font-medium">Profit da sessão:</span>{' '}
                                <span className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {data.profit >= 0 ? '+' : ''}R$ {data.profit.toFixed(2)}
                                </span>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Profit acumulado:</span>{' '}
                                <span className={data.cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {data.cumulativeProfit >= 0 ? '+' : ''}R$ {data.cumulativeProfit.toFixed(2)}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Buy-in: R$ {data.buyin.toFixed(2)} → Cash-out: R$ {data.cashout.toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeProfit"
                      stroke={chartData.length > 0 && chartData[chartData.length - 1].cumulativeProfit >= 0 ? '#16a34a' : '#dc2626'}
                      strokeWidth={3}
                      dot={(props) => {
                        const { payload } = props;
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={4}
                            fill={payload.cumulativeProfit >= 0 ? '#16a34a' : '#dc2626'}
                            stroke={payload.cumulativeProfit >= 0 ? '#16a34a' : '#dc2626'}
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={(props) => {
                        const { payload } = props;
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={6}
                            fill={payload.cumulativeProfit >= 0 ? '#16a34a' : '#dc2626'}
                            stroke={payload.cumulativeProfit >= 0 ? '#16a34a' : '#dc2626'}
                            strokeWidth={2}
                          />
                        );
                      }}
                    />
                  </LineChart>
                ) : chartType === 'ranking' ? (
                  <LineChart data={rankingData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      reversed={true}
                      domain={[1, 'dataMax']}
                      tickFormatter={(value) => `#${value}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm mb-2">{`Data: ${label}`}</p>
                              <p className="text-sm text-muted-foreground mb-1">{`Local: ${data.location}`}</p>
                              <p className="text-sm">
                                <span className="font-medium">Posição no ranking:</span>{' '}
                                <span className="font-bold">#{data.rank}</span>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Profit acumulado:</span>{' '}
                                <span className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {data.profit >= 0 ? '+' : ''}R$ {data.profit.toFixed(2)}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Total de jogadores: {data.totalPlayers}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rank"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={(props) => (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={4}
                          fill="#8b5cf6"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                        />
                      )}
                      activeDot={(props) => (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={6}
                          fill="#8b5cf6"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                        />
                      )}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const value = payload[0].value as number;
                          const dataKey = payload[0].dataKey as string;
                          
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm mb-2">{`Data: ${label}`}</p>
                              <p className="text-sm text-muted-foreground mb-1">{`Local: ${data.location}`}</p>
                              {dataKey === 'profit' && (
                                <p className="text-sm">
                                  <span className="font-medium">Profit da sessão:</span>{' '}
                                  <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {value >= 0 ? '+' : ''}R$ {value.toFixed(2)}
                                  </span>
                                </p>
                              )}
                              {dataKey === 'buyin' && (
                                <p className="text-sm">
                                  <span className="font-medium">Buy-in:</span>{' '}
                                  R$ {value.toFixed(2)}
                                </p>
                              )}
                              {dataKey === 'cashout' && (
                                <p className="text-sm">
                                  <span className="font-medium">Cash-out:</span>{' '}
                                  R$ {value.toFixed(2)}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Buy-in: R$ {data.buyin.toFixed(2)} → Cash-out: R$ {data.cashout.toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey={chartType === 'profit' ? 'profit' : chartType === 'buyin' ? 'buyin' : 'cashout'}
                      radius={[2, 2, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            chartType === 'profit' 
                              ? (entry.profit >= 0 ? '#16a34a' : '#dc2626')
                              : chartType === 'buyin'
                              ? '#3b82f6'
                              : '#8b5cf6'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

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
                  const playerInSession = session.players_data?.find((pd: SessionPlayerData) => {
                    // Match by ID (handle both number and string)
                    if (pd.id && (pd.id === playerId || pd.id === playerId.toString() || Number(pd.id) === playerId)) {
                      return true;
                    }
                    // Fallback: match by name
                    if (playerData && pd.name && pd.name.toLowerCase() === playerData.name.toLowerCase()) {
                      return true;
                    }
                    return false;
                  });
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
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum jogo agendado</p>
                <p className="text-sm mt-1">
                  Quando houver jogos futuros, você poderá confirmar sua presença aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 3).map((session: Session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(session.scheduled_date!).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.scheduled_date!).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} • {session.location}
                      </p>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const confirmation = confirmations[session.id];
                        const isConfirming = confirmingSession === session.id;

                        if (confirmation?.confirmed) {
                          return (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">Confirmado</span>
                            </div>
                          );
                        } else if (confirmation && !confirmation.confirmed) {
                          return (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-600 font-medium">Recusado</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConfirmPresence(session.id, true)}
                                disabled={isConfirming}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                {isConfirming ? '...' : 'Confirmar'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConfirmPresence(session.id, false)}
                                disabled={isConfirming}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                {isConfirming ? '...' : 'Recusar'}
                              </Button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                ))}
                {upcomingSessions.length > 3 && (
                  <div className="pt-2 border-t">
                    <Link href="/dashboard/schedule" className="text-sm text-primary hover:underline">
                      Ver todas as {upcomingSessions.length} sessões agendadas →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}