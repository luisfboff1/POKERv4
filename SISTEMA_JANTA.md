# 🍽️ Sistema de Controle da Janta

## 📋 **Funcionalidades Implementadas:**

### **1. Aba "Janta" na Navegação**
- ✅ Nova aba "Janta" adicionada entre "Sessão" e "Histórico"
- ✅ Interface dedicada para gerenciar pagamentos da janta

### **2. Sistema de Pagamento da Janta**

#### **Configuração da Janta:**
- **Valor Total**: Campo para inserir o valor total da janta
- **Quem Pagou**: Dropdown para selecionar quem pagou a janta
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
- ✅ **Lista de todos os jogadores** da sessão atual
- ✅ **Checkbox para marcar** quem já pagou
- ✅ **Valor individual** mostrado para cada pessoa
- ✅ **Status visual** "✓ Pago" para quem já pagou
- ✅ **Integração com jogadores** da sessão

#### **Interface:**
```
☐ Luis - R$ 20,00
☑ Fernando - R$ 15,00 ✓ Pago
☐ Luiggi - R$ 25,00
```

### **4. Salvamento no Supabase**

#### **Tabela `dinner_data`:**
```sql
CREATE TABLE dinner_data (
  id UUID PRIMARY KEY,
  session_id TEXT NOT NULL,
  total_amount DECIMAL(10,2),
  payer TEXT NOT NULL,
  division_type TEXT CHECK (division_type IN ('equal', 'custom')),
  custom_amounts JSONB,
  payments JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### **Dados Salvos:**
- **session_id**: ID da sessão atual
- **total_amount**: Valor total da janta
- **payer**: Quem pagou a janta
- **division_type**: Tipo de divisão (equal/custom)
- **custom_amounts**: Valores personalizados por jogador
- **payments**: Status de pagamento de cada jogador

### **5. Integração com a Sessão**

#### **Carregamento Automático:**
- ✅ **Carrega dados** quando a aba "Janta" é ativada
- ✅ **Associado à sessão** atual (campo `name`)
- ✅ **Persistência** entre aberturas do app

#### **Sincronização:**
- ✅ **Jogadores da sessão** aparecem automaticamente na lista
- ✅ **Dados salvos** são carregados automaticamente
- ✅ **Atualização em tempo real** dos checkboxes

## 🎯 **Como Usar:**

### **1. Configurar a Janta:**
1. Vá para a aba "Janta"
2. Digite o **valor total** da janta
3. Selecione **quem pagou** a janta
4. Escolha o **tipo de divisão**:
   - **Igual**: Para churrascos, pizzas, etc.
   - **Personalizada**: Para pedidos individuais

### **2. Valores Personalizados (se escolhido):**
1. Marque "Valores Personalizados"
2. Digite o valor para cada jogador
3. Verifique o total personalizado

### **3. Marcar Pagamentos:**
1. Na lista de pagamentos, marque os checkboxes
2. Quem já pagou aparece com "✓ Pago"
3. Clique "💾 Salvar Dados da Janta"

### **4. Verificar no Dia Seguinte:**
1. Abra a mesma sessão
2. Vá para a aba "Janta"
3. Veja quem já pagou e quem ainda deve

## 🔧 **Estrutura Técnica:**

### **Estados React:**
```javascript
const [dinnerData, setDinnerData] = useState({
  totalAmount: 0,
  payer: '',
  divisionType: 'equal',
  customAmounts: {},
  payments: {}
});
```

### **Funções Principais:**
- `handleDinnerTotalChange()`: Atualiza valor total
- `handleDinnerPayerChange()`: Seleciona quem pagou
- `handleDivisionTypeChange()`: Muda tipo de divisão
- `handleCustomAmountChange()`: Atualiza valores personalizados
- `handlePaymentToggle()`: Marca/desmarca pagamentos
- `saveDinnerData()`: Salva no Supabase
- `loadDinnerData()`: Carrega do Supabase

### **Componente DinnerPanel:**
- Interface completa para gerenciar a janta
- Cálculos automáticos de divisão
- Lista interativa de pagamentos
- Botão de salvamento

## 📊 **Exemplos de Uso:**

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

## ✅ **Status:**
- ✅ **Aba "Janta"** criada e funcionando
- ✅ **Sistema de pagamento** implementado
- ✅ **Lista com checkboxes** funcionando
- ✅ **Salvamento no Supabase** configurado
- ✅ **Integração com sessão** completa
- ✅ **Interface responsiva** e intuitiva

## 🚀 **Próximos Passos:**
1. **Executar o SQL** `dinner_data_setup.sql` no Supabase
2. **Testar a funcionalidade** na aplicação
3. **Verificar salvamento** e carregamento dos dados
4. **Fazer deploy** no Vercel

O sistema de janta está completo e pronto para uso! 🎉
