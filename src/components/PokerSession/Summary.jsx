import React from 'react';

export function Summary({ players, getPlayerBalance, onSave }) {
  // Separar jogadores que recebem e que pagam
  const receiving = players.filter(p => getPlayerBalance(p) > 0);
  const paying = players.filter(p => getPlayerBalance(p) < 0);
  
  // Calcular transferências otimizadas
  const calculateTransfers = () => {
    const transfers = [];
    
    // Clonar arrays para não modificar os originais
    const payers = [...paying].map(p => ({
      ...p,
      remainingToPay: Math.abs(getPlayerBalance(p))
    }));
    
    const receivers = [...receiving].map(p => ({
      ...p,
      remainingToReceive: getPlayerBalance(p)
    }));
    
    // Enquanto houver pagamentos pendentes
    while (payers.length > 0 && receivers.length > 0) {
      const payer = payers[0];
      const receiver = receivers[0];
      
      // Encontrar o menor valor entre o que precisa pagar e o que precisa receber
      const amount = Math.min(payer.remainingToPay, receiver.remainingToReceive);
      
      // Registrar a transferência
      transfers.push({
        from: payer.name,
        to: receiver.name,
        amount
      });
      
      // Atualizar valores restantes
      payer.remainingToPay -= amount;
      receiver.remainingToReceive -= amount;
      
      // Remover jogadores que já quitaram seus valores
      if (payer.remainingToPay === 0) payers.shift();
      if (receiver.remainingToReceive === 0) receivers.shift();
    }
    
    return transfers;
  };
  
  const transfers = calculateTransfers();
  
  return (
    <div className="space-y-6">
      {/* Resumo de Saldos */}
      <div className="grid grid-cols-2 gap-4">
        {/* Quem Recebe */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-green-600 mb-3">
            Recebem
          </h3>
          <div className="space-y-2">
            {receiving.map(player => (
              <div key={player.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span>{player.name}</span>
                <span className="font-medium">
                  R$ {getPlayerBalance(player)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quem Paga */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-red-600 mb-3">
            Pagam
          </h3>
          <div className="space-y-2">
            {paying.map(player => (
              <div key={player.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                <div>
                  <div>{player.name}</div>
                  {!player.dinnerPaid && player.dinnerAmount > 0 && (
                    <div className="text-sm text-gray-500">
                      Inclui janta: R$ {player.dinnerAmount}
                    </div>
                  )}
                </div>
                <span className="font-medium">
                  R$ {Math.abs(getPlayerBalance(player))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transferências Sugeridas */}
      {transfers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-3">
            Transferências Sugeridas
          </h3>
          <div className="space-y-2">
            {transfers.map((transfer, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-600">{transfer.from}</span>
                  <span>→</span>
                  <span className="font-medium text-green-600">{transfer.to}</span>
                </div>
                <span className="font-medium">
                  R$ {transfer.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Salvar Sessão
        </button>
      </div>
    </div>
  );
}
