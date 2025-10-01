'use client';

import { useState, useTransition } from 'react';
import { LoadingState, ErrorState } from '@/components/ui/loading';
import { useSessions } from '@/hooks/useApi';
import { useAuth } from '@/contexts/auth-context';
import { useModal, useConfirmModal } from '@/components/ui/modal';
import { SessionFilters } from './components/session-filters';
import { SessionsTable, LocalSession } from './components/sessions-table';
import { SessionDetailsModal } from './components/session-details-modal';
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
  const { sessions, loading, error, refetch, deleteSession, approveSession, updateSessionPayments } = useSessions();
  const [filters, setFilters] = useState<SessionFiltersState>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedSession, setSelectedSession] = useState<HistoricSessionMinimal | null>(null);
  const sessionDetailsModal = useModal();
  const { confirm, ConfirmModalComponent } = useConfirmModal();

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

  const handleApproveSession = async (id: number) => {
    startTransition(async () => {
      try {
        await approveSession(id);
        // Recarregar a lista de sessões após aprovação bem-sucedida
        await refetch();
      } catch (err) {
        alert('Erro ao aprovar sessão');
        console.error('Erro ao aprovar:', err);
      }
    });
  };

  if (loading) {
    return <LoadingState text="Carregando histórico..." />;
  }

  if (error) {
    return <ErrorState message={error} retry={refetch} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Histórico de sessões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe todas as partidas realizadas no seu clube
        </p>
      </div>

      <SessionFilters value={filters} onChange={setFilters} />

      <SessionsTable
        sessions={filteredSessions}
        totalSessions={sessions.length}
        isPendingAction={isPending}
        canModerate={user?.role === 'admin' || user?.role === 'super_admin'}
  onView={(s) => { setSelectedSession(s); sessionDetailsModal.open(); }}
        onApprove={handleApproveSession}
        onDelete={handleDeleteSession}
      />

      <SessionDetailsModal
        session={selectedSession}
        isOpen={sessionDetailsModal.isOpen}
        onClose={() => { sessionDetailsModal.close(); setSelectedSession(null); }}
  onUpdateSessionPlayers={setSelectedSession}
        onSave={async (id, payload) => { await updateSessionPayments(id, payload); await refetch(); }}
      />

      {/* Modal de Confirmação */}
      {ConfirmModalComponent}
    </div>
  );
}

