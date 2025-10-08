# Google Analytics - Implementação

## 📊 Configuração Completa

O Google Analytics está configurado para rastrear **todas as páginas** automaticamente.

### 🎯 **ID de Rastreamento:** `G-RZHKVNR9XB`

## 🏗️ **Arquitetura**

### **1. Layout Global (`app/layout.tsx`)**
- ✅ **Aplicado a TODAS as páginas** (login, dashboard, ranking, etc.)
- ✅ Script otimizado com `strategy="afterInteractive"`
- ✅ Carregamento assíncrono para melhor performance

### **2. Biblioteca de Analytics (`lib/analytics.ts`)**
- 🎯 Funções personalizadas para eventos do poker
- 📈 Tracking automático de ações importantes
- 🔧 Fácil de usar em qualquer componente

## 📱 **Páginas Cobertas**

Todas essas páginas têm Google Analytics automaticamente:

- ✅ **Página Inicial** (`/`)
- ✅ **Login** (`/login`) - com evento customizado
- ✅ **Registro** (`/register`)
- ✅ **Dashboard** (`/dashboard`)
- ✅ **Ranking** (`/dashboard/ranking`)
- ✅ **Histórico** (`/dashboard/history`)
- ✅ **Nova Sessão** (`/dashboard/new`)
- ✅ **Jogadores** (`/dashboard/players`)
- ✅ **Convites** (`/dashboard/invites`)

## 🎯 **Eventos Rastreados**

### **Autenticação:**
- Login bem-sucedido
- Registro de novo usuário
- Logout

### **Ações do Poker:**
- Criar sessão
- Aprovar sessão
- Excluir sessão
- Adicionar jogador
- Enviar convite

### **Navegação:**
- Visualizar ranking
- Visualizar histórico
- Acessar dashboard

## 💻 **Como Usar em Outras Páginas**

```tsx
import { trackPokerEvent, trackEvent } from '@/lib/analytics';

// Eventos pré-definidos
trackPokerEvent.createSession();
trackPokerEvent.viewRanking();

// Eventos personalizados
trackEvent('custom_action', 'category', 'label', 100);
```

## 🔍 **Verificar se Funciona**

1. **Abra o site** em produção
2. **F12 → Console** - deve aparecer gtag
3. **Network** - deve carregar `gtag/js`
4. **Google Analytics** - dados aparecem em ~24h

## ⚙️ **Configuração Técnica**

- **Strategy:** `afterInteractive` (melhor performance)
- **Modo:** Universal Analytics (GA4)
- **Localização:** Layout raiz (aplicado globalmente)
- **Eventos:** Personalizados para sistema de poker

## 📈 **Métricas Importantes**

O Google Analytics vai rastrear:
- **Visitantes únicos**
- **Páginas mais visitadas**
- **Tempo no site**
- **Taxa de conversão (login/registro)**
- **Ações dos usuários** (criar sessões, ver ranking)
- **Performance das páginas**

---

**✅ Implementação completa!** Todas as páginas têm tracking automático.