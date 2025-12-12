'use client';

import { useState, useTransition, useEffect } from 'react';
import { LoadingState, ErrorState } from '@/components/ui/loading';
import { useSessions, useRankingPeriods, useCurrentPeriod } from '@/hooks/useApi';
import { useAuth } from '@/contexts/auth-context';
import { useModal, useConfirmModal } from '@/components/ui/modal';
import { SessionFilters } from './components/session-filters';
import { SessionsTable } from './components/sessions-table';
import type { LocalSession } from './components/sessions-table';
import { SessionDetailsModal } from './components/session-details-modal';
import { MobileList } from '@/components/ui/mobile-list';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getResponsiveTypography } from '@/lib/mobile-utils';
import { Eye, Trash2, SlidersHorizontal, History } from 'lucide-react';
import type { SessionPlayerData, RankingPeriod } from '@/lib/types';
import { PeriodSelector } from '@/components/ranking/period-selector';
// helpers usados dentro dos componentes importados

interface SessionFiltersState {
  search: string;
  status: 'all' | 'pending' | 'approved' | 'closed';
  dateFrom: string;
  dateTo: string;
}

type HistoricSessionMinimal = LocalSession;

export default function HistoryPage() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const { sessions, loading, error, refetch, deleteSession, updateSessionPayments } = useSessions();
  const { periods, loading: periodsLoading } = useRankingPeriods();
  const { currentPeriod } = useCurrentPeriod();
  const [filters, setFilters] = useState<SessionFiltersState>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<HistoricSessionMinimal | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const sessionDetailsModal = useModal();
  const { confirm, ConfirmModalComponent } = useConfirmModal();

  // Auto-selecionar período atual
  useEffect(() => {
    if (currentPeriod && !selectedPeriod && periods.length > 0) {
      setSelectedPeriod(currentPeriod.id.toString());
    }
  }, [currentPeriod, selectedPeriod, periods]);

  // Filtrar sessões
  const filteredSessions = sessions.filter(session => {
    if (filters.search && !session.location?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && session.status !== filters.status) {
      return false;
    }
    if (filters.dateFrom && session.date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && session.date > filters.dateTo) {
      return false;
    }

    // Filtrar por período selecionado
    if (selectedPeriod && selectedPeriod !== '0') {
      const period = periods.find(p => p.id.toString() === selectedPeriod);
      if (period) {
        const sessionDate = new Date(session.date);
        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);
        if (sessionDate < startDate || sessionDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });

  const handleDeleteSession = async (id: number) => {
    confirm({
      title: 'Excluir sessão',
      message: 'Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      variant: 'destructive',
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deleteSession(id);
            await refetch();
          } catch (err) {
            alert('Erro ao excluir sessão');
            console.error('Erro ao excluir:', err);
          }
        });
      }
    });
  };

  const handleRefresh = async () => {
    await refetch();
  };

  if (loading) {
    return <LoadingState text="Carregando histórico..." />;
  }

  if (error) {
    return <ErrorState message={error} retry={refetch} />;
  }

  const canModerate = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={!sessionDetailsModal.isOpen}>
      <div className={cn('space-y-4 md:space-y-6')}>
        {/* Header with mobile-optimized spacing */}
        <div className="space-y-1">
          <h1 className={getResponsiveTypography('display')}>
            Histórico de sessões
          </h1>
          <p className={getResponsiveTypography('caption')}>
            Acompanhe todas as partidas realizadas no seu clube
          </p>
        </div>

        {/* Period Selector */}
        {!periodsLoading && periods.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Período de ranking</label>
            <PeriodSelector
              periods={[
                { id: 0, name: 'Todas as sessões', tenant_id: 0, start_date: '', end_date: '', is_active: true, created_at: '', updated_at: '' } as RankingPeriod,
                ...periods
              ]}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              isAdmin={false}
            />
          </div>
        )}

        {/* Filters - Desktop: inline, Mobile: modal */}
        <div className="flex items-center gap-3">
          {/* Desktop filters */}
          <div className="hidden md:block flex-1">
            <SessionFilters value={filters} onChange={setFilters} />
          </div>
          
          {/* Mobile filter button */}
          <Button
            variant="outline"
            size="default"
            className="md:hidden flex-1"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtros {(filters.status !== 'all' || filters.search || filters.dateFrom || filters.dateTo) && '(ativos)'}
          </Button>
        </div>

        {/* Mobile filters modal */}
        {showFilters && (
          <div className="md:hidden bg-surface/50 rounded-lg p-4 space-y-4 border border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                Fechar
              </Button>
            </div>
            <SessionFilters value={filters} onChange={setFilters} />
          </div>
        )}

        {/* Sessions - Mobile: List, Desktop: Table */}
        <div className="md:hidden">
          <MobileList
            items={filteredSessions.map((session) => {
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
                actions: canModerate ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                        sessionDetailsModal.open();
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : undefined,
                onClick: () => {
                  setSelectedSession(session);
                  sessionDetailsModal.open();
                }
              };
            })}
            emptyMessage="Nenhuma sessão encontrada"
            emptyIcon={<History className="h-10 w-10" />}
          />
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <SessionsTable
            sessions={filteredSessions}
            totalSessions={sessions.length}
            isPendingAction={isPending}
            canModerate={canModerate}
            onView={(s) => { setSelectedSession(s); sessionDetailsModal.open(); }}
            onDelete={handleDeleteSession}
          />
        </div>

        <SessionDetailsModal
          session={selectedSession}
          isOpen={sessionDetailsModal.isOpen}
          onClose={() => { sessionDetailsModal.close(); setSelectedSession(null); }}
          onUpdateSessionPlayers={setSelectedSession}
          onSave={async (id, payload, paidTransfers) => { 
            await updateSessionPayments(id, payload, paidTransfers); 
            await refetch(); 
          }}
        />

        {/* Modal de Confirmação */}
        {ConfirmModalComponent}
      </div>
    </PullToRefresh>
  );
}

