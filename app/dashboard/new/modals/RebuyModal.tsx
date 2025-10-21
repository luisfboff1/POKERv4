import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface RebuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onConfirm: (amount: number) => void;
  defaultBuyin?: number;
  initialAmount?: number;
}

export const RebuyModal: React.FC<RebuyModalProps> = ({
  isOpen,
  onClose,
  playerName,
  onConfirm,
  defaultBuyin = 50
  , initialAmount
}) => {
  const [amount, setAmount] = useState(defaultBuyin.toString());
  const [error, setError] = useState('');

  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount((initialAmount !== undefined ? initialAmount : defaultBuyin).toString());
      setError('');
    }
  }, [isOpen, defaultBuyin, initialAmount]);

  const handleSubmit = () => {
    const numAmount = Number(amount);

    if (!amount || isNaN(numAmount)) {
      setError('Digite um valor válido');
      return;
    }

    if (numAmount <= 0) {
      setError('O valor deve ser maior que zero');
      return;
    }

    onConfirm(numAmount);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Rebuy"
      size="sm"
    >
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Adicionar rebuy para <span className="font-medium text-foreground">{playerName}</span>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/50 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="rebuy-amount">Valor do Rebuy (R$)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="rebuy-amount"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="50"
              min="1"
              step="10"
              className="pl-10"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Valor padrão: R$ {defaultBuyin.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            <DollarSign className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
