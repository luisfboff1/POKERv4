'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Player } from '@/lib/types';

interface EditPlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: Partial<Player>) => Promise<void>;
}

export function EditPlayerModal({ player, isOpen, onClose, onSave }: EditPlayerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        status: player.status || 'active'
      });
      setError('');
    }
  }, [player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(player.id, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar jogador');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Editar Jogador</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do jogador"
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as 'active' | 'inactive' })
                }
                disabled={saving}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Jogadores inativos não aparecem em seleções
              </p>
            </div>
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
              disabled={saving || !formData.name.trim()}
              className="flex-1"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
