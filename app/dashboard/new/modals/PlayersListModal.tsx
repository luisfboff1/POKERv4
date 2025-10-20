import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle2, Circle } from 'lucide-react';
import type { Player, LiveSession, LivePlayer } from '@/lib/types';

interface PlayersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPlayers: Array<Pick<Player, 'id' | 'name' | 'email'>>;
  currentSession: LiveSession | null;
  addPlayerToSession: (player: Pick<Player, 'id' | 'name' | 'email'>, isExisting: boolean) => void;
}

export const PlayersListModal: React.FC<PlayersListModalProps> = ({
  isOpen,
  onClose,
  existingPlayers,
  currentSession,
  addPlayerToSession
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number | string>>(new Set());

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlayers(new Set());
    }
  }, [isOpen]);

  const togglePlayerSelection = (playerId: number | string) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    selectedPlayers.forEach(playerId => {
      const player = existingPlayers.find(p => p.id === playerId);
      if (player) {
        addPlayerToSession(player, true);
      }
    });
    setSelectedPlayers(new Set());
    onClose();
  };

  const selectedCount = selectedPlayers.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Todos os Jogadores"
      description="Selecione um ou mais jogadores para adicionar"
      size="md"
    >
      <ModalContent>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {existingPlayers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>Nenhum jogador cadastrado</p>
          </div>
        ) : (
          existingPlayers.map(player => {
            const isInSession = currentSession?.players.some((p: LivePlayer) => p.name.toLowerCase() === player.name.toLowerCase());
            const isSelected = selectedPlayers.has(player.id);

            return (
              <button
                key={player.id}
                onClick={() => {
                  if (!isInSession) {
                    togglePlayerSelection(player.id);
                  }
                }}
                disabled={isInSession}
                className={`w-full text-left p-3 rounded border transition-all flex items-start gap-3 ${
                  isInSession
                    ? 'opacity-50 cursor-not-allowed bg-muted/30'
                    : isSelected
                      ? 'border-primary bg-primary/5 hover:bg-primary/10'
                      : 'hover:bg-muted hover:border-primary/50'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isInSession ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{player.name}</div>
                  {player.email && (
                    <div className="text-muted-foreground text-xs">{player.email}</div>
                  )}
                  {isInSession && (
                    <div className="text-primary text-xs mt-1">Já na mesa</div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </ModalContent>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button
        onClick={handleAddSelected}
        disabled={selectedCount === 0}
      >
        Adicionar {selectedCount > 0 && `(${selectedCount})`}
      </Button>
    </ModalFooter>
  </Modal>
  );
};