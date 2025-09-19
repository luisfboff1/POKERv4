import React, { useState } from 'react';
import { PlayerRow } from './PlayerRow';
import { Summary } from './Summary';

export function PokerSession() {
  const [players, setPlayers] = useState([]);
  const [dinnerAmount, setDinnerAmount] = useState(0);

  // Adicionar jogador
  const addPlayer = (name) => {
    if (!name) return;
    
    setPlayers([
      ...players,
      {
        id: Date.now(),
        name,
        buyIn: 50,
        buyIns: [50],  // Lista de buy-ins para caso faça mais de um
        cashOut: 0,
        dinnerAmount: 0,
        dinnerPaid: false
      }
    ]);
  };

  // Remover jogador
  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  // Adicionar buy-in
  const addBuyIn = (playerId, amount) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        const newBuyIns = [...player.buyIns, amount];
        return {
          ...player,
          buyIns: newBuyIns,
          buyIn: newBuyIns.reduce((a, b) => a + b, 0)
        };
      }
      return player;
    }));
  };

  // Atualizar cash-out
  const updateCashOut = (playerId, amount) => {
    setPlayers(players.map(player => 
      player.id === playerId ? { ...player, cashOut: amount } : player
    ));
  };

  // Dividir janta
  const splitDinner = (total) => {
    if (!total || players.length === 0) return;
    
    const perPlayer = Number((total / players.length).toFixed(2));
    setDinnerAmount(total);
    
    setPlayers(players.map(player => ({
      ...player,
      dinnerAmount: perPlayer,
      dinnerPaid: false
    })));
  };

  // Marcar janta como paga
  const toggleDinnerPaid = (playerId) => {
    setPlayers(players.map(player =>
      player.id === playerId ? { ...player, dinnerPaid: !player.dinnerPaid } : player
    ));
  };

  // Calcular saldo de um jogador
  const getPlayerBalance = (player) => {
    const pokerBalance = player.cashOut - player.buyIn;
    const dinnerBalance = player.dinnerPaid ? 0 : -player.dinnerAmount;
    return pokerBalance + dinnerBalance;
  };

  // Salvar sessão
  const saveSession = async () => {
    // TODO: Implementar salvamento no backend
    console.log('Dados da sessão:', {
      players,
      dinnerAmount,
      date: new Date(),
      balances: players.map(p => ({
        name: p.name,
        balance: getPlayerBalance(p)
      }))
    });
  };

  return (
    <div className="space-y-6">
      {/* Adicionar Jogador */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nome do jogador"
          className="flex-1 p-2 border rounded"
          onKeyPress={e => e.key === 'Enter' && addPlayer(e.target.value)}
        />
        <input
          type="number"
          placeholder="Valor da janta"
          className="w-40 p-2 border rounded"
          onChange={e => splitDinner(Number(e.target.value))}
        />
      </div>

      {/* Lista de Jogadores */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {players.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Jogador</th>
                <th className="px-4 py-2 text-right">Buy-ins</th>
                <th className="px-4 py-2 text-right">Cash Out</th>
                <th className="px-4 py-2 text-right">Janta</th>
                <th className="px-4 py-2 text-center">Pagou?</th>
                <th className="px-4 py-2 text-right">Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  onAddBuyIn={addBuyIn}
                  onUpdateCashOut={updateCashOut}
                  onToggleDinnerPaid={toggleDinnerPaid}
                  onRemove={removePlayer}
                  balance={getPlayerBalance(player)}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Adicione jogadores para começar
          </div>
        )}
      </div>

      {/* Resumo */}
      {players.length > 0 && (
        <Summary 
          players={players}
          getPlayerBalance={getPlayerBalance}
          onSave={saveSession}
        />
      )}
    </div>
  );
}
