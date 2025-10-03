// ...existing code...
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/loading';
import { History as HistoryIcon, Eye, CheckCircle, Trash2 } from 'lucide-react';
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
import React from 'react';

interface SessionsTableProps {
  sessions: LocalSession[];
  canModerate: boolean;
  onView: (session: LocalSession) => void;
  onApprove: (id: number) => void;
  onDelete: (id: number) => void;
  isPendingAction: boolean;
  totalSessions: number;
}

export function SessionsTable({ sessions, canModerate, onView, onApprove, onDelete, isPendingAction }: SessionsTableProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState 
        title="Nenhuma sessão encontrada"
        description="Não há sessões que correspondam aos filtros selecionados."
        icon={HistoryIcon}
      />
    );
  }
  return (
    <div
      className="overflow-x-auto rounded-xl border border-primary/30 shadow-lg bg-card"
    >
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
          {sessions.map((session: LocalSession) => {
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
                    <Button size="sm" variant="outline" onClick={() => onView(session)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canModerate && (
                      <>
                        {session.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => onApprove(session.id)} disabled={isPendingAction} className="text-green-600 hover:text-green-700">
                            {isPendingAction ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => onDelete(session.id)} disabled={isPendingAction} className="text-destructive hover:text-destructive/80">
                          {isPendingAction ? (
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
    </div>
  );
}
