# 🍽️ Sistema de Janta - Documentação Completa

## 📋 **Visão Geral**

Sistema completo para gerenciar pagamentos de janta, com funcionalidades de divisão igual/personalizada, controle de pagamentos e integração com sessões de poker ou funcionamento independente.

## 🎯 **Funcionalidades Principais**

### **1. Aba "Janta" na Navegação**
- ✅ Nova aba "Janta" adicionada entre "Sessão" e "Histórico"
- ✅ Interface dedicada para gerenciar pagamentos da janta
- ✅ Funciona independente de sessões de poker

### **2. Sistema de Pagamento da Janta**

#### **Configuração da Janta:**
- **Valor Total**: Campo para inserir o valor total da janta
- **Quem Pagou**: Dropdown para selecionar quem pagou a janta (opcional)
- **Data da Janta**: Seletor de data (padrão: hoje)
- **Tipo de Divisão**: Duas opções:
  - **Divisão Igual (Churrasco)**: Todos pagam o mesmo valor
  - **Valores Personalizados (Xis, etc.)**: Cada pessoa paga um valor diferente

#### **Divisão Igual:**
- Calcula automaticamente: `Valor Total ÷ Número de Jogadores`
- Exemplo: R$ 100,00 ÷ 5 pessoas = R$ 20,00 por pessoa

#### **Valores Personalizados:**
- Campo individual para cada jogador
- Permite valores diferentes (ex: Xis R$ 15,00, Refrigerante R$ 5,00)
- Mostra total personalizado para verificação

### **3. Lista de Pagamentos com Checkboxes**

#### **Funcionalidades:**
- ✅ **Lista de todos os jogadores** da sessão atual ou lista personalizada
- ✅ **Checkbox para marcar** quem já pagou
- ✅ **Valor individual** mostrado para cada pessoa
- ✅ **Status visual** "✓ Pago" para quem já pagou
- ✅ **Integração com jogadores** da sessão (se houver)

#### **Interface:**
```
☐ Luis - R$ 20,00
☑ Fernando - R$ 15,00 ✓ Pago
☐ Luiggi - R$ 25,00
```

### **4. Janta Independente da Sessão**

#### **Antes:**
- ❌ Erro: "Por favor, crie uma sessão primeiro"
- ❌ Janta obrigatoriamente associada à sessão
- ❌ Não podia gerenciar janta sem criar sessão

#### **Agora:**
- ✅ **Janta independente** da sessão
- ✅ **Identificação por data** (YYYY-MM-DD)
- ✅ **Funciona sem sessão** ativa

## 🔧 **Implementação Técnica**

### **Estados React:**
```javascript
const [dinnerData, setDinnerData] = useState({
  totalAmount: 0,
  payer: '',
  divisionType: 'equal',
  customAmounts: {},
  payments: {},
  date: new Date().toISOString().split('T')[0], // Data da janta
  isIndependent: true // Se é independente da sessão
});

// Estados para edição da janta no histórico
const [editingDinner, setEditingDinner] = useState(null); // sessionId sendo editada
const [dinnerHistory, setDinnerHistory] = useState({}); // { [sessionId]: dinnerData }
```

### **Funções Principais:**
- `handleDinnerTotalChange()`: Atualiza valor total
- `handleDinnerPayerChange()`: Seleciona quem pagou
- `handleDivisionTypeChange()`: Muda tipo de divisão
- `handleCustomAmountChange()`: Atualiza valores personalizados
- `handlePaymentToggle()`: Marca/desmarca pagamentos
- `saveDinnerData()`: Salva no MySQL
- `loadDinnerData()`: Carrega do MySQL
- `loadDinnerHistory()`: Carrega dados da janta de todas as sessões
- `startEditingDinner(sessionId)`: Inicia edição de uma sessão
- `saveDinnerHistory(sessionId)`: Salva alterações no histórico
- `updateDinnerPayment(sessionId, playerId, paid, amount)`: Atualiza status de pagamento

### **Banco de Dados MySQL:**
```sql
CREATE TABLE dinner_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL, -- Pode ser "dinner_YYYY-MM-DD" ou nome da sessão
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payer VARCHAR(255), -- Opcional
  division_type VARCHAR(50) NOT NULL DEFAULT 'equal',
  custom_amount DECIMAL(10,2) DEFAULT 0,
  user_id INT DEFAULT 1,
  dinner_date DATE, -- Data da janta
  is_independent BOOLEAN DEFAULT true, -- Se é independente da sessão
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE dinner_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dinner_id INT,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dinner_id) REFERENCES dinner_data(id) ON DELETE CASCADE
);
```

## ✅ **Correções Implementadas**

### **1. Validação Restritiva Corrigida**

#### **Problema:**
- ❌ Erro: "Por favor, preencha o valor total e selecione quem pagou a janta"
- ❌ Validação muito restritiva impedindo salvamento

#### **Solução:**
- ✅ **Validação mais flexível** - apenas valor total obrigatório
- ✅ **Quem pagou** não é mais obrigatório para salvar
- ✅ **Mensagens de erro** mais específicas

#### **Código Corrigido:**
```javascript
const saveDinnerData = async () => {
  try {
    // Verificar se há dados básicos para salvar
    if (dinnerData.totalAmount <= 0) {
      alert('Por favor, preencha o valor total da janta');
      return;
    }
    
    if (!dinnerData.date) {
      alert('Por favor, selecione a data da janta');
      return;
    }
    // ... resto do código
  }
};
```

### **2. Edição no Histórico Implementada**

#### **Funcionalidades Adicionadas:**
- ✅ **Seção "🍽️ Janta"** no histórico de cada sessão
- ✅ **Visualização** dos dados da janta (valor, quem pagou, divisão)
- ✅ **Modo de edição** para marcar pagamentos
- ✅ **Checkboxes interativos** para marcar quem pagou
- ✅ **Botões Salvar/Cancelar** na edição
- ✅ **Botão "Adicionar Janta"** para sessões sem dados

#### **Interface no Histórico:**
```
🍽️ Janta
Valor Total: R$ 100,00
Quem Pagou: Luis
Divisão: Igual

Status dos Pagamentos:
☐ Luis: R$ 20,00
☑ Fernando: R$ 20,00 ✓ Pago
☐ Luiggi: R$ 20,00

[Editar Pagamentos]
```

### **3. Salvamento Robusto**

#### **Melhorias Implementadas:**
- ✅ **Salvamento no MySQL** via API PHP
- ✅ **Tratamento de erros** robusto
- ✅ **Validação de dados** antes de salvar
- ✅ **Upsert com onConflict** para evitar duplicatas
- ✅ **Mensagens informativas** para o usuário

## 📋 **Como Usar**

### **1. Configurar Janta na Sessão Atual:**
1. Vá para aba "Janta"
2. Selecione a data da janta (padrão: hoje)
3. Digite valor total (obrigatório)
4. Selecione quem pagou (opcional)
5. Escolha tipo de divisão
6. Marque quem já pagou
7. Clique "💾 Salvar"

### **2. Editar Pagamentos no Histórico:**
1. Vá para aba "Histórico"
2. Expanda uma sessão
3. Veja seção "🍽️ Janta"
4. Clique "Editar Pagamentos"
5. Marque checkboxes de quem pagou
6. Clique "Salvar"

### **3. Adicionar Janta a Sessão Antiga:**
1. No histórico, expanda sessão sem janta
2. Clique "Adicionar Janta"
3. Configure dados da janta
4. Salve as alterações

## 📊 **Exemplos de Uso**

### **Exemplo 1: Churrasco (Divisão Igual)**
- **Valor Total**: R$ 150,00
- **Quem Pagou**: Luis
- **Tipo**: Divisão Igual
- **Resultado**: R$ 30,00 por pessoa (5 pessoas)

### **Exemplo 2: Pedidos Individuais (Personalizado)**
- **Luis**: Xis - R$ 18,00
- **Fernando**: Refrigerante - R$ 5,00
- **Luiggi**: Pizza - R$ 25,00
- **Total**: R$ 48,00

### **Exemplo 3: Janta Independente**
- **Data**: 2024-01-15
- **Identificador**: `dinner_2024-01-15`
- **Valor**: R$ 120,00
- **Divisão**: Igual (4 pessoas = R$ 30,00 cada)

## 🎯 **Como Funciona a Identificação**

### **1. Janta Independente (Padrão):**
- **Identificador**: `dinner_2024-01-15` (data da janta)
- **Associação**: Por data, não por sessão
- **Uso**: Gerenciar jantas sem criar sessão

### **2. Janta Associada à Sessão:**
- **Identificador**: `nome_da_sessao`
- **Associação**: Por sessão específica
- **Uso**: Janta durante uma sessão de poker

```javascript
// Usar data como identificador se for independente, senão usar session_id
const identifier = dinnerData.isIndependent ? `dinner_${dinnerData.date}` : name;
```

## ✅ **Status Atual**

### **✅ Sistema Completo:**
1. **Aba "Janta"** - Configuração e gerenciamento da janta atual
2. **Divisão Igual/Personalizada** - Flexibilidade na divisão de valores
3. **Lista de Pagamentos** - Checkboxes para marcar quem pagou
4. **Salvamento Robusto** - MySQL via API PHP
5. **Edição no Histórico** - Marcar pagamentos de sessões passadas
6. **Janta Independente** - Funciona sem sessão ativa
7. **Validação Flexível** - Apenas valor total obrigatório

### **🔧 Melhorias Técnicas:**
- ✅ **Validação menos restritiva** - permite salvar sem quem pagou
- ✅ **Edição no histórico** - marcar pagamentos de sessões passadas
- ✅ **Estados separados** - sessão atual vs histórico
- ✅ **Carregamento automático** - dados carregados quando necessário
- ✅ **Interface intuitiva** - botões claros e feedback visual
- ✅ **Identificação flexível** - por data ou por sessão

## 🚀 **Vantagens**

### **✅ Flexibilidade:**
- **Sem dependência** de sessão
- **Gerenciamento** por data
- **Múltiplas jantas** possíveis
- **Divisão personalizada** ou igual

### **✅ Simplicidade:**
- **Interface** mais limpa
- **Validação** menos restritiva
- **Uso** mais intuitivo

### **✅ Robustez:**
- **Salvamento** no MySQL
- **Tratamento de erros** completo
- **Persistência** garantida

O sistema de janta está completamente funcional e pronto para uso em produção! 🎉
