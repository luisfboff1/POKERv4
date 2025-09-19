import React from 'react';

export function TransferList({ players = [], recommendations = [] }) {
  if (!players || players.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Otimização de Transferências</h2>
        <p className="text-slate-400">
          Adicione jogadores para ver as recomendações de transferências
        </p>
      </div>
    );
  }

  // Calcular balanço de cada jogador
  const balances = players.map(player => {
    const buyIn = player.buyIns?.reduce((sum, value) => sum + value, 0) || 0;
    const cashOut = player.cashOut || 0;
    return {
      name: player.name,
      balance: cashOut - buyIn
    };
  });

  // Separar pagadores e recebedores
  const payers = balances.filter(b => b.balance < 0)
    .sort((a, b) => a.balance - b.balance);
  const receivers = balances.filter(b => b.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  // Formatar valor em reais
  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Otimização de Transferências</h2>
        
        {/* Balanços */}
        <div className="space-y-2">
          {balances.map((balance, index) => (
            <div 
              key={index}
              className={`flex justify-between items-center p-2 rounded ${
                balance.balance > 0 
                  ? 'bg-green-500/10 text-green-400'
                  : balance.balance < 0 
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-slate-700'
              }`}
            >
              <span>{balance.name}</span>
              <span>{formatMoney(balance.balance)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendações */}
      {(payers.length > 0 || receivers.length > 0) && (
        <div>
          <h3 className="font-medium mb-2">Recomendações</h3>
          <div className="space-y-2">
            {payers.map(payer => (
              receivers.map(receiver => {
                const amount = Math.min(Math.abs(payer.balance), receiver.balance);
                if (amount > 0) {
                  return (
                    <div 
                      key={`${payer.name}-${receiver.name}`}
                      className="bg-slate-700 p-2 rounded text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span>{payer.name} → {receiver.name}</span>
                        <span>{formatMoney(amount)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }).filter(Boolean)
            ))}
          </div>
        </div>
      )}
    </div>
  );
}