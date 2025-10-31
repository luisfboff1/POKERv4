'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUsers, usePlayers, useInvites, useSessions } from '@/hooks/useApi';
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
  Building2
} from 'lucide-react';
import { EditUserRoleModal } from './components/edit-user-role-modal';

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

export default function AdminPage() {
  const { user } = useAuth();
  const { users, loading: usersLoading, refetch: refetchUsers, updateUserRole } = useUsers();
  const { players } = usePlayers();
  const { invites } = useInvites();
  const { sessions } = useSessions();

  // Modais
  const [selectedUser, setSelectedUser] = useState<UserDisplay | null>(null);
  const editUserRoleModal = useModal();
  const { ConfirmModalComponent } = useConfirmModal();

  const handleEditUserRole = (u: UserDisplay) => {
    setSelectedUser(u);
    editUserRoleModal.open();
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUserRole(u)}
                          className="h-8 px-3 hover:bg-primary/10 hover:text-primary"
                        >
                          <Shield className="h-4 w-4 mr-1.5" />
                          Permissões
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações do sistema */}
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

      {/* Modal de Confirmação */}
      {ConfirmModalComponent}
    </div>
  );
}

