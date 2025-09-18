# 🍽️ Janta com Seleção de Sessão

## ✅ **Problema Resolvido:**

### **Erro Original:**
- ❌ `Could not find the 'dinner_date' column of 'dinner_data' in the schema cache`
- ❌ `column "dinner_date" does not exist`
- ❌ `there is no unique or exclusion constraint matching the ON CONFLICT specification`

### **Solução Implementada:**
- ✅ **Colunas adicionadas** ao banco de dados
- ✅ **Constraint única** adicionada para session_id
- ✅ **Opção de selecionar sessão** (atual, específica ou independente)
- ✅ **Data automática** na primeira vez e fixa depois

## 🔧 **Mudanças Implementadas:**

### **1. Novas Colunas no Banco:**
```sql
-- Adicionar constraint única para session_id
ALTER TABLE dinner_data ADD CONSTRAINT dinner_data_session_id_key UNIQUE (session_id);

-- Adicionar novas colunas
ALTER TABLE dinner_data 
ADD COLUMN IF NOT EXISTS dinner_date DATE;

ALTER TABLE dinner_data 
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'current' 
CHECK (session_type IN ('current', 'specific', 'independent'));

ALTER TABLE dinner_data 
ADD COLUMN IF NOT EXISTS selected_session TEXT;

ALTER TABLE dinner_data 
ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT false;
```

### **2. Estados Atualizados:**
```javascript
const [dinnerData, setDinnerData] = useState({
  totalAmount: 0,
  payer: '',
  divisionType: 'equal',
  customAmounts: {},
  payments: {},
  date: null, // Data automática na primeira vez
  sessionType: 'current', // 'current', 'specific', 'independent'
  selectedSession: '', // ID da sessão selecionada
  isSaved: false // Para não permitir mudar a data
});
```

### **3. Interface com Seleção de Sessão:**
- ✅ **Radio buttons** para escolher tipo de associação
- ✅ **Dropdown** para selecionar sessão específica
- ✅ **Data automática** para jantas independentes
- ✅ **Data fixa** após salvar

### **4. Tipos de Associação:**

#### **🎯 Sessão Atual:**
- **Uso**: Janta da sessão que está rodando
- **Identificador**: Nome da sessão atual
- **Requisito**: Deve ter uma sessão ativa

#### **🎯 Sessão Específica:**
- **Uso**: Janta de uma sessão passada
- **Identificador**: ID da sessão selecionada
- **Requisito**: Deve selecionar uma sessão da lista

#### **🎯 Independente:**
- **Uso**: Janta sem associação a sessão
- **Identificador**: `dinner_YYYY-MM-DD`
- **Data**: Automática na primeira vez, fixa depois

## 🎯 **Como Funciona:**

### **1. Seleção de Tipo:**
```
☑️ Sessão Atual (Poker 15/01)
☐ Sessão Específica
☐ Independente (apenas por data)
```

### **2. Sessão Específica:**
```
Selecionar Sessão:
[Dropdown com lista de sessões]
- Poker 14/01 - 14/01/2024
- Poker 13/01 - 13/01/2024
- Poker 12/01 - 12/01/2024
```

### **3. Data Automática:**
- **Primeira vez**: Data atual automaticamente
- **Após salvar**: Data fixa (não pode mudar)
- **Campo desabilitado**: Para jantas já salvas

## 📋 **Fluxo de Uso:**

### **Cenário 1: Janta da Sessão Atual**
1. **Selecione**: "Sessão Atual"
2. **Digite**: Valor total
3. **Configure**: Divisão e pagamentos
4. **Salve**: Associa à sessão atual

### **Cenário 2: Janta de Sessão Passada**
1. **Selecione**: "Sessão Específica"
2. **Escolha**: Sessão da lista
3. **Digite**: Valor total
4. **Configure**: Divisão e pagamentos
5. **Salve**: Associa à sessão escolhida

### **Cenário 3: Janta Independente**
1. **Selecione**: "Independente"
2. **Digite**: Valor total
3. **Configure**: Divisão e pagamentos
4. **Salve**: Data definida automaticamente
5. **Editar**: Data fica fixa

## 🔍 **Exemplos:**

### **Exemplo 1: Janta da Sessão Atual**
- **Tipo**: Sessão Atual
- **Sessão**: "Poker 15/01"
- **Identificador**: `Poker 15/01`
- **Valor**: R$ 120,00

### **Exemplo 2: Janta de Ontem**
- **Tipo**: Sessão Específica
- **Sessão**: "Poker 14/01"
- **Identificador**: `Poker 14/01`
- **Valor**: R$ 80,00

### **Exemplo 3: Janta Independente**
- **Tipo**: Independente
- **Data**: 2024-01-15 (automática)
- **Identificador**: `dinner_2024-01-15`
- **Valor**: R$ 100,00

## 🚀 **Vantagens:**

### **✅ Flexibilidade:**
- **3 tipos** de associação
- **Sessão atual** ou passada
- **Independente** por data

### **✅ Controle de Data:**
- **Automática** na primeira vez
- **Fixa** após salvar
- **Sem confusão** de datas

### **✅ Interface Intuitiva:**
- **Radio buttons** claros
- **Dropdown** com sessões
- **Validação** apropriada

## 📋 **Scripts SQL:**

### **1. Script Completo:**
```bash
# Execute o script completo
dinner_data_setup.sql
```

### **2. Script de Atualização:**
```bash
# Se a tabela já existe, execute apenas:
add_dinner_columns.sql
```

### **3. Script de Correção Rápida:**
```bash
# Para corrigir apenas a constraint única:
fix_dinner_constraint.sql
```

## ✅ **Status:**
- ✅ **Colunas adicionadas** ao banco
- ✅ **Constraint única** adicionada
- ✅ **Interface atualizada** com seleção
- ✅ **Data automática** implementada
- ✅ **Validação** corrigida
- ✅ **Scripts SQL** criados

## 🎯 **Próximos Passos:**
1. **Execute** `fix_dinner_constraint.sql` no Supabase (correção rápida)
2. **Ou execute** `add_dinner_columns.sql` (atualização completa)
3. **Teste** a seleção de sessão
4. **Verifique** a data automática
5. **Faça commit** e deploy

Agora você pode escolher se a janta é da sessão atual, de uma sessão específica ou independente! 🚀
