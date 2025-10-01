import { Modal, ModalContent } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { PlayerPaymentRow } from './player-payment-row';
import { LocalSession } from './sessions-table';
import { useMemo, useState, Dispatch, SetStateAction } from 'react';

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

  const originalPlayersState: PlayerStateSnapshot[] = useMemo(() => {
    if (!session?.players_data) return [];
    return session.players_data.map((p) => ({
      id: (p.id ?? p.name) as string | number,
      session_paid: !!p.session_paid,
      janta_paid: !!p.janta_paid,
    }));
  }, [session?.players_data]);

  const hasPaymentChanges = useMemo(() => {
    if (!session?.players_data) return false;
    return session.players_data.some((p) => {
      const orig = originalPlayersState.find((o: PlayerStateSnapshot) => o.id === (p.id ?? p.name));
      if (!orig) return true;
      return orig.session_paid !== !!p.session_paid || orig.janta_paid !== !!p.janta_paid;
    });
  }, [session, originalPlayersState]);

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
    >
      <ModalContent>
        {session && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Editar Pagamentos
                </Button>
              )}
              {editing && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
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
            {session.recommendations && session.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Transferências</h4>
                <div className="space-y-2">
                  {session.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">
                        <span className="font-medium">{rec.from}</span> → <span className="font-medium">{rec.to}</span>
                      </span>
                      <span className="font-medium text-primary">R$ {rec.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
