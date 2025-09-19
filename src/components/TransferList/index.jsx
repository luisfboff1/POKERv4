import React, { useMemo } from 'react';
import { optimizeTransfers } from '../../utils/optimizeTransfers';

export function TransferList({ players, recommendations, onUpdateOptimization }) {
  // Calcular transferências otimizadas usando useMemo para melhor performance
  const transfers = useMemo(() => {
    // Filtrar apenas jogadores com saldo não zero
    const activePlayers = players.filter(player => {
      const totalBuyIn = player.buyIns.reduce((sum, buyIn) => sum + buyIn, 0);
      const balance = player.cashOut - totalBuyIn;
      return balance !== 0;
    });

    return optimizeTransfers(activePlayers, recommendations);
  }, [players, recommendations]);

  const totalTransfers = transfers.length;
  const totalVolume = transfers.reduce((sum, t) => sum + t.amount, 0);
  const recommendedCount = transfers.filter(t => t.recommended).length;
  const optimizedCount = transfers.filter(t => !t.recommended).length;

  if (players.length === 0) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Otimização de Transferências</h3>
        <div className="text-slate-400">Adicione jogadores para começar</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Otimização de Transferências</h3>
        {recommendations.length > 0 && (
          <button 
            onClick={onUpdateOptimization}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            title="Recalcular otimização considerando recomendações"
          >
            🔄 Atualizar
          </button>
        )}
      </div>

      {totalTransfers === 0 ? (
        <div className="text-slate-400">Nada a liquidar.</div>
      ) : (
        <>
          <div className="text-sm text-slate-400 mb-4">
            Sugestão com número mínimo de transferências (≤ N-1):
            {recommendedCount > 0 && (
              <div className="mt-1 text-xs text-emerald-500">
                📝 {recommendedCount} recomendação(ões) fixa(s) + {optimizedCount} transferência(s) otimizada(s)
              </div>
            )}
          </div>

          <div className="space-y-2">
            {transfers.map((transfer, index) => (
              <div
                key={index}
                className={`rounded-lg p-3 flex items-center justify-between ${
                  transfer.recommended 
                    ? 'bg-emerald-900/20 border border-emerald-800' 
                    : 'bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{transfer.from}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-medium">{transfer.to}</span>
                  <span className="text-slate-400">
                    R$ {transfer.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {transfer.recommended ? (
                    <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
                      📝 Fixo
                    </span>
                  ) : (
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">
                      🔄 Otimizado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-slate-400">
            {totalTransfers} transferência(s), volume total R$ {totalVolume.toFixed(2)}
          </div>
        </>
      )}
    </div>
  );
}