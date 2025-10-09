import { CreditCard, Utensils } from 'lucide-react';

interface PlayerPaymentRowPlayer {
  id?: number | string;
  name: string;
  buyin?: number;
  cashout?: number;
  janta_paid?: boolean;
}

interface PlayerPaymentRowProps {
  player: PlayerPaymentRowPlayer; // Tipado
  index: number;
  sessionId: number;
  editing: boolean;
  onToggle(field: 'janta_paid', value: boolean): void;
}

export function PlayerPaymentRow({ player, index, sessionId, editing, onToggle }: PlayerPaymentRowProps) {
  const net = (player.cashout || 0) - (player.buyin || 0);
  return (
  <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border shadow-sm">
      <div className="flex-1">
        <span className="font-medium">{player.name}</span>
        <div className="text-sm space-x-4 mt-1">
          <span>Buy-in: R$ {player.buyin}</span>
          <span>Cash-out: R$ {player.cashout}</span>
          <span className={`font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {net >= 0 ? '+' : ''}R$ {net}
          </span>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`janta_paid_${sessionId}_${index}`}
            checked={!!player.janta_paid}
            disabled={!editing}
            onChange={(e) => onToggle('janta_paid', e.target.checked)}
            className="w-4 h-4 text-green-600 rounded focus:ring-green-500 disabled:opacity-50"
          />
          <label htmlFor={`janta_paid_${sessionId}_${index}`} className="text-xs flex items-center gap-1">
            <Utensils className="h-3 w-3" />
            Janta
          </label>
        </div>
      </div>
    </div>
  );
}
