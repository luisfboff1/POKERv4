import React, { useState, useEffect } from 'react';
import { useAgent } from '../../contexts/AgentContext';
import { api } from '../../services/api';

export function DataAnalyzer({ onComplete, onCancel }) {
  const [analysisType, setAnalysisType] = useState('performance');
  const [timeRange, setTimeRange] = useState('last_30_days');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const { executeAction } = useAgent();

  const analysisTypes = [
    { 
      id: 'performance', 
      name: 'Performance dos Jogadores', 
      icon: '📈',
      description: 'Análise detalhada de lucros, perdas e tendências'
    },
    { 
      id: 'patterns', 
      name: 'Padrões de Jogo', 
      icon: '🔍',
      description: 'Identificar comportamentos e estratégias'
    },
    { 
      id: 'financial', 
      name: 'Relatório Financeiro', 
      icon: '💰',
      description: 'Movimentação financeira e balanços'
    },
    { 
      id: 'social', 
      name: 'Análise Social', 
      icon: '👥',
      description: 'Frequência, grupos e interações'
    }
  ];

  const timeRanges = [
    { id: 'last_7_days', name: 'Últimos 7 dias' },
    { id: 'last_30_days', name: 'Últimos 30 dias' },
    { id: 'last_90_days', name: 'Últimos 90 dias' },
    { id: 'this_year', name: 'Este ano' },
    { id: 'all_time', name: 'Todo o período' }
  ];

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await executeAction('analyze_data', {
        analysisType,
        timeRange,
        includeAdvanced: true
      });
      
      if (result.success) {
        setResults(result.data);
      }
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 max-w-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">📊 Análise Inteligente</h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {!results ? (
        <>
          {/* Tipo de Análise */}
          <div className="mb-4">
            <h4 className="text-slate-300 mb-3">Tipo de Análise:</h4>
            <div className="grid grid-cols-1 gap-2">
              {analysisTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAnalysisType(type.id)}
                  className={`p-3 rounded text-left transition-colors ${
                    analysisType === type.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs opacity-75">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Período */}
          <div className="mb-4">
            <h4 className="text-slate-300 mb-3">Período:</h4>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              {timeRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.name}
                </option>
              ))}
            </select>
          </div>

          {/* Executar */}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-3 rounded font-medium"
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
                Analisando dados...
              </div>
            ) : (
              '🚀 Iniciar Análise'
            )}
          </button>
        </>
      ) : (
        <>
          {/* Resultados */}
          <div className="mb-4">
            <h4 className="text-white mb-3">📊 Resultados da Análise</h4>
            
            {/* Resumo */}
            <div className="bg-slate-700 p-3 rounded mb-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {results.summary?.total_sessions || 0}
                  </div>
                  <div className="text-xs text-slate-400">Sessões</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {results.summary?.unique_players || 0}
                  </div>
                  <div className="text-xs text-slate-400">Jogadores</div>
                </div>
              </div>
            </div>

            {/* Top Player */}
            {results.summary?.top_player && (
              <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 p-3 rounded mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-yellow-200 font-semibold">
                      Melhor Performance
                    </div>
                    <div className="text-yellow-100">
                      {results.summary.top_player}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estatísticas dos Jogadores */}
            {results.player_stats && Object.keys(results.player_stats).length > 0 && (
              <div className="mb-4">
                <h5 className="text-slate-300 mb-2">📈 Performance por Jogador:</h5>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {Object.entries(results.player_stats)
                    .sort(([,a], [,b]) => b.profit - a.profit)
                    .slice(0, 10)
                    .map(([name, stats]) => (
                      <div key={name} className="bg-slate-700 p-2 rounded flex justify-between items-center">
                        <div>
                          <div className="text-white text-sm font-medium">{name}</div>
                          <div className="text-xs text-slate-400">
                            {stats.sessions} sessões
                          </div>
                        </div>
                        <div className={`text-sm font-bold ${
                          stats.profit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(stats.profit)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Insights IA */}
            <div className="bg-blue-900/30 border border-blue-600/50 p-3 rounded mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400">🤖</span>
                <span className="text-blue-200 font-medium">Insights IA</span>
              </div>
              <div className="text-blue-100 text-sm space-y-1">
                <div>• Análise baseada em {results.summary?.total_sessions || 0} sessões</div>
                <div>• {results.summary?.unique_players || 0} jogadores únicos identificados</div>
                <div>• Padrões de performance detectados</div>
                <div>• Recomendações de otimização disponíveis</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <button
              onClick={() => setResults(null)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded"
            >
              ← Nova Análise
            </button>
            <button
              onClick={() => onComplete(results)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              📄 Gerar Relatório
            </button>
          </div>
        </>
      )}
    </div>
  );
}
