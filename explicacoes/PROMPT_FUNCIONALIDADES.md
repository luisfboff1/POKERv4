# 🚀 PROMPT - Sistema de Poker Settlements

## 📋 CONTEXTO DO PROJETO
Sistema de gerenciamento de sessões de poker desenvolvido em React + PHP para controle de jogadores, valores e recomendações de transferências.

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### 🏠 **PÁGINA INICIAL (Home)**
- **Exibição de estatísticas gerais**
- **Lista das últimas sessões** (mais recentes primeiro)
- **Botões de ação rápida** (Nova Sessão, Ver Histórico)
- **Resumo financeiro** por jogador
- **Cards visuais** para melhor UX

### ➕ **NOVA SESSÃO**
- **Formulário de criação** de sessão de poker
- **Adição dinâmica de jogadores** (nome + valor inicial)
- **Cálculo automático** de diferenças
- **Geração de recomendações** de transferências
- **Validação de dados** (nomes obrigatórios, valores numéricos)
- **Salvamento no banco** via API PHP

### 📊 **HISTÓRICO DE SESSÕES**
- **Lista completa** de todas as sessões
- **Filtros por data** e jogador
- **Visualização detalhada** de cada sessão
- **Edição inline** de sessões existentes
- **Exclusão** de sessões
- **Exportação** para diferentes formatos

### 🔧 **FUNCIONALIDADES TÉCNICAS**

#### **Frontend (React)**
- **React Router** para navegação SPA
- **Componentes reutilizáveis** (Layout, ErrorBoundary)
- **Estado global** com hooks
- **API Service** para comunicação com backend
- **Responsive design** com Tailwind CSS
- **Tratamento de erros** e loading states

#### **Backend (PHP)**
- **API RESTful** com endpoints:
  - `GET /api/session.php` - Listar sessões
  - `POST /api/session.php` - Criar sessão
  - `PUT /api/session.php?id=X` - Editar sessão
  - `DELETE /api/session.php?id=X` - Excluir sessão
  - `GET /api/players.php` - Listar jogadores únicos
- **Validação de dados** server-side
- **Headers CORS** configurados
- **Tratamento de erros** padronizado
- **JSON responses** estruturados

#### **Banco de Dados**
- **Tabela `sessions`** com campos:
  - `id` (auto-increment)
  - `date` (data da sessão)
  - `players_data` (JSON com jogadores e valores)
  - `recommendations` (JSON com transferências)
- **Queries otimizadas** para performance
- **Integridade referencial**

### 🚀 **DEPLOY AUTOMATIZADO**

#### **GitHub Actions Workflow**
- **Build automático** do React no GitHub
- **Instalação de dependências** (npm install)
- **Compilação** (npm run build)
- **Cópia automática** do .htaccess
- **Deploy via FTP** separado:
  - Frontend: `dist/` → `/poker/`
  - API: `api/` → `/poker/api/`
- **Proteção contra alterações** desnecessárias
- **Logs detalhados** de deploy

#### **Configuração do Servidor**
- **Apache .htaccess** para SPA routing
- **Estrutura de pastas** organizada
- **Secrets configurados** no GitHub:
  - `HOSTINGER_FTP_HOST`
  - `HOSTINGER_FTP_USER`
  - `HOSTINGER_FTP_PASSWORD`

## 📁 **ESTRUTURA DO PROJETO**

```
poker-novo/
├── src/                    # Código fonte React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # API service
│   └── App.jsx            # App principal
├── api/                   # Backend PHP
│   ├── config.php         # Configuração DB + CORS
│   ├── session.php        # CRUD de sessões
│   └── players.php        # Listagem de jogadores
├── dist/                  # Build do React (gerado)
├── .github/workflows/     # Deploy automático
└── .htaccess             # Configuração Apache
```

## 🎨 **DESIGN E UX**

### **Visual**
- **Design moderno** com Tailwind CSS
- **Cores consistentes** (azul, verde, vermelho)
- **Ícones** para melhor UX
- **Cards e botões** estilizados
- **Responsive** para mobile

### **Interação**
- **Formulários intuitivos** com validação
- **Feedback visual** para ações
- **Loading states** durante requisições
- **Mensagens de erro** claras
- **Navegação fluida** entre páginas

## 🔒 **SEGURANÇA E PERFORMANCE**

### **Segurança**
- **Validação server-side** de dados
- **Prepared statements** SQL
- **Headers CORS** configurados
- **Sanitização** de inputs
- **Tratamento de erros** sem exposição

### **Performance**
- **Build otimizado** do React
- **Chunks separados** para vendor libs
- **Queries SQL** otimizadas
- **Cache** de dependências npm
- **Assets comprimidos**

## 🚨 **REGRAS IMPORTANTES**

### **Deploy**
- **NUNCA alterar** `.github/workflows/deploy-hostinger.yml` sem aprovação
- **Arquivo protegido** contra modificações desnecessárias
- **Sempre testar** em branch separada antes de merge

### **Desenvolvimento**
- **Commit apenas** arquivos modificados
- **Mensagens descritivas** nos commits
- **Código limpo** e documentado
- **Testes** antes de deploy

## 📝 **PRÓXIMAS MELHORIAS SUGERIDAS**

1. **Autenticação** de usuários
2. **Backup automático** do banco
3. **Notificações** de novas sessões
4. **Relatórios** financeiros avançados
5. **Exportação** para PDF/Excel
6. **Modo offline** com cache
7. **PWA** para instalação mobile

---

**Status:** ✅ **SISTEMA FUNCIONAL E DEPLOYADO**
**URL:** https://luisfboff.com/poker/
**Última atualização:** Dezembro 2024
