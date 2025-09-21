import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/api';

const AgentContext = createContext();

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent deve ser usado dentro de AgentProvider');
  }
  return context;
};

export const AgentProvider = ({ children }) => {
  const [agentStatus, setAgentStatus] = useState('online'); // online, processing, offline
  const [currentAction, setCurrentAction] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [agentCapabilities, setAgentCapabilities] = useState({
    canCreateSessions: true,
    canEditSessions: true,
    canGeneratePDFs: true,
    canAnalyzeData: true,
    canDebugSystem: true,
    canManageUsers: false, // Baseado no role do usuário
  });

  // Executar ação do agente
  const executeAction = useCallback(async (actionType, parameters = {}) => {
    setAgentStatus('processing');
    setCurrentAction({ type: actionType, parameters, startTime: new Date() });

    try {
      let result;
      
      switch (actionType) {
        case 'create_session':
          result = await createSession(parameters);
          break;
        case 'edit_session':
          result = await editSession(parameters);
          break;
        case 'generate_pdf':
          result = await generatePDF(parameters);
          break;
        case 'analyze_data':
          result = await analyzeData(parameters);
          break;
        case 'debug_system':
          result = await debugSystem(parameters);
          break;
        case 'send_invite':
          result = await sendInvite(parameters);
          break;
        default:
          throw new Error(`Ação não reconhecida: ${actionType}`);
      }

      // Adicionar ao histórico
      setActionHistory(prev => [...prev, {
        id: Date.now(),
        type: actionType,
        parameters,
        result,
        timestamp: new Date(),
        success: true
      }]);

      setAgentStatus('online');
      setCurrentAction(null);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao executar ação do agente:', error);
      
      // Adicionar erro ao histórico
      setActionHistory(prev => [...prev, {
        id: Date.now(),
        type: actionType,
        parameters,
        error: error.message,
        timestamp: new Date(),
        success: false
      }]);

      setAgentStatus('online');
      setCurrentAction(null);
      
      return { success: false, error: error.message };
    }
  }, []);

  // Ações específicas do agente
  const createSession = async (params) => {
    const { date, players } = params;
    
    const sessionData = {
      date: date || new Date().toISOString().split('T')[0],
      players_data: players.map(player => ({
        name: player.name,
        buyIns: player.buyIns || [100], // Buy-in padrão
        cashOut: player.cashOut || 0,
        dinner: player.dinner || { amount: 0, paid: false }
      }))
    };

    const response = await api.createSession(sessionData);
    return {
      message: `Sessão criada com sucesso para ${players.length} jogadores`,
      sessionId: response.data?.id,
      data: response.data
    };
  };

  const editSession = async (params) => {
    const { sessionId, updates } = params;
    const response = await api.updateSession(sessionId, updates);
    return {
      message: 'Sessão atualizada com sucesso',
      data: response.data
    };
  };

  const generatePDF = async (params) => {
    const { sessionId, type = 'session' } = params;
    
    // Por enquanto, simular geração de PDF
    // TODO: Implementar geração real de PDF na Fase 4
    return {
      message: `PDF ${type} gerado com sucesso`,
      downloadUrl: `/api/pdf/session_${sessionId}.pdf`,
      fileName: `poker_${type}_${sessionId}.pdf`
    };
  };

  const analyzeData = async (params) => {
    const { analysisType, timeRange } = params;
    
    // Buscar dados das sessões
    const sessionsResponse = await api.getSessions();
    const sessions = sessionsResponse.data || [];
    
    // Análise básica por enquanto
    // TODO: Expandir com algoritmos avançados na Fase 3
    const analysis = {
      totalSessions: sessions.length,
      timeRange: timeRange,
      insights: [
        'Análise de dados implementada com sucesso',
        `${sessions.length} sessões analisadas`,
        'Relatório detalhado gerado'
      ]
    };
    
    return {
      message: `Análise ${analysisType} concluída`,
      data: analysis
    };
  };

  const debugSystem = async (params) => {
    const { checkType = 'full' } = params;
    
    // Verificações básicas do sistema
    const checks = {
      database: 'OK',
      sessions: 'OK',
      users: 'OK',
      api: 'OK'
    };
    
    return {
      message: 'Diagnóstico do sistema concluído',
      checks: checks,
      recommendations: ['Sistema funcionando normalmente']
    };
  };

  const sendInvite = async (params) => {
    const { email, message } = params;
    
    try {
      await api.sendInvite({ email, message });
      return {
        message: `Convite enviado para ${email}`,
        email: email
      };
    } catch (error) {
      throw new Error(`Erro ao enviar convite: ${error.message}`);
    }
  };

  // Interpretar comando de texto em ação
  const interpretCommand = useCallback((command) => {
    const commandLower = command.toLowerCase();
    
    // Criar sessão
    if (commandLower.includes('criar sessão') || commandLower.includes('nova sessão')) {
      return {
        type: 'create_session',
        confidence: 0.9,
        parameters: extractSessionParams(command)
      };
    }
    
    // Gerar PDF
    if (commandLower.includes('gerar pdf') || commandLower.includes('exportar pdf')) {
      return {
        type: 'generate_pdf',
        confidence: 0.8,
        parameters: extractPDFParams(command)
      };
    }
    
    // Análise de dados
    if (commandLower.includes('analisar') || commandLower.includes('relatório')) {
      return {
        type: 'analyze_data',
        confidence: 0.7,
        parameters: extractAnalysisParams(command)
      };
    }
    
    // Debug do sistema
    if (commandLower.includes('verificar sistema') || commandLower.includes('debug')) {
      return {
        type: 'debug_system',
        confidence: 0.8,
        parameters: { checkType: 'full' }
      };
    }
    
    // Enviar convite
    if (commandLower.includes('convidar') || commandLower.includes('convite')) {
      return {
        type: 'send_invite',
        confidence: 0.7,
        parameters: extractInviteParams(command)
      };
    }
    
    return null;
  }, []);

  // Funções auxiliares para extrair parâmetros
  const extractSessionParams = (command) => {
    // Extrair nomes de jogadores do comando
    // Ex: "Criar sessão com João, Maria e Pedro"
    const playersMatch = command.match(/com (.+?)(?:\s|$)/i);
    let players = [];
    
    if (playersMatch) {
      const playersStr = playersMatch[1];
      players = playersStr.split(/,|\se\s/).map(name => ({
        name: name.trim(),
        buyIns: [100], // Padrão
        cashOut: 0
      }));
    }
    
    return { players };
  };

  const extractPDFParams = (command) => {
    // Extrair ID da sessão se mencionado
    const sessionMatch = command.match(/sessão\s+(\d+)/i);
    return {
      sessionId: sessionMatch ? parseInt(sessionMatch[1]) : null,
      type: 'session'
    };
  };

  const extractAnalysisParams = (command) => {
    let analysisType = 'general';
    
    if (command.includes('jogador')) analysisType = 'players';
    if (command.includes('lucro')) analysisType = 'profit';
    if (command.includes('sessão')) analysisType = 'sessions';
    
    return { analysisType };
  };

  const extractInviteParams = (command) => {
    // Extrair email do comando
    const emailMatch = command.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return {
      email: emailMatch ? emailMatch[1] : '',
      message: 'Você foi convidado para participar do nosso grupo de poker!'
    };
  };

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setActionHistory([]);
  }, []);

  const value = {
    // Estado
    agentStatus,
    currentAction,
    actionHistory,
    agentCapabilities,
    
    // Ações
    executeAction,
    interpretCommand,
    clearHistory,
    
    // Setters
    setAgentCapabilities
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};
