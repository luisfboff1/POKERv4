import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function SessionManager({ initialData = null, onSave = null }) {
  const [players, setPlayers] = useState(initialData?.players_data || []);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const addPlayer = () => {
    setPlayers([...players, {
      name: '',
      buyIns: [50],
      cashOut: 0,
      dinner: { amount: 0, paid: false }
    }]);
  };

  const removePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index][parent][child] = value;
    } else {
      updated[index][field] = value;
    }
    setPlayers(updated);
  };

  const calculateBalance = (player) => {
    const totalBuyIn = player.buyIns.reduce((sum, buyIn) => sum + buyIn, 0);
    return player.cashOut - totalBuyIn;
  };

  const optimizeTransfers = () => {
    const balances = players.map(player => ({
      name: player.name,
      balance: calculateBalance(player)
    }));

    const creditors = balances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const transfers = [];
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, -debtor.balance);

      if (amount > 0) {
        transfers.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount
        });

        creditor.balance -= amount;
        debtor.balance += amount;
      }

      if (creditor.balance === 0) i++;
      if (debtor.balance === 0) j++;
    }

    setSuggestions(transfers);
  };

  const handleSave = async () => {
    if (!players.some(p => p.name)) {
      alert('Adicione pelo menos um jogador');
      return;
    }

    setLoading(true);
    try {
      const sessionData = {
        date,
        players_data: players.filter(p => p.name),
        recommendations: suggestions
      };

      await (onSave ? onSave(sessionData) : api.createSession(sessionData));
      alert('Sessão salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar sessão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (players.length > 0) {
      optimizeTransfers();
    }
  }, [players]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium mb-2">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          />
        </div>
        <button
          onClick={addPlayer}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Adicionar Jogador
        </button>
      </div>

      <div className="grid gap-4">
        {players.map((player, index) => (
          <div key={index} className="bg-slate-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                  placeholder="Nome do jogador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Buy-in</label>
                <input
                  type="number"
                  value={player.buyIns[0]}
                  onChange={(e) => updatePlayer(index, 'buyIns', [Number(e.target.value)])}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cash-out</label>
                <input
                  type="number"
                  value={player.cashOut}
                  onChange={(e) => updatePlayer(index, 'cashOut', Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Janta</label>
                <input
                  type="number"
                  value={player.dinner.amount}
                  onChange={(e) => updatePlayer(index, 'dinner.amount', Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={player.dinner.paid}
                    onChange={(e) => updatePlayer(index, 'dinner.paid', e.target.checked)}
                    className="mr-2"
                  />
                  Janta Paga
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className={`font-bold ${calculateBalance(player) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {calculateBalance(player) >= 0 ? '+' : ''}R$ {calculateBalance(player).toFixed(2)}
                </div>
                <button
                  onClick={() => removePlayer(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Sugestões de Transferência</h3>
          <div className="space-y-2">
            {suggestions.map((transfer, index) => (
              <div key={index} className="flex justify-between items-center bg-slate-700 p-3 rounded">
                <span>{transfer.from} → {transfer.to}</span>
                <span className="font-bold text-green-400">R$ {transfer.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium"
      >
        {loading ? 'Salvando...' : 'Salvar Sessão'}
      </button>
    </div>
  );
}
