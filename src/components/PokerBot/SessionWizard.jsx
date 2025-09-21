import React, { useState, useEffect } from 'react';
import { useAgent } from '../../contexts/AgentContext';
import { api } from '../../services/api';

export function SessionWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    players: []
  });
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { executeAction } = useAgent();

  // Carregar jogadores existentes
  useEffect(() => {
    loadAvailablePlayers();
  }, []);

  const loadAvailablePlayers = async () => {
    try {
      const response = await api.getPlayers();
      setAvailablePlayers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
    }
  };

  const addExistingPlayer = (playerName) => {
    if (!sessionData.players.find(p => p.name === playerName)) {
      setSessionData(prev => ({
        ...prev,
        players: [...prev.players, {
          name: playerName,
          buyIns: [100], // Padrão
          cashOut: 0,
          dinner: { amount: 0, paid: false }
        }]
      }));
    }
  };

  const addNewPlayer = () => {
    if (newPlayerName.trim() && !sessionData.players.find(p => p.name === newPlayerName.trim())) {
      setSessionData(prev => ({
        ...prev,
        players: [...prev.players, {
          name: newPlayerName.trim(),
          buyIns: [100], // Padrão
          cashOut: 0,
          dinner: { amount: 0, paid: false }
        }]
      }));
      setNewPlayerName('');
    }
  };

  const removePlayer = (playerName) => {
    setSessionData(prev => ({
      ...prev,
      players: prev.players.filter(p => p.name !== playerName)
    }));
  };

  const updatePlayerBuyIn = (playerName, buyIn) => {
    setSessionData(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.name === playerName 
          ? { ...p, buyIns: [parseInt(buyIn) || 100] }
          : p
      )
    }));
  };

  const createSession = async () => {
    if (sessionData.players.length === 0) {
      alert('Adicione pelo menos um jogador!');
      return;
    }

    setIsCreating(true);
    
    try {
      const result = await executeAction('create_session', {
        date: sessionData.date,
        players: sessionData.players
      });
      
      if (result.success) {
        onComplete(result);
      } else {
        alert('Erro ao criar sessão: ' + result.error);
      }
    } catch (error) {
      alert('Erro ao criar sessão: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const suggestedGroups = [
    { name: 'Grupo Padrão', players: ['João', 'Maria', 'Pedro', 'Ana'] },
    { name: 'Grupo Veteranos', players: ['Carlos', 'Roberto', 'Fernanda'] },
    { name: 'Grupo Novatos', players: ['Lucas', 'Beatriz', 'Diego'] }
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">🎯 Criar Nova Sessão</h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Progress */}
      <div className="flex mb-4">
        <div className={`flex-1 h-2 rounded-l ${step >= 1 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
        <div className={`flex-1 h-2 ${step >= 2 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
        <div className={`flex-1 h-2 rounded-r ${step >= 3 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
      </div>

      {/* Step 1: Data */}
      {step === 1 && (
        <div>
          <h4 className="text-white mb-3">📅 Data da Sessão</h4>
          <input
            type="date"
            value={sessionData.date}
            onChange={(e) => setSessionData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          
          <div className="mt-4">
            <button
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Próximo: Jogadores →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Jogadores */}
      {step === 2 && (
        <div>
          <h4 className="text-white mb-3">👥 Jogadores ({sessionData.players.length})</h4>
          
          {/* Grupos Sugeridos */}
          <div className="mb-4">
            <h5 className="text-sm text-slate-400 mb-2">Grupos Recentes:</h5>
            <div className="space-y-1">
              {suggestedGroups.map((group, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSessionData(prev => ({
                      ...prev,
                      players: group.players.map(name => ({
                        name,
                        buyIns: [100],
                        cashOut: 0,
                        dinner: { amount: 0, paid: false }
                      }))
                    }));
                  }}
                  className="w-full text-left bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm text-white"
                >
                  {group.name} ({group.players.length} jogadores)
                </button>
              ))}
            </div>
          </div>

          {/* Jogadores Disponíveis */}
          {availablePlayers.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm text-slate-400 mb-2">Jogadores Existentes:</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availablePlayers.slice(0, 10).map((player, index) => (
                  <button
                    key={index}
                    onClick={() => addExistingPlayer(player)}
                    className="w-full text-left bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm text-white"
                  >
                    + {player}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar Novo Jogador */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nome do novo jogador"
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addNewPlayer()}
              />
              <button
                onClick={addNewPlayer}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Lista de Jogadores Selecionados */}
          {sessionData.players.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm text-slate-400 mb-2">Jogadores Selecionados:</h5>
              <div className="space-y-2">
                {sessionData.players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-700 px-3 py-2 rounded">
                    <span className="text-white text-sm">{player.name}</span>
                    <button
                      onClick={() => removePlayer(player.name)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded"
            >
              ← Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={sessionData.players.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-2 rounded"
            >
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmação */}
      {step === 3 && (
        <div>
          <h4 className="text-white mb-3">✅ Confirmação</h4>
          
          <div className="bg-slate-700 p-3 rounded mb-4">
            <div className="text-sm">
              <div className="text-slate-400">Data:</div>
              <div className="text-white mb-2">{new Date(sessionData.date).toLocaleDateString('pt-BR')}</div>
              
              <div className="text-slate-400">Jogadores ({sessionData.players.length}):</div>
              <div className="text-white">
                {sessionData.players.map(p => p.name).join(', ')}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded"
            >
              ← Voltar
            </button>
            <button
              onClick={createSession}
              disabled={isCreating}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-2 rounded"
            >
              {isCreating ? '⏳ Criando...' : '🎯 Criar Sessão'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
