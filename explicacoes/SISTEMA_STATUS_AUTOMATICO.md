# 🔄 Sistema de Atualização Automática de Status de Sessões

## Problema Resolvido

**Antes**: Sessões permaneciam com status "pending" mesmo após todos os pagamentos serem realizados.

**Agora**: Status atualiza automaticamente para "completed" quando todas as condições são atendidas.

---

## Lógica de Verificação

### Função: `checkSessionPaymentStatus()`

```typescript
const checkSessionPaymentStatus = (
  playersData: SessionPlayerData[],
  recommendations: TransferRecommendation[],
  paidTransfers: Record<string, boolean>
): string => {
  // 1. Se não há transferências recomendadas → completed
  if (!recommendations || recommendations.length === 0) {
    return 'completed';
  }

  // 2. Verificar se todas as transferências foram pagas
  const allTransfersPaid = recommendations.every((rec) => {
    const transferKey = `${rec.from}-${rec.to}`;
    return paidTransfers[transferKey] === true;
  });

  // 3. Verificar se todas as jantas foram pagas
  const allJantasPaid = playersData.every((player) => {
    if (!player.janta_paid && player.janta_paid !== false) {
      return true; // Não precisa pagar janta
    }
    return player.janta_paid === true;
  });

  // 4. Se tudo pago → completed, senão → pending
  if (allTransfersPaid && allJantasPaid) {
    return 'completed';
  }

  return 'pending';
};
```

---

## Condições para Status "Completed"

### ✅ Todas as condições devem ser verdadeiras:

1. **Todas as transferências foram pagas**
   - Para cada recomendação em `recommendations[]`
   - Verifica se `paid_transfers[from-to] === true`

2. **Todas as jantas foram pagas** (se aplicável)
   - Para cada jogador em `players_data[]`
   - Se `janta_paid` é `undefined` ou `null` → não precisa pagar
   - Se `janta_paid` é `false` → precisa pagar mas não pagou
   - Se `janta_paid` é `true` → pagou ✅

---

## Onde é Aplicado

### 1. **PUT /api/sessions/[id]** - Atualização Geral
```typescript
// Quando admin atualiza sessão (players_data, recommendations, etc.)
const newStatus = checkSessionPaymentStatus(
  playersData,
  recommendations,
  paidTransfers
);

if (newStatus !== existingSession.status) {
  updateData.status = newStatus;
}
```

### 2. **POST /api/sessions/[id]/payments** - Atualização de Pagamentos
```typescript
// Quando admin marca transferências/jantas como pagas
const newStatus = checkSessionPaymentStatus(
  currentPlayers,
  existingSession.recommendations,
  body.paid_transfers || existingSession.paid_transfers
);

if (newStatus !== existingSession.status) {
  updateData.status = newStatus;
}
```

---

## Exemplos de Funcionamento

### Exemplo 1: Sessão Simples (Sem Transferências)

```json
{
  "recommendations": [],
  "players_data": [
    { "name": "João", "buyin": 100, "cashout": 100 },
    { "name": "Maria", "buyin": 100, "cashout": 100 }
  ],
  "paid_transfers": {}
}
```

**Resultado**: `status = "completed"` (sem transferências = completo)

---

### Exemplo 2: Transferências Pendentes

```json
{
  "recommendations": [
    { "from": "João", "to": "Maria", "amount": 50 }
  ],
  "players_data": [
    { "name": "João", "buyin": 100, "cashout": 50 },
    { "name": "Maria", "buyin": 100, "cashout": 150 }
  ],
  "paid_transfers": {
    "João-Maria": false  // ❌ NÃO PAGO
  }
}
```

**Resultado**: `status = "pending"` (transferência não paga)

---

### Exemplo 3: Transferências Pagas

```json
{
  "recommendations": [
    { "from": "João", "to": "Maria", "amount": 50 }
  ],
  "players_data": [
    { "name": "João", "buyin": 100, "cashout": 50 },
    { "name": "Maria", "buyin": 100, "cashout": 150 }
  ],
  "paid_transfers": {
    "João-Maria": true  // ✅ PAGO
  }
}
```

**Resultado**: `status = "completed"` (tudo pago!)

---

### Exemplo 4: Com Janta

```json
{
  "recommendations": [
    { "from": "João", "to": "Maria", "amount": 50 }
  ],
  "players_data": [
    { "name": "João", "buyin": 100, "cashout": 50, "janta_paid": true },
    { "name": "Maria", "buyin": 100, "cashout": 150, "janta_paid": false }
  ],
  "paid_transfers": {
    "João-Maria": true
  }
}
```

**Resultado**: `status = "pending"` (Maria não pagou janta)

---

### Exemplo 5: Tudo Pago

```json
{
  "recommendations": [
    { "from": "João", "to": "Maria", "amount": 50 }
  ],
  "players_data": [
    { "name": "João", "buyin": 100, "cashout": 50, "janta_paid": true },
    { "name": "Maria", "buyin": 100, "cashout": 150, "janta_paid": true }
  ],
  "paid_transfers": {
    "João-Maria": true
  }
}
```

**Resultado**: `status = "completed"` 🎉

---

## Fluxo de Atualização

```
1. Admin atualiza pagamentos via API
   ↓
2. API recebe dados (players_data, paid_transfers)
   ↓
3. checkSessionPaymentStatus() verifica:
   - Transferências pagas?
   - Jantas pagas?
   ↓
4. Determina novo status:
   - Tudo pago → "completed"
   - Algo pendente → "pending"
   ↓
5. Se status mudou:
   - Atualiza no banco
   - Retorna sucesso
   ↓
6. Frontend reflete mudança automaticamente
```

---

## Benefícios

✅ **Automático**: Não precisa marcar manualmente como concluída  
✅ **Preciso**: Verifica todas as condições  
✅ **Transparente**: Admin vê mudança imediatamente  
✅ **Auditável**: Logs registram mudança de status  
✅ **Flexível**: Funciona com ou sem jantas  

---

## Casos Especiais

### Caso 1: Sessão sem recomendações
- Se `recommendations.length === 0`
- Status: **"completed"** (nada para pagar)

### Caso 2: Jogador sem janta
- Se `janta_paid === undefined` ou `null`
- Considerado: **não precisa pagar** (OK)

### Caso 3: Transferência não marcada
- Se `paid_transfers[key]` não existe
- Considerado: **não pago** (PENDING)

---

## Testing

### Teste 1: Marcar todas as transferências como pagas
```javascript
// No componente TransferManager
const handleMarkAllPaid = () => {
  const newPaidTransfers = {};
  recommendations.forEach(rec => {
    newPaidTransfers[`${rec.from}-${rec.to}`] = true;
  });
  
  api.sessions.updatePayments(sessionId, {
    paid_transfers: newPaidTransfers
  });
};
```

**Esperado**: Status muda para "completed"

### Teste 2: Desmarcar uma transferência
```javascript
const handleUnmarkTransfer = (from, to) => {
  const newPaidTransfers = { ...paidTransfers };
  newPaidTransfers[`${from}-${to}`] = false;
  
  api.sessions.updatePayments(sessionId, {
    paid_transfers: newPaidTransfers
  });
};
```

**Esperado**: Status volta para "pending"

---

## Conclusão

O sistema agora **atualiza automaticamente** o status das sessões conforme os pagamentos são registrados. Isso torna o sistema mais **inteligente** e **reduz trabalho manual** do administrador! 🚀
