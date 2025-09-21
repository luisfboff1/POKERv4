import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export function Home() {
  const { user, getTenantInfo, isTenantAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const tenantInfo = getTenantInfo();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const sessionsResponse = await api.getSessions();
      const sessions = sessionsResponse.data || [];
      
      // Calcular estatísticas
      const totalSessions = sessions.length;
      const thisMonthSessions = sessions.filter(session => {
        const sessionDate = new Date(session.created_at);
        const now = new Date();
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear();
      }).length;

      // Últimas 5 sessões
      const recent = sessions.slice(0, 5);

      setStats({
        totalSessions,
        thisMonthSessions,
        totalPlayers: await getTotalPlayers(sessions)
      });
      setRecentSessions(recent);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalPlayers = async (sessions) => {
    try {
      const playersResponse = await api.getPlayers();
      return playersResponse.data?.length || 0;
    } catch {
      return 0;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div>
      {/* Header do Dashboard */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          👋 Olá, {user?.name}!
        </h1>
        <p className="text-slate-400">
          Bem-vindo ao dashboard do {tenantInfo?.name} • Plano {tenantInfo?.plan}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Carregando dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🎲</div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats?.totalSessions || 0}</div>
                  <div className="text-slate-400 text-sm">Total de Sessões</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📅</div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats?.thisMonthSessions || 0}</div>
                  <div className="text-slate-400 text-sm">Este Mês</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👥</div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats?.totalPlayers || 0}</div>
                  <div className="text-slate-400 text-sm">Jogadores</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isTenantAdmin() && (
              <Link
                to="/new"
                className="bg-blue-600 hover:bg-blue-700 p-6 rounded-lg text-center transition-colors"
              >
                <div className="text-3xl mb-2">➕</div>
                <div className="font-semibold">Nova Sessão</div>
              </Link>
            )}

            <Link
              to="/history"
              className="bg-slate-800 hover:bg-slate-700 p-6 rounded-lg text-center transition-colors"
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="font-semibold">Histórico</div>
            </Link>

            <Link
              to="/ranking"
              className="bg-slate-800 hover:bg-slate-700 p-6 rounded-lg text-center transition-colors"
            >
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-semibold">Ranking</div>
            </Link>

            {isTenantAdmin() && (
              <Link
                to="/invites"
                className="bg-slate-800 hover:bg-slate-700 p-6 rounded-lg text-center transition-colors"
              >
                <div className="text-3xl mb-2">👥</div>
                <div className="font-semibold">Convites</div>
              </Link>
            )}
          </div>

          {/* Sessões Recentes */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">📊 Sessões Recentes</h2>
              <Link to="/history" className="text-blue-400 hover:text-blue-300 text-sm">
                Ver todas →
              </Link>
            </div>

            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎲</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma sessão ainda
                </h3>
                <p className="text-slate-400 mb-6">
                  {isTenantAdmin() 
                    ? 'Crie sua primeira sessão para começar!'
                    : 'Aguarde o administrador criar a primeira sessão.'
                  }
                </p>
                {isTenantAdmin() && (
                  <Link
                    to="/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ➕ Primeira Sessão
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">🎲</div>
                      <div>
                        <div className="text-white font-medium">
                          Sessão {session.id}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {formatDate(session.date)} • {session.created_at ? formatDate(session.created_at) : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {session.players_data?.length || 0} jogadores
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}