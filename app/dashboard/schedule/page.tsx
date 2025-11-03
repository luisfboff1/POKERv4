'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePlayers } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/ui/loading';
import { useModal } from '@/components/ui/modal';
import { Calendar, MapPin, Users, Clock, CheckCircle, Plus } from 'lucide-react';
import { ScheduleSessionModal } from './components/schedule-session-modal';
import { SessionConfirmationsModal } from './components/session-confirmations-modal';
import type { Session, SessionConfirmation } from '@/lib/types';

interface ScheduledSession extends Session {
  confirmations?: SessionConfirmation[];
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { players } = usePlayers();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null);

  const scheduleModal = useModal();
  const confirmationsModal = useModal();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.sessions.list();

      // Filter for scheduled sessions (those with scheduled_date in the future)
      const now = new Date();
      const allSessions = (response.data as Session[]) || [];

      const scheduledSessions = allSessions.filter((s: Session) => {
        if (!s.scheduled_date) return false;
        return new Date(s.scheduled_date) > now;
      });

      // Set sessions first without confirmations
      setSessions(scheduledSessions);

      // Load confirmations asynchronously for each session
      scheduledSessions.forEach(async (session) => {
        try {
          const confirmationsResponse = await api.sessions.getConfirmations(session.id);
          const confirmations = (confirmationsResponse.data as SessionConfirmation[]) || [];

          // Update the session with confirmations
          setSessions(prev => prev.map(s =>
            s.id === session.id
              ? { ...s, confirmations }
              : s
          ));
        } catch (error) {
          console.error(`Error loading confirmations for session ${session.id}:`, error);
          // Still update with empty confirmations to avoid blocking
          setSessions(prev => prev.map(s =>
            s.id === session.id
              ? { ...s, confirmations: [] }
              : s
          ));
        }
      });

    } catch (error) {
      console.error('Error loading scheduled sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSession = async (data: {
    scheduled_date: string;
    location: string;
    max_players?: number;
    player_ids?: number[];
  }) => {
    try {
      await api.sessions.schedule(data);
      await loadSessions();
      scheduleModal.close();
    } catch (error) {
      console.error('Error scheduling session:', error);
      throw error;
    }
  };

  const handleViewConfirmations = async (session: ScheduledSession) => {
    try {
      const response = await api.sessions.getConfirmations(session.id);
      setSelectedSession({
        ...session,
        confirmations: (response.data as SessionConfirmation[]) || [],
      });
      confirmationsModal.open();
    } catch (error) {
      console.error('Error loading confirmations:', error);
      // Still open modal with empty confirmations
      setSelectedSession({
        ...session,
        confirmations: [],
      });
      confirmationsModal.open();
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
    }).format(date);
  };

  const getConfirmationStats = (session: ScheduledSession) => {
    if (!session.confirmations || session.confirmations.length === 0) {
      return { confirmed: 0, total: 0, pending: 0 };
    }

    const confirmed = session.confirmations.filter((c) => c.confirmed).length;
    const total = session.confirmations.length;
    const pending = total - confirmed;

    return { confirmed, total, pending };
  };

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agendamento de Sessões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize as próximas sessões agendadas
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="Área de Administrador"
              description="Apenas administradores podem agendar sessões."
              icon={Calendar}
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
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Agendamento de Sessões
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agende jogos futuros e gerencie confirmações de presença
          </p>
        </div>
        <Button onClick={scheduleModal.open}>
          <Plus className="h-4 w-4 mr-2" />
          Agendar Sessão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Sessões</CardTitle>
          <CardDescription>
            Sessões agendadas e confirmações de presença
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState text="Carregando sessões agendadas..." />
          ) : sessions.length === 0 ? (
            <EmptyState
              title="Nenhuma sessão agendada"
              description="Agende sua primeira sessão clicando no botão acima."
              icon={Calendar}
            />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Vagas</TableHead>
                    <TableHead>Confirmações</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const stats = getConfirmationStats(session);
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {session.scheduled_date
                                ? formatDateTime(session.scheduled_date)
                                : formatDate(session.date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{session.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.max_players ? (
                            <span className="text-sm">
                              {stats.confirmed}/{session.max_players}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Ilimitado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {stats.confirmed} confirmados
                              {stats.pending > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  / {stats.pending} pendentes
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              session.status === 'approved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : session.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {session.status === 'approved' ? 'Confirmada' : 'Agendada'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewConfirmations(session)}
                            className="h-8 px-3"
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Ver Confirmações
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={scheduleModal.isOpen}
        onClose={scheduleModal.close}
        onSchedule={handleScheduleSession}
        players={players}
      />

      {/* Confirmations Modal */}
      {selectedSession && (
        <SessionConfirmationsModal
          isOpen={confirmationsModal.isOpen}
          onClose={() => {
            confirmationsModal.close();
            setSelectedSession(null);
          }}
          session={selectedSession}
          players={players}
          onRefresh={loadSessions}
        />
      )}
    </div>
  );
}
