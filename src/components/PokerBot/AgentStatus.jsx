import React, { useState } from 'react';
import { useAgent } from '../../contexts/AgentContext';

export function AgentStatus() {
  const { agentStatus, currentAction, actionHistory, clearHistory } = useAgent();
  const [showHistory, setShowHistory] = useState(false);

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'online': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'online': return '🟢';
      case 'processing': return '🟡';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  const formatActionType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      {/* Status Principal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className={`font-semibold ${getStatusColor()}`}>
            {agentStatus === 'online' ? 'Agente Online' :
             agentStatus === 'processing' ? 'Executando Ação' :
             'Agente Offline'}
          </span>
        </div>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-slate-700"
        >
          📋 Histórico
        </button>
      </div>

      {/* Ação Atual */}
      {currentAction && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded p-2 mb-3">
          <div className="flex items-center gap-2 text-yellow-200">
            <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">
              {formatActionType(currentAction.type)}
            </span>
          </div>
          <div className="text-xs text-yellow-300 mt-1">
            Iniciado às {formatTimestamp(currentAction.startTime)}
          </div>
        </div>
      )}

      {/* Histórico de Ações */}
      {showHistory && (
        <div className="border-t border-slate-700 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">Histórico de Ações</h4>
            {actionHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-700"
              >
                🗑️ Limpar
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {actionHistory.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-4">
                Nenhuma ação executada ainda
              </div>
            ) : (
              actionHistory.slice(-10).reverse().map((action) => (
                <div
                  key={action.id}
                  className={`p-2 rounded text-xs border ${
                    action.success
                      ? 'bg-green-900/30 border-green-600/50 text-green-200'
                      : 'bg-red-900/30 border-red-600/50 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {action.success ? '✅' : '❌'} {formatActionType(action.type)}
                    </span>
                    <span className="text-slate-400">
                      {formatTimestamp(action.timestamp)}
                    </span>
                  </div>
                  
                  {action.success && action.result?.message && (
                    <div className="mt-1 text-slate-300">
                      {action.result.message}
                    </div>
                  )}
                  
                  {!action.success && action.error && (
                    <div className="mt-1 text-red-300">
                      Erro: {action.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Estatísticas Rápidas */}
      {actionHistory.length > 0 && (
        <div className="border-t border-slate-700 pt-3 mt-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-white">
                {actionHistory.length}
              </div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">
                {actionHistory.filter(a => a.success).length}
              </div>
              <div className="text-xs text-slate-400">Sucesso</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400">
                {actionHistory.filter(a => !a.success).length}
              </div>
              <div className="text-xs text-slate-400">Erros</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
