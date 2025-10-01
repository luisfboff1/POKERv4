'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/loading';
import { useSessions } from '@/hooks/useApi';
import { useAuth } from '@/contexts/auth-context';
import { 
  History as HistoryIcon, 
  Search, 
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  CreditCard,
  Utensils
} from 'lucide-react';
import { Modal, ModalContent, useModal, useConfirmModal } from '@/components/ui/modal';

interface SessionFilters {
  search: string;
  status: 'all' | 'pending' | 'approved' | 'closed';
  dateFrom: string;
  dateTo: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'closed'>('all');
  const [isPending, startTransition] = useTransition();
  const { sessions, loading, error, refetch, deleteSession, approveSession } = useSessions();
  const [filters, setFilters] = useState<SessionFilters>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const sessionDetailsModal = useModal();
  const { confirm, ConfirmModalComponent } = useConfirmModal();

  // Função para atualizar pagamentos de jogador
  const updatePlayerPayment = async (sessionId: number, playerIndex: number, field: 'session_paid' | 'janta_paid', value: boolean) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session || !session.players_data) return;
      
      const updatedPlayersData = [...session.players_data];
      updatedPlayersData[playerIndex] = {
        ...updatedPlayersData[playerIndex],
        [field]: value
      };
      
      // Aqui você pode fazer a chamada para API para salvar
      // Por enquanto, vamos apenas atualizar o estado local
      setSelectedSession({
        ...selectedSession,
        players_data: updatedPlayersData
      });
      
      // TODO: Implementar API call para salvar no backend
      console.log(`Atualizado: ${field} = ${value} para jogador ${playerIndex} na sessão ${sessionId}`);
      
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
    }
  };

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
            // Recarregar a lista de sessões após exclusão bem-sucedida
            await refetch();
          } catch (err) {
            // TODO: Substituir alert por toast ou modal de erro
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovada';
      case 'closed':
        return 'Fechada';
      default:
        return status;
    }
  };

  const calculateSessionTotals = (playersData: any[]) => {
    if (!Array.isArray(playersData)) return { totalBuyin: 0, totalCashout: 0, playerCount: 0 };
    
    const totalBuyin = playersData.reduce((sum, p) => sum + (p.buyin || 0), 0);
    const totalCashout = playersData.reduce((sum, p) => sum + (p.cashout || 0), 0);
    
    return {
      totalBuyin,
      totalCashout,
      playerCount: playersData.length
    };
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar por local</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do local..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-surface text-foreground"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value as any})}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovada</option>
                <option value="closed">Fechada</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data inicial</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data final</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Sessões */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessões ({filteredSessions.length})</CardTitle>
              <CardDescription>
                {filteredSessions.length === sessions.length 
                  ? 'Todas as sessões' 
                  : `${filteredSessions.length} de ${sessions.length} sessões`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <EmptyState 
              title="Nenhuma sessão encontrada"
              description="Não há sessões que correspondam aos filtros selecionados."
              icon={HistoryIcon}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Jogadores</TableHead>
                  <TableHead>Total Buy-in</TableHead>
                  <TableHead>Total Cash-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const totals = calculateSessionTotals(session.players_data || []);
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {new Date(session.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{session.location}</TableCell>
                      <TableCell>{totals.playerCount}</TableCell>
                      <TableCell>R$ {totals.totalBuyin}</TableCell>
                      <TableCell>R$ {totals.totalCashout}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(session.status)}
                          <span className="text-sm">{getStatusText(session.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSession(session);
                              sessionDetailsModal.open();
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {(user?.role === 'admin' || user?.role === 'super_admin') && (
                            <>
                              {session.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApproveSession(session.id)}
                                  disabled={isPending}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  {isPending ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSession(session.id)}
                                disabled={isPending}
                                className="text-destructive hover:text-destructive/80"
                              >
                                {isPending ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Sessão */}
      <Modal 
        isOpen={sessionDetailsModal.isOpen}
        onClose={() => {
          sessionDetailsModal.close();
          setSelectedSession(null);
        }}
        title="Detalhes da Sessão"
        description={selectedSession ? `${selectedSession.location} - ${new Date(selectedSession.date).toLocaleDateString('pt-BR')}` : ''}
        size="lg"
      >
        <ModalContent>
          {selectedSession && (
            <div className="space-y-6">
              {/* Jogadores */}
              {selectedSession.players_data && (
                <div>
                  <h4 className="font-medium mb-3">Jogadores</h4>
                  <div className="space-y-2">
                    {selectedSession.players_data.map((player: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">{player.name}</span>
                          <div className="text-sm space-x-4 mt-1">
                            <span>Buy-in: R$ {player.buyin}</span>
                            <span>Cash-out: R$ {player.cashout}</span>
                            <span className={`font-medium ${
                              (player.cashout - player.buyin) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {player.cashout - player.buyin >= 0 ? '+' : ''}R$ {player.cashout - player.buyin}
                            </span>
                          </div>
                        </div>
                        
                        {/* Checkboxes de Pagamento */}
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`session_paid_${selectedSession.id}_${index}`}
                              checked={player.session_paid || false}
                              onChange={(e) => updatePlayerPayment(selectedSession.id, index, 'session_paid', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`session_paid_${selectedSession.id}_${index}`} className="text-xs flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              Sessão
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`janta_paid_${selectedSession.id}_${index}`}
                              checked={player.janta_paid || false}
                              onChange={(e) => updatePlayerPayment(selectedSession.id, index, 'janta_paid', e.target.checked)}
                              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <label htmlFor={`janta_paid_${selectedSession.id}_${index}`} className="text-xs flex items-center gap-1">
                              <Utensils className="h-3 w-3" />
                              Janta
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {selectedSession.recommendations && selectedSession.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Transferências</h4>
                  <div className="space-y-2">
                    {selectedSession.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">
                          <span className="font-medium">{rec.from}</span> → <span className="font-medium">{rec.to}</span>
                        </span>
                        <span className="font-medium text-primary">R$ {rec.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de Confirmação */}
      {ConfirmModalComponent}
    </div>
  );
}

