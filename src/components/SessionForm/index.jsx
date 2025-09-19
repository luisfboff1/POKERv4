import React, { useState, useEffect } from 'react';
import { PlayerAutocomplete } from '../PlayerAutocomplete';

export function SessionForm({ initialData, onDataChange, onSave, disabled }) {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialData) {
      setPlayers(initialData.players || []);
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
    }
  }, [initialData]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;

    const newPlayer = {
      name: newPlayerName.trim(),
      buyIns: [50], // Buy-in padrão
      cashOut: 0,
      dinner: {
        amount: 0,
        paid: false
      },
      transferPaid: false
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    setNewPlayerName('');

    onDataChange({
      date,
      players: updatedPlayers
    });
  };

  const removePlayer = (index) => {
    const updatedPlayers = players.filter((_, i) => i !== index);
    setPlayers(updatedPlayers);
    onDataChange({
      date,
      players: updatedPlayers
    });
  };

  const updatePlayerField = (index, field, value) => {
    const updatedPlayers = [...players];
    
    if (field === 'buyIn') {
      // Atualiza o último buy-in
      if (!updatedPlayers[index].buyIns) {
        updatedPlayers[index].buyIns = [];
      }
      if (updatedPlayers[index].buyIns.length === 0) {
        updatedPlayers[index].buyIns.push(0);
      }
      updatedPlayers[index].buyIns[updatedPlayers[index].buyIns.length - 1] = Number(value);
    } else if (field === 'addBuyIn') {
      // Adiciona um novo buy-in
      if (!updatedPlayers[index].buyIns) {
        updatedPlayers[index].buyIns = [];
      }
      updatedPlayers[index].buyIns.push(50); // Valor padrão para novo buy-in
    } else if (field === 'dinner') {
      updatedPlayers[index].dinner = {
        ...updatedPlayers[index].dinner,
        amount: Number(value)
      };
    } else {
      updatedPlayers[index][field] = Number(value);
    }

    setPlayers(updatedPlayers);
    onDataChange({
      date,
      players: updatedPlayers
    });
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    onDataChange({
      date: newDate,
      players
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      date,
      players
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data da sessão */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Data da sessão
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      {/* Lista de jogadores */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Jogadores
        </h3>
        
        <div className="space-y-4">
          {players.map((player, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">{player.name}</h4>
                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700"
                >
                  Remover
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buy-ins */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Buy-ins
                  </label>
                  <div className="mt-1 space-y-2">
                    {player.buyIns?.map((buyIn, buyInIndex) => (
                      <input
                        key={buyInIndex}
                        type="number"
                        value={buyIn}
                        onChange={(e) => updatePlayerField(index, 'buyIn', e.target.value)}
                        disabled={disabled}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => updatePlayerField(index, 'addBuyIn')}
                      disabled={disabled}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      + Adicionar buy-in
                    </button>
                  </div>
                </div>

                {/* Cash-out */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cash-out
                  </label>
                  <input
                    type="number"
                    value={player.cashOut}
                    onChange={(e) => updatePlayerField(index, 'cashOut', e.target.value)}
                    disabled={disabled}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Janta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Valor da janta
                  </label>
                  <input
                    type="number"
                    value={player.dinner?.amount || 0}
                    onChange={(e) => updatePlayerField(index, 'dinner', e.target.value)}
                    disabled={disabled}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Adicionar jogador */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Adicionar jogador
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <PlayerAutocomplete
                value={newPlayerName}
                onChange={setNewPlayerName}
                disabled={disabled}
              />
            </div>
            <button
              type="button"
              onClick={addPlayer}
              disabled={disabled || !newPlayerName.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Botão salvar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || players.length === 0}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}