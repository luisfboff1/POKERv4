'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui/loading';
import { useInvites, usePlayersForTenant } from '@/hooks/useApi';
import { 
  Users, 
  Mail, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  UserPlus,
  Search
} from 'lucide-react';
import { useConfirmModal } from '@/components/ui/modal';

export default function InvitesPage() {
  const { invites, loading, error, createInvite, deleteInvite } = useInvites();
  const { availablePlayers, loading: playersLoading } = usePlayersForTenant();
  const [showForm, setShowForm] = useState(false);
  const { confirm, ConfirmModalComponent } = useConfirmModal();
  const [formData, setFormData] = useState({
    email: '',
    role: 'player',
    name: '',
    playerLinkType: 'new', // 'new' ou 'existing'
    selectedPlayerId: '',
    newPlayerData: {
      name: '',
      nickname: '',
      phone: ''
    }
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validações básicas
    if (!formData.email.trim()) {
      setFormError('Email é obrigatório');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('Email inválido');
      return;
    }

    // Validações específicas para vinculação de jogador (admin ou player)
    if ((formData.role === 'player' || formData.role === 'admin') && formData.playerLinkType) {
      if (formData.playerLinkType === 'existing' && !formData.selectedPlayerId) {
        setFormError('Selecione um jogador para vincular');
        return;
      }
      
      if (formData.playerLinkType === 'new' && !formData.newPlayerData.name.trim()) {
        setFormError('Nome do jogador é obrigatório');
        return;
      }
    }

    setFormLoading(true);

    try {
      // Preparar dados de vinculação se for jogador ou admin com vinculação
      const hasPlayerLink = (formData.role === 'player' || formData.role === 'admin') && formData.playerLinkType;
      
      const playerData = hasPlayerLink ? {
        playerLinkType: formData.playerLinkType,
        selectedPlayerId: formData.selectedPlayerId || null,
        newPlayerData: formData.playerLinkType === 'new' ? formData.newPlayerData : null
      } : undefined;

      await createInvite(formData.email, formData.role, formData.name, playerData);
      
      setFormData({
        email: '',
        role: 'player',
        name: '',
        playerLinkType: 'new',
        selectedPlayerId: '',
        newPlayerData: { name: '', nickname: '', phone: '' }
      });
      setPlayerSearch('');
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro ao enviar convite');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteInvite = async (id: number) => {
    confirm({
      title: 'Excluir convite',
      message: 'Tem certeza que deseja excluir este convite? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteInvite(id);
        } catch {
          // TODO: Substituir alert por toast ou modal de erro
          alert('Erro ao excluir convite');
        }
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceito';
      case 'expired':
        return 'Expirado';
      default:
        return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Administrador';
      case 'player':
        return 'Jogador';
      default:
        return role;
    }
  };

  if (loading) {
    return <LoadingState text="Carregando convites..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Convites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Convide novos jogadores e acompanhe o status dos convites enviados
        </p>
      </div>

      {/* Formulário de novo convite */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Novo convite
              </CardTitle>
              <CardDescription>
                Envie convites por email para novos membros do clube
              </CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Enviar convite
              </Button>
            )}
          </div>
        </CardHeader>
        {showForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{formError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email do convidado</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Papel</Label>
                  <select 
                    id="role"
                    className="w-full h-10 px-3 rounded-md border border-input bg-surface text-foreground"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="player">Jogador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {/* Seção de vinculação com jogador (para 'player' e 'admin') */}
              {(formData.role === 'player' || formData.role === 'admin') && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    <Label className="text-base font-medium">Vinculação com jogador</Label>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="playerLinkType"
                          value="existing"
                          checked={formData.playerLinkType === 'existing'}
                          onChange={(e) => setFormData({...formData, playerLinkType: e.target.value})}
                          className="text-primary focus:ring-primary"
                        />
                        <span>Vincular a jogador existente</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="playerLinkType"
                          value="new"
                          checked={formData.playerLinkType === 'new'}
                          onChange={(e) => setFormData({...formData, playerLinkType: e.target.value})}
                          className="text-primary focus:ring-primary"
                        />
                        <span>Criar novo jogador</span>
                      </label>
                    </div>

                    {formData.playerLinkType === 'existing' && (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Buscar jogador..."
                            value={playerSearch}
                            onChange={(e) => setPlayerSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        {playersLoading ? (
                          <div className="p-4 text-center">
                            <LoadingSpinner size="sm" />
                            <p className="text-sm text-muted-foreground mt-2">Carregando jogadores...</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {availablePlayers
                              .filter(player => 
                                player.name.toLowerCase().includes(playerSearch.toLowerCase())
                              )
                              .map(player => (
                                <label key={player.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer">
                                  <input
                                    type="radio"
                                    name="selectedPlayer"
                                    value={player.id.toString()}
                                    checked={formData.selectedPlayerId === player.id.toString()}
                                    onChange={(e) => setFormData({...formData, selectedPlayerId: e.target.value})}
                                    className="text-primary focus:ring-primary"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{player.name}</p>
                                    {player.total_sessions && (
                                      <p className="text-xs text-muted-foreground">
                                        {player.total_sessions} sessões jogadas
                                      </p>
                                    )}
                                  </div>
                                </label>
                              ))
                            }
                            {availablePlayers.filter(player => 
                              player.name.toLowerCase().includes(playerSearch.toLowerCase())
                            ).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center p-4">
                                {playerSearch ? 'Nenhum jogador encontrado' : 'Não há jogadores disponíveis para vinculação'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {formData.playerLinkType === 'new' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="newPlayerName">Nome completo</Label>
                            <Input
                              id="newPlayerName"
                              placeholder="Nome do novo jogador"
                              value={formData.newPlayerData.name}
                              onChange={(e) => setFormData({
                                ...formData,
                                newPlayerData: {...formData.newPlayerData, name: e.target.value}
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPlayerNickname">Apelido (opcional)</Label>
                            <Input
                              id="newPlayerNickname"
                              placeholder="Apelido"
                              value={formData.newPlayerData.nickname}
                              onChange={(e) => setFormData({
                                ...formData,
                                newPlayerData: {...formData.newPlayerData, nickname: e.target.value}
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPlayerPhone">Telefone (opcional)</Label>
                          <Input
                            id="newPlayerPhone"
                            placeholder="(11) 99999-9999"
                            value={formData.newPlayerData.phone}
                            onChange={(e) => setFormData({
                              ...formData,
                              newPlayerData: {...formData.newPlayerData, phone: e.target.value}
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
             )}
                  Enviar convite
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormError('');
                    setFormData({
                      email: '',
                      role: 'player',
                      name: '',
                      playerLinkType: 'new',
                      selectedPlayerId: '',
                      newPlayerData: { name: '', nickname: '', phone: '' }
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Lista de convites */}
      <Card>
        <CardHeader>
          <CardTitle>Convites enviados ({invites.length})</CardTitle>
          <CardDescription>
            Acompanhe o status de todos os convites enviados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <EmptyState 
              title="Nenhum convite enviado"
              description="Clique em 'Enviar convite' para convidar novos membros para o clube."
              icon={Users}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{getRoleText(invite.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invite.status)}
                        <span className="text-sm">{getStatusText(invite.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {invite.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/accept-invite?token=${invite.token}`);
                                alert('Link copiado para a área de transferência!');
                              }}
                              className="text-primary hover:text-primary/80"
                            >
                              Copiar link
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteInvite(invite.id)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {invite.status === 'expired' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {invite.status === 'accepted' && (
                          <span className="text-sm text-green-600">✓ Aceito por {invite.invited_by_name}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {invites.filter(i => i.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Convites aceitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invites.filter(i => i.status === 'accepted').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Convites expirados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invites.filter(i => i.status === 'expired').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmação */}
      {ConfirmModalComponent}
    </div>
  );
}

