'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import { Modal, ModalContent, ModalFooter, useModal } from '@/components/ui/modal';
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
  UserPlus,
  CreditCard,
  Check
} from 'lucide-react';

import type { LiveSession, LivePlayer, TransferRecommendation } from '@/lib/types';

type SessionStep = 'create' | 'players' | 'active' | 'cashout' | 'transfers';

export default function CurrentSessionPage() {
  const router = useRouter();
  const { createSession, sessions } = useSessions();
  const { players: existingPlayers, createPlayer } = usePlayers();
  
  // Estado da sessão
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [step, setStep] = useState<SessionStep>('create');
  
  // Controles de interface
  const [searchPlayer, setSearchPlayer] = useState('');
  // Estados dos modais removidos - agora usando hooks useModal
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [defaultBuyin, setDefaultBuyin] = useState(50);
  
  // Estados de transferência
  const [recommendations, setRecommendations] = useState<TransferRecommendation[]>([]);
  const [manualAdjustments, setManualAdjustments] = useState<any[]>([]);
  const [manualSuggestions, setManualSuggestions] = useState<TransferRecommendation[]>([]);
  const suggestionModal = useModal();
  const playersListModal = useModal();
  const addPlayerModal = useModal();
  const [suggestionForm, setSuggestionForm] = useState({
    from: '',
    to: '',
    amount: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Chave para localStorage
  const CACHE_KEY = 'current_session_cache';

  // Funções de cache local
  const saveToCache = (session: LiveSession) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...session,
        lastSaved: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  };

  const loadFromCache = (): LiveSession | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const session = JSON.parse(cached);
        // Verificar se o cache não é muito antigo (max 24h)
        const lastSaved = new Date(session.lastSaved);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return session;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar do cache:', error);
    }
    return null;
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      // Também limpar outros caches relacionados
      localStorage.removeItem('session_data');
      localStorage.removeItem('current_session');
      localStorage.removeItem('poker_session_cache');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  const forceCleanStart = () => {
    clearCache();
    setCurrentSession({
      id: 0,
      date: new Date().toISOString().split('T')[0],
      location: '',
      players: [],
      status: 'creating'
    });
    setStep('create');
    setSearchPlayer('');
    setNewPlayerName('');
    setError('');
  };

  // Função para lidar com Enter
  const handleKeyPress = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      action();
    }
  };

  // Verificar se há sessão ativa ao carregar
  useEffect(() => {
    // Tentar carregar sessão do cache ao inicializar
    const cachedSession = loadFromCache();
    if (cachedSession) {
      setCurrentSession(cachedSession);
      // Determinar em qual etapa estamos baseado no status da sessão
      switch (cachedSession.status) {
        case 'creating':
          setStep('create');
          break;
        case 'players':
          setStep('players');
          break;
        case 'active':
          setStep('active');
          break;
        case 'cashout':
          setStep('cashout');
          break;
        case 'finished':
          setStep('transfers');
          break;
        default:
          setStep('create');
      }
    }
  }, []);

  // Salvar no cache sempre que a sessão mudar
  useEffect(() => {
    if (currentSession) {
      saveToCache(currentSession);
    }
  }, [currentSession]);

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
        status: 'players' as const // Apenas local, não salvar ainda no backend
      };
      
      // NÃO criar no backend ainda - apenas atualizar estado local
      setCurrentSession(sessionData);
      setStep('players');
      
      // Salvar no cache local para não perder dados
      saveToCache(sessionData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão');
    } finally {
      setLoading(false);
    }
  };

  // Funções de jogadores
  const addPlayerToSession = async (player: any, isExisting: boolean) => {
    if (!currentSession) return;
    if (!player) return;
    
    const playerName = isExisting ? (player?.name || '') : (player || '');
    if (!playerName.trim()) return;
    
    // Verificar se o jogador já está na mesa
    const existsInSession = currentSession.players.some(p => 
      p.name.toLowerCase() === playerName.toLowerCase()
    );
    
    if (existsInSession) {
      setError('Jogador já está na mesa');
      return;
    }

    try {
      let playerData = player;
      
      // Sempre fazer upsert no backend para garantir dados atualizados
      setLoading(true);
      const upsertResponse = await createPlayer(playerName, isExisting ? player.email : '');
      
      // Usar dados do response (pode ser novo ou existente atualizado)
      playerData = upsertResponse.data || upsertResponse;
      
      const newPlayer: LivePlayer = {
        id: playerData?.id?.toString() || Date.now().toString(),
        name: playerData?.name || playerName,
        email: playerData?.email || '',
        buyin: defaultBuyin,
        totalBuyin: defaultBuyin,
        cashout: 0,
        janta: 0,
        rebuys: [],
        isExisting: true, // Sempre true agora pois foi salvo no banco
        // Inicializar campos de pagamento
        session_paid: false,
        janta_paid: false
      };

      setCurrentSession({
        ...currentSession,
        players: [...currentSession.players, newPlayer]
      });
      
      // Limpar formulários
      setSearchPlayer('');
      setNewPlayerName('');
      addPlayerModal.close();
      setError('');
      
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar jogador');
    } finally {
      setLoading(false);
    }
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
      name: p.name,
      balance: p.cashout - p.totalBuyin
    }));

    // Aplicar sugestões manuais primeiro
    const balancesCopy = [...playersWithBalance];
    manualSuggestions.forEach(suggestion => {
      const fromPlayer = balancesCopy.find(p => p.name === suggestion.from);
      const toPlayer = balancesCopy.find(p => p.name === suggestion.to);
      
      if (fromPlayer && toPlayer) {
        fromPlayer.balance += suggestion.amount; // Quem paga fica com saldo mais positivo
        toPlayer.balance -= suggestion.amount;   // Quem recebe fica com saldo mais negativo
      }
    });

    // Separar credores e devedores após aplicar sugestões
    const creditors = balancesCopy.filter(p => p.balance > 0.01);
    const debtors = balancesCopy.filter(p => p.balance < -0.01);

    const newRecommendations: TransferRecommendation[] = [...manualSuggestions];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const amount = Math.min(creditor.balance, -debtor.balance);
      
      if (amount > 0.01) { // Evitar centavos
        newRecommendations.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount * 100) / 100
        });
        
        creditor.balance -= amount;
        debtor.balance += amount;
      }
      
      if (creditor.balance <= 0.01) i++;
      if (debtor.balance >= -0.01) j++;
    }

    setRecommendations(newRecommendations);
  };

  // Funções para sugestões manuais
  const addManualSuggestion = () => {
    const { from, to, amount } = suggestionForm;
    
    // Validações
    if (!from || !to || !amount) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    if (from === to) {
      setError('Pagador e recebedor devem ser diferentes');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }
    
    // Verificar se os jogadores existem na sessão
    const fromExists = currentSession?.players.some(p => p.name === from);
    const toExists = currentSession?.players.some(p => p.name === to);
    
    if (!fromExists || !toExists) {
      setError('Jogadores devem estar na sessão atual');
      return;
    }
    
    // Adicionar sugestão
    const newSuggestion: TransferRecommendation = {
      from,
      to,
      amount: amountNum
    };
    
    setManualSuggestions([...manualSuggestions, newSuggestion]);
    setSuggestionForm({ from: '', to: '', amount: '' });
    suggestionModal.close();
    setError('');
    
    // Recalcular automaticamente
    setTimeout(() => calculateRecommendations(), 100);
  };

  const removeManualSuggestion = (index: number) => {
    const newSuggestions = manualSuggestions.filter((_, i) => i !== index);
    setManualSuggestions(newSuggestions);
    
    // Recalcular automaticamente
    setTimeout(() => calculateRecommendations(), 100);
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

      // Limpar cache após salvar com sucesso
      clearCache();
      setCurrentSession(null);
      setStep('create');
      
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
  const filteredExistingPlayers = (existingPlayers || []).filter(p => {
    if (!p?.name) return false;
    
    // Se não há busca, mostrar todos (limitado depois no render)
    if (!searchPlayer || !searchPlayer.trim()) return true;
    
    // Se há busca, filtrar por nome
    return p.name.toLowerCase().includes(searchPlayer.toLowerCase());
  });

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
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar jogador existente..."
                  value={searchPlayer}
                  onChange={(e) => setSearchPlayer(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, () => {
                    if (searchPlayer.trim() && filteredExistingPlayers.length === 0) {
                      addPlayerToSession(searchPlayer.trim(), false);
                    } else if (filteredExistingPlayers.length > 0) {
                      addPlayerToSession(filteredExistingPlayers[0], true);
                    }
                  })}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('Clicou em Novo - abrindo modal');
                  addPlayerModal.open();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('Clicou em Lista - abrindo modal');
                  playersListModal.open();
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>

            {/* Lista de jogadores existentes */}
            {searchPlayer && filteredExistingPlayers.length > 0 && (
              <div className="border rounded-lg p-2 bg-muted/30">
                <p className="text-sm font-medium mb-2">Jogadores cadastrados:</p>
                <div className="space-y-1">
                  {filteredExistingPlayers.slice(0, 5).map(player => (
                    <button
                      key={player?.id}
                      onClick={() => addPlayerToSession(player, true)}
                      className="w-full text-left p-2 rounded hover:bg-muted text-sm"
                    >
                      {player?.name} ({player?.email})
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

        {/* Modal Lista Completa de Jogadores será adicionado no final */}
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
                onClick={() => addPlayerModal.open()}
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

        {/* Modal Adicionar Jogador será adicionado no final */}
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

                  {/* Checkboxes de Pagamento */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`session_paid_${player.id}`}
                        checked={player.session_paid || false}
                        onChange={(e) => updatePlayerField(player.id, 'session_paid', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`session_paid_${player.id}`} className="text-sm flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Sessão
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`janta_paid_${player.id}`}
                        checked={player.janta_paid || false}
                        onChange={(e) => updatePlayerField(player.id, 'janta_paid', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <label htmlFor={`janta_paid_${player.id}`} className="text-sm flex items-center gap-1">
                        <Utensils className="h-3 w-3" />
                        Janta
                      </label>
                    </div>
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

        {/* Sugestões Manuais */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Otimizar Transferências</CardTitle>
                <CardDescription>
                  Configure pagamentos manuais ou use a otimização automática
                </CardDescription>
              </div>
              <Button 
                onClick={() => suggestionModal.open()}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Sugerir Pagamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {manualSuggestions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-3">Sugestões Manuais:</h4>
                <div className="space-y-2">
                  {manualSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          M
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{suggestion.from}</span> → {' '}
                          <span className="font-medium">{suggestion.to}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-700">
                          R$ {suggestion.amount}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeManualSuggestion(index)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Transferências Finais</CardTitle>
              <CardDescription>
                {manualSuggestions.length > 0 
                  ? 'Otimização considerando suas sugestões manuais'
                  : 'Transfers otimizadas para zerar todos os saldos'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, index) => {
                  const isManual = manualSuggestions.some(s => 
                    s.from === rec.from && s.to === rec.to && s.amount === rec.amount
                  );
                  
                  return (
                    <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                      isManual ? 'bg-blue-50 border border-blue-200' : 'bg-muted/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isManual 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isManual ? 'M' : rec.from[0]}
                        </div>
                        <span>→</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isManual 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isManual ? 'M' : rec.to[0]}
                        </div>
                        <div>
                          <div className="text-sm">
                            <span className="font-medium">{rec.from}</span> paga{' '}
                            <span className="font-medium">{rec.to}</span>
                            {isManual && <span className="ml-2 text-xs text-blue-600">(manual)</span>}
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        isManual ? 'text-blue-700' : 'text-primary'
                      }`}>
                        R$ {rec.amount}
                      </div>
                    </div>
                  );
                })}
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

  // Renderizar conteúdo principal baseado na etapa
  let mainContent = null;

  if (step === 'create') {
    mainContent = (
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
                  value={currentSession?.date}
                  onChange={(e) => setCurrentSession({...currentSession!, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local *</Label>
                <Input
                  id="location"
                  placeholder="Ex: Clube do João, Casa do Pedro..."
                  value={currentSession?.location}
                  onChange={(e) => setCurrentSession({...currentSession!, location: e.target.value})}
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
                onClick={() => startSession(currentSession?.location || '')}
                disabled={!currentSession?.location?.trim() || loading}
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
  // Todas as outras etapas continuam normalmente...
  else if (step === 'players') {
    mainContent = (
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
                    value={currentSession?.date}
                    onChange={(e) => setCurrentSession({...currentSession!, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local *</Label>
                  <Input
                    id="location"
                    placeholder="Ex: Clube do João, Casa do Pedro..."
                    value={currentSession?.location}
                    onChange={(e) => setCurrentSession({...currentSession!, location: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={createNewSession}
              disabled={loading || !currentSession?.location}
              className="flex-1 md:flex-none"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Criar Sessão
            </Button>
          </div>
        </div>
      )}

      {/* TODO: Adicionar outras etapas aqui */}

      {/* Modal Lista Completa de Jogadores */}
      <Modal 
        isOpen={playersListModal.isOpen}
        onClose={playersListModal.close}
        title="Todos os Jogadores"
        description="Selecione um jogador da lista"
        size="md"
      >
        <ModalContent>
          <div className="space-y-2">
            {existingPlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>Nenhum jogador cadastrado</p>
              </div>
            ) : (
              existingPlayers.map(player => {
                const isInSession = currentSession?.players.some(p => 
                  p.name.toLowerCase() === player.name.toLowerCase()
                );
                
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      if (!isInSession) {
                        addPlayerToSession(player, true);
                        playersListModal.close();
                      }
                    }}
                    disabled={isInSession}
                    className={`w-full text-left p-3 rounded border hover:bg-muted text-sm transition-colors ${
                      isInSession 
                        ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{player.name}</div>
                    {player.email && (
                      <div className="text-muted-foreground text-xs">{player.email}</div>
                    )}
                    {isInSession && (
                      <div className="text-primary text-xs mt-1">● Já na mesa</div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ModalContent>
      </Modal>

      {/* Modal Adicionar Jogador Durante Jogo */}
      <Modal 
        isOpen={addPlayerModal.isOpen}
        onClose={() => {
          addPlayerModal.close();
          setSearchPlayer('');
        }}
        title="Adicionar Jogador"
        description="Novo jogador chegou durante o jogo"
        size="md"
      >
        <ModalContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ou digitar nome..."
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Lista de jogadores encontrados */}
            {filteredExistingPlayers.length > 0 && (
              <div>
                <Label className="text-sm font-medium">
                  {searchPlayer.trim() ? 'Jogadores encontrados:' : 'Jogadores cadastrados:'}
                </Label>
                <div className="mt-2 border rounded-lg p-2 bg-muted/30 max-h-40 overflow-y-auto">
                  {filteredExistingPlayers.slice(0, 5).map(player => (
                    <button
                      key={player?.id}
                      onClick={() => addPlayerToSession(player, true)}
                      className="w-full text-left p-2 rounded hover:bg-muted text-sm transition-colors"
                    >
                      <div className="font-medium">{player?.name}</div>
                      {player?.email && (
                        <div className="text-xs text-muted-foreground">{player?.email}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Botão para adicionar jogador novo (apenas se digitou algo) */}
            {searchPlayer.trim() && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => addPlayerToSession(searchPlayer, false)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar "{searchPlayer.trim()}"
                </Button>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => {
                  addPlayerModal.close();
                  setSearchPlayer('');
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Modal de Sugestão Manual */}
      <Modal 
        isOpen={suggestionModal.isOpen} 
        onClose={() => {
          suggestionModal.close();
          setSuggestionForm({ from: '', to: '', amount: '' });
          setError('');
        }}
        title="Sugerir Pagamento"
        description="Configure um pagamento específico entre jogadores"
        size="md"
      >
        <ModalContent>
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">Quem paga</Label>
              <select
                id="from"
                value={suggestionForm.from}
                onChange={(e) => setSuggestionForm({...suggestionForm, from: e.target.value})}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Selecione o pagador</option>
                {currentSession?.players.map(player => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuggestionForm({
                    from: suggestionForm.to,
                    to: suggestionForm.from,
                    amount: suggestionForm.amount
                  });
                }}
                disabled={!suggestionForm.from && !suggestionForm.to}
              >
                ↕ Trocar
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">Quem recebe</Label>
              <select
                id="to"
                value={suggestionForm.to}
                onChange={(e) => setSuggestionForm({...suggestionForm, to: e.target.value})}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Selecione o recebedor</option>
                {currentSession?.players.map(player => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={suggestionForm.amount}
              onChange={(e) => setSuggestionForm({...suggestionForm, amount: e.target.value})}
            />
          </div>
        </ModalContent>
        
        <ModalFooter>
          <Button 
            variant="outline"
            onClick={() => {
              suggestionModal.close();
              setSuggestionForm({ from: '', to: '', amount: '' });
              setError('');
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={addManualSuggestion}
            disabled={!suggestionForm.from || !suggestionForm.to || !suggestionForm.amount}
          >
            Adicionar Sugestão
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

