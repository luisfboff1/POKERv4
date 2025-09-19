import React, { useState, useEffect } from 'react';

export function SessionForm({ onDataChange, onSave }) {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recForm, setRecForm] = useState({
    from: '',
    to: '',
    amount: ''
  });

  // Notificar mudanças para o componente pai
  useEffect(() => {
    onDataChange({ players, recommendations });
  }, [players, recommendations]);

  // Adicionar jogador
  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayer.trim()) return;

    setPlayers([
      ...players,
      {
        id: Date.now().toString(),
        name: newPlayer,
        buyIns: [50], // Buy-in padrão de 50
        cashOut: 0,
        dinner: {
          amount: 0,
          paid: false
        }
      }
    ]);
    setNewPlayer('');
  };

  // Adicionar buy-in
  const handleAddBuyIn = (playerId, amount = 50) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          buyIns: [...player.buyIns, amount]
        };
      }
      return player;
    }));
  };

  // Atualizar cash-out
  const handleCashOutChange = (playerId, amount) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          cashOut: Number(amount)
        };
      }
      return player;
    }));
  };

  // Atualizar valor individual da janta
  const handleDinnerAmountChange = (playerId, amount) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          dinner: {
            ...player.dinner,
            amount: Number(amount)
          }
        };
      }
      return player;
    }));
  };

  // Toggle pagamento da janta
  const handleDinnerPaidToggle = (playerId) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          dinner: {
            ...player.dinner,
            paid: !player.dinner.paid
          }
        };
      }
      return player;
    }));
  };

  // Adicionar recomendação de pagamento
  const handleAddRecommendation = (e) => {
    e.preventDefault();
    if (!recForm.from || !recForm.to || !recForm.amount || recForm.from === recForm.to) {
      return;
    }

    setRecommendations([
      ...recommendations,
      {
        from: recForm.from,
        to: recForm.to,
        amount: Number(recForm.amount),
        paid: false
      }
    ]);

    setRecForm({ from: '', to: '', amount: '' });
  };

  // Remover recomendação
  const handleRemoveRecommendation = (index) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  // Toggle pagamento de recomendação
  const handleRecommendationPaidToggle = (index) => {
    setRecommendations(recommendations.map((rec, i) => 
      i === index ? { ...rec, paid: !rec.paid } : rec
    ));
  };

  // Calcular saldo do poker (sem janta)
  const getPokerBalance = (player) => {
    const totalBuyIn = player.buyIns.reduce((sum, buyIn) => sum + buyIn, 0);
    return player.cashOut - totalBuyIn;
  };

  // Calcular total da janta
  const getTotalDinner = () => {
    return players.reduce((sum, player) => sum + player.dinner.amount, 0);
  };

  // Salvar sessão
  const handleSave = () => {
    if (players.length === 0) {
      alert('Adicione pelo menos um jogador antes de salvar.');
      return;
    }

    onSave({
      players,
      recommendations,
      date: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Jogador */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <form onSubmit={handleAddPlayer} className="flex gap-4">
          <input
            type="text"
            value={newPlayer}
            onChange={e => setNewPlayer(e.target.value)}
            placeholder="Nome do jogador"
            className="flex-1 rounded-md"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Adicionar Jogador
          </button>
        </form>
      </div>

      {/* Lista de Jogadores */}
      {players.length > 0 && (
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left">Jogador</th>
                <th className="px-6 py-3 text-right">Buy-ins</th>
                <th className="px-6 py-3 text-right">Cash Out</th>
                <th className="px-6 py-3 text-right">Saldo Poker</th>
                <th className="px-6 py-3 text-right">Janta</th>
                <th className="px-6 py-3 text-center">Pagou Janta?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {players.map(player => (
                <tr key={player.id}>
                  <td className="px-6 py-4">{player.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="text-slate-400">
                        {player.buyIns.join(' + ')} = {player.buyIns.reduce((a, b) => a + b, 0)}
                      </div>
                      <button
                        onClick={() => handleAddBuyIn(player.id)}
                        className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded"
                      >
                        +50
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={player.cashOut}
                      onChange={e => handleCashOutChange(player.id, e.target.value)}
                      className="w-24 rounded text-right"
                    />
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${
                    getPokerBalance(player) > 0 ? 'text-green-400' : 
                    getPokerBalance(player) < 0 ? 'text-red-400' : ''
                  }`}>
                    {getPokerBalance(player).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={player.dinner.amount}
                      onChange={e => handleDinnerAmountChange(player.id, e.target.value)}
                      className="w-24 rounded text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={player.dinner.paid}
                      onChange={() => handleDinnerPaidToggle(player.id)}
                      className="h-4 w-4 rounded"
                    />
                  </td>
                </tr>
              ))}
              {/* Linha de Total */}
              <tr className="bg-slate-900">
                <td className="px-6 py-4 font-medium">Total</td>
                <td className="px-6 py-4 text-right font-medium">
                  {players.reduce((sum, p) => sum + p.buyIns.reduce((a, b) => a + b, 0), 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {players.reduce((sum, p) => sum + p.cashOut, 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {players.reduce((sum, p) => sum + getPokerBalance(p), 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {getTotalDinner().toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Formulário de Recomendações */}
      {players.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Recomendações de Pagamento (Poker)</h3>
          <form onSubmit={handleAddRecommendation} className="flex gap-4 mb-4">
            <select
              value={recForm.from}
              onChange={e => setRecForm({ ...recForm, from: e.target.value })}
              className="rounded-md"
            >
              <option value="">Quem paga</option>
              {players.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <select
              value={recForm.to}
              onChange={e => setRecForm({ ...recForm, to: e.target.value })}
              className="rounded-md"
            >
              <option value="">Quem recebe</option>
              {players.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={recForm.amount}
              onChange={e => setRecForm({ ...recForm, amount: e.target.value })}
              placeholder="Valor"
              className="w-32 rounded-md"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-md"
            >
              Adicionar
            </button>
          </form>

          {/* Lista de Recomendações */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-emerald-900/20 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">{rec.from}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-400">{rec.to}</span>
                    <span className="text-slate-400">R$ {rec.amount}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={rec.paid}
                        onChange={() => handleRecommendationPaidToggle(index)}
                        className="rounded"
                      />
                      <span className="text-slate-400">Pago?</span>
                    </label>
                    <button
                      onClick={() => handleRemoveRecommendation(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botão Salvar */}
      {players.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Salvar Sessão
          </button>
        </div>
      )}
    </div>
  );
}