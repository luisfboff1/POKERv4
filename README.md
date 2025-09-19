# 🎰 Sistema de Poker - Gestão de Sessões e Janta

> Sistema completo para gerenciamento de sessões de poker e divisão inteligente de contas de janta entre jogadores, com otimização automática de transferências.

![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![PHP](https://img.shields.io/badge/PHP-8.x-purple?logo=php)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-cyan?logo=tailwindcss)
![Hostinger](https://img.shields.io/badge/Deploy-Hostinger-green)

## 📋 **O que faz este sistema?**

### 🎯 **Gestão de Sessões de Poker**
- **Controle de Buy-ins**: Registra todas as entradas de dinheiro de cada jogador
- **Cash-out**: Registra quanto cada jogador saiu com
- **Cálculo Automático**: Determina quem deve e quem deve receber
- **Otimização de Pagamentos**: Minimiza o número de transferências necessárias
- **Sistema de Recomendações**: Permite pagamentos específicos entre jogadores

### 🍽️ **Sistema de Janta Inteligente**
- **Divisão Igual**: Para churrascos, pizzas (valor ÷ pessoas)
- **Divisão Personalizada**: Para pedidos individuais (xis, bebidas)
- **Controle de Pagamentos**: Checkboxes para marcar quem já pagou
- **Funcionamento Independente**: Não precisa de sessão de poker ativa
- **Histórico Completo**: Visualiza e edita jantas de sessões passadas

### 📊 **Recursos Avançados**
- **Algoritmo de Otimização**: Reduz transferências de N² para o mínimo possível
- **Interface Intuitiva**: Abas organizadas (Sessão → Janta → Histórico)
- **Persistência Robusta**: Dados salvos em MySQL com API PHP
- **Responsivo**: Funciona perfeitamente em mobile e desktop

## 🏗️ **Arquitetura do Sistema**

### **Frontend (React + Vite)**
```
src/
├── App.jsx                 # Componente principal com todas as abas
├── main.jsx               # Ponto de entrada da aplicação
├── index.css              # Estilos globais + Tailwind
├── mysqlService-api.js    # Cliente HTTP para comunicação com API
└── useMySQL.js           # Hooks personalizados para gerenciar estado
```

### **Backend (PHP + MySQL)**
```
api/
├── config.php            # ✅ Conexão MySQL (já configurada)
├── sessions.php          # Endpoints CRUD para sessões de poker
├── dinner.php           # Endpoints CRUD para dados de janta
└── players.php          # Endpoints para gerenciar jogadores
```

### **Banco de Dados (MySQL)**
```sql
-- Tabela principal de sessões
sessions (id, name, date, buy_in, rebuy, add_on, total_pot, snapshot, created_by, created_at)

-- Tabela de dados de janta
dinner_data (id, session_id, total_amount, payer, division_type, custom_amount, user_id)

-- Tabela de participantes da janta
dinner_participants (id, dinner_id, name, amount, paid)

-- Tabela de usuários (futuro)
users (id, name, email, password_hash, role, created_at)
```

## ⚙️ **Banco de Dados (Já Configurado)**

### **✅ Status Atual**
O banco de dados MySQL já está **100% configurado e funcionando** no Hostinger:
- 🟢 **Conexão ativa** - `srv1437.hstgr.io`
- 🟢 **Credenciais configuradas** - `api/config.php`
- 🟢 **Tabelas criadas** - Todas as estruturas prontas
- 🟢 **Dados funcionais** - Sistema operacional

### **📊 Tabelas Ativas**
- ✅ `sessions` - Sessões de poker (funcionando)
- ✅ `dinner_data` - Dados das jantas (funcionando)
- ✅ `dinner_participants` - Participantes das jantas (funcionando)
- ✅ `users` - Usuários do sistema (preparado para futuro)

## 🚀 **Como Executar**

### **Desenvolvimento Local**
```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor de desenvolvimento
npm run dev

# 3. Acessar no navegador
http://localhost:5173
```

### **Produção (Hostinger) - ✅ Já Configurado**
O sistema já está **totalmente configurado** e funcionando em produção:
- ✅ **Arquivos enviados** - Projeto completo no servidor
- ✅ **Domínio configurado** - Apontando para a pasta correta
- ✅ **Banco conectado** - MySQL funcionando perfeitamente
- ✅ **Sistema operacional** - Pronto para uso

## 💡 **Como Usar**

### **🎰 Aba Sessão (Poker)**
1. **Adicione jogadores** digitando nomes
2. **Registre buy-ins** clicando em "Buy-in" para cada jogador
3. **Registre cash-outs** ao final da sessão
4. **Veja as transferências otimizadas** automaticamente
5. **Adicione recomendações** para pagamentos específicos
6. **Salve a sessão** para histórico

### **🍽️ Aba Janta**
1. **Digite o valor total** da janta
2. **Selecione quem pagou** (opcional)
3. **Escolha o tipo de divisão**:
   - **Igual**: Para churrascos (valor ÷ pessoas)
   - **Personalizada**: Para pedidos individuais
4. **Marque quem já pagou** com checkboxes
5. **Salve os dados** da janta

### **📚 Aba Histórico**
1. **Visualize sessões passadas** com todos os detalhes
2. **Edite dados de janta** de sessões antigas
3. **Marque pagamentos** que foram feitos posteriormente
4. **Carregue sessão para edição** clicando em "Editar"

## 🎯 **Algoritmo de Otimização**

### **Problema:**
Em uma sessão com 5 jogadores, sem otimização seriam necessárias até **20 transferências** (4×5).

### **Solução:**
Nosso algoritmo reduz para **no máximo 4 transferências** (N-1), considerando:

1. **Calcula saldos líquidos**: `cashOut - totalBuyIns`
2. **Aplica recomendações**: Como restrições que modificam saldos
3. **Otimiza o restante**: Algoritmo de matching entre credores e devedores
4. **Resultado**: Recomendações fixas + transferências mínimas

### **Exemplo Prático:**
```
Situação: Luis(-20), Luiggi(+50), Ettore(-30)
Recomendação: Luis → Luiggi: R$ 20

Resultado:
✅ Luis → Luiggi: R$ 20,00 (recomendação)
✅ Ettore → Luiggi: R$ 30,00 (otimizada)
Total: 2 transferências (mínimo possível)
```

## 🎨 **Interface e Experiência**

### **Design Responsivo**
- ✅ **Mobile-first**: Funciona perfeitamente em celulares
- ✅ **Tailwind CSS**: Design moderno e consistente
- ✅ **Modo escuro**: Interface agradável para longas sessões

### **Feedback Visual**
- 🟢 **Badges verdes**: Recomendações fixas
- 🔵 **Badges azuis**: Transferências otimizadas
- ✅ **Checkboxes**: Status de pagamentos
- 🔄 **Botões intuitivos**: Ações claras para o usuário

### **Estados da Aplicação**
- **Loading**: Indicadores durante operações
- **Erro**: Mensagens claras de problemas
- **Sucesso**: Confirmações de ações realizadas
- **Vazio**: Orientações quando não há dados

## 📁 **Estrutura Completa do Projeto**

```
📦 Sistema de Poker/
├── 📁 src/                          # Frontend React
│   ├── App.jsx                      # Componente principal (3 abas)
│   ├── main.jsx                     # Ponto de entrada
│   ├── index.css                    # Estilos globais
│   ├── mysqlService-api.js          # Cliente HTTP para API
│   └── useMySQL.js                  # Hooks para gerenciar estado
├── 📁 api/                          # Backend PHP
│   ├── config.php                   # ✅ Conexão MySQL (já configurada)
│   ├── sessions.php                 # CRUD de sessões (funcionando)
│   ├── dinner.php                   # CRUD de jantas (funcionando)
│   └── players.php                  # Gerenciar jogadores (funcionando)
├── 📁 explicacoes/                  # Documentação técnica
│   ├── SISTEMA_JANTA_COMPLETO.md    # Doc. sistema de janta
│   ├── OTIMIZACAO_TRANSFERENCIAS_COMPLETA.md  # Doc. otimização
│   ├── CORRECOES_SISTEMA_COMPLETAS.md  # Correções implementadas
│   ├── HOSTINGER_SETUP.md           # Setup no Hostinger
│   ├── ESTRUTURA_ABAS.md            # Estrutura das abas
│   └── HISTORICO_ABAS.md            # Histórico e navegação
├── 📁 public/                       # Arquivos estáticos
│   ├── icon-192x192.png             # Ícone da aplicação
│   └── manifest.webmanifest         # PWA manifest
├── 📄 package.json                  # Dependências Node.js
├── 📄 vite.config.js                # Configuração do Vite
├── 📄 tailwind.config.js            # Configuração do Tailwind
├── 📄 postcss.config.js             # Configuração do PostCSS
├── 📄 index.html                    # HTML principal
└── 📄 config.example.js             # Exemplo de configuração
```

## 🔧 **Tecnologias Utilizadas**

### **Frontend**
- **React 18**: Biblioteca para interfaces reativas
- **Vite**: Build tool rápido e moderno
- **Tailwind CSS**: Framework CSS utilitário
- **JavaScript ES6+**: Sintaxe moderna

### **Backend**
- **PHP 8.x**: Linguagem server-side
- **MySQL 8.0**: Banco de dados relacional
- **PDO**: Camada de abstração do banco
- **JSON**: Formato de troca de dados

### **Hospedagem**
- **Hostinger**: Hospedagem compartilhada
- **MySQL**: Banco de dados na nuvem
- **PHP**: Servidor web Apache
- **SSL**: Certificado de segurança

## 📊 **Métricas do Projeto**

- 📁 **35 arquivos** total (ultra-otimizado)
- 🎯 **6 arquivos** de documentação técnica
- ⚡ **5 arquivos** React essenciais
- 🔧 **7 endpoints** PHP
- 📱 **100% responsivo**
- 🚀 **Tempo de carregamento** < 2s
- 💾 **Banco de dados** otimizado
- 🔒 **Segurança** com validações

## 🤝 **Contribuição**

Este é um projeto privado para gerenciar sessões de poker entre amigos. Para sugestões ou melhorias, entre em contato.

## 📞 **Suporte**

Para dúvidas sobre configuração ou uso do sistema, consulte a documentação em `/explicacoes/` ou entre em contato.

---

**Sistema desenvolvido com ❤️ para otimizar as sessões de poker e facilitar a divisão de jantas entre amigos!** 🎰🍽️
