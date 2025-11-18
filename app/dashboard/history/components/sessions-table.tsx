import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/loading';
import { History as HistoryIcon, Eye, Trash2 } from 'lucide-react';
import { getStatusIcon, getStatusText, calculateSessionTotals } from './helpers';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

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
  // Define columns for sessions table
  const columns: ColumnDef<LocalSession>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {new Date(row.getValue("date")).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Local" />
      ),
      cell: ({ row }) => row.getValue("location"),
    },
    {
      id: "players",
      header: "Jogadores",
      cell: ({ row }) => {
        const totals = calculateSessionTotals(row.original.players_data || []);
        return totals.playerCount;
      },
    },
    {
      id: "totalBuyin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Buy-in" />
      ),
      cell: ({ row }) => {
        const totals = calculateSessionTotals(row.original.players_data || []);
        return `R$ ${totals.totalBuyin}`;
      },
    },
    {
      id: "totalCashout",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Cash-out" />
      ),
      cell: ({ row }) => {
        const totals = calculateSessionTotals(row.original.players_data || []);
        return `R$ ${totals.totalCashout}`;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as 'pending' | 'approved' | 'closed';
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="text-sm">{getStatusText(status)}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canModerate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original.id);
              }}
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
      ),
    },
  ];

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
          <DataTable
            columns={columns}
            data={sessions}
            searchKey="location"
            searchPlaceholder="Filtrar por local..."
            enableColumnVisibility={true}
            enableSorting={true}
            enableFiltering={true}
          />
        )}
      </CardContent>
    </Card>
  );
}
