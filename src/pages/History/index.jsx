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
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">
                    Sessão do dia {formatDate(session.date)}
                  </h3>
                  <div className="mt-2 text-gray-600 dark:text-gray-300">
                    <p>Jogadores: {session.players_data?.length || 0}</p>
                    <p>Total em jogo: R$ {
                      session.players_data?.reduce((total, player) => 
                        total + (player.buyIns?.reduce((sum, buyIn) => sum + buyIn, 0) || 0), 0
                      ).toFixed(2)
                    }</p>
                  </div>
                </div>
                <Link 
                  to={`/session/${session.id}`} 
                  className="text-blue-500 hover:text-blue-600"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}