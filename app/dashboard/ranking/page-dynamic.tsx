'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/loading';
import { usePlayers, useSessions } from '@/hooks/useApi';
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';
import type { SessionPlayerData } from '@/lib/types';

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
  lastPlayed: string | null;
}

export default function RankingPage() {
  const { players, loading: playersLoading, error: playersError } = usePlayers();
  const { sessions, loading: sessionsLoading } = useSessions();

  // Calcular estatísticas DINAMICAMENTE baseado apenas nas sessões
  const playerStats = useMemo((): PlayerStats[] => {
    if (!players.length || !sessions.length) return [];

    console.log('🔄 Calculando ranking dinamicamente das sessões...');
    console.log('📊 Sessões encontradas:', sessions.length);
    console.log('👥 Players cadastrados:', players.length);

    const stats = new Map<string, PlayerStats>();

    // Inicializar stats para todos os players cadastrados
    players.forEach(player => {
      stats.set(player.name, {
        id: player.id,
        name: player.name,
        email: player.email || '',
        sessionsPlayed: 0,
        totalBuyin: 0,
        totalCashout: 0,
        profit: 0,
        profitPerSession: 0,
        winRate: 0,
        biggestWin: 0,
        biggestLoss: 0,
        lastPlayed: null
      });
    });

    // Calcular estatísticas baseadas apenas nas sessões aprovadas
    sessions.forEach(session => {
      if (session.status !== 'approved' || !session.players_data || !Array.isArray(session.players_data)) {
        return;
      }

      console.log('📈 Processando sessão:', session.date, 'com', session.players_data.length, 'jogadores');

      session.players_data.forEach((sessionPlayer: SessionPlayerData) => {
        if (!sessionPlayer.name) return;

        const playerStat = stats.get(sessionPlayer.name);
        if (!playerStat) {
          console.log('⚠️  Jogador não cadastrado encontrado na sessão:', sessionPlayer.name);
          return; // Só processa jogadores que estão cadastrados
        }

        const buyin = sessionPlayer.buyin || 0;
        const cashout = sessionPlayer.cashout || 0;
        const sessionProfit = cashout - buyin;
        
        // Atualizar estatísticas
        playerStat.sessionsPlayed++;
        playerStat.totalBuyin += buyin;
        playerStat.totalCashout += cashout;
        playerStat.profit += sessionProfit;
        
        // Atualizar maior ganho e maior perda
        if (sessionProfit > playerStat.biggestWin) {
          playerStat.biggestWin = sessionProfit;
        }
        
        if (sessionProfit < playerStat.biggestLoss) {
          playerStat.biggestLoss = sessionProfit;
        }

        // Atualizar última vez que jogou
        if (!playerStat.lastPlayed || session.date > playerStat.lastPlayed) {
          playerStat.lastPlayed = session.date;
        }
      });
    });

    // Calcular métricas finais
    const finalStats = Array.from(stats.values()).map(stat => {
      stat.profitPerSession = stat.sessionsPlayed > 0 ? stat.profit / stat.sessionsPlayed : 0;
      stat.winRate = stat.totalBuyin > 0 ? (stat.profit / stat.totalBuyin) * 100 : 0;
      return stat;
    });

    // Ordenar por lucro total (maior para menor)
    const sortedStats = finalStats.sort((a, b) => b.profit - a.profit);
    
    console.log('📋 Ranking calculado:', sortedStats.map(s => `${s.name}: R$ ${s.profit.toFixed(2)}`));
    
    return sortedStats;
  }, [players, sessions]);

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

  if (playersLoading || sessionsLoading) {
    return <LoadingState text="Calculando rankings dinamicamente..." />;
  }

  if (playersError) {
    return <ErrorState message={playersError} />;
  }

  if (!players.length) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ranking de jogadores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum jogador cadastrado ainda
          </p>
        </div>
        <EmptyState 
          icon={Trophy}
          title="Nenhum jogador encontrado"
          description="Cadastre jogadores para ver o ranking aqui."
        />
      </div>
    );
  }

  // Filtrar apenas jogadores que realmente jogaram
  const playersWithSessions = playerStats.filter(player => player.sessionsPlayed > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ranking de jogadores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Calculado dinamicamente de {sessions.length} sessões • {playersWithSessions.length} jogadores com histórico
          </p>
        </div>
      </div>

      {playersWithSessions.length === 0 ? (
        <EmptyState 
          icon={Trophy}
          title="Nenhuma sessão encontrada"
          description="O ranking aparecerá quando houver sessões aprovadas com jogadores."
        />
      ) : (
        <>
          {/* Cards de destaque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {playersWithSessions.slice(0, 3).map((player, index) => (
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
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Lucro total:</span>
                    <span className={`font-semibold ${player.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(player.profit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sessões:</span>
                    <span className="font-medium">{player.sessionsPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de vitória:</span>
                    <span className="font-medium">{player.winRate.toFixed(1)}%</span>
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
                Todos os jogadores ordenados por lucro total • Calculado em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Jogador</TableHead>
                    <TableHead className="text-center">Sessões</TableHead>
                    <TableHead className="text-right">Buy-in Total</TableHead>
                    <TableHead className="text-right">Cash-out Total</TableHead>
                    <TableHead className="text-right">Lucro Total</TableHead>
                    <TableHead className="text-right">Lucro/Sessão</TableHead>
                    <TableHead className="text-center">Taxa Vitória</TableHead>
                    <TableHead className="text-right">Maior Ganho</TableHead>
                    <TableHead className="text-right">Maior Perda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playersWithSessions.map((player, index) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          {player.email && (
                            <div className="text-sm text-muted-foreground">{player.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{player.sessionsPlayed}</TableCell>
                      <TableCell className="text-right">{formatCurrency(player.totalBuyin)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(player.totalCashout)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {player.profit >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={player.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(player.profit)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(player.profitPerSession)}</TableCell>
                      <TableCell className="text-center">{player.winRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(player.biggestWin)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(player.biggestLoss)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}