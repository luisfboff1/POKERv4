'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import { useSessions, usePlayers } from '@/hooks/useApi';
import { 
  Play, 
  Plus, 
  Minus, 
  Calculator, 
  Save, 
  Users, 
  DollarSign,
  Utensils,
  CheckCircle,
  Edit3,
  Search,
  UserPlus
} from 'lucide-react';

import type { LiveSession, LivePlayer, TransferRecommendation } from '@/lib/types';

type SessionStep = 'create' | 'players' | 'active' | 'cashout' | 'transfers';

export default function CurrentSessionPage() {
  const router = useRouter();
  const { createSession, sessions } = useSessions();
  const { players: existingPlayers } = usePlayers();
  
  // Estado da sessão
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [step, setStep] = useState<SessionStep>('create');
  
  // Controles de interface
  const [searchPlayer, setSearchPlayer] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [defaultBuyin, setDefaultBuyin] = useState(50);
  
  // Estados de transferência
  const [recommendations, setRecommendations] = useState<TransferRecommendation[]>([]);
  const [manualAdjustments, setManualAdjustments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar se há sessão ativa ao carregar
  useEffect(() => {
    // TODO: Implementar busca por sessões ativas quando a API suportar
    // Por enquanto começamos sempre do zero
  }, [sessions]);

  // Funções da sessão
  const createNewSession = () => {
    const newSession: LiveSession = {
      date: new Date().toISOString().split('T')[0],
      location: '',
      status: 'creating',
      players: []
    };
    setCurrentSession(newSession);
    setStep('create');
  };

  const startSession = async (location: string) => {
    if (!currentSession) return;
    
    setLoading(true);
    try {
      const sessionData = {
        ...currentSession,
        location,
        status: 'active' as const
      };
      
      // Criar sessão no backend
      await createSession({
        date: sessionData.date,
        location: sessionData.location,
        status: 'pending', // Mapear para status válido da API
        players_data: sessionData.players
      });

      setCurrentSession(sessionData);
      setStep('players');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sessão');
    } finally {
      setLoading(false);
    }
  };

  // Funções de jogadores
  const addPlayerToSession = (player: any, isExisting: boolean) => {
    if (!currentSession) return;
    
    const newPlayer: LivePlayer = {
      id: Date.now().toString(),
      name: isExisting ? player.name : player,
      buyin: defaultBuyin,
      totalBuyin: defaultBuyin,
      cashout: 0,
      janta: 0,
      rebuys: [],
      isExisting
    };

    setCurrentSession({
      ...currentSession,
      players: [...currentSession.players, newPlayer]
    });
    
    setSearchPlayer('');
    setNewPlayerName('');
    setShowAddPlayer(false);
  };

  const updatePlayerField = (playerId: string, field: keyof LivePlayer, value: any) => {
    if (!currentSession) return;
    
    setCurrentSession({
      ...currentSession,
      players: currentSession.players.map((p: LivePlayer) => {
        if (p.id === playerId) {
          const updated = { ...p, [field]: value };
          // Recalcular total buyin quando necessário
          if (field === 'buyin' || field === 'rebuys') {
            updated.totalBuyin = updated.buyin + updated.rebuys.reduce((sum: number, rebuy: number) => sum + rebuy, 0);
          }
          return updated;
        }
        return p;
      })
    });
  };

  const addRebuy = (playerId: string, amount: number) => {
    if (!currentSession) return;
    
    const player = currentSession.players.find((p: LivePlayer) => p.id === playerId);
    if (player) {
      const newRebuys = [...player.rebuys, amount];
      updatePlayerField(playerId, 'rebuys', newRebuys);
    }
  };

  const removePlayer = (playerId: string) => {
    if (!currentSession) return;
    
    setCurrentSession({
      ...currentSession,
      players: currentSession.players.filter((p: LivePlayer) => p.id !== playerId)
    });
  };

  const calculateRecommendations = () => {
    if (!currentSession) return;
    
    // Calcular balances finais
    const playersWithBalance = currentSession.players.map((p: LivePlayer) => ({
      ...p,
      balance: p.cashout - p.totalBuyin
    }));

    // Separar credores e devedores (sem considerar janta)
    const creditors = playersWithBalance.filter((p: any) => p.balance > 0);
    const debtors = playersWithBalance.filter((p: any) => p.balance < 0);

    const newRecommendations: TransferRecommendation[] = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const amount = Math.min(creditor.balance, -debtor.balance);
      
      if (amount > 0) {
        newRecommendations.push({
          from: debtor.name,
          to: creditor.name,
          amount
        });
        
        creditor.balance -= amount;
        debtor.balance += amount;
      }
      
      if (creditor.balance === 0) i++;
      if (debtor.balance === 0) j++;
    }

    setRecommendations(newRecommendations);
  };

  const finishSession = async () => {
    if (!currentSession) return;
    
    setLoading(true);
    try {
      // Calcular balances finais
      const finalPlayers = currentSession.players.map((p: LivePlayer) => ({
        ...p,
        balance: p.cashout - p.totalBuyin
      }));

      // Salvar sessão finalizada
      await createSession({
        date: currentSession.date,
        location: currentSession.location,
        status: 'approved',
        players_data: finalPlayers,
        recommendations
      });

      // Redirecionar para histórico
      router.push('/dashboard/history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar sessão');
    } finally {
      setLoading(false);
    }
  };

  // Calcular totais
  const totals = currentSession ? {
    totalBuyin: currentSession.players.reduce((sum: number, p: LivePlayer) => sum + p.totalBuyin, 0),
    totalCashout: currentSession.players.reduce((sum: number, p: LivePlayer) => sum + p.cashout, 0),
    totalJanta: currentSession.players.reduce((sum: number, p: LivePlayer) => sum + p.janta, 0),
    playersCount: currentSession.players.length
  } : { totalBuyin: 0, totalCashout: 0, totalJanta: 0, playersCount: 0 };

  const isBalanced = totals.totalBuyin === totals.totalCashout;
  
  // Filtrar jogadores existentes para busca
  const filteredExistingPlayers = existingPlayers.filter(p => 
    p.name.toLowerCase().includes(searchPlayer.toLowerCase())
  );

  // Se não há sessão ativa, mostrar opção de criar
  if (!currentSession) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            <Play className="h-8 w-8 text-primary" />
            Sessão Atual
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie uma sessão de poker em tempo real
          </p>
        </div>

        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Play className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma sessão ativa</h3>
              <p className="text-muted-foreground">
                Crie uma nova sessão para começar a gerenciar uma partida de poker
              </p>
            </div>
            <Button onClick={createNewSession} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Nova Sessão
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Etapa 1: Criar sessão (definir local e data)
  if (step === 'create') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Nova Sessão</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure os dados básicos para iniciar uma nova partida
          </p>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados da sessão</CardTitle>
            <CardDescription>
              Defina onde e quando será realizada a partida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={currentSession.date}
                  onChange={(e) => setCurrentSession({...currentSession, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local *</Label>
                <Input
                  id="location"
                  placeholder="Ex: Clube do João, Casa do Pedro..."
                  value={currentSession.location}
                  onChange={(e) => setCurrentSession({...currentSession, location: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyin">Buy-in padrão (R$)</Label>
              <Input
                id="buyin"
                type="number"
                value={defaultBuyin}
                onChange={(e) => setDefaultBuyin(Number(e.target.value) || 50)}
                min="1"
              />
              <p className="text-sm text-muted-foreground">
                Valor inicial que cada jogador pagará ao entrar na mesa
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => startSession(currentSession.location)}
                disabled={!currentSession.location.trim() || loading}
                className="flex-1"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Iniciar Sessão
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentSession(null)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Etapa 2: Adicionar jogadores
  if (step === 'players') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {currentSession.location}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(currentSession.date).toLocaleDateString('pt-BR')} • Adicionando jogadores
            </p>
          </div>
          <Button 
            onClick={() => setStep('active')} 
            disabled={currentSession.players.length < 2}
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            Começar Jogo
          </Button>
        </div>

        {/* Adicionar Jogador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Adicionar Jogador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showAddPlayer ? (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar jogador existente..."
                    value={searchPlayer}
                    onChange={(e) => setSearchPlayer(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowAddPlayer(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do novo jogador"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
                <Button 
                  onClick={() => addPlayerToSession(newPlayerName, false)}
                  disabled={!newPlayerName.trim()}
                >
                  Adicionar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAddPlayer(false)}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Lista de jogadores existentes */}
            {searchPlayer && filteredExistingPlayers.length > 0 && (
              <div className="border rounded-lg p-2 bg-muted/30">
                <p className="text-sm font-medium mb-2">Jogadores cadastrados:</p>
                <div className="space-y-1">
                  {filteredExistingPlayers.slice(0, 5).map(player => (
                    <button
                      key={player.id}
                      onClick={() => addPlayerToSession(player, true)}
                      className="w-full text-left p-2 rounded hover:bg-muted text-sm"
                    >
                      {player.name} ({player.email})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Jogadores Adicionados */}
        <Card>
          <CardHeader>
            <CardTitle>Jogadores na mesa ({currentSession.players.length})</CardTitle>
            <CardDescription>
              Buy-in inicial: R$ {defaultBuyin}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentSession.players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>Nenhum jogador adicionado</p>
                <p className="text-sm">Adicione pelo menos 2 jogadores para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentSession.players.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Buy-in: R$ {player.buyin}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(player.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Total em mesa: R$ {totals.totalBuyin}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Etapa 3: Sessão ativa (durante o jogo)
  if (step === 'active') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              {currentSession.location}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(currentSession.date).toLocaleDateString('pt-BR')} • Sessão em andamento
            </p>
          </div>
          <Button 
            onClick={() => setStep('cashout')}
            variant="outline"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar Sessão
          </Button>
        </div>

        {/* Resumo da Mesa */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totals.playersCount}</div>
              <p className="text-xs text-muted-foreground">Jogadores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">R$ {totals.totalBuyin}</div>
              <p className="text-xs text-muted-foreground">Total Buy-in</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">R$ {totals.totalJanta}</div>
              <p className="text-xs text-muted-foreground">Janta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddPlayer(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Jogador
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Jogadores na Mesa */}
        <Card>
          <CardHeader>
            <CardTitle>Controle de Mesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentSession.players.map((player) => (
                <div key={player.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{player.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      Total: R$ {player.totalBuyin}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <Label>Buy-in inicial</Label>
                      <div className="font-medium">R$ {player.buyin}</div>
                    </div>
                    <div>
                      <Label>Rebuys ({player.rebuys.length})</Label>
                      <div className="font-medium">
                        R$ {player.rebuys.reduce((sum, r) => sum + r, 0)}
                      </div>
                    </div>
                    <div>
                      <Label>Janta</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={player.janta || ''}
                        onChange={(e) => updatePlayerField(player.id, 'janta', Number(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const amount = prompt('Valor do rebuy:');
                        if (amount) addRebuy(player.id, Number(amount));
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Rebuy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modal Adicionar Jogador Durante Jogo */}
        {showAddPlayer && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Adicionar Jogador</CardTitle>
                <CardDescription>
                  Novo jogador chegou durante o jogo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ou digitar nome..."
                    value={searchPlayer}
                    onChange={(e) => setSearchPlayer(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchPlayer && filteredExistingPlayers.length > 0 && (
                  <div className="border rounded-lg p-2 bg-muted/30 max-h-32 overflow-y-auto">
                    {filteredExistingPlayers.slice(0, 3).map(player => (
                      <button
                        key={player.id}
                        onClick={() => addPlayerToSession(player, true)}
                        className="w-full text-left p-2 rounded hover:bg-muted text-sm"
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => addPlayerToSession(searchPlayer, false)}
                    disabled={!searchPlayer.trim()}
                    className="flex-1"
                  >
                    Adicionar "{searchPlayer}"
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowAddPlayer(false);
                      setSearchPlayer('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Etapa 4: Cashout (finalização)
  if (step === 'cashout') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finalizar Sessão</h1>
          <p className="text-sm text-muted-foreground">
            Registre quanto cada jogador saiu em fichas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cash-out dos Jogadores</CardTitle>
            <CardDescription>
              Digite quanto cada jogador terminou em fichas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentSession.players.map((player) => (
                <div key={player.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Buy-in total: R$ {player.totalBuyin} • Janta: R$ {player.janta}
                    </p>
                  </div>
                  <div className="w-32">
                    <Label>Cash-out</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={player.cashout || ''}
                      onChange={(e) => updatePlayerField(player.id, 'cashout', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-24 text-center">
                    <Label>Resultado</Label>
                    <div className={`text-sm font-medium ${
                      (player.cashout - player.totalBuyin) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {player.cashout - player.totalBuyin >= 0 ? '+' : ''}
                      R$ {player.cashout - player.totalBuyin}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold">R$ {totals.totalBuyin}</div>
                    <div className="text-sm text-muted-foreground">Total Buy-in</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">R$ {totals.totalCashout}</div>
                    <div className="text-sm text-muted-foreground">Total Cash-out</div>
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {isBalanced ? '✓' : '⚠'} {isBalanced ? 'Balanceado' : 'Diferença: R$ ' + Math.abs(totals.totalBuyin - totals.totalCashout)}
                    </div>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-6">
              <Button 
                onClick={calculateRecommendations}
                disabled={totals.totalCashout === 0}
                variant="outline"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Transferências
              </Button>
              <Button 
                onClick={() => setStep('transfers')}
                disabled={!isBalanced}
              >
                Continuar
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setStep('active')}
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Etapa 5: Transferências
  if (step === 'transfers') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transferências</h1>
          <p className="text-sm text-muted-foreground">
            Revise e ajuste as transferências necessárias
          </p>
        </div>

        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Transferências Recomendadas</CardTitle>
              <CardDescription>
                Transfers otimizadas para zerar todos os saldos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {rec.from[0]}
                      </div>
                      <span>→</span>
                      <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {rec.to[0]}
                      </div>
                      <div>
                        <div className="text-sm">
                          <span className="font-medium">{rec.from}</span> paga{' '}
                          <span className="font-medium">{rec.to}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      R$ {rec.amount}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo da Janta */}
        {totals.totalJanta > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Janta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentSession.players.filter(p => p.janta > 0).map(player => (
                  <div key={player.id} className="flex justify-between text-sm">
                    <span>{player.name}</span>
                    <span>R$ {player.janta}</span>
                  </div>
                ))}
                <div className="pt-2 border-t font-medium">
                  Total da janta: R$ {totals.totalJanta}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={finishSession}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Finalizar e Salvar Sessão
          </Button>
          <Button 
            variant="outline"
            onClick={() => setStep('cashout')}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

