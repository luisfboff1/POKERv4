import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Minus, Search, UserPlus } from 'lucide-react';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { SessionStep } from './SessionCreateStep';

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
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {currentSession.location}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date(currentSession.date).toLocaleDateString('pt-BR')} • Adicionando jogadores
        </p>
      </div>
      <Button
        onClick={() => setStep('active')}
        disabled={currentSession.players.length < 2}
        size="sm"
      >
        <Plus className="mr-2 h-4 w-4" />
        Começar Jogo
      </Button>
    </div>

    {error && (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-4">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )}

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Adicionar Jogador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar jogador existente ou criar novo (Enter para adicionar)..."
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
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => addPlayerModal.open()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
          <Button
            variant="outline"
            onClick={() => playersListModal.open()}
          >
            <Users className="h-4 w-4 mr-2" />
            Lista
          </Button>
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
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar &quot;{searchPlayer.trim()}&quot;
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Jogadores na mesa ({currentSession.players.length})</CardTitle>
        <CardDescription>
          Buy-in inicial: {formatCurrency(defaultBuyin)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentSession.players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>Nenhum jogador adicionado</p>
            <p className="text-sm">Adicione pelo menos 2 jogadores para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSession.players.map((player: LivePlayer, index: number) => (
              <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Buy-in: {formatCurrency(player.buyin)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlayer(player.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                Total em mesa: {formatCurrency(totals.totalBuyin)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);