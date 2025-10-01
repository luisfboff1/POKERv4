import { useState } from 'react';
import type { LiveSession, TransferRecommendation } from '@/lib/types';

export function useTransferRecommendations(currentSession: LiveSession | null) {
  const [recommendations, setRecommendations] = useState<TransferRecommendation[]>([]);
  const [manualSuggestions, setManualSuggestions] = useState<TransferRecommendation[]>([]);

  const calculateRecommendations = () => {
    if (!currentSession) return;
    const playersWithBalance = currentSession.players.map((p: any) => ({
      name: p.name,
      balance: p.cashout - p.totalBuyin
    }));
    const balancesCopy = [...playersWithBalance];
    manualSuggestions.forEach(suggestion => {
      const fromPlayer = balancesCopy.find(p => p.name === suggestion.from);
      const toPlayer = balancesCopy.find(p => p.name === suggestion.to);
      if (fromPlayer && toPlayer) {
        fromPlayer.balance += suggestion.amount;
        toPlayer.balance -= suggestion.amount;
      }
    });
    const creditors = balancesCopy.filter(p => p.balance > 0.01);
    const debtors = balancesCopy.filter(p => p.balance < -0.01);
    const newRecommendations: TransferRecommendation[] = [...manualSuggestions];
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, -debtor.balance);
      if (amount > 0.01) {
        newRecommendations.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount * 100) / 100
        });
        creditor.balance -= amount;
        debtor.balance += amount;
      }
      if (creditor.balance <= 0.01) i++;
      if (debtor.balance >= -0.01) j++;
    }
    setRecommendations(newRecommendations);
  };

  const addManualSuggestion = (suggestion: TransferRecommendation) => {
    setManualSuggestions([...manualSuggestions, suggestion]);
    setTimeout(() => calculateRecommendations(), 100);
  };

  const removeManualSuggestion = (index: number) => {
    const newSuggestions = manualSuggestions.filter((_, i) => i !== index);
    setManualSuggestions(newSuggestions);
    setTimeout(() => calculateRecommendations(), 100);
  };

  return {
    recommendations,
    manualSuggestions,
    calculateRecommendations,
    addManualSuggestion,
    removeManualSuggestion,
    setManualSuggestions
  };
}
