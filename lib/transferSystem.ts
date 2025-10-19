// Sistema de transferências simplificado e inteligente

interface Player {
  name: string;
  buyin: number;
  cashout: number;
  profit: number;
}

export interface Transfer {
  id: string;
  from: string;
  to: string;
  amount: number;
  isPaid: boolean;
  createdAt: string;
}

// Calcular transferências necessárias
export function calculateOptimalTransfers(players: Player[]): Transfer[] {
  // 1. Separar quem deve pagar e quem deve receber
  const creditors = players.filter(p => p.profit > 0).sort((a, b) => b.profit - a.profit);
  const debtors = players.filter(p => p.profit < 0).sort((a, b) => a.profit - b.profit);
  
  const transfers: Transfer[] = [];
  let transferId = 1;
  
  // 2. Fazer matching otimizado (menos transferências possível)
  const creditorsCopy = creditors.map(c => ({ ...c }));
  const debtorsCopy = debtors.map(d => ({ ...d, profit: Math.abs(d.profit) }));
  
  while (creditorsCopy.length > 0 && debtorsCopy.length > 0) {
    const creditor = creditorsCopy[0];
    const debtor = debtorsCopy[0];
    
    const transferAmount = Math.min(creditor.profit, debtor.profit);
    
    if (transferAmount > 0.01) { // Evitar transferências de centavos
      transfers.push({
        id: `transfer_${transferId++}`,
        from: debtor.name,
        to: creditor.name,
        amount: transferAmount,
        isPaid: false,
        createdAt: new Date().toISOString()
      });
    }
    
    // Atualizar saldos
    creditor.profit -= transferAmount;
    debtor.profit -= transferAmount;
    
    // Remover se zerou
    if (creditor.profit <= 0.01) {
      creditorsCopy.shift();
    }
    if (debtor.profit <= 0.01) {
      debtorsCopy.shift();
    }
  }
  
  return transfers;
}

// Verificar se sessão está completa (todos pagaram)
export function isSessionComplete(transfers: Transfer[]): boolean {
  return transfers.every(t => t.isPaid);
}

// Obter status da sessão baseado em pagamentos
export function getSessionStatus(transfers: Transfer[]): 'pending' | 'partial' | 'completed' {
  if (transfers.length === 0) return 'completed'; // Sem transferências necessárias
  
  const paidCount = transfers.filter(t => t.isPaid).length;
  const totalCount = transfers.length;
  
  if (paidCount === 0) return 'pending';
  if (paidCount === totalCount) return 'completed';
  return 'partial';
}

// Obter resumo de pagamentos
export function getPaymentSummary(transfers: Transfer[]) {
  const total = transfers.length;
  const paid = transfers.filter(t => t.isPaid).length;
  const pending = total - paid;
  const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);
  const paidAmount = transfers.filter(t => t.isPaid).reduce((sum, t) => sum + t.amount, 0);
  
  return {
    total,
    paid,
    pending,
    totalAmount,
    paidAmount,
    pendingAmount: totalAmount - paidAmount,
    completionPercentage: total > 0 ? (paid / total) * 100 : 100
  };
}