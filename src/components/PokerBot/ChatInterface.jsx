import React, { useState, useRef, useEffect } from 'react';
import { useAgent } from '../../contexts/AgentContext';

export function ChatInterface({ messages, onSendMessage, isTyping }) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { agentStatus, currentAction, interpretCommand, executeAction } = useAgent();

  // Scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage('');
    
    // Enviar mensagem para o chat
    onSendMessage(message);
    
    // Verificar se é um comando de ação
    const command = interpretCommand(message);
    
    if (command && command.confidence > 0.6) {
      // Executar ação do agente
      const result = await executeAction(command.type, command.parameters);
      
      // Enviar resultado como mensagem do bot
      if (result.success) {
        onSendMessage(`✅ ${result.data.message}`, 'ai');
      } else {
        onSendMessage(`❌ Erro: ${result.error}`, 'ai');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedActions = [
    { text: "Criar sessão hoje", action: () => setInputMessage("Criar sessão de hoje") },
    { text: "Gerar PDF", action: () => setInputMessage("Gerar PDF da última sessão") },
    { text: "Analisar dados", action: () => setInputMessage("Analisar performance dos jogadores") },
    { text: "Verificar sistema", action: () => setInputMessage("Verificar sistema") }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header com status do agente */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold">PokerBot Agente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            agentStatus === 'online' ? 'bg-green-400' : 
            agentStatus === 'processing' ? 'bg-yellow-400 animate-pulse' : 
            'bg-red-400'
          }`}></div>
          <span className="text-xs bg-blue-500 px-2 py-1 rounded capitalize">
            {agentStatus === 'processing' ? 'Executando...' : 
             agentStatus === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Ação atual sendo executada */}
      {currentAction && (
        <div className="bg-yellow-900/50 border-b border-yellow-500 p-2 text-yellow-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full"></div>
            <span>Executando: {currentAction.type.replace('_', ' ')}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-800">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'action'
                  ? 'bg-green-700 text-green-100 border border-green-600'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              {message.type === 'action' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">⚡</span>
                  <span className="text-xs font-semibold text-green-300">AÇÃO EXECUTADA</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-200 p-3 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span>🤖</span>
                <span>PokerBot está processando</span>
                <span className="animate-pulse">⋯</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Ações Sugeridas */}
      <div className="bg-slate-700 border-t border-slate-600 p-2">
        <div className="text-xs text-slate-400 mb-2">💡 Ações Rápidas:</div>
        <div className="grid grid-cols-2 gap-1">
          {suggestedActions.map((suggestion, index) => (
            <button
              key={index}
              onClick={suggestion.action}
              className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-slate-300 hover:text-white transition-colors text-left"
              disabled={agentStatus === 'processing'}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700 bg-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite um comando ou pergunta..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            disabled={agentStatus === 'processing'}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || agentStatus === 'processing'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-1"
          >
            {agentStatus === 'processing' ? (
              <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
            ) : (
              '→'
            )}
          </button>
        </div>
        
        {/* Dica de comando */}
        <div className="text-xs text-slate-400 mt-1">
          💡 Experimente: "Criar sessão hoje", "Gerar PDF", "Analisar dados"
        </div>
      </div>
    </div>
  );
}
