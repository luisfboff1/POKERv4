import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, UserPlus, Trash2 } from 'lucide-react';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { SessionStep } from './SessionCreateStep';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

// Helper simples de moeda (poderá ser substituído por formatCurrency util)
import { formatCurrency } from '@/lib/format';

interface ExistingPlayer {
  id: number | string;
  name: string;
  email?: string;
}

interface SessionPlayersStepProps {
  currentSession: LiveSession;
  defaultBuyin: number;
  error: string;
  searchPlayer: string;
  setSearchPlayer: (v: string) => void;
  filteredExistingPlayers: ExistingPlayer[];
  addPlayerToSession: (player: ExistingPlayer | string, isExisting: boolean) => void;
  addPlayerModal: { isOpen: boolean; open: () => void; close: () => void };
  playersListModal: { isOpen: boolean; open: () => void; close: () => void };
  removePlayer: (id: string) => void;
  totals: { totalBuyin: number };
  setStep: (step: SessionStep) => void;
}

export const SessionPlayersStep: React.FC<SessionPlayersStepProps> = ({
  currentSession,
  defaultBuyin,
  error,
  searchPlayer,
  setSearchPlayer,
  filteredExistingPlayers,
  addPlayerToSession,
  addPlayerModal,
  playersListModal,
  removePlayer,
  totals,
  setStep
}) => {
  // Define columns for player table
  const columns: ColumnDef<LivePlayer>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Jogador" />
      ),
      cell: ({ row }) => {
        const index = currentSession.players.findIndex(p => p.id === row.original.id);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "buyin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Buy-in" />
      ),
      cell: ({ row }) => formatCurrency(row.getValue("buyin")),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            removePlayer(row.original.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
  <div className="space-y-4 md:space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
          {currentSession.location}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          {new Date(currentSession.date).toLocaleDateString('pt-BR')} • Adicionando jogadores
        </p>
      </div>
      <Button
        onClick={() => setStep('active')}
        disabled={currentSession.players.length < 2}
        size="default"
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        Começar Jogo
      </Button>
    </div>

    {error && (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-3 md:pt-4 pb-3 md:pb-4">
          <p className="text-xs md:text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )}

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
          Adicionar Jogador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar jogador ou criar novo (Enter para adicionar)..."
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchPlayer.trim()) {
                  e.preventDefault();
                  const matchingPlayer = filteredExistingPlayers[0];
                  if (matchingPlayer) {
                    addPlayerToSession(matchingPlayer, true);
                  } else {
                    addPlayerToSession(searchPlayer.trim(), false);
                  }
                  setSearchPlayer('');
                }
              }}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => addPlayerModal.open()}
              className="flex-1 sm:flex-none h-11"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="sm:inline">Novo</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => playersListModal.open()}
              className="flex-1 sm:flex-none h-11"
            >
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="sm:inline">Lista</span>
            </Button>
          </div>
        </div>

        {searchPlayer && filteredExistingPlayers.length > 0 && (
          <div className="border rounded-lg p-2 bg-muted/30">
            <p className="text-sm font-medium mb-2">Jogadores cadastrados:</p>
            <div className="space-y-1">
              {filteredExistingPlayers.slice(0, 5).map(player => (
                <button
                  key={player.id}
                  onClick={() => addPlayerToSession(player, true)}
                  className="w-full text-left p-2 rounded hover:bg-muted text-sm"
                >
                  {player.name}{player.email ? ` (${player.email})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {searchPlayer.trim() && filteredExistingPlayers.length === 0 && (
          <div>
            <Button
              onClick={() => addPlayerToSession(searchPlayer.trim(), false)}
              size="default"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar &quot;{searchPlayer.trim()}&quot;
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Jogadores na mesa ({currentSession.players.length})</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Buy-in inicial: {formatCurrency(defaultBuyin)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentSession.players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-10 w-10 md:h-12 md:w-12 mb-3 opacity-50" />
            <p className="text-sm md:text-base">Nenhum jogador adicionado</p>
            <p className="text-xs md:text-sm">Adicione pelo menos 2 jogadores para começar</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={currentSession.players}
              searchKey="name"
              searchPlaceholder="Filtrar por jogador..."
              enableColumnVisibility={true}
              enableSorting={true}
              enableFiltering={true}
            />
            <div className="pt-4 mt-4 border-t">
              <div className="text-xs md:text-sm text-muted-foreground">
                Total em mesa: {formatCurrency(totals.totalBuyin)}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  </div>
);
};