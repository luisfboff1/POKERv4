'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Player } from '@/lib/types';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: {
    scheduled_date: string;
    location: string;
    max_players?: number;
    player_ids?: number[];
  }) => Promise<void>;
  players: Player[];
}

export function ScheduleSessionModal({
  isOpen,
  onClose,
  onSchedule,
  players,
}: ScheduleSessionModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    max_players: '',
  });
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.time) {
      setError('Data e hora são obrigatórios');
      return;
    }

    if (!formData.location.trim()) {
      setError('Local é obrigatório');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const scheduled_date = `${formData.date}T${formData.time}:00`;

      await onSchedule({
        scheduled_date,
        location: formData.location,
        max_players: formData.max_players ? parseInt(formData.max_players) : undefined,
        player_ids: selectedPlayers.length > 0 ? selectedPlayers : undefined,
      });

      // Reset form
      setFormData({ date: '', time: '', location: '', max_players: '' });
      setSelectedPlayers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar sessão');
    } finally {
      setSaving(false);
    }
  };

  const handlePlayerToggle = (playerId: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({ date: '', time: '', location: '', max_players: '' });
      setSelectedPlayers([]);
      setError('');
      onClose();
    }
  };

  // Get minimum date/time (current date/time)
  const now = new Date();
  const minDate = now.toISOString().split('T')[0];
  const minTime = formData.date === minDate ? now.toTimeString().slice(0, 5) : '00:00';

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Agendar Sessão</ModalTitle>
        </ModalHeader>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={minDate}
                  disabled={saving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  min={formData.date === minDate ? minTime : undefined}
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Casa do João, Clube de Poker..."
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_players">Número máximo de jogadores (opcional)</Label>
              <Input
                id="max_players"
                type="number"
                min="2"
                value={formData.max_players}
                onChange={(e) => setFormData({ ...formData, max_players: e.target.value })}
                placeholder="Deixe em branco para ilimitado"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Limite de vagas para a sessão
              </p>
            </div>

            <div className="space-y-2">
              <Label>Convidar jogadores (opcional)</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                {players.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum jogador cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {players.map((player) => (
                      <label
                        key={player.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.id)}
                          onChange={() => handlePlayerToggle(player.id)}
                          disabled={saving}
                          className="rounded"
                        />
                        <span className="text-sm">{player.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Os jogadores selecionados receberão um convite para confirmar presença
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || !formData.date || !formData.time || !formData.location.trim()}
                className="flex-1"
              >
                {saving ? 'Agendando...' : 'Agendar Sessão'}
              </Button>
            </div>
          </form>
        </div>
      </ModalContent>
    </Modal>
  );
}
