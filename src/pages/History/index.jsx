import React, { useEffect, useState } from 'react';
import { sessionApi } from '../../services/api';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/Modal';

export function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handlePaymentChange = (sessionId, playerIndex, field, value) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        const updatedPlayers = [...session.players_data];
        if (field === 'dinner') {
          updatedPlayers[playerIndex] = {
            ...updatedPlayers[playerIndex],
            dinner: {
              ...updatedPlayers[playerIndex].dinner,
              paid: value
            }
          };
        } else if (field === 'transfer') {
          updatedPlayers[playerIndex] = {
            ...updatedPlayers[playerIndex],
            transferPaid: value
          };
        }
        return {
          ...session,
          players_data: updatedPlayers
        };
      }
      return session;
    });

    setEditingSession(updatedSessions.find(s => s.id === sessionId));
  };

  const handleSavePayments = async () => {
    if (!editingSession) return;

    try {
      setIsSaving(true);
      await sessionApi.update(editingSession.id, {
        date: editingSession.date,
        players: editingSession.players_data,
        recommendations: editingSession.recommendations || []
      });

      setSessions(sessions.map(s => 
        s.id === editingSession.id ? editingSession : s
      ));
      setEditingSession(null);
      alert('Pagamentos salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar pagamentos:', error);
      alert('Erro ao salvar pagamentos: ' + error.message);
    } finally {
      setIsSaving(false);
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
          className="btn btn-primary"
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
              className="card"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Sessão do dia {formatDate(session.date)}
                  </h3>
                  <div className="text-slate-400">
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
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedSession(session)}
                    className="btn btn-secondary"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => setEditingSession(session)}
                    className="btn btn-primary"
                  >
                    Editar Pagamentos
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={`Detalhes da Sessão - ${selectedSession ? formatDate(selectedSession.date) : ''}`}
      >
        {selectedSession && (
          <div className="space-y-4">
            {selectedSession.players_data?.map((player, index) => (
              <div 
                key={index}
                className="bg-slate-700 p-4 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium mb-2">{player.name}</h4>
                    <div className="space-y-1 text-sm text-slate-300">
                      <p>Buy-ins: {formatMoney(player.buyIns?.reduce((sum, value) => sum + value, 0) || 0)}</p>
                      <p>Cash-out: {formatMoney(player.cashOut || 0)}</p>
                      {player.dinner?.amount > 0 && (
                        <p>Janta: {formatMoney(player.dinner.amount)} {player.dinner.paid && '✓'}</p>
                      )}
                    </div>
                  </div>
                  <div className={`text-lg font-medium ${
                    calculatePlayerBalance(player) >= 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {formatMoney(calculatePlayerBalance(player))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal de Edição */}
      <Modal
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        title={`Editar Pagamentos - ${editingSession ? formatDate(editingSession.date) : ''}`}
      >
        {editingSession && (
          <div className="space-y-4">
            {editingSession.players_data?.map((player, index) => (
              <div 
                key={index}
                className="bg-slate-700 p-4 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium mb-2">{player.name}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={player.dinner?.paid || false}
                            onChange={(e) => handlePaymentChange(
                              editingSession.id,
                              index,
                              'dinner',
                              e.target.checked
                            )}
                            className="form-checkbox"
                          />
                          <span className="ml-2">Janta Paga ({formatMoney(player.dinner?.amount || 0)})</span>
                        </label>
                      </div>
                      {calculatePlayerBalance(player) !== 0 && (
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={player.transferPaid || false}
                              onChange={(e) => handlePaymentChange(
                                editingSession.id,
                                index,
                                'transfer',
                                e.target.checked
                              )}
                              className="form-checkbox"
                            />
                            <span className="ml-2">Transferência Paga ({formatMoney(Math.abs(calculatePlayerBalance(player)))})</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSavePayments}
                disabled={isSaving}
                className="btn btn-primary"
              >
                {isSaving ? 'Salvando...' : 'Salvar Pagamentos'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}