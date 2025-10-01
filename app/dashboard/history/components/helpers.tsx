import { CheckCircle, Clock, XCircle } from 'lucide-react';

export function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'closed':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return null;
  }
}

export function getStatusText(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'approved':
      return 'Aprovada';
    case 'closed':
      return 'Fechada';
    default:
      return status;
  }
}

export interface PlayerDataLite {
  buyin?: number | null;
  cashout?: number | null;
}

export interface SessionTotals {
  totalBuyin: number;
  totalCashout: number;
  playerCount: number;
}

export function calculateSessionTotals(playersData: PlayerDataLite[] | unknown): SessionTotals {
  if (!Array.isArray(playersData)) return { totalBuyin: 0, totalCashout: 0, playerCount: 0 };
  const totalBuyin = playersData.reduce((sum: number, p) => sum + (typeof p.buyin === 'number' ? p.buyin : 0), 0);
  const totalCashout = playersData.reduce((sum: number, p) => sum + (typeof p.cashout === 'number' ? p.cashout : 0), 0);
  return { totalBuyin, totalCashout, playerCount: playersData.length };
}
