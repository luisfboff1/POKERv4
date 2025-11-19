'use client';

import { useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Utensils } from 'lucide-react';

interface SessionPlayer {
  id?: number | string;
  name: string;
  buyin?: number;
  cashout?: number;
  janta_paid?: boolean;
}

interface SessionPlayersTableProps {
  players: SessionPlayer[];
  sessionId: number;
  editing: boolean;
  onToggleJanta: (playerIndex: number, value: boolean) => void;
}

export function SessionPlayersTable({
  players,
  sessionId,
  editing,
  onToggleJanta
}: SessionPlayersTableProps) {

  const columns: ColumnDef<SessionPlayer>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Jogador',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'buyin',
      header: 'Buy-in',
      cell: ({ row }) => (
        <div className="text-sm">R$ {(row.original.buyin || 0).toFixed(2)}</div>
      ),
    },
    {
      accessorKey: 'cashout',
      header: 'Cash-out',
      cell: ({ row }) => (
        <div className="text-sm">R$ {(row.original.cashout || 0).toFixed(2)}</div>
      ),
    },
    {
      id: 'profit',
      header: 'Profit',
      cell: ({ row }) => {
        const profit = (row.original.cashout || 0) - (row.original.buyin || 0);
        return (
          <div className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: 'janta_paid',
      header: () => (
        <div className="flex items-center gap-1">
          <Utensils className="h-3 w-3" />
          <span>Janta</span>
        </div>
      ),
      cell: ({ row }) => {
        const playerIndex = players.findIndex(p =>
          (p.id && p.id === row.original.id) || p.name === row.original.name
        );

        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              id={`janta_paid_${sessionId}_${playerIndex}`}
              checked={!!row.original.janta_paid}
              disabled={!editing}
              onChange={(e) => onToggleJanta(playerIndex, e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        );
      },
    },
  ], [players, sessionId, editing, onToggleJanta]);

  return (
    <DataTable
      columns={columns}
      data={players}
      searchKey="name"
      searchPlaceholder="Buscar jogador..."
      enableColumnVisibility={false}
      enableSorting={true}
      enableFiltering={true}
    />
  );
}
