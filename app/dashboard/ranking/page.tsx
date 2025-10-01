'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/loading';
import { useSessions } from '@/hooks/useApi';
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';

interface PlayerStats {
  name: string;
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
  const { sessions, loading, error } = useSessions();

  // Calcular estatísticas dos jogadores
  const playerStats = useMemo(() => {
    const stats = new Map<string, PlayerStats>();

    sessions.forEach(session => {
      if (!session.players_data || !Array.isArray(session.players_data)) return;

      session.players_data.forEach((player: any) => {
        if (!player.name) return;

        const existing = stats.get(player.name) || {
          name: player.name,
          sessionsPlayed: 0,
          totalBuyin: 0,
          totalCashout: 0,
          profit: 0,
          profitPerSession: 0,
          winRate: 0,
          biggestWin: 0,
          biggestLoss: 0
        };

        const sessionProfit = (player.cashout || 0) - (player.buyin || 0);
        
        existing.sessionsPlayed++;
        existing.totalBuyin += player.buyin || 0;
        existing.totalCashout += player.cashout || 0;
        existing.profit += sessionProfit;
        
        if (sessionProfit > existing.biggestWin) {
          existing.biggestWin = sessionProfit;
        }
        
        if (sessionProfit < existing.biggestLoss) {
          existing.biggestLoss = sessionProfit;
        }

        stats.set(player.name, existing);
      });
    });

    // Calcular métricas finais
    const result = Array.from(stats.values()).map(player => ({
      ...player,
      profitPerSession: player.sessionsPlayed > 0 ? player.profit / player.sessionsPlayed : 0,
      winRate: player.sessionsPlayed > 0 ? 
        (sessions.filter(s => 
          s.players_data?.find((p: any) => 
            p.name === player.name && (p.cashout - p.buyin) > 0
          )
        ).length / player.sessionsPlayed) * 100 : 0
    }));

    // Ordenar por lucro total
    return result.sort((a, b) => b.profit - a.profit);
  }, [sessions]);

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
              title="Nenhum ranking disponível"
              description="Assim que novas sessões forem criadas, os rankings serão calculados automaticamente."
              icon={Trophy}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Ranking de jogadores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Performance calculada com base em {sessions.length} sessões registradas
        </p>
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

