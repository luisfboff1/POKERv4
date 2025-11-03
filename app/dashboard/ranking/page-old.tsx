'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/loading';
import { usePlayers, useSessions } from '@/hooks/useApi';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { SessionPlayerData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PlayerStats {
  id: number;
  name: string;
  email: string;
  sessionsPlayed: number;
  totalBuyin: number;
  totalCashout: number;
  profit: number;
  profitPerSession: number;
  winRate: number;
  biggestWin: number;
  biggestLoss: number;
}

export default function RankingPage() {
  const { players, loading: playersLoading, error: playersError, refetch: refetchPlayers } = usePlayers();
  const { sessions, loading: sessionsLoading } = useSessions();
  const [syncingStats, setSyncingStats] = useState(false);

  // Combinar dados dos jogadores da tabela com estatísticas calculadas das sessões
  const playerStats = useMemo(() => {
    if (!players.length) return [];

    const stats = new Map<string, PlayerStats>();

    // Primeiro, criar estatísticas base dos jogadores cadastrados
    players.forEach(player => {
      const profit = (player.total_cashout || 0) - (player.total_buyin || 0);
      
      stats.set(player.name, {
        id: player.id,
        name: player.name,
        email: player.email || '',
        sessionsPlayed: player.total_sessions || 0,
        totalBuyin: player.total_buyin || 0,
        totalCashout: player.total_cashout || 0,
        profit,
        profitPerSession: (player.total_sessions || 0) > 0 ? profit / (player.total_sessions || 0) : 0,
        winRate: 0, // Será calculado com base nas sessões
        biggestWin: 0, // Será calculado com base nas sessões
        biggestLoss: 0, // Será calculado com base nas sessões
      });
    });

    // Depois, calcular métricas adicionais baseadas nas sessões (winRate, biggestWin, biggestLoss)
    if (sessions.length > 0) {
      sessions.forEach(session => {
        if (!session.players_data || !Array.isArray(session.players_data)) return;

  session.players_data.forEach((sessionPlayer: SessionPlayerData) => {
          if (!sessionPlayer.name) return;

          const playerStat = stats.get(sessionPlayer.name);
          if (!playerStat) return; // Só processa jogadores que estão na tabela

          const sessionProfit = (sessionPlayer.cashout || 0) - (sessionPlayer.buyin || 0);
          
          // Atualizar maior ganho e maior perda
          if (sessionProfit > playerStat.biggestWin) {
            playerStat.biggestWin = sessionProfit;
          }
          
          if (sessionProfit < playerStat.biggestLoss) {
            playerStat.biggestLoss = sessionProfit;
          }
        });
      });

      // Calcular taxa de vitória
      stats.forEach((playerStat, playerName) => {
        const winSessions = sessions.filter(session => 
          session.players_data?.find((p: SessionPlayerData) => 
            p.name === playerName && ((p.cashout || 0) - (p.buyin || 0)) > 0
          )
        ).length;
        
        playerStat.winRate = playerStat.sessionsPlayed > 0 ? 
          (winSessions / playerStat.sessionsPlayed) * 100 : 0;
      });
    }

    // Ordenar por lucro total
    return Array.from(stats.values()).sort((a, b) => b.profit - a.profit);
  }, [players, sessions]);

  const loading = playersLoading || sessionsLoading;
  const error = playersError;

  const handleSyncStats = async () => {
    try {
      setSyncingStats(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sync_simple.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ action: 'sync_all' })
      });

      const result = await response.json();
      
      if (result.success) {
        await refetchPlayers();
      } else {
        console.error('❌ Erro:', result.error);
        alert('Erro ao sincronizar: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', error);
      alert('Erro de conexão');
    } finally {
      setSyncingStats(false);
    }
  };

  const handleRecalculateStats = async () => {
    try {
      setSyncingStats(true);
      
      // Usar API simples
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sync_simple.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ action: 'reset_all' })
      });

      const result = await response.json();
      
      if (result.success) {
        await refetchPlayers();
      } else {
        console.error('❌ Erro:', result.error);
        alert('Erro ao recalcular: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao recalcular:', error);
      alert('Erro de conexão');
    } finally {
      setSyncingStats(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="w-5 text-center text-sm font-medium">{position}</span>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  if (loading) {
    return <LoadingState text="Calculando rankings..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (playerStats.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ranking de jogadores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Veja a evolução do desempenho de cada membro do clube ao longo das sessões
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <EmptyState 
              title="Nenhum jogador cadastrado"
              description="Os jogadores são automaticamente cadastrados quando participam de sessões. Crie sua primeira sessão para começar a ver os rankings."
              icon={Trophy}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ranking de jogadores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estatísticas consolidadas de {players.length} jogadores cadastrados com {sessions.length} sessões registradas
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncStats}
            disabled={syncingStats}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncingStats ? 'animate-spin' : ''}`} />
            {syncingStats ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button 
            onClick={handleRecalculateStats}
            disabled={syncingStats}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncingStats ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
        </div>
      </div>

      {/* Cards de destaque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {playerStats.slice(0, 3).map((player, index) => (
          <Card key={player.name} className={`${
            index === 0 ? 'ring-2 ring-yellow-500/20 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20' :
            index === 1 ? 'ring-2 ring-gray-400/20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20' :
            'ring-2 ring-orange-600/20 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {getRankIcon(index + 1)}
                <div>
                  <CardTitle className="text-lg">{player.name}</CardTitle>
                  <CardDescription>
                    {index === 0 ? '🏆 Líder' : index === 1 ? '🥈 Vice-líder' : '🥉 Terceiro lugar'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Lucro total:</span>
                  <span className={`font-medium ${player.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(player.profit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sessões:</span>
                  <span>{player.sessionsPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de vitória:</span>
                  <span>{player.winRate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela completa */}
      <Card>
        <CardHeader>
          <CardTitle>Classificação geral</CardTitle>
          <CardDescription>
            Todos os jogadores ordenados por lucro total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos.</TableHead>
                <TableHead>Jogador</TableHead>
                <TableHead>Sessões</TableHead>
                <TableHead>Buy-in Total</TableHead>
                <TableHead>Cash-out Total</TableHead>
                <TableHead>Lucro Total</TableHead>
                <TableHead>Lucro/Sessão</TableHead>
                <TableHead>Taxa Vitória</TableHead>
                <TableHead>Maior Ganho</TableHead>
                <TableHead>Maior Perda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStats.map((player, index) => (
                <TableRow key={player.name}>
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.sessionsPlayed}</TableCell>
                  <TableCell>{formatCurrency(player.totalBuyin)}</TableCell>
                  <TableCell>{formatCurrency(player.totalCashout)}</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${
                      player.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {player.profit >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-medium">{formatCurrency(player.profit)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`${
                      player.profitPerSession >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(player.profitPerSession)}
                    </span>
                  </TableCell>
                  <TableCell>{player.winRate.toFixed(1)}%</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(player.biggestWin)}
                  </TableCell>
                  <TableCell className="text-red-600 font-medium">
                    {formatCurrency(player.biggestLoss)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

