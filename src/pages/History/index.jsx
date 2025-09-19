import React, { useState } from 'react';

export function History() {
  const [sessions] = useState([
    {
      id: 1,
      date: '2025-09-19',
      players: [
        { name: 'João', buyIn: 50, cashOut: 100 },
        { name: 'Maria', buyIn: 50, cashOut: 0 },
      ],
      dinner: {
        total: 60,
        paidBy: 'João',
        perPerson: 30,
      }
    }
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Histórico</h1>
        <p className="text-slate-400">Histórico de sessões e jantas</p>
      </div>

      <div className="space-y-4">
        {sessions.map(session => (
          <div key={session.id} className="bg-slate-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">
                  Sessão #{session.id}
                </h3>
                <p className="text-sm text-slate-400">
                  {new Date(session.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white">
                  Editar
                </button>
                <button className="text-sm px-3 py-1 rounded-md bg-red-600 text-white">
                  Excluir
                </button>
              </div>
            </div>

            {/* Detalhes do Poker */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Poker</h4>
              <div className="bg-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-600">
                    <tr>
                      <th className="px-4 py-2 text-left">Jogador</th>
                      <th className="px-4 py-2 text-right">Buy-in</th>
                      <th className="px-4 py-2 text-right">Cash-out</th>
                      <th className="px-4 py-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.players.map(player => (
                      <tr key={player.name} className="border-t border-slate-600">
                        <td className="px-4 py-2">{player.name}</td>
                        <td className="px-4 py-2 text-right">R$ {player.buyIn}</td>
                        <td className="px-4 py-2 text-right">R$ {player.cashOut}</td>
                        <td className={`px-4 py-2 text-right ${
                          player.cashOut - player.buyIn > 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          R$ {player.cashOut - player.buyIn}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detalhes da Janta */}
            {session.dinner && (
              <div>
                <h4 className="font-medium mb-2">Janta</h4>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Total</p>
                      <p className="font-medium">R$ {session.dinner.total}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Pago por</p>
                      <p className="font-medium">{session.dinner.paidBy}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Por pessoa</p>
                      <p className="font-medium">R$ {session.dinner.perPerson}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
