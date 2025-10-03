import React from 'react';
import { Modal, ModalContent } from '@/components/ui/modal';
import { Users } from 'lucide-react';
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
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Todos os Jogadores" description="Selecione um jogador da lista" size="md">
    <ModalContent>
      <div className="space-y-3">
        {existingPlayers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>Nenhum jogador cadastrado</p>
          </div>
        ) : (
          existingPlayers.map(player => {
            const isInSession = currentSession?.players.some((p: LivePlayer) => p.name.toLowerCase() === player.name.toLowerCase());
            return (
              <div
                key={player.id}
                className={`w-full rounded-lg border border-border bg-[#25422f] text-white shadow-sm transition-all ${isInSession ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-primary/50'}`}
                style={{
                  boxShadow: isInSession ? 'none' : '0 2px 8px 0 rgba(0,0,0,0.12)',
                }}
              >
                <button
                  onClick={() => {
                    if (!isInSession) {
                      addPlayerToSession(player, true);
                      onClose();
                    }
                  }}
                  disabled={isInSession}
                  className="w-full text-left p-3 bg-transparent text-sm rounded-lg"
                >
                  <div className="font-semibold">{player.name}</div>
                  {player.email && (
                    <div className="text-muted-foreground text-xs">{player.email}</div>
                  )}
                  {isInSession && (
                    <div className="text-primary text-xs mt-1">● Já na mesa</div>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </ModalContent>
  </Modal>
);