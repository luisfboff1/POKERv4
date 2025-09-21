import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

export function PokerBot() {
  const [apiKey] = useState(import.meta.env.VITE_GROQ_API_KEY || 'API_KEY_PLACEHOLDER');
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: '🤖 Olá! Sou o PokerBot! Posso te ajudar com informações sobre suas sessões de poker. Pergunte-me sobre estatísticas, quem deve quem, rankings e muito mais!'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState([]);
  const messagesEndRef = useRef(null);

  // Carregar sessões quando o bot é inicializado
  useEffect(() => {
    loadSessions();
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
    if (apiKey === 'API_KEY_PLACEHOLDER') {
      return "🤖 Funcionalidade de IA avançada não configurada. Use as perguntas sugeridas!";
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

    // Para perguntas complexas, usar IA
    const context = `
      DADOS DAS SESSÕES:
      - Total de sessões: ${sessions.length}
      - Jogadores: ${playerStats.map(p => `${p.name}: ${formatMoney(p.totalProfit)} (${p.participations} sessões)`).join(', ')}
      - Últimas sessões: ${sessions.slice(0, 3).map(s => `${s.date}: ${s.players_data?.map(p => `${p.name}: ${formatMoney((p.cashOut || 0) - (p.buyIns?.reduce((sum, buyIn) => sum + buyIn, 0) || 0))}`).join(', ')}`).join(' | ')}
    `;
    
    return await askGroqAI(question, context);
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Simular delay de digitação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Analisar pergunta e gerar resposta
      const response = await analyzeQuestion(userMessage);
      
      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'ai', content: response }]);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: '😅 Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente!' 
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleBot = () => {
    setIsVisible(!isVisible);
  };

  const suggestedQuestions = [
    "Quem deve?",
    "Quem ganhou?",
    "Estatísticas",
    "Transferências"
  ];

  return (
    <>
      {/* Botão do Bot */}
      <button
        onClick={toggleBot}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-50 flex items-center justify-center text-xl transition-all duration-300 ${isVisible ? 'rotate-45' : ''}`}
        title="PokerBot - Assistente IA"
      >
        {isVisible ? '✕' : '🤖'}
      </button>

      {/* Chat Widget */}
      {isVisible && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-40 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold">PokerBot</span>
            </div>
            <span className="text-xs bg-blue-500 px-2 py-1 rounded">Online</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-200 p-2 rounded-lg text-sm">
                  <div className="flex items-center gap-1">
                    <span>🤖</span>
                    <span>PokerBot está digitando</span>
                    <span className="animate-pulse">⋯</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions - Compactas */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1 p-2 bg-slate-700 border-t border-slate-600">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-slate-300 hover:text-white transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pergunte sobre suas sessões..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
