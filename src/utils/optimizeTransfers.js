/**
 * Otimiza transferências entre jogadores, considerando recomendações como restrições
 * @param {Array} players - Lista de jogadores com seus saldos
 * @param {Array} recommendations - Lista de recomendações de pagamento
 * @returns {Array} Lista de transferências otimizadas
 */
export function optimizeTransfers(players, recommendations = []) {
  console.log('🔍 Iniciando otimização...');
  console.log('👥 Jogadores:', players);
  console.log('📝 Recomendações:', recommendations);
  
  // 1. Calcular saldos líquidos iniciais
  const nets = players.map(p => ({ 
    name: p.name, 
    net: (Number(p.cashOut) || 0) - p.buyIns.reduce((a, b) => a + b, 0) 
  }));
  
  console.log('💰 Saldos iniciais:', nets);
  
  // 2. Aplicar recomendações como restrições (modificar saldos)
  const tempNets = [...nets];
  recommendations.forEach(rec => {
    const payer = tempNets.find(p => p.name === rec.from);
    const receiver = tempNets.find(p => p.name === rec.to);
    if (payer && receiver) {
      console.log(`📝 Aplicando recomendação: ${rec.from} paga ${rec.amount} para ${rec.to}`);
      console.log(`   Antes: ${payer.name}=${payer.net}, ${receiver.name}=${receiver.net}`);
      
      // Pagador: se tem saldo negativo, reduz a dívida
      if (payer.net < 0) {
        payer.net += Number(rec.amount); // Reduz dívida (ex: -20 + 20 = 0)
      } else {
        payer.net -= Number(rec.amount); // Se tem saldo positivo, reduz
      }
      
      // Recebedor: se tem saldo positivo, reduz o crédito
      if (receiver.net > 0) {
        receiver.net -= Number(rec.amount); // Reduz crédito (ex: 50 - 20 = 30)
      } else {
        receiver.net += Number(rec.amount); // Se tem saldo negativo, reduz dívida
      }
      
      console.log(`   Depois: ${payer.name}=${payer.net}, ${receiver.name}=${receiver.net}`);
    }
  });
  
  console.log('💰 Saldos após recomendações:', tempNets);
  
  // 3. Separar credores e devedores baseado nos saldos modificados
  const creditors = tempNets.filter(n => n.net > 0).map(x => ({ ...x }));
  const debtors = tempNets.filter(n => n.net < 0).map(x => ({ name: x.name, net: -x.net }));
  
  console.log('📊 Credores:', creditors);
  console.log('📊 Devedores:', debtors);
  
  const result = [];
  creditors.sort((a, b) => b.net - a.net);
  debtors.sort((a, b) => b.net - a.net);
  
  // 4. Algoritmo de otimização para os saldos restantes
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const amt = Math.min(credit.net, debt.net);
    
    if (amt > 0) {
      result.push({ 
        from: debt.name, 
        to: credit.name, 
        amount: round2(amt),
        recommended: false // Indica que é uma transferência otimizada
      });
      console.log(`💸 Transferência otimizada: ${debt.name} → ${credit.name}: ${round2(amt)}`);
    }
    
    credit.net = round2(credit.net - amt);
    debt.net = round2(debt.net - amt);
    
    if (credit.net === 0) i++;
    if (debt.net === 0) j++;
  }
  
  // 5. Adicionar recomendações como transferências fixas
  const transfers = [
    ...recommendations.map(rec => ({
      from: rec.from,
      to: rec.to,
      amount: Number(rec.amount),
      recommended: true // Indica que é uma recomendação fixa
    })),
    ...result
  ];
  
  console.log('✅ Resultado final:', transfers);
  return transfers;
}

// Helper para arredondar para 2 casas decimais
function round2(n) {
  return Math.round(n * 100) / 100;
}
