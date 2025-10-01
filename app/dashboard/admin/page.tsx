'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePlayers, useInvites, useSessions } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/ui/loading';
import { 
  Shield, 
  Users, 
  Settings, 
  Database,
  Activity,
  Mail,
  Crown,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const { players, loading: playersLoading } = usePlayers();
  const { invites, loading: invitesLoading } = useInvites();
  const { sessions, loading: sessionsLoading } = useSessions();

  // Verificar se é super admin
  if (user?.role !== 'super_admin') {
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
                <p className="text-muted-foreground">Apenas super administradores podem acessar esta área.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalUsers: players.length,
    pendingInvites: invites.filter(i => i.status === 'pending').length,
    totalSessions: sessions.length,
    activeAdmins: players.filter(p => p.role === 'admin' || p.role === 'super_admin').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <Crown className="h-8 w-8 text-yellow-500" />
          Painel Super Admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle total do sistema, usuários e configurações avançadas
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

      {/* Gerenciamento de usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Gerenciar usuários
          </CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {playersLoading ? (
            <LoadingState text="Carregando usuários..." />
          ) : players.length === 0 ? (
            <EmptyState 
              title="Nenhum usuário encontrado"
              description="Não há usuários cadastrados no sistema."
              icon={Users}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        player.role === 'super_admin' ? 'bg-yellow-100 text-yellow-800' :
                        player.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {player.role === 'super_admin' && <Crown className="h-3 w-3" />}
                        {player.role === 'admin' && <Shield className="h-3 w-3" />}
                        {player.role === 'super_admin' ? 'Super Admin' :
                         player.role === 'admin' ? 'Admin' : 'Jogador'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        player.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {player.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>{player.team_name || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  );
}

