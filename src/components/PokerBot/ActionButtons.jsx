import React, { useState } from 'react';
import { useAgent } from '../../contexts/AgentContext';
import { useAuth } from '../../contexts/AuthContext';

export function ActionButtons({ onActionExecuted }) {
  const { executeAction, agentStatus } = useAgent();
  const { user, isTenantAdmin } = useAuth();
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleQuickAction = async (actionType, params = {}) => {
    const result = await executeAction(actionType, params);
    
    if (onActionExecuted) {
      onActionExecuted({
        type: actionType,
        result: result,
        message: result.success ? 
          `✅ ${result.data.message}` : 
          `❌ ${result.error}`
      });
    }
  };

  const quickActions = [
    {
      id: 'create_session',
      label: 'Nova Sessão',
      icon: '📊',
      description: 'Criar sessão de hoje',
      color: 'bg-green-600 hover:bg-green-700',
      enabled: isTenantAdmin(),
      action: () => handleQuickAction('create_session', {
        date: new Date().toISOString().split('T')[0],
        players: [
          { name: 'Jogador 1', buyIns: [100], cashOut: 0 },
          { name: 'Jogador 2', buyIns: [100], cashOut: 0 }
        ]
      })
    },
    {
      id: 'generate_report',
      label: 'Relatório',
      icon: '📈',
      description: 'Gerar relatório mensal',
      color: 'bg-blue-600 hover:bg-blue-700',
      enabled: true,
      action: () => handleQuickAction('analyze_data', {
        analysisType: 'monthly',
        timeRange: 'last_30_days'
      })
    },
    {
      id: 'generate_pdf',
      label: 'PDF',
      icon: '📄',
      description: 'Gerar PDF da última sessão',
      color: 'bg-purple-600 hover:bg-purple-700',
      enabled: true,
      action: () => handleQuickAction('generate_pdf', {
        type: 'session'
      })
    },
    {
      id: 'system_check',
      label: 'Debug',
      icon: '🔧',
      description: 'Verificar sistema',
      color: 'bg-orange-600 hover:bg-orange-700',
      enabled: isTenantAdmin(),
      action: () => handleQuickAction('debug_system', {
        checkType: 'full'
      })
    },
    {
      id: 'backup_data',
      label: 'Backup',
      icon: '💾',
      description: 'Fazer backup dos dados',
      color: 'bg-gray-600 hover:bg-gray-700',
      enabled: isTenantAdmin(),
      action: () => handleQuickAction('analyze_data', {
        analysisType: 'backup',
        includeExport: true
      })
    },
    {
      id: 'send_invite',
      label: 'Convidar',
      icon: '👥',
      description: 'Enviar convite',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      enabled: isTenantAdmin(),
      action: () => {
        const email = prompt('Digite o email para enviar o convite:');
        if (email) {
          handleQuickAction('send_invite', { email });
        }
      }
    }
  ];

  const enabledActions = quickActions.filter(action => action.enabled);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg text-sm transition-colors flex items-center gap-2"
        disabled={agentStatus === 'processing'}
        title="Ações Rápidas"
      >
        <span>⚡</span>
        <span className="hidden sm:inline">Ações</span>
        <span className={`transition-transform ${showQuickActions ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 min-w-64 z-50">
          <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>⚡</span>
            <span>Ações Rápidas</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {enabledActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                disabled={agentStatus === 'processing'}
                className={`${action.color} disabled:bg-slate-600 text-white p-3 rounded-lg text-sm transition-colors hover:scale-105 transform`}
                title={action.description}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-xs font-medium">{action.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Status Indicator */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${
                agentStatus === 'online' ? 'bg-green-400' : 
                agentStatus === 'processing' ? 'bg-yellow-400 animate-pulse' : 
                'bg-red-400'
              }`}></div>
              <span className="text-slate-400">
                Agente {agentStatus === 'processing' ? 'executando ação...' : 'pronto'}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowQuickActions(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
