'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUsers, usePlayers, useInvites, useSessions, useTenants } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/ui/loading';
import { useModal, useConfirmModal } from '@/components/ui/modal';
import {
  Shield,
  Users,
  Settings,
  Database,
  Activity,
  Mail,
  Crown,
  UserCheck,
  AlertTriangle,
  Building2,
  Plus,
  Trash2
} from 'lucide-react';
import { EditUserRoleModal } from './components/edit-user-role-modal';
import { CreateTenantModal } from './components/create-tenant-modal';
import { EditPlayerModal } from './components/edit-player-modal';

interface UserDisplay {
  id: number;
  user_id?: number;
  name: string;
  nickname?: string;
  email: string;
  role: string;
  global_role?: string;
  has_account: boolean;
  status: string;
  team_id?: number;
  team_name?: string;
  tenants?: Array<{ tenant_id: number; tenant_name?: string; role: string }>;
}

interface PlayerEditData {
  id: number;
  name: string;
  nickname?: string;
  user_id?: number;
  status: 'active' | 'inactive';
  team_id: number;
}

interface TenantDeleteData {
  id: number;
  name: string;
  users_count?: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { users, loading: usersLoading, refetch: refetchUsers, updateUserRole } = useUsers();
  const { players } = usePlayers();
  const { invites } = useInvites();
  const { sessions } = useSessions();
  const { tenants, loading: tenantsLoading, createTenant } = useTenants();

  // Modais
  const [selectedUser, setSelectedUser] = useState<UserDisplay | null>(null);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<PlayerEditData | null>(null);
  const [selectedTenantToDelete, setSelectedTenantToDelete] = useState<TenantDeleteData | null>(null);
  const editUserRoleModal = useModal();
  const createTenantModal = useModal();
  const editPlayerModal = useModal();
  const deleteTenantModal = useModal();
  const { ConfirmModalComponent } = useConfirmModal();

  const handleEditUserRole = (u: UserDisplay) => {
    setSelectedUser(u);
    editUserRoleModal.open();
  };

  const handleEditPlayer = (u: UserDisplay) => {
    // Converter UserDisplay para formato Player
    setSelectedPlayerForEdit({
      id: u.id,
      name: u.name,
      nickname: u.nickname,
      user_id: u.user_id,
      status: u.status === 'active' ? 'active' : 'inactive',
      team_id: u.team_id || 0
    });
    editPlayerModal.open();
  };

  const handleSavePlayer = async (id: number, data: Partial<PlayerEditData>) => {
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar jogador');
      
      await refetchUsers();
      editPlayerModal.close();
      setSelectedPlayerForEdit(null);
    } catch (error) {
      console.error('Erro ao salvar jogador:', error);
      throw error;
    }
  };

  const handleSaveUserRole = async (userId: number, role: string, tenantId?: number) => {
    try {
      await updateUserRole(userId, role, tenantId);
      await refetchUsers();
      editUserRoleModal.close();
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      throw error;
    }
  };

  const handleCreateTenant = async (tenantName: string) => {
    try {
      await createTenant(tenantName);
      await refetchUsers(); // Refresh users list to show new tenant
      createTenantModal.close();
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      throw error;
    }
  };

  const handleDeleteTenant = async (tenantId: number) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir grupo');
      }

      // Refresh lists
      await refetchUsers();
      deleteTenantModal.close();
      setSelectedTenantToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      throw error;
    }
  };

  // Verificar se é super admin ou admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Acesso negado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Você não tem permissão para acessar o painel administrativo
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Shield className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <p className="text-lg font-medium">Área restrita</p>
                <p className="text-muted-foreground">Apenas administradores podem acessar esta área.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    totalPlayers: players.length,
    pendingInvites: invites.filter(i => i.status === 'pending').length,
    totalSessions: sessions.length,
    activeAdmins: (users as UserDisplay[]).filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          {isSuperAdmin ? <Crown className="h-8 w-8 text-yellow-500" /> : <Shield className="h-8 w-8 text-blue-500" />}
          {isSuperAdmin ? 'Painel Super Admin' : 'Painel de Administração'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSuperAdmin
            ? 'Controle total do sistema, usuários e configurações avançadas'
            : 'Gerencie usuários e configurações do seu grupo'}
        </p>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAdmins} administradores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvites}</div>
            <p className="text-xs text-muted-foreground">
              aguardando resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              registradas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✓</div>
            <p className="text-xs text-muted-foreground">
              funcionando normalmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grupos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Grupos
              </CardTitle>
              <CardDescription>
                Gerencie os grupos do sistema
              </CardDescription>
            </div>
              {isSuperAdmin && (
                <Button
                  size="sm"
                  onClick={createTenantModal.open}
                  className="h-8 px-3"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Novo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Carregando grupos...</div>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum grupo encontrado</p>
                <p className="text-xs mt-1">Crie o primeiro grupo usando o botão acima</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.users_count || 0} jogadores • {tenant.plan} • {tenant.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tenant.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : tenant.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {tenant.status === 'active' ? 'Ativo' :
                         tenant.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                      </span>
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedTenantToDelete(tenant);
                            deleteTenantModal.open();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Usuários Cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Gerenciar usuários
          </CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? 'Visualize e gerencie todos os usuários do sistema'
                : 'Visualize e gerencie usuários do seu grupo'}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {usersLoading ? (
            <LoadingState text="Carregando usuários..." />
          ) : users.length === 0 ? (
            <EmptyState 
              title="Nenhum usuário encontrado"
              description="Não há usuários cadastrados."
              icon={Users}
            />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Cadastrado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grupos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users as UserDisplay[]).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name}
                        {u.nickname && <span className="text-xs text-muted-foreground ml-1">({u.nickname})</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'super_admin' || u.global_role === 'super_admin' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          u.role === 'admin' || u.global_role === 'admin'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {(u.role === 'super_admin' || u.global_role === 'super_admin') && <Crown className="h-3 w-3" />}
                          {(u.role === 'admin' || u.global_role === 'admin') && u.role !== 'super_admin' && u.global_role !== 'super_admin' && <Shield className="h-3 w-3" />}
                          {isSuperAdmin ? (
                            u.role === 'super_admin' ? 'Super Admin' :
                            u.role === 'admin' ? 'Admin' : 'Jogador'
                          ) : (
                            u.role === 'admin' ? 'Admin' : 'Jogador'
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          u.has_account
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {u.has_account ? '✓ Sim' : '✗ Não'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          u.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {u.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {u.tenants && u.tenants.length > 0 ? (
                              <>
                                {u.tenants.length} {u.tenants.length === 1 ? 'grupo' : 'grupos'}
                                {u.tenants.length <= 3 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({u.tenants.map((t) => t.tenant_name || `#${t.tenant_id}`).join(', ')})
                                  </span>
                                )}
                              </>
                            ) : u.team_name ? (
                              u.team_name
                            ) : (
                              'N/A'
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Se NÃO tem conta, mostrar botão para criar/vincular */}
                          {!u.has_account && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPlayer(u)}
                              className="h-8 px-3 hover:bg-green-500/10 hover:text-green-600"
                            >
                              <UserCheck className="h-4 w-4 mr-1.5" />
                              Criar conta
                            </Button>
                          )}
                          
                          {/* Botão de permissões (sempre visível) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUserRole(u)}
                            className="h-8 px-3 hover:bg-primary/10 hover:text-primary"
                          >
                            <Shield className="h-4 w-4 mr-1.5" />
                            Permissões
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sistema de notificações</p>
                <p className="text-sm text-muted-foreground">Enviar emails automáticos</p>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Backup automático</p>
                <p className="text-sm text-muted-foreground">Backup diário do banco de dados</p>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Logs do sistema</p>
                <p className="text-sm text-muted-foreground">Visualizar logs de atividade</p>
              </div>
              <Button variant="outline" size="sm">
                Ver logs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ações avançadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Limpar dados antigos</p>
                <p className="text-sm text-muted-foreground">Remover sessões antigas</p>
              </div>
              <Button variant="destructive" size="sm">
                Limpar
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Exportar dados</p>
                <p className="text-sm text-muted-foreground">Download completo dos dados</p>
              </div>
              <Button variant="outline" size="sm">
                Exportar
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reset sistema</p>
                <p className="text-sm text-muted-foreground">Resetar configurações padrão</p>
              </div>
              <Button variant="destructive" size="sm">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Edição de Role de Usuário */}
      <EditUserRoleModal
        user={selectedUser}
        isOpen={editUserRoleModal.isOpen}
        onClose={() => {
          editUserRoleModal.close();
          setSelectedUser(null);
        }}
        onSave={handleSaveUserRole}
        isSuperAdmin={isSuperAdmin}
        currentTenantId={user?.tenant_id}
      />

      {/* Modal de Criação de Tenant */}
      <CreateTenantModal
        isOpen={createTenantModal.isOpen}
        onClose={createTenantModal.close}
        onCreate={handleCreateTenant}
      />

      {/* Modal de Edição de Jogador (criar conta/vincular email) */}
      <EditPlayerModal
        player={selectedPlayerForEdit}
        isOpen={editPlayerModal.isOpen}
        onClose={() => {
          editPlayerModal.close();
          setSelectedPlayerForEdit(null);
        }}
        onSave={handleSavePlayer}
        onRefresh={refetchUsers}
      />

      {/* Modal de Confirmação de Exclusão de Grupo */}
      {deleteTenantModal.isOpen && selectedTenantToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Excluir Grupo
              </CardTitle>
              <CardDescription>
                Esta ação não pode ser desfeita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium mb-2">Você está prestes a excluir:</p>
                <p className="text-lg font-bold">{selectedTenantToDelete.name}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedTenantToDelete.users_count || 0} jogadores serão afetados
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    deleteTenantModal.close();
                    setSelectedTenantToDelete(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteTenant(selectedTenantToDelete.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Grupo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação */}
      {ConfirmModalComponent}
    </div>
  );
}

