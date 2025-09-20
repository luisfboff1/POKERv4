import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.getSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculateSessionTotal = (session) => {
    return session.players_data?.reduce((total, player) => 
      total + (player.buyIns?.reduce((sum, buyIn) => sum + buyIn, 0) || 0), 0
    ) || 0;
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Nova Sessão
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>Nenhuma sessão encontrada</p>
          <Link to="/new" className="text-blue-400 hover:text-blue-300">
            Criar primeira sessão
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-slate-800 p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Sessão do dia {formatDate(session.date)}
                  </h3>
                  <div className="text-slate-400">
                    <p>Total em jogo: {formatMoney(calculateSessionTotal(session))}</p>
                    <p>Jogadores: {session.players_data?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                {session.players_data?.map((player, index) => {
                  const balance = (player.cashOut || 0) - (player.buyIns?.reduce((sum, buyIn) => sum + buyIn, 0) || 0);
                  return (
                    <div key={index} className="flex justify-between items-center bg-slate-700 p-3 rounded">
                      <div>
                        <span className="font-medium">{player.name}</span>
                        {player.dinner?.amount > 0 && (
                          <span className="ml-2 text-sm text-slate-400">
                            (Janta: {formatMoney(player.dinner.amount)})
                          </span>
                        )}
                      </div>
                      <div className={`font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {balance >= 0 ? '+' : ''}{formatMoney(balance)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {session.recommendations?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-medium mb-2">Transferências Sugeridas:</h4>
                  <div className="space-y-1">
                    {session.recommendations.map((transfer, index) => (
                      <div key={index} className="text-sm text-slate-400">
                        {transfer.from} → {transfer.to}: {formatMoney(transfer.amount)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}