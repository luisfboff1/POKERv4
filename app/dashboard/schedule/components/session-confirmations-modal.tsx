'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react';
import type { Player } from '@/lib/types';

interface Confirmation {
  id: number;
  session_id: number;
  player_id: number;
  player_name: string;
  player_nickname?: string;
  confirmed: boolean;
  confirmed_at?: string;
  created_at: string;
}

interface SessionConfirmationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: number;
    location: string;
    scheduled_date?: string;
    date: string;
    confirmations?: Confirmation[];
  };
  players: Player[];
  onRefresh: () => void;
}

export function SessionConfirmationsModal({
  isOpen,
  onClose,
  session,
  players,
  onRefresh,
}: SessionConfirmationsModalProps) {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && session) {
      loadConfirmations();
    }
  }, [isOpen, session?.id]);

  const loadConfirmations = async () => {
    try {
      setLoading(true);
      const response = await api.sessions.getConfirmations(session.id);
      setConfirmations((response.data as Confirmation[]) || []);
    } catch (error) {
      console.error('Error loading confirmations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (playerId: number, confirmed: boolean) => {
    try {
      setProcessing(playerId);
      await api.sessions.confirmPlayer(session.id, playerId, confirmed);
      await loadConfirmations();
      onRefresh();
    } catch (error) {
      console.error('Error updating confirmation:', error);
      alert('Erro ao atualizar confirmação');
    } finally {
      setProcessing(null);
    }
  };

  const handleAddPlayer = async (playerId: number) => {
    try {
      setProcessing(playerId);
      await api.sessions.confirmPlayer(session.id, playerId, false);
      await loadConfirmations();
      onRefresh();
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Erro ao adicionar jogador');
    } finally {
      setProcessing(null);
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  // Get players not yet invited
  const invitedPlayerIds = confirmations.map((c) => c.player_id);
  const uninvitedPlayers = players.filter((p) => !invitedPlayerIds.includes(p.id));

  const confirmedCount = confirmations.filter((c) => c.confirmed).length;
  const pendingCount = confirmations.length - confirmedCount;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="max-w-3xl">
        <ModalHeader>
          <ModalTitle>Confirmações de Presença</ModalTitle>
        </ModalHeader>

        <div className="p-6 space-y-6">
          {/* Session Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{session.location}</div>
                <div className="text-sm text-muted-foreground">
                  {session.scheduled_date
                    ? formatDateTime(session.scheduled_date)
                    : formatDateTime(session.date)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {confirmedCount} confirmados / {confirmations.length} convidados
                </div>
                {pendingCount > 0 && (
                  <div className="text-xs text-muted-foreground">{pendingCount} pendentes</div>
                )}
              </div>
            </div>
          </div>

          {/* Confirmations Table */}
          {loading ? (
            <LoadingState text="Carregando confirmações..." />
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jogador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confirmado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum jogador convidado ainda
                        </TableCell>
                      </TableRow>
                    ) : (
                      confirmations.map((confirmation) => (
                        <TableRow key={confirmation.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{confirmation.player_name}</div>
                              {confirmation.player_nickname && (
                                <div className="text-xs text-muted-foreground">
                                  {confirmation.player_nickname}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {confirmation.confirmed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                Confirmado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <Clock className="h-3 w-3" />
                                Pendente
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {confirmation.confirmed_at
                              ? formatDateTime(confirmation.confirmed_at)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {!confirmation.confirmed ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirm(confirmation.player_id, true)}
                                disabled={processing === confirmation.player_id}
                                className="h-8 px-3 hover:bg-green-100 hover:text-green-800"
                              >
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                {processing === confirmation.player_id ? 'Confirmando...' : 'Confirmar'}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirm(confirmation.player_id, false)}
                                disabled={processing === confirmation.player_id}
                                className="h-8 px-3 hover:bg-red-100 hover:text-red-800"
                              >
                                <XCircle className="h-4 w-4 mr-1.5" />
                                {processing === confirmation.player_id
                                  ? 'Cancelando...'
                                  : 'Cancelar'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Add More Players */}
              {uninvitedPlayers.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Adicionar mais jogadores</div>
                  <div className="flex flex-wrap gap-2">
                    {uninvitedPlayers.map((player) => (
                      <Button
                        key={player.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddPlayer(player.id)}
                        disabled={processing === player.id}
                        className="h-8"
                      >
                        <UserPlus className="h-3 w-3 mr-1.5" />
                        {player.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
