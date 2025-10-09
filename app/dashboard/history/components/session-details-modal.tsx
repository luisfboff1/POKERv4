import { Modal, ModalContent } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { PlayerPaymentRow } from './player-payment-row';
import TransferManager from '@/components/TransferManager';
import { useSessionAutoApproval } from '@/lib/sessionAutoApproval';
import type { LocalSession } from './sessions-table';
import { useMemo, useState, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface PlayerStateSnapshot {
  id: string | number;
  session_paid: boolean;
  janta_paid: boolean;
}

interface SessionPlayer {
  id?: number | string;
  name: string;
  buyin?: number;
  cashout?: number;
  session_paid?: boolean;
  janta_paid?: boolean;
}

// Mantém sessão genérica; status opcional para permitir reuso
// Reusa LocalSession porém garantindo players tipados detalhados
type SessionLike = LocalSession & { players_data?: SessionPlayer[] };

interface SessionDetailsModalProps {
  session: SessionLike | null;
  isOpen: boolean;
  onClose(): void;
  onUpdateSessionPlayers: Dispatch<SetStateAction<SessionLike | null>>;
  onSave(sessionId: number, playersPayload: SessionPlayer[]): Promise<void>;
}

export function SessionDetailsModal({ session, isOpen, onClose, onUpdateSessionPlayers, onSave }: SessionDetailsModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Configurar auto-aprovação para esta sessão
  const { onTransferUpdate, checkAndApprove } = useSessionAutoApproval(session?.id || 0);

  // Snapshot somente quando entra em modo edição
  const originalPlayersRef = useRef<PlayerStateSnapshot[] | null>(null);
  const hasPaymentChanges = useMemo(() => {
    if (!editing) return false;
    if (!session?.players_data) return false;
    const snapshot = originalPlayersRef.current;
    if (!snapshot) return false;
    return session.players_data.some((p) => {
      const orig = snapshot.find((o) => o.id === (p.id ?? p.name));
      if (!orig) return true; // novo jogador improvável aqui
      return orig.session_paid !== !!p.session_paid || orig.janta_paid !== !!p.janta_paid;
    });
  }, [editing, session?.players_data]);

  const updatePlayerPayment = (playerIndex: number, field: 'session_paid' | 'janta_paid', value: boolean) => {
    if (!editing) return;
    onUpdateSessionPlayers((prev: SessionLike | null) => {
      if (!prev) return prev;
      const updated = [...(prev.players_data || [])];
      const current = { ...updated[playerIndex], [field]: value };
      updated[playerIndex] = current;
      return { ...prev, players_data: updated };
    });
  };

  const handleSave = async () => {
    if (!session?.id || !hasPaymentChanges) return;
    if (!session.players_data) return;
    try {
      setSaving(true);
      const payload: SessionPlayer[] = session.players_data.map((p) => ({
        id: p.id,
        name: p.name || 'Sem nome',
        session_paid: !!p.session_paid,
        janta_paid: !!p.janta_paid,
      }));
      await onSave(session.id, payload);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setEditing(false); onClose(); }}
      title="Detalhes da Sessão"
      description={session ? `${session.location} - ${new Date(session.date).toLocaleDateString('pt-BR')}` : ''}
      size="lg"
      variant="solid"
      forceOpaque
    >
      <ModalContent>
        {session && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Criar snapshot somente ao entrar em edição
                    if (session?.players_data) {
                      originalPlayersRef.current = session.players_data.map((p) => ({
                        id: (p.id ?? p.name) as string | number,
                        session_paid: !!p.session_paid,
                        janta_paid: !!p.janta_paid,
                      }));
                    } else {
                      originalPlayersRef.current = [];
                    }
                    setEditing(true);
                  }}
                >
                  Editar Pagamentos
                </Button>
              )}
              {editing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Restaurar snapshot se cancelar
                      if (originalPlayersRef.current && session?.players_data) {
                        onUpdateSessionPlayers((prev) => {
                          if (!prev) return prev;
                          const restored = prev.players_data?.map((p) => {
                            const snap = originalPlayersRef.current!.find((s) => s.id === (p.id ?? p.name));
                            if (!snap) return p;
                            return { ...p, session_paid: snap.session_paid, janta_paid: snap.janta_paid };
                          });
                          return { ...prev, players_data: restored };
                        });
                      }
                      setEditing(false);
                      originalPlayersRef.current = null;
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={!hasPaymentChanges || saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              )}
            </div>
            {session.players_data && (
              <div>
                <h4 className="font-medium mb-3">Jogadores</h4>
                <div className="space-y-2">
                  {session.players_data.map((player, index) => (
                    <PlayerPaymentRow
                      key={index}
                      player={player}
                      index={index}
                      sessionId={session.id}
                      editing={editing}
                      onToggle={(field, value) => updatePlayerPayment(index, field, value)}
                    />
                  ))}
                </div>
              </div>
            )}
            {session.players_data && session.players_data.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Transferências</h4>
                <TransferManager
                  players={session.players_data.map(p => ({
                    name: p.name,
                    buyin: p.buyin || 0,
                    cashout: p.cashout || 0,
                    profit: (p.cashout || 0) - (p.buyin || 0)
                  }))}
                  onTransferUpdate={async (transfers) => {
                    console.log('🔄 Transferências atualizadas:', transfers);
                    
                    // Sistema de auto-aprovação: verifica se pode aprovar automaticamente
                    try {
                      await onTransferUpdate(transfers);
                    } catch (error) {
                      console.error('Erro na auto-aprovação:', error);
                    }
                  }}
                  onStatusChange={(status) => {
                    console.log('📊 Status da sessão mudou para:', status);
                    if (status === 'completed') {
                      console.log('🎯 Todos os pagamentos completos! Sessão será aprovada automaticamente.');
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
