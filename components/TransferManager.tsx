import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  calculateOptimalTransfers, 
  getSessionStatus, 
  getPaymentSummary,
  type Transfer 
} from '@/lib/transferSystem';

interface Player {
  name: string;
  buyin: number;
  cashout: number;
  profit: number;
}

interface TransferManagerProps {
  players: Player[];
  onTransferUpdate?: (transfers: Transfer[]) => void;
  onStatusChange?: (status: 'pending' | 'partial' | 'completed') => void;
}

const TransferManager: React.FC<TransferManagerProps> = ({
  players,
  onTransferUpdate,
  onStatusChange
}) => {
  const [transfers, setTransfers] = useState<Transfer[]>(() => 
    calculateOptimalTransfers(players)
  );

  const summary = getPaymentSummary(transfers);
  const status = getSessionStatus(transfers);

  const handleTransferToggle = (transferId: string, isPaid: boolean) => {
    const updatedTransfers = transfers.map(t => 
      t.id === transferId ? { ...t, isPaid } : t
    );
    
    setTransfers(updatedTransfers);
    onTransferUpdate?.(updatedTransfers);
    onStatusChange?.(getSessionStatus(updatedTransfers));
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'partial': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'partial': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed': return 'Todos os pagamentos concluídos';
      case 'partial': return 'Pagamentos parciais';
      default: return 'Aguardando pagamentos';
    }
  };

  if (transfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Transferências</CardTitle>
          </div>
          <CardDescription>Sessão balanceada - sem transferências necessárias</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Resumo de Transferências</CardTitle>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.paid}</div>
              <div className="text-sm text-gray-500">Pagos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.pending}</div>
              <div className="text-sm text-gray-500">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.paidAmount)}</div>
              <div className="text-sm text-gray-500">Valor Pago</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{formatCurrency(summary.totalAmount)}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso dos pagamentos</span>
              <span>{summary.completionPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${summary.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transferências */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transferências Necessárias</CardTitle>
          <CardDescription>
            Marque como pago quando a transferência for concluída
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transfers.map((transfer) => (
            <div
              key={transfer.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                transfer.isPaid
                  ? 'bg-green-50 border-green-200 opacity-75'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={transfer.isPaid}
                  onChange={(e) => 
                    handleTransferToggle(transfer.id, e.target.checked)
                  }
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                
                <div className="flex items-center space-x-3">
                  <div className="font-medium text-gray-900">
                    {transfer.from}
                  </div>
                  <ArrowRight className={`w-4 h-4 ${
                    transfer.isPaid ? 'text-green-600' : 'text-blue-600'
                  }`} />
                  <div className="font-medium text-gray-900">
                    {transfer.to}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  transfer.isPaid ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {formatCurrency(transfer.amount)}
                </div>
                {transfer.isPaid && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Pago
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ações */}
      {summary.pending > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {summary.pending} transferência(s) pendente(s)
                </div>
                <div className="text-sm text-gray-500">
                  Valor pendente: {formatCurrency(summary.pendingAmount)}
                </div>
              </div>
              <Button
                onClick={() => {
                  // Marcar todas como pagas
                  const allPaid = transfers.map(t => ({ ...t, isPaid: true }));
                  setTransfers(allPaid);
                  onTransferUpdate?.(allPaid);
                  onStatusChange?.(getSessionStatus(allPaid));
                }}
                variant="outline"
                size="sm"
              >
                Marcar Todas como Pagas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransferManager;