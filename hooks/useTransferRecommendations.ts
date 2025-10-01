import { useState } from 'react';
import type { LiveSession, TransferRecommendation } from '@/lib/types';

/**
 * Hook de cálculo de transferências.
 * Implementa a lógica descrita em OTIMIZACAO_TRANSFERENCIAS_COMPLETA.md:
 * 1. Calcula saldos líquidos (cashout - totalBuyin)
 * 2. Aplica recomendações manuais como restrições alterando os saldos conforme sinal
 * 3. Otimiza o restante minimizando número de transferências
 */
export function useTransferRecommendations(currentSession: LiveSession | null) {
  const [recommendations, setRecommendations] = useState<TransferRecommendation[]>([]); // Resultado final (manuais + otimizadas)
  const [manualSuggestions, setManualSuggestions] = useState<TransferRecommendation[]>([]); // Somente as manuais
  const [needsRecalc, setNeedsRecalc] = useState(false); // Flag para mostrar botão de atualizar

  const recompute = () => {
    if (!currentSession) return;
    // 1. Saldos iniciais
    const baseBalances = currentSession.players.map(p => ({
      name: p.name,
      net: Number((p.cashout || 0) - p.totalBuyin)
    }));

    // 2. Aplicar recomendações como restrições (ajustando sinais)
    manualSuggestions.forEach(rec => {
      const payer = baseBalances.find(b => b.name === rec.from);
      const receiver = baseBalances.find(b => b.name === rec.to);
      if (!payer || !receiver) return; // segurança
      const amount = rec.amount;
      // Pagador: se negativo, reduz dívida somando; se positivo, reduz crédito subtraindo
      if (payer.net < 0) {
        payer.net += amount;
      } else {
        payer.net -= amount;
      }
      // Recebedor: se positivo, reduz crédito; se negativo, reduz dívida somando
      if (receiver.net > 0) {
        receiver.net -= amount;
      } else {
        receiver.net += amount;
      }
    });

    // 3. Separar credores e devedores remanescentes
    const creditors = baseBalances.filter(b => b.net > 0.01).sort((a,b) => b.net - a.net); // opcional: ordenar
    const debtors = baseBalances.filter(b => b.net < -0.01).map(d => ({ ...d, net: Math.abs(d.net) })).sort((a,b) => b.net - a.net);

    const optimized: TransferRecommendation[] = [];
    // 4. Matching greedily minimizando quantidade
    while (creditors.length && debtors.length) {
      const c = creditors[0];
      const d = debtors[0];
      const amount = Math.min(c.net, d.net);
      if (amount > 0.01) {
        optimized.push({ from: d.name, to: c.name, amount: Math.round(amount * 100) / 100 });
        c.net -= amount;
        d.net -= amount;
      }
      if (c.net <= 0.01) creditors.shift();
      if (d.net <= 0.01) debtors.shift();
    }

    // 5. Resultado final = manuais (como estão) + otimizadas
    setRecommendations([...manualSuggestions, ...optimized]);
    setNeedsRecalc(false);
  };

  const addManualSuggestion = (suggestion: TransferRecommendation) => {
    setManualSuggestions(prev => [...prev, suggestion]);
    setNeedsRecalc(true); // exige clique manual agora
  };

  const removeManualSuggestion = (index: number) => {
    setManualSuggestions(prev => prev.filter((_, i) => i !== index));
    setNeedsRecalc(true);
  };

  return {
    recommendations,
    manualSuggestions,
    addManualSuggestion,
    removeManualSuggestion,
    setManualSuggestions,
    recompute,
    needsRecalc
  };
}
