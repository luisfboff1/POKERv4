import React from 'react';

export function PlayerRow({ 
  player, 
  onAddBuyIn, 
  onUpdateCashOut, 
  onToggleDinnerPaid,
  onRemove,
  balance 
}) {
  return (
    <tr className="border-t">
      <td className="px-4 py-2">
        {player.name}
      </td>
      
      {/* Buy-ins */}
      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-2">
          <span className="text-gray-500">
            {player.buyIns.join(' + ')} =
          </span>
          <span className="font-medium">
            R$ {player.buyIn}
          </span>
          <button
            onClick={() => onAddBuyIn(player.id, 50)}
            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            +50
          </button>
        </div>
      </td>
      
      {/* Cash Out */}
      <td className="px-4 py-2">
        <input
          type="number"
          value={player.cashOut}
          onChange={e => onUpdateCashOut(player.id, Number(e.target.value))}
          className="w-24 p-1 text-right border rounded"
        />
      </td>
      
      {/* Janta */}
      <td className="px-4 py-2 text-right">
        R$ {player.dinnerAmount}
      </td>
      
      {/* Pagou Janta */}
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={player.dinnerPaid}
          onChange={() => onToggleDinnerPaid(player.id)}
          className="w-4 h-4"
        />
      </td>
      
      {/* Saldo */}
      <td className={`px-4 py-2 text-right font-medium ${
        balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : ''
      }`}>
        {balance > 0 ? '+' : ''}{balance}
      </td>
      
      {/* Ações */}
      <td className="px-4 py-2">
        <button
          onClick={() => onRemove(player.id)}
          className="text-red-600 hover:text-red-800"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
