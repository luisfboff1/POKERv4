import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function SessionManager({ initialData = null, onSave = null }) {
  const [players, setPlayers] = useState(initialData?.players_data || []);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [currentStep, setCurrentStep] = useState(initialData ? 'values' : 'names');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState({});
  
  // Estados para sistema de recomendações
  const [recommendedPayments, setRecommendedPayments] = useState([]);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [newRecommendation, setNewRecommendation] = useState({
    from: '',
    to: '',
    amount: ''
  });

  // Carregar jogadores disponíveis do histórico
  const loadAvailablePlayers = async () => {
    try {
      const response = await api.getPlayers();
      setAvailablePlayers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
    }
  };

  // Adicionar jogador na etapa de nomes
  const addPlayerName = () => {
    setPlayers([...players, { name: '' }]);
    setCurrentPlayerIndex(players.length);
  };

  // Adicionar jogador completo (para modo de edição)
  const addPlayer = () => {
    setPlayers([...players, {
      name: '',
      buyIns: [50],
      cashOut: 0,
      dinner: { amount: 0, paid: false }
    }]);
  };

  // Finalizar coleta de nomes e ir para valores
  const finishNamesStep = () => {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length === 0) {
      alert('Adicione pelo menos um jogador');
      return;
    }
    
    // Converter para estrutura completa
    const fullPlayers = validPlayers.map(player => ({
      ...player,
      buyIns: [50],
      cashOut: 0,
      dinner: { amount: 0, paid: false }
    }));
    
    setPlayers(fullPlayers);
    setCurrentStep('values');
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

  // Obter sugestões de jogadores baseado no texto digitado
  const getPlayerSuggestions = (text, playerIndex) => {
    if (!text || text.length < 2) {
      return [];
    }
    const suggestions = availablePlayers.filter(player => 
      player.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 5);
    
    return suggestions;
  };

  // Lidar com Enter para próximo jogador
  const handlePlayerNameKeyPress = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (players[index].name.trim()) {
        // Se não é o último jogador, focar no próximo
        if (index < players.length - 1) {
          const nextInput = document.querySelector(`input[data-player-index="${index + 1}"]`);
          nextInput?.focus();
        } else {
          // Se é o último, adicionar novo jogador
          addPlayerName();
          setTimeout(() => {
            const newInput = document.querySelector(`input[data-player-index="${players.length}"]`);
            newInput?.focus();
          }, 100);
        }
      }
    }
  };

  const calculateBalance = (player) => {
    const totalBuyIn = (player.buyIns || []).reduce((sum, buyIn) => sum + buyIn, 0);
    return (player.cashOut || 0) - totalBuyIn;
  };

  // Calcular transferências otimizadas (algoritmo corrigido)
  const optimizeTransfers = (playerList = players, recommendations = []) => {
    console.log('🔍 Iniciando otimização...');
    console.log('👥 Jogadores:', playerList);
    console.log('📝 Recomendações:', recommendations);
    
    // 1. Calcular saldos líquidos iniciais
    const nets = playerList.map(p => ({ 
      name: p.name, 
      net: calculateBalance(p)
    }));
    
    console.log('💰 Saldos iniciais:', nets);
    
    // 2. Aplicar recomendações como restrições (modificar saldos)
    const tempNets = [...nets];
    recommendations.forEach(rec => {
      const payer = tempNets.find(p => p.name === rec.from);
      const receiver = tempNets.find(p => p.name === rec.to);
      if (payer && receiver) {
        console.log(`📝 Aplicando recomendação: ${rec.from} paga ${rec.amount} para ${rec.to}`);
        console.log(`   Antes: ${payer.name}=${payer.net}, ${receiver.name}=${receiver.net}`);
        
        // Aplicar baseado no tipo de saldo
        if (payer.net < 0) {
          payer.net += Number(rec.amount); // Reduz dívida
        } else {
          payer.net -= Number(rec.amount); // Reduz crédito
        }
        
        if (receiver.net > 0) {
          receiver.net -= Number(rec.amount); // Reduz crédito
        } else {
          receiver.net += Number(rec.amount); // Reduz dívida
        }
        
        console.log(`   Depois: ${payer.name}=${payer.net}, ${receiver.name}=${receiver.net}`);
      }
    });
    
    console.log('💰 Saldos após recomendações:', tempNets);
    
    // 3. Otimizar transferências restantes
    const creditors = tempNets.filter(n => n.net > 0);
    const debtors = tempNets.filter(n => n.net < 0).map(n => ({...n, net: Math.abs(n.net)}));
    
    console.log('📊 Credores:', creditors);
    console.log('📊 Devedores:', debtors);
    
    // Algoritmo de matching otimizado
    const transfers = [];
    while (creditors.length > 0 && debtors.length > 0) {
      const creditor = creditors[0];
      const debtor = debtors[0];
      const amount = Math.min(creditor.net, debtor.net);
      
      console.log(`💸 Transferência otimizada: ${debtor.name} → ${creditor.name}: ${amount}`);
      
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount,
        paid: false
      });
      
      creditor.net -= amount;
      debtor.net -= amount;
      
      if (creditor.net === 0) creditors.shift();
      if (debtor.net === 0) debtors.shift();
    }
    
    console.log('✅ Resultado final:', transfers);
    return transfers;
  };

  // Adicionar recomendação
  const addRecommendation = () => {
    if (!newRecommendation.from || !newRecommendation.to || !newRecommendation.amount) {
      alert('Preencha todos os campos');
      return;
    }

    if (newRecommendation.from === newRecommendation.to) {
      alert('Não é possível pagar para si mesmo');
      return;
    }

    if (Number(newRecommendation.amount) <= 0) {
      alert('Valor deve ser positivo');
      return;
    }

    const recommendation = {
      from: newRecommendation.from,
      to: newRecommendation.to,
      amount: Number(newRecommendation.amount),
      paid: false
    };

    setRecommendedPayments([...recommendedPayments, recommendation]);
    setNewRecommendation({ from: '', to: '', amount: '' });
    setShowRecommendationForm(false);
  };

  // Remover recomendação
  const removeRecommendation = (index) => {
    const updated = recommendedPayments.filter((_, i) => i !== index);
    setRecommendedPayments(updated);
  };

  // Atualizar otimização com recomendações
  const updateOptimization = () => {
    const optimizedTransfers = optimizeTransfers(players, recommendedPayments);
    setSuggestions(optimizedTransfers);
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
        recommendations: [...recommendedPayments, ...suggestions]
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
    if (players.length > 0 && players.some(p => p.name)) {
      try {
        const optimizedTransfers = optimizeTransfers(players, recommendedPayments);
        setSuggestions(optimizedTransfers);
      } catch (error) {
        console.error('Erro ao calcular otimização:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }, [players, recommendedPayments]);

  useEffect(() => {
    if (!initialData) {
      loadAvailablePlayers();
    }
  }, [initialData]);

  // Adicionar primeiro jogador automaticamente
  useEffect(() => {
    if (!initialData && players.length === 0) {
      setPlayers([{ name: '' }]);
    }
  }, [initialData]);

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
        {currentStep === 'names' ? (
          <div className="flex gap-2">
            <button
              onClick={addPlayerName}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Adicionar Jogador
            </button>
            <button
              onClick={finishNamesStep}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Continuar para Valores
            </button>
          </div>
        ) : (
          <button
            onClick={addPlayer}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Adicionar Jogador
          </button>
        )}
      </div>

      {currentStep === 'names' && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Adicione os jogadores da sessão</h3>
          <div className="grid gap-3">
            {players.map((player, index) => {
              const playerSuggestions = getPlayerSuggestions(player.name, index);
              const shouldShowSuggestions = showSuggestions[index] && playerSuggestions.length > 0;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-slate-400 w-8">{index + 1}.</span>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => {
                        updatePlayer(index, 'name', e.target.value);
                        // Atualizar sugestões quando o texto muda
                        if (e.target.value.length >= 2) {
                          setShowSuggestions(prev => ({ ...prev, [index]: true }));
                        } else {
                          setShowSuggestions(prev => ({ ...prev, [index]: false }));
                        }
                      }}
                      onKeyPress={(e) => handlePlayerNameKeyPress(e, index)}
                      onBlur={() => {
                        // Fechar sugestões após um pequeno delay para permitir clique
                        setTimeout(() => {
                          setShowSuggestions(prev => ({ ...prev, [index]: false }));
                        }, 200);
                      }}
                      onFocus={() => {
                        // Mostrar sugestões se houver texto
                        if (player.name && player.name.length >= 2) {
                          setShowSuggestions(prev => ({ ...prev, [index]: true }));
                        }
                      }}
                      data-player-index={index}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      placeholder="Nome do jogador (pressione Enter para próximo)"
                      autoFocus={index === currentPlayerIndex}
                    />
                    {shouldShowSuggestions && (
                      <div className="absolute top-full left-0 right-0 bg-slate-700 border border-slate-600 rounded-b mt-1 z-10 shadow-lg">
                        {playerSuggestions.map((suggestion, sugIndex) => (
                          <button
                            key={sugIndex}
                            onClick={() => {
                              updatePlayer(index, 'name', suggestion);
                              setShowSuggestions(prev => ({ ...prev, [index]: false }));
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-600 text-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removePlayer(index)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-slate-400">
            💡 Dica: Digite 2+ letras para ver sugestões de jogadores anteriores
          </div>
        </div>
      )}

      {currentStep === 'values' && (
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
      )}

      {currentStep === 'values' && (
        <>
          {/* Sistema de Recomendações */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Sistema de Recomendações</h3>
              <button
                onClick={() => setShowRecommendationForm(!showRecommendationForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                {showRecommendationForm ? 'Cancelar' : '+ Adicionar Recomendação'}
              </button>
            </div>

            {/* Formulário de Recomendação */}
            {showRecommendationForm && (
              <div className="bg-slate-700 p-4 rounded-lg mb-4">
                <h4 className="text-md font-medium mb-3">Nova Recomendação</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Quem paga</label>
                    <select
                      value={newRecommendation.from}
                      onChange={(e) => setNewRecommendation({...newRecommendation, from: e.target.value})}
                      className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2"
                    >
                      <option value="">Selecione...</option>
                      {players.filter(p => p.name).map(player => (
                        <option key={player.name} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Para quem</label>
                    <select
                      value={newRecommendation.to}
                      onChange={(e) => setNewRecommendation({...newRecommendation, to: e.target.value})}
                      className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2"
                    >
                      <option value="">Selecione...</option>
                      {players.filter(p => p.name && p.name !== newRecommendation.from).map(player => (
                        <option key={player.name} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newRecommendation.amount}
                      onChange={(e) => setNewRecommendation({...newRecommendation, amount: e.target.value})}
                      className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addRecommendation}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Recomendações */}
            {recommendedPayments.length > 0 && (
              <div className="bg-slate-700 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium">
                    Recomendações Fixas ({recommendedPayments.length})
                  </h4>
                  <button
                    onClick={updateOptimization}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                  >
                    🔄 Atualizar Otimização
                  </button>
                </div>
                <div className="space-y-2">
                  {recommendedPayments.map((rec, index) => (
                    <div key={index} className="flex justify-between items-center bg-green-800 p-3 rounded">
                      <div className="flex items-center gap-3">
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">📝 Fixo</span>
                        <span>{rec.from} → {rec.to}</span>
                        <span className="font-bold text-green-300">R$ {rec.amount.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => removeRecommendation(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  💡 Recomendações são transferências fixas que devem ser pagas. O sistema otimiza apenas o restante.
                </div>
              </div>
            )}

            {/* Transferências Otimizadas */}
            {suggestions.length > 0 && (
              <div className="bg-slate-700 p-4 rounded-lg">
                <h4 className="text-md font-medium mb-3">
                  Transferências Otimizadas ({suggestions.length})
                </h4>
                <div className="space-y-2">
                  {suggestions.map((transfer, index) => (
                    <div key={index} className="flex justify-between items-center bg-blue-800 p-3 rounded">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">🔄 Otimizado</span>
                        <span>{transfer.from} → {transfer.to}</span>
                        <span className="font-bold text-blue-300">R$ {transfer.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={transfer.paid || false}
                            onChange={(e) => {
                              const updatedSuggestions = [...suggestions];
                              updatedSuggestions[index].paid = e.target.checked;
                              setSuggestions(updatedSuggestions);
                            }}
                            className="mr-1"
                          />
                          <span className={transfer.paid ? 'text-green-400' : 'text-slate-400'}>
                            {transfer.paid ? 'Pago' : 'Pendente'}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  💡 Transferências otimizadas calculadas pelo sistema para minimizar o número de pagamentos.
                </div>
              </div>
            )}

            {/* Resumo */}
            {recommendedPayments.length > 0 || suggestions.length > 0 ? (
              <div className="mt-4 p-3 bg-slate-600 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Total de Transferências:</span>
                  <span className="font-bold">{recommendedPayments.length + suggestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recomendações Fixas:</span>
                  <span className="text-green-400">{recommendedPayments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Otimizadas:</span>
                  <span className="text-blue-400">{suggestions.length}</span>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {currentStep === 'values' && (
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium"
        >
          {loading ? 'Salvando...' : 'Salvar Sessão'}
        </button>
      )}
    </div>
  );
}
