import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { ChatInterface } from './ChatInterface';
import { ActionButtons } from './ActionButtons';
import { AgentStatus } from './AgentStatus';
import { useAgent } from '../../contexts/AgentContext';

export function PokerBot() {
  const [apiKey] = useState(import.meta.env.VITE_GROQ_API_KEY || 'API_KEY_PLACEHOLDER');
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'actions', 'status'
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: '🤖 Olá! Sou o PokerBot Agente! Agora posso executar ações além de responder perguntas. Experimente comandos como "Criar sessão hoje" ou use os botões de ação rápida!'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState([]);
  const messagesEndRef = useRef(null);
  const { agentStatus } = useAgent();

  // Carregar sessões quando o bot é inicializado
  useEffect(() => {
    loadSessions();
    console.log('🤖 PokerBot API Key:', apiKey ? 'Configurada' : 'Não configurada');
    console.log('🤖 API Key value:', apiKey === 'API_KEY_PLACEHOLDER' ? 'PLACEHOLDER' : 'REAL_KEY');
  }, []);

  // Scroll para a última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await api.getSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar sessões para o bot:', error);
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

    return Object.values(stats);
  };

  // Função para usar a API da Groq para perguntas complexas
  const askGroqAI = async (question, context) => {
    if (apiKey === 'API_KEY_PLACEHOLDER' || !apiKey) {
      return "🤖 IA avançada não configurada. Mas posso responder perguntas básicas sobre seus dados!";
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { 
              role: 'system', 
              content: `Você é o PokerBot, um assistente especializado em análise de dados de poker. 
              
              CONTEXTO DOS DADOS:
              ${context}
              
              IMPORTANTE:
              - Responda em português brasileiro
              - Seja direto e objetivo
              - Use emojis ocasionalmente
              - Analise os dados fornecidos
              - Se não tiver dados suficientes, diga isso claramente
              - Foque em insights úteis sobre o poker`
            },
            { 
              role: 'user', 
              content: question 
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "Erro ao processar resposta da IA";
    } catch (error) {
      console.error('Erro na API Groq:', error);
      return "🤖 Desculpe, não consegui processar sua pergunta com IA avançada no momento.";
    }
  };

  // Analisar pergunta e gerar resposta
  const analyzeQuestion = async (question) => {
    const playerStats = calculatePlayerStats();
    const questionLower = question.toLowerCase();

    // Perguntas sobre quem deve quem
    if (questionLower.includes('deve') || questionLower.includes('devendo')) {
      const debtors = playerStats.filter(p => p.totalProfit < 0).sort((a, b) => a.totalProfit - b.totalProfit);
      if (debtors.length === 0) {
        return "🎉 Ótima notícia! Ninguém está devendo no momento. Todos os jogadores estão com saldo positivo ou zerado!";
      }
      
      let response = "📊 **Quem está devendo:**\n\n";
      debtors.forEach((player, index) => {
        response += `${index + 1}. **${player.name}**: ${formatMoney(player.totalProfit)} (${player.participations} sessões)\n`;
      });
      return response;
    }

    // Perguntas sobre quem ganhou mais
    if (questionLower.includes('ganhou mais') || questionLower.includes('lucrou mais') || questionLower.includes('melhor')) {
      const winners = playerStats.filter(p => p.totalProfit > 0).sort((a, b) => b.totalProfit - a.totalProfit);
      if (winners.length === 0) {
        return "😅 Nenhum jogador está com lucro no momento. Todos estão devendo ou empatados!";
      }
      
      let response = "🏆 **Top jogadores com lucro:**\n\n";
      winners.slice(0, 5).forEach((player, index) => {
        response += `${index + 1}. **${player.name}**: ${formatMoney(player.totalProfit)} (${player.participations} sessões)\n`;
      });
      return response;
    }

    // Perguntas sobre quem deu mais buy-in
    if (questionLower.includes('buy-in') || questionLower.includes('investiu mais') || questionLower.includes('gastou mais')) {
      const sortedByBuyIn = playerStats.sort((a, b) => b.totalBuyIns - a.totalBuyIns);
      let response = "💰 **Maiores investidores:**\n\n";
      sortedByBuyIn.slice(0, 5).forEach((player, index) => {
        response += `${index + 1}. **${player.name}**: ${formatMoney(player.totalBuyIns)} (${player.participations} sessões)\n`;
      });
      return response;
    }

    // Perguntas sobre estatísticas gerais
    if (questionLower.includes('estatística') || questionLower.includes('resumo') || questionLower.includes('total')) {
      const totalSessions = sessions.length;
      const totalPlayers = playerStats.length;
      const totalProfit = playerStats.reduce((sum, p) => sum + p.totalProfit, 0);
      const biggestWinner = playerStats.reduce((max, p) => p.totalProfit > max.totalProfit ? p : max, { totalProfit: -Infinity });
      const biggestLoser = playerStats.reduce((min, p) => p.totalProfit < min.totalProfit ? p : min, { totalProfit: Infinity });

      let response = "📈 **Resumo Geral:**\n\n";
      response += `🎯 **Total de sessões**: ${totalSessions}\n`;
      response += `👥 **Jogadores únicos**: ${totalPlayers}\n`;
      response += `💰 **Saldo total**: ${formatMoney(totalProfit)}\n\n`;
      
      if (biggestWinner.totalProfit > 0) {
        response += `🏆 **Maior ganhador**: ${biggestWinner.name} (${formatMoney(biggestWinner.totalProfit)})\n`;
      }
      
      if (biggestLoser.totalProfit < 0) {
        response += `😅 **Maior perdedor**: ${biggestLoser.name} (${formatMoney(biggestLoser.totalProfit)})\n`;
      }

      return response;
    }

    // Perguntas sobre sessões recentes
    if (questionLower.includes('recente') || questionLower.includes('última') || questionLower.includes('último')) {
      const recentSessions = sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
      let response = "📅 **Sessões mais recentes:**\n\n";
      
      recentSessions.forEach((session, index) => {
        response += `${index + 1}. **${session.date}**\n`;
        if (session.players_data) {
          session.players_data.forEach(player => {
            const buyIns = (player.buyIns || []).reduce((sum, buyIn) => sum + buyIn, 0);
            const profit = (player.cashOut || 0) - buyIns;
            response += `   • ${player.name}: ${formatMoney(profit)}\n`;
          });
        }
        response += '\n';
      });
      
      return response;
    }

    // Perguntas sobre recomendações/transferências
    if (questionLower.includes('transferência') || questionLower.includes('recomendação') || questionLower.includes('pagar')) {
      const recentSession = sessions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      if (!recentSession || !recentSession.recommendations) {
        return "🤔 Não encontrei transferências pendentes na sessão mais recente. Verifique se há recomendações ou transferências otimizadas salvas.";
      }

      let response = "💸 **Transferências da última sessão:**\n\n";
      recentSession.recommendations.forEach((transfer, index) => {
        const status = transfer.paid ? '✅ Pago' : '⏳ Pendente';
        response += `${index + 1}. **${transfer.from}** → **${transfer.to}**: ${formatMoney(transfer.amount)} ${status}\n`;
      });
      
      return response;
    }

    // Perguntas sobre jantas
    if (questionLower.includes('janta') || questionLower.includes('comida')) {
      const jantaStats = {};
      sessions.forEach(session => {
        if (session.players_data) {
          session.players_data.forEach(player => {
            if (player.dinner?.amount > 0) {
              if (!jantaStats[player.name]) {
                jantaStats[player.name] = { total: 0, sessions: 0 };
              }
              jantaStats[player.name].total += player.dinner.amount;
              jantaStats[player.name].sessions += 1;
            }
          });
        }
      });

      if (Object.keys(jantaStats).length === 0) {
        return "🍽️ Nenhuma janta registrada nas sessões ainda!";
      }

      const sortedJanta = Object.entries(jantaStats)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 5);

      let response = "🍽️ **Maiores gastadores com janta:**\n\n";
      sortedJanta.forEach(([name, stats], index) => {
        response += `${index + 1}. **${name}**: ${formatMoney(stats.total)} (${stats.sessions} sessões)\n`;
      });

      return response;
    }

    // Para perguntas sobre ranking/liderança
    if (questionLower.includes('ranking') || questionLower.includes('lidera') || questionLower.includes('primeiro') || questionLower.includes('top')) {
      const topPlayers = playerStats
        .filter(p => p.totalProfit > 0)
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 5);
      
      if (topPlayers.length === 0) {
        return "😅 Nenhum jogador está com lucro no momento para formar um ranking!";
      }
      
      let response = "🏆 **Top 5 Ranking por Lucro:**\n\n";
      topPlayers.forEach((player, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅";
        response += `${medal} **${index + 1}. ${player.name}**: ${formatMoney(player.totalProfit)} (${player.participations} sessões)\n`;
      });
      return response;
    }

    // Para perguntas complexas, usar IA se disponível
    if (apiKey !== 'API_KEY_PLACEHOLDER' && apiKey) {
      const context = `
        DADOS DAS SESSÕES:
        - Total de sessões: ${sessions.length}
        - Jogadores: ${playerStats.map(p => `${p.name}: ${formatMoney(p.totalProfit)} (${p.participations} sessões)`).join(', ')}
        - Últimas sessões: ${sessions.slice(0, 3).map(s => `${s.date}: ${s.players_data?.map(p => `${p.name}: ${formatMoney((p.cashOut || 0) - (p.buyIns?.reduce((sum, buyIn) => sum + buyIn, 0) || 0))}`).join(', ')}`).join(' | ')}
      `;
      
      return await askGroqAI(question, context);
    }

    // Resposta padrão para perguntas não reconhecidas (sem IA)
    return "🤖 Desculpe, não entendi sua pergunta. Tente perguntar sobre:\n• Quem deve quem?\n• Quem ganhou mais?\n• Estatísticas gerais\n• Ranking de jogadores\n• Transferências pendentes";
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSendMessage = async (message, messageType = 'user') => {
    if (messageType === 'user') {
      // Adicionar mensagem do usuário
      setMessages(prev => [...prev, { type: 'user', content: message }]);
      setIsTyping(true);

      try {
        // Simular delay de digitação
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Analisar pergunta e gerar resposta
        const response = await analyzeQuestion(message);
        
        setIsTyping(false);
        setMessages(prev => [...prev, { type: 'ai', content: response }]);
      } catch (error) {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: '😅 Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente!' 
        }]);
      }
    } else {
      // Mensagem direta do agente (resultado de ação)
      setMessages(prev => [...prev, { type: messageType, content: message }]);
    }
  };

  const handleActionExecuted = (actionResult) => {
    setMessages(prev => [...prev, { 
      type: 'action', 
      content: actionResult.message 
    }]);
  };

  const toggleBot = () => {
    setIsVisible(!isVisible);
  };

  const tabs = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'actions', label: 'Ações', icon: '⚡' },
    { id: 'status', label: 'Status', icon: '📊' }
  ];

  return (
    <>
      {/* Botão do Bot com indicador de status */}
      <button
        onClick={toggleBot}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-50 flex items-center justify-center text-xl transition-all duration-300 ${isVisible ? 'rotate-45' : ''} relative`}
        title="PokerBot Agente - Assistente IA"
      >
        {isVisible ? '✕' : '🤖'}
        
        {/* Status indicator */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
          agentStatus === 'online' ? 'bg-green-400' :
          agentStatus === 'processing' ? 'bg-yellow-400 animate-pulse' :
          'bg-red-400'
        }`}></div>
      </button>

      {/* Agent Widget */}
      {isVisible && (
        <div className="fixed bottom-24 right-6 w-96 h-[32rem] bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-40 flex flex-col">
          {/* Tabs */}
          <div className="flex bg-slate-700 rounded-t-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 p-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
              />
            )}
            
            {activeTab === 'actions' && (
              <div className="p-4 h-full overflow-y-auto">
                <div className="mb-4">
                  <h3 className="text-white font-semibold mb-2">⚡ Ações Rápidas</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Execute ações diretamente no sistema
                  </p>
                </div>
                
                <ActionButtons onActionExecuted={handleActionExecuted} />
                
                <div className="mt-6">
                  <AgentStatus />
                </div>
              </div>
            )}
            
            {activeTab === 'status' && (
              <div className="p-4 h-full overflow-y-auto">
                <div className="mb-4">
                  <h3 className="text-white font-semibold mb-2">📊 Status do Agente</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Monitore o desempenho e histórico de ações
                  </p>
                </div>
                
                <AgentStatus />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
