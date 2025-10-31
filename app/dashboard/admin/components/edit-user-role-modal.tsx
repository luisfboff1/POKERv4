'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Crown, User as UserIcon } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  global_role?: string;
  tenants?: Array<{ tenant_id: number; tenant_name?: string; role: string }>;
}

interface EditUserRoleModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, role: string, tenantId?: number) => Promise<void>;
  isSuperAdmin: boolean;
  currentTenantId?: number;
}

export function EditUserRoleModal({
  user,
  isOpen,
  onClose,
  onSave,
  isSuperAdmin,
  currentTenantId,
}: EditUserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      // For super admin, show global role; for tenant admin, show tenant role
      setSelectedRole(isSuperAdmin ? user.role : (user.role || 'player'));
      setError('');
    }
  }, [user, isSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole) return;

    setSaving(true);
    setError('');

    try {
      await onSave(user.id, selectedRole, currentTenantId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar role');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'Jogador';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Alterar Permissões</ModalTitle>
        </ModalHeader>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {user && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="text-sm text-muted-foreground">Usuário</div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                {user.tenants && user.tenants.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Membro de {user.tenants.length} grupo(s)
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    {isSuperAdmin ? 'Permissão Global' : 'Permissão no Grupo'}
                  </Label>
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={saving}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isSuperAdmin && (
                        <SelectItem value="super_admin">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <span>Super Admin</span>
                          </div>
                        </SelectItem>
                      )}
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="player">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span>Jogador</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {isSuperAdmin
                      ? 'Super Admins têm acesso total ao sistema. Admins podem gerenciar seus grupos.'
                      : 'Admins podem gerenciar usuários e configurações do grupo.'}
                  </p>
                </div>

                {user.global_role && !isSuperAdmin && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                    <strong>Nota:</strong> Este usuário tem permissão global de{' '}
                    <strong>{getRoleLabel(user.global_role)}</strong>. Você está alterando apenas
                    a permissão dele neste grupo específico.
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={saving}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || !selectedRole} className="flex-1">
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
