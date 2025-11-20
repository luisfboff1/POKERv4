import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { SessionPlayersTable } from './session-players-table';
import TransferManager from '@/components/TransferManager';
import { useSessionAutoApproval } from '@/lib/sessionAutoApproval';
import type { LocalSession } from './sessions-table';
import { useMemo, useState, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Transfer } from '@/lib/transferSystem';

interface PlayerStateSnapshot {
  id: string | number;
  janta_paid: boolean;
}

interface SessionPlayer {
  id?: number | string;
  name: string;
  buyin?: number;
  cashout?: number;
  janta_paid?: boolean;
}

// Mantém sessão genérica; status opcional para permitir reuso
// Reusa LocalSession porém garantindo players tipados detalhados
type SessionLike = LocalSession & { 
  players_data?: SessionPlayer[];
  paid_transfers?: Record<string, boolean>;
};

interface SessionDetailsModalProps {
  session: SessionLike | null;
  isOpen: boolean;
  onClose(): void;
  onUpdateSessionPlayers: Dispatch<SetStateAction<SessionLike | null>>;
  onSave(sessionId: number, playersPayload: SessionPlayer[], paidTransfers?: Record<string, boolean>): Promise<void>;
}

export function SessionDetailsModal({ session, isOpen, onClose, onUpdateSessionPlayers, onSave }: SessionDetailsModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTransfers, setCurrentTransfers] = useState<Transfer[]>([]);
  
  // Configurar auto-aprovação para esta sessão
  const { onTransferUpdate } = useSessionAutoApproval(session?.id || 0);

  // Snapshot somente quando entra em modo edição
  const originalPlayersRef = useRef<PlayerStateSnapshot[] | null>(null);
  const originalTransfersRef = useRef<Record<string, boolean> | null>(null);
  const hasPaymentChanges = useMemo(() => {
    if (!editing) return false;
    if (!session?.players_data) return false;
    
    // Verificar mudanças nos pagamentos de janta
    const snapshot = originalPlayersRef.current;
    if (snapshot) {
      const hasJantaChanges = session.players_data.some((p) => {
        const orig = snapshot.find((o) => o.id === (p.id ?? p.name));
        if (!orig) return true; // novo jogador improvável aqui
        return orig.janta_paid !== !!p.janta_paid;
      });
      if (hasJantaChanges) return true;
    }
    
    // Verificar mudanças nas transferências
    const transferSnapshot = originalTransfersRef.current;
    if (transferSnapshot && currentTransfers.length > 0) {
      const currentPaidTransfers: Record<string, boolean> = {};
      currentTransfers.forEach(transfer => {
        const key = `${transfer.from}_${transfer.to}`;
        currentPaidTransfers[key] = transfer.isPaid || false;
      });
      
      // Comparar com snapshot original
      for (const key in currentPaidTransfers) {
        if ((transferSnapshot[key] || false) !== currentPaidTransfers[key]) {
          return true;
        }
      }
      
      // Verificar se há novas transferências
      for (const key in transferSnapshot) {
        if (!(key in currentPaidTransfers)) {
          return true;
        }
      }
    }
    
    return false;
  }, [editing, session?.players_data, currentTransfers]);

  const updatePlayerPayment = (playerIndex: number, field: 'janta_paid', value: boolean) => {
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
        janta_paid: !!p.janta_paid,
      }));
      
      // Converter transferências para formato paid_transfers
      const paidTransfers: Record<string, boolean> = {};
      currentTransfers.forEach(transfer => {
        const key = `${transfer.from}_${transfer.to}`;
        paidTransfers[key] = transfer.isPaid || false;
      });
      
      await onSave(session.id, payload, paidTransfers);
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
      size="xl"
      variant="solid"
      forceOpaque
    >
      {session && (
        <div className="flex flex-col h-full -m-6">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {session.players_data && (
              <div>
                <h4 className="font-medium mb-4">Jogadores</h4>
                <SessionPlayersTable
                  players={session.players_data}
                  sessionId={session.id}
                  editing={editing}
                  onToggleJanta={(playerIndex, value) => updatePlayerPayment(playerIndex, 'janta_paid', value)}
                />
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
                  existingTransfers={session.recommendations?.map(rec => ({
                    id: `${rec.from}_${rec.to}`,
                    from: rec.from,
                    to: rec.to,
                    amount: rec.amount,
                    isPaid: false, // será definido pelo paidTransfers
                    createdAt: new Date().toISOString()
                  }))}
                  paidTransfers={session.paid_transfers || {}}
                  disabled={!editing}
                  onTransferUpdate={async (transfers) => {
                    setCurrentTransfers(transfers);

                    // Sistema de auto-aprovação: verifica se pode aprovar automaticamente
                    try {
                      await onTransferUpdate(transfers);
                    } catch (error) {
                      console.error('Erro na auto-aprovação:', error);
                    }
                  }}
                  onStatusChange={(_status) => {
                    // Status updated
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Fixed footer with action buttons */}
          <ModalFooter>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Criar snapshot somente ao entrar em edição
                  if (session?.players_data) {
                    originalPlayersRef.current = session.players_data.map((p) => ({
                      id: (p.id ?? p.name) as string | number,
                      janta_paid: !!p.janta_paid,
                    }));
                  } else {
                    originalPlayersRef.current = [];
                  }
                  
                  // Criar snapshot das transferências
                  if (session?.paid_transfers) {
                    originalTransfersRef.current = { ...session.paid_transfers };
                  } else {
                    originalTransfersRef.current = {};
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
                          return { ...p, janta_paid: snap.janta_paid };
                        });
                        return { 
                          ...prev, 
                          players_data: restored,
                          paid_transfers: originalTransfersRef.current || {}
                        };
                      });
                    }
                    
                    setEditing(false);
                    originalPlayersRef.current = null;
                    originalTransfersRef.current = null;
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
          </ModalFooter>
        </div>
        )}
    </Modal>
  );
}
