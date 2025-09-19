import React, { useEffect, useState } from 'react';
import { sessionApi } from '../../services/api';
import { Link } from 'react-router-dom';

export function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionApi.list();
      if (response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      alert('Erro ao carregar sessões: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculatePlayerBalance = (player) => {
    const buyIn = player.buyIns?.reduce((sum, value) => sum + value, 0) || 0;
    const cashOut = player.cashOut || 0;
    return cashOut - buyIn;
  };

  const handlePaymentToggle = async (sessionId, playerIndex, type) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const updatedSession = { ...session };
      const updatedPlayers = [...session.players_data];
      
      if (type === 'dinner') {
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          dinner: {
            ...updatedPlayers[playerIndex].dinner,
            paid: !updatedPlayers[playerIndex].dinner?.paid
          }
        };
      } else if (type === 'transfer') {
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          transferPaid: !updatedPlayers[playerIndex].transferPaid
        };
      }

      updatedSession.players_data = updatedPlayers;
      
      await sessionApi.update(sessionId, {
        date: session.date,
        players: updatedPlayers,
        recommendations: session.recommendations || []
      });

      // Atualiza o estado local
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, players_data: updatedPlayers } : s
      ));
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      alert('Erro ao atualizar pagamento: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center">Carregando sessões...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Histórico de Sessões</h1>
        <Link 
          to="/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Nova Sessão
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center text-gray-500">
          Nenhuma sessão encontrada
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Sessão do dia {formatDate(session.date)}
                  </h3>
                  <div className="text-gray-600 dark:text-gray-300">
                    <p className="mb-1">
                      Total em jogo: {formatMoney(
                        session.players_data?.reduce((total, player) => 
                          total + (player.buyIns?.reduce((sum, buyIn) => sum + buyIn, 0) || 0), 0
                        )
                      )}
                    </p>
                    <p>Jogadores: {session.players_data?.length || 0}</p>
                  </div>
                </div>
                <Link 
                  to={`/edit/${session.id}`} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Editar
                </Link>
              </div>

              {/* Lista de Jogadores */}
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Participantes:</h4>
                <div className="grid gap-2">
                  {session.players_data?.map((player, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="font-medium">{player.name}</span>
                      <div className="text-right space-y-1">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Buy-in: {formatMoney(player.buyIns?.reduce((sum, value) => sum + value, 0) || 0)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Cash-out: {formatMoney(player.cashOut || 0)}
                        </div>
                        <div className={`font-medium ${
                          calculatePlayerBalance(player) >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Balanço: {formatMoney(calculatePlayerBalance(player))}
                        </div>
                        {player.dinner?.amount > 0 && (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Janta: {formatMoney(player.dinner.amount)}
                            </span>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={player.dinner?.paid || false}
                                onChange={() => handlePaymentToggle(session.id, index, 'dinner')}
                                className="form-checkbox h-4 w-4 text-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Pago</span>
                            </label>
                          </div>
                        )}
                        {calculatePlayerBalance(player) !== 0 && (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Transferência
                            </span>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={player.transferPaid || false}
                                onChange={() => handlePaymentToggle(session.id, index, 'transfer')}
                                className="form-checkbox h-4 w-4 text-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Pago</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}