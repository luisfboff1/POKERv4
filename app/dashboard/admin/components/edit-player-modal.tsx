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
  onRefresh?: () => void;
}

type EditMode = 'basic' | 'associate';

export function EditPlayerModal({ player, isOpen, onClose, onSave, onRefresh }: EditPlayerModalProps) {
  const [editMode, setEditMode] = useState<EditMode>('basic');
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        status: player.status || 'active'
      });
      setEmailData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      setError('');
      setEditMode('basic');
      setNeedsPassword(false);
    }
  }, [player]);

  const handleBasicSubmit = async (e: React.FormEvent) => {
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
      // onSave will handle closing via parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar jogador');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    const email = emailData.email.trim();
    if (!email) {
      setError('Email é obrigatório');
      return;
    }

    if (needsPassword) {
      if (!emailData.password || emailData.password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (emailData.password !== emailData.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/players/${player.id}/associate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: needsPassword ? emailData.password : undefined,
          createAccount: needsPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsConfirmation) {
          setNeedsPassword(true);
          setError('');
          return;
        }
        throw new Error(data.error || 'Falha ao associar email');
      }

      // Success - refresh and close
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao associar email');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError('');
      setEditMode('basic');
      setNeedsPassword(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Editar Jogador</ModalTitle>
        </ModalHeader>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Show player info if already has account */}
          {player?.user_id && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
              Este jogador já possui uma conta associada
            </div>
          )}

          {/* Mode selector */}
          {!player?.user_id && (
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setEditMode('basic')}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  editMode === 'basic'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Editar Informações
              </button>
              <button
                type="button"
                onClick={() => setEditMode('associate')}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  editMode === 'associate'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Associar Email
              </button>
            </div>
          )}

          {/* Basic edit form */}
          {editMode === 'basic' && (
            <form onSubmit={handleBasicSubmit} className="space-y-4">
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
          )}

          {/* Email association form */}
          {editMode === 'associate' && !player?.user_id && (
            <form onSubmit={handleEmailAssociate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  disabled={saving}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {needsPassword 
                    ? 'Email não cadastrado. Defina uma senha para criar a conta.'
                    : 'Digite o email para associar ao jogador'
                  }
                </p>
              </div>

              {needsPassword && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={emailData.password}
                      onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={emailData.confirmPassword}
                      onChange={(e) => setEmailData({ ...emailData, confirmPassword: e.target.value })}
                      placeholder="Digite a senha novamente"
                      disabled={saving}
                      required
                    />
                  </div>
                </>
              )}

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
                  disabled={saving || !emailData.email.trim()}
                  className="flex-1"
                >
                  {saving ? 'Associando...' : needsPassword ? 'Criar e Associar' : 'Associar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
