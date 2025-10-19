import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/loading';
import { History as HistoryIcon, Eye, Trash2 } from 'lucide-react';
import { getStatusIcon, getStatusText, calculateSessionTotals } from './helpers';

export interface LocalSessionPlayer { id?: number | string; name: string; buyin?: number; cashout?: number; session_paid?: boolean; janta_paid?: boolean; }
export interface LocalSession {
  id: number;
  date: string;
  location: string;
  status: 'pending' | 'approved' | 'closed';
  players_data?: LocalSessionPlayer[];
  recommendations?: { from: string; to: string; amount: number }[];
}

interface SessionsTableProps {
  sessions: LocalSession[];
  totalSessions: number;
  isPendingAction: boolean;
  canModerate: boolean;
  onView(session: LocalSession): void;
  onDelete(id: number): void;
}

export function SessionsTable({ sessions, totalSessions, isPendingAction, canModerate, onView, onDelete }: SessionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sessões ({sessions.length})</CardTitle>
            <CardDescription>
              {sessions.length === totalSessions ? 'Todas as sessões' : `${sessions.length} de ${totalSessions} sessões`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
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
              {sessions.map((session) => {
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
                          onClick={() => onView(session)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canModerate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(session.id)}
                            disabled={isPendingAction}
                            className="text-destructive hover:text-destructive/80"
                          >
                            {isPendingAction ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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
  );
}
