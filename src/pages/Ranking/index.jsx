import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function Ranking() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);

  // Carregar sessões
  const loadSessions = async () => {
    try {
      const response = await api.getSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas dos jogadores
  const calculatePlayerStats = () => {
    const stats = {};

    sessions.forEach(session => {
      if (session.players_data && Array.isArray(session.players_data)) {
        session.players_data.forEach(player => {
          if (player.name) {
            if (!stats[player.name]) {
              stats[player.name] = {
                name: player.name,
                participations: 0,
                totalBuyIns: 0,
                totalCashOut: 0,
                totalProfit: 0,
                totalDinner: 0,
                sessions: []
              };
            }

            const buyIns = (player.buyIns || []).reduce((sum, buyIn) => sum + buyIn, 0);
            const cashOut = player.cashOut || 0;
            const dinner = player.dinner?.amount || 0;
            const profit = cashOut - buyIns;

            stats[player.name].participations += 1;
            stats[player.name].totalBuyIns += buyIns;
            stats[player.name].totalCashOut += cashOut;
            stats[player.name].totalProfit += profit;
            stats[player.name].totalDinner += dinner;
            stats[player.name].sessions.push({
              date: session.date,
              profit: profit,
              dinner: dinner
            });
          }
        });
      }
    });

    // Converter para array e calcular médias
    const playersArray = Object.values(stats).map(player => ({
      ...player,
      averageProfit: player.totalProfit / player.participations,
      winRate: player.sessions.filter(s => s.profit > 0).length / player.participations * 100
    }));

    // Ordenar por lucro total (maior para menor)
    const sortedPlayers = playersArray.sort((a, b) => b.totalProfit - a.totalProfit);
    
    setPlayerStats(sortedPlayers);
    setTopPlayers(sortedPlayers.slice(0, 10));
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      calculatePlayerStats();
    }
  }, [sessions]);

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Carregando ranking...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">🏆 Ranking dos Jogadores</h1>
        <p className="text-slate-400">Estatísticas completas de todas as sessões</p>
      </div>

      {/* Top 10 Players Chart */}
      {topPlayers.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-center">🥇 Top 10 Jogadores</h2>
          
          {/* Gráfico de Barras Horizontal */}
          <div className="space-y-3">
            {topPlayers.map((player, index) => {
              const maxProfit = Math.max(...topPlayers.map(p => Math.abs(p.totalProfit)));
              const barWidth = (Math.abs(player.totalProfit) / maxProfit) * 100;
              const isPositive = player.totalProfit >= 0;
              
              return (
                <div key={player.name} className="flex items-center gap-4">
                  <div className="w-8 text-center font-bold">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}º`}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-white">{player.name}</span>
                      <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {formatMoney(player.totalProfit)}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <div className="w-full bg-slate-700 rounded-full h-6">
                        <div
                          className={`h-6 rounded-full transition-all duration-500 ${
                            isPositive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        >
                          <div className="flex items-center justify-center h-full text-white text-xs font-medium">
                            {player.participations} sessões
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estatísticas Detalhadas */}
      {playerStats.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📊 Estatísticas Completas</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-2">Jogador</th>
                  <th className="text-center py-3 px-2">Sessões</th>
                  <th className="text-right py-3 px-2">Lucro Total</th>
                  <th className="text-right py-3 px-2">Lucro Médio</th>
                  <th className="text-center py-3 px-2">Taxa Vitória</th>
                  <th className="text-right py-3 px-2">Investido</th>
                  <th className="text-right py-3 px-2">Recebido</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.map((player, index) => (
                  <tr key={player.name} className={`border-b border-slate-700 hover:bg-slate-700/50 ${index < 3 ? 'bg-slate-700/30' : ''}`}>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{player.name}</span>
                        {index === 0 && <span className="text-yellow-400">👑</span>}
                        {index === 1 && <span className="text-gray-400">🥈</span>}
                        {index === 2 && <span className="text-amber-600">🥉</span>}
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 text-slate-300">
                      {player.participations}
                    </td>
                    <td className={`text-right py-3 px-2 font-bold ${
                      player.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatMoney(player.totalProfit)}
                    </td>
                    <td className={`text-right py-3 px-2 ${
                      player.averageProfit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatMoney(player.averageProfit)}
                    </td>
                    <td className="text-center py-3 px-2 text-slate-300">
                      {formatPercentage(player.winRate)}
                    </td>
                    <td className="text-right py-3 px-2 text-slate-300">
                      {formatMoney(player.totalBuyIns)}
                    </td>
                    <td className="text-right py-3 px-2 text-slate-300">
                      {formatMoney(player.totalCashOut)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumo Geral */}
      {playerStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <div className="text-slate-400 text-sm">Total de Sessões</div>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">{playerStats.length}</div>
            <div className="text-slate-400 text-sm">Jogadores Únicos</div>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatMoney(playerStats.reduce((sum, p) => sum + Math.max(0, p.totalProfit), 0))}
            </div>
            <div className="text-slate-400 text-sm">Lucro Total (Ganhadores)</div>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">
              {formatMoney(playerStats.reduce((sum, p) => sum + Math.min(0, p.totalProfit), 0))}
            </div>
            <div className="text-slate-400 text-sm">Perda Total (Perdedores)</div>
          </div>
        </div>
      )}

      {playerStats.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 text-lg">Nenhuma sessão encontrada</div>
          <div className="text-slate-500 text-sm mt-2">Crie sua primeira sessão para ver o ranking</div>
        </div>
      )}
    </div>
  );
}
