'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import { useSessions } from '@/hooks/useApi';
import { Plus, Minus, Calculator, Save } from 'lucide-react';

interface PlayerData {
  id: string;
  name: string;
  buyin: number;
  cashout: number;
}

interface Recommendation {
  from: string;
  to: string;
  amount: number;
}

export default function NewSessionPage() {
  const router = useRouter();
  const { createSession } = useSessions();
  
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
  });
  
  const [players, setPlayers] = useState<PlayerData[]>([
    { id: '1', name: '', buyin: 0, cashout: 0 }
  ]);
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addPlayer = () => {
    setPlayers([...players, { 
      id: Date.now().toString(), 
      name: '', 
      buyin: 0, 
      cashout: 0 
    }]);
  };

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayer = (id: string, field: keyof PlayerData, value: string | number) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const calculateRecommendations = () => {
    // Calcular saldos dos jogadores
    const playersWithBalance = players.map(p => ({
      ...p,
      balance: p.cashout - p.buyin
    }));

    // Separar credores e devedores
    const creditors = playersWithBalance.filter(p => p.balance > 0);
    const debtors = playersWithBalance.filter(p => p.balance < 0);

    const newRecommendations: Recommendation[] = [];

    // Algoritmo simples de transferências
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

  const handleSubmit = async () => {
    setError('');

    // Validações
    if (!sessionData.location.trim()) {
      setError('Local é obrigatório');
      return;
    }

    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < 2) {
      setError('Pelo menos 2 jogadores são necessários');
      return;
    }

    setLoading(true);

    try {
      await createSession({
        date: sessionData.date,
        location: sessionData.location,
        players_data: validPlayers,
        recommendations
      });

      router.push('/dashboard/history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sessão');
    } finally {
      setLoading(false);
    }
  };

  const totalBuyin = players.reduce((sum, p) => sum + (p.buyin || 0), 0);
  const totalCashout = players.reduce((sum, p) => sum + (p.cashout || 0), 0);
  const isBalanced = totalBuyin === totalCashout;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Criar nova sessão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a partida, adicione jogadores e calcule as transferências automaticamente
        </p>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Dados da Sessão */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da sessão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={sessionData.date}
                onChange={(e) => setSessionData({...sessionData, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                placeholder="Ex: Clube do João"
                value={sessionData.location}
                onChange={(e) => setSessionData({...sessionData, location: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jogadores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Jogadores ({players.length})</CardTitle>
              <CardDescription>
                Adicione os jogadores e seus valores de buy-in e cash-out
              </CardDescription>
            </div>
            <Button onClick={addPlayer} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {players.map((player, index) => (
            <div key={player.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Label>Jogador {index + 1}</Label>
                <Input
                  placeholder="Nome do jogador"
                  value={player.name}
                  onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                />
              </div>
              
              <div className="w-32 space-y-2">
                <Label>Buy-in</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={player.buyin || ''}
                  onChange={(e) => updatePlayer(player.id, 'buyin', Number(e.target.value) || 0)}
                />
              </div>
              
              <div className="w-32 space-y-2">
                <Label>Cash-out</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={player.cashout || ''}
                  onChange={(e) => updatePlayer(player.id, 'cashout', Number(e.target.value) || 0)}
                />
              </div>
              
              <div className="w-24 space-y-2 text-center">
                <Label>Saldo</Label>
                <div className={`text-sm font-medium ${
                  (player.cashout - player.buyin) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {player.cashout - player.buyin >= 0 ? '+' : ''}
                  {player.cashout - player.buyin}
                </div>
              </div>
              
              {players.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removePlayer(player.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {/* Resumo */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Total Buy-in: <span className="font-medium">{totalBuyin}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Cash-out: <span className="font-medium">{totalCashout}</span>
            </div>
            <div className={`text-sm font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {isBalanced ? '✓ Balanceado' : '⚠ Desbalanceado'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transferências recomendadas</CardTitle>
            <CardDescription>
              Transfers otimizadas para liquidar todos os saldos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm">
                    <span className="font-medium">{rec.from}</span> deve transferir para{' '}
                    <span className="font-medium">{rec.to}</span>
                  </span>
                  <span className="font-medium text-primary">R$ {rec.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={calculateRecommendations}
          disabled={players.filter(p => p.name.trim()).length < 2}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calcular transferências
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={loading || !isBalanced || !sessionData.location.trim()}
        >
          {loading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar sessão
        </Button>
      </div>
    </div>
  );
}

