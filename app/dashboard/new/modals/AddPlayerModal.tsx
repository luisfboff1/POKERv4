import React from 'react';
import { Modal, ModalContent } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import type { Player } from '@/lib/types';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchPlayer: string;
  setSearchPlayer: (v: string) => void;
  filteredExistingPlayers: Array<Pick<Player, 'id' | 'name' | 'email'>>;
  addPlayerToSession: (player: Pick<Player, 'id' | 'name' | 'email'> | string, isExisting: boolean) => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  searchPlayer,
  setSearchPlayer,
  filteredExistingPlayers,
  addPlayerToSession
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Jogador" description="Novo jogador chegou durante o jogo" size="md">
    <ModalContent>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ou digitar nome..."
            value={searchPlayer}
            onChange={e => setSearchPlayer(e.target.value)}
            className="pl-10"
          />
        </div>
        {filteredExistingPlayers.length > 0 && (
          <div>
            <div className="mt-2 border rounded-lg p-2 bg-muted/30 max-h-40 overflow-y-auto">
              {filteredExistingPlayers.slice(0, 5).map(player => (
                <button
                  key={player?.id}
                  onClick={() => addPlayerToSession(player, true)}
                  className="w-full text-left p-2 rounded hover:bg-muted text-sm transition-colors"
                >
                  <div className="font-medium">{player?.name}</div>
                  {player?.email && (
                    <div className="text-xs text-muted-foreground">{player?.email}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {searchPlayer.trim() && (
          <div className="flex gap-2">
            <Button onClick={() => addPlayerToSession(searchPlayer, false)} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar &quot;{searchPlayer.trim()}&quot;
            </Button>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </ModalContent>
  </Modal>
);