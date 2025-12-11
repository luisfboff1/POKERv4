'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/loading';
import { usePlayers, useSessions, useRankingPeriods } from '@/hooks/useApi';
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';
import type { SessionPlayerData, RankingPeriod, CreateRankingPeriodPayload, UpdateRankingPeriodPayload } from '@/lib/types';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { MobileList } from '@/components/ui/mobile-list';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { cn } from '@/lib/utils';
import { getResponsiveTypography } from '@/lib/mobile-utils';
import { PeriodSelector } from '@/components/ranking/period-selector';
import { PeriodDialog } from '@/components/ranking/period-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ToastProvider, useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

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

function RankingPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { players, loading: playersLoading, error: playersError, refetch: refetchPlayers } = usePlayers();
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useSessions();
  const { periods, loading: periodsLoading, createPeriod, updatePeriod, deletePeriod, refetch: refetchPeriods } = useRankingPeriods();

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Auto-select current period when periods are loaded or changed
  React.useEffect(() => {
    console.log('🔍 Period Selection Effect:', {
      periodsCount: periods.length,
      currentSelectedPeriod: selectedPeriod
    });

    if (periods.length > 0 && !selectedPeriod) {
      const today = new Date();
      // Reset time to 00:00:00 for date-only comparison
      today.setHours(0, 0, 0, 0);
      console.log('📅 Today:', today.toISOString());

      const currentPeriod = periods.find(period => {
        const startDate = new Date(period.start_date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(period.end_date);
        endDate.setHours(23, 59, 59, 999); // End of day

        const isInRange = today >= startDate && today <= endDate;

        console.log(`  Period "${period.name}":`, {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          isInRange,
        });

        return isInRange;
      });

      console.log('✅ Found current period:', currentPeriod ? currentPeriod.name : 'NONE');

      const periodToSelect = currentPeriod
        ? currentPeriod.id.toString()
        : periods[0].id.toString();

      console.log('🎯 Auto-selecting period:', periodToSelect);
      setSelectedPeriod(periodToSelect);
    }
  }, [periods]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<RankingPeriod | null>(null);
  const [deletingPeriodId, setDeletingPeriodId] = useState<number | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Filter sessions based on selected period
  const filteredSessions = useMemo(() => {
    if (!selectedPeriod) return [];

    const period = periods.find(p => p.id.toString() === selectedPeriod);
    if (!period) return [];

    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }, [sessions, selectedPeriod, periods]);

  // Calcular estatísticas DINAMICAMENTE baseado nas sessões filtradas
  const playerStats = useMemo((): PlayerStats[] => {
    if (!players.length || !filteredSessions.length) return [];

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

    // Calcular estatísticas baseadas em TODAS as sessões filtradas (não só aprovadas)
    filteredSessions.forEach(session => {
      if (!session.players_data || !Array.isArray(session.players_data)) {
        return;
      }

      session.players_data.forEach((sessionPlayer: SessionPlayerData) => {
        if (!sessionPlayer.name) return;

        const playerStat = stats.get(sessionPlayer.name);
        if (!playerStat) {
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

    return sortedStats;
  }, [players, filteredSessions]);

  const handleCreatePeriod = () => {
    setEditingPeriod(null);
    setDialogOpen(true);
  };

  const handleEditPeriod = (period: RankingPeriod) => {
    setEditingPeriod(period);
    setDialogOpen(true);
  };

  const handleDeletePeriod = (periodId: number) => {
    setDeletingPeriodId(periodId);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPeriodId) return;

    try {
      await deletePeriod(deletingPeriodId);
      if (selectedPeriod === deletingPeriodId.toString()) {
        setSelectedPeriod(null);
      }
      toast({
        title: 'Sucesso',
        description: 'Período excluído com sucesso',
      });
    } catch (error) {
      console.error('Error deleting period:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir período',
        variant: 'destructive',
      });
    } finally {
      setDeletingPeriodId(null);
    }
  };

  const handleSavePeriod = async (data: CreateRankingPeriodPayload | UpdateRankingPeriodPayload) => {
    if (editingPeriod) {
      await updatePeriod(editingPeriod.id, data as UpdateRankingPeriodPayload);
    } else {
      await createPeriod(data as CreateRankingPeriodPayload);
    }
    // Refetch periods to update the list
    await refetchPeriods();
  };

  const handleRefresh = async () => {
    await Promise.all([refetchPlayers(), refetchSessions(), refetchPeriods()]);
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

  // Define columns for ranking table
  const columns: ColumnDef<PlayerStats>[] = [
    {
      id: "position",
      header: "Pos.",
      cell: ({ row }) => {
        const index = playerStats.findIndex(p => p.id === row.original.id);
        return (
          <div className="flex items-center justify-center">
            {getRankIcon(index + 1)}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Jogador" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          {row.original.email && (
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "sessionsPlayed",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sessões" />
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("sessionsPlayed")}</div>
      ),
    },
    {
      accessorKey: "totalBuyin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Buy-in Total" />
      ),
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.getValue("totalBuyin"))}</div>
      ),
    },
    {
      accessorKey: "totalCashout",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cash-out Total" />
      ),
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.getValue("totalCashout"))}</div>
      ),
    },
    {
      accessorKey: "profit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lucro Total" />
      ),
      cell: ({ row }) => {
        const profit = row.getValue("profit") as number;
        return (
          <div className="flex items-center justify-end gap-1">
            {profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(profit)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "profitPerSession",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lucro/Sessão" />
      ),
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.getValue("profitPerSession"))}</div>
      ),
    },
    {
      accessorKey: "winRate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Taxa Vitória" />
      ),
      cell: ({ row }) => (
        <div className="text-center">{(row.getValue("winRate") as number).toFixed(1)}%</div>
      ),
    },
    {
      accessorKey: "biggestWin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Maior Ganho" />
      ),
      cell: ({ row }) => (
        <div className="text-right text-green-600">{formatCurrency(row.getValue("biggestWin"))}</div>
      ),
    },
    {
      accessorKey: "biggestLoss",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Maior Perda" />
      ),
      cell: ({ row }) => (
        <div className="text-right text-red-600">{formatCurrency(row.getValue("biggestLoss"))}</div>
      ),
    },
  ];

  if (playersLoading || sessionsLoading || periodsLoading) {
    return <LoadingState text="Calculando rankings dinamicamente..." />;
  }

  if (playersError) {
    return <ErrorState message={playersError} />;
  }

  if (!players.length) {
    return (
      <div className={cn('space-y-4 md:space-y-6')}>
        <div className="space-y-1">
          <h1 className={getResponsiveTypography('display')}>
            Ranking de jogadores
          </h1>
          <p className={getResponsiveTypography('caption')}>
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

  const selectedPeriodData = selectedPeriod
    ? periods.find(p => p.id.toString() === selectedPeriod)
    : null;

  const periodDescription = selectedPeriodData
    ? `${selectedPeriodData.name} • ${filteredSessions.length} sessões`
    : `Nenhum período selecionado`;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="w-full max-w-full overflow-x-hidden min-w-0">
        <div className={cn('space-y-4 md:space-y-6 w-full min-w-0')}>
          <div className="space-y-3 w-full min-w-0">
            <div className="space-y-1">
              <h1 className={getResponsiveTypography('display')}>
                Ranking de jogadores
              </h1>
              <p className={getResponsiveTypography('caption')}>
                {periodDescription} • {playersWithSessions.length} jogadores com histórico
              </p>
            </div>

            {/* Period Selector */}
            <PeriodSelector
              periods={periods}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              onCreatePeriod={handleCreatePeriod}
              onEditPeriod={handleEditPeriod}
              onDeletePeriod={handleDeletePeriod}
              isAdmin={isAdmin}
            />
          </div>

          {/* Period Dialog */}
          <PeriodDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            period={editingPeriod}
            onSave={handleSavePeriod}
          />

          {/* Confirm Delete Dialog */}
          <ConfirmDialog
            open={confirmDialogOpen}
            onOpenChange={setConfirmDialogOpen}
            title="Excluir período"
            description="Tem certeza que deseja excluir este período? Esta ação não pode ser desfeita."
            onConfirm={confirmDelete}
            confirmText="Excluir"
            cancelText="Cancelar"
            variant="destructive"
          />

        {playersWithSessions.length === 0 ? (
          <EmptyState 
            icon={Trophy}
            title="Nenhuma sessão encontrada"
            description="O ranking aparecerá quando houver sessões aprovadas com jogadores."
          />
        ) : (
          <>
            {/* Top 3 - Mobile: Compact, Desktop: Full cards */}
            <div className={cn(
              'grid gap-3 md:gap-6 w-full',
              'grid-cols-3 md:grid-cols-3'
            )}>
              {playersWithSessions.slice(0, 3).map((player, index) => {
                const gradients = [
                  'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
                  'from-gray-400/20 to-gray-500/10 border-gray-400/30',
                  'from-orange-600/20 to-orange-700/10 border-orange-600/30'
                ];

                const icons = [
                  <Trophy key="1" className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />,
                  <Medal key="2" className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />,
                  <Award key="3" className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                ];

                return (
                  <div
                    key={player.name}
                    className={cn(
                      'rounded-lg border bg-gradient-to-br p-3 md:rounded-xl md:p-5',
                      gradients[index]
                    )}
                  >
                    {/* Icon - centered on mobile */}
                    <div className="flex justify-center mb-2 md:mb-3">
                      {icons[index]}
                    </div>

                    {/* Player name - truncated on mobile */}
                    <h3 className="font-semibold text-sm md:text-base text-center truncate mb-1">
                      {player.name}
                    </h3>

                    {/* Main stat - profit */}
                    <p className={cn(
                      'text-center font-bold text-base md:text-xl mb-2',
                      player.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {player.profit >= 0 ? '+' : ''}R$ {Math.abs(player.profit).toFixed(0)}
                    </p>

                    {/* Additional info - hide on very small mobile */}
                    <div className="hidden sm:flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Sessões:</span>
                        <span className="font-medium text-foreground">{player.sessionsPlayed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa:</span>
                        <span className="font-medium text-foreground">{player.winRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remaining players - Mobile: List, Desktop: Table */}
            <div className="w-full min-w-0">
              <h2 className={cn(
                getResponsiveTypography('subtitle'),
                'mb-3 px-3 md:px-0'
              )}>
                Classificação geral
              </h2>

              {/* Mobile List */}
              <div className="md:hidden">
                <MobileList
                  items={playersWithSessions.map((player, index) => ({
                    id: player.id,
                    icon: (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-bold">
                        {index + 1}
                      </div>
                    ),
                    primary: (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.name}</span>
                        {index < 3 && (
                          <span>
                            {index === 0 && <Trophy className="h-3 w-3 text-yellow-500" />}
                            {index === 1 && <Medal className="h-3 w-3 text-gray-400" />}
                            {index === 2 && <Award className="h-3 w-3 text-orange-600" />}
                          </span>
                        )}
                      </div>
                    ),
                    secondary: `${player.sessionsPlayed} sessões • Taxa: ${player.winRate.toFixed(1)}%`,
                    meta: (
                      <div className="text-right">
                        <p className={cn(
                          'font-semibold text-sm',
                          player.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {player.profit >= 0 ? '+' : ''}R$ {Math.abs(player.profit).toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(player.profitPerSession)}/sessão
                        </p>
                      </div>
                    )
                  }))}
                  emptyMessage="Nenhum jogador encontrado"
                />
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block w-full min-w-0">
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Classificação completa</CardTitle>
                    <CardDescription>
                      Todos os jogadores ordenados por lucro total • Calculado em tempo real
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto px-6 py-6">
                      <DataTable
                        columns={columns}
                        data={playersWithSessions}
                        searchKey="name"
                        searchPlaceholder="Filtrar por jogador..."
                        enableColumnVisibility={true}
                        enableSorting={true}
                        enableFiltering={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </PullToRefresh>
  );
}

export default function RankingPage() {
  return (
    <ToastProvider>
      <RankingPageContent />
    </ToastProvider>
  );
}