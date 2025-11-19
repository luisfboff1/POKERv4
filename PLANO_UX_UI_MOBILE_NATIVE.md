# 📱 Plano de Melhoria UX/UI - Mobile First Native Experience

## 🎯 Objetivo
Transformar a experiência mobile do Poker Manager em uma experiência nativa, eliminando o problema de "cards dentro de cards dentro de páginas" e otimizando cada pixel para dispositivos móveis.

---

## 🔍 Problemas Identificados

### 1. **Estrutura Visual Pesada**
- ❌ Cards dentro de cards criam excesso de bordas e sombras
- ❌ Padding excessivo desperdiça espaço valioso em mobile
- ❌ Muitas camadas de containers (Card > CardHeader > CardContent)
- ❌ Não aproveita toda a largura da tela em mobile

### 2. **Padrões Não-Nativos**
- ❌ Tabelas desktop não otimizadas para mobile
- ❌ Modais tradicionais ao invés de bottom sheets
- ❌ Falta de pull-to-refresh
- ❌ Navegação não aproveita gestos nativos
- ❌ Sem feedback tátil (haptic)

### 3. **Densidade de Informação**
- ❌ Informações importantes escondidas em hierarquias profundas
- ❌ Tipografia não otimizada para leitura rápida em mobile
- ❌ CTA (Call-to-Action) não destacados o suficiente

### 4. **Performance e Interatividade**
- ❌ Animações não otimizadas para mobile
- ❌ Loading states genéricos
- ❌ Falta de feedback visual imediato

---

## 💡 Soluções Propostas

### **Fase 1: Arquitetura de Layout Mobile-First** 🏗️

#### 1.1 Sistema de Espaçamento Responsivo
```typescript
// lib/mobile-utils.ts
export const mobileSpacing = {
  // Reduzir padding em mobile
  page: {
    mobile: 'p-3',      // 12px
    tablet: 'md:p-6',   // 24px
    desktop: 'lg:p-8'   // 32px
  },
  card: {
    mobile: 'p-4',      // 16px
    tablet: 'md:p-5',   // 20px
    desktop: 'lg:p-6'   // 24px
  },
  section: {
    mobile: 'space-y-3',
    tablet: 'md:space-y-4',
    desktop: 'lg:space-y-6'
  }
}
```

**Aplicar em:**
- ✅ `app/dashboard/page.tsx` - Dashboard principal
- ✅ `app/dashboard/history/page.tsx` - Histórico
- ✅ `app/dashboard/ranking/page.tsx` - Ranking
- ✅ `app/dashboard/new/page.tsx` - Nova sessão
- ✅ `app/dashboard/layout.tsx` - Layout geral

#### 1.2 Remover Nested Cards em Mobile
**Antes:**
```tsx
<Card>                          // ❌ Card externo
  <CardHeader>
    <CardTitle>Estatísticas</CardTitle>
  </CardHeader>
  <CardContent>
    <Card>                      // ❌ Card interno - nested!
      <CardContent>Dados</CardContent>
    </Card>
  </CardContent>
</Card>
```

**Depois:**
```tsx
{/* Mobile: Section sem card */}
<div className="md:hidden space-y-3">
  <h2 className="text-lg font-semibold px-3">Estatísticas</h2>
  <div className="bg-surface/50 rounded-lg p-4 mx-3">
    Dados
  </div>
</div>

{/* Desktop: Card tradicional */}
<Card className="hidden md:block">
  <CardHeader>
    <CardTitle>Estatísticas</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="bg-muted/30 rounded-lg p-4">
      Dados
    </div>
  </CardContent>
</Card>
```

**Aplicar em:**
- ✅ Dashboard stats cards
- ✅ Recent sessions list
- ✅ Player rankings
- ✅ Session history

#### 1.3 Criar Componente MobileCard
```typescript
// components/ui/mobile-card.tsx
interface MobileCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'flat' | 'minimal';
}

export function MobileCard({ 
  title, 
  description, 
  children, 
  action,
  variant = 'default' 
}: MobileCardProps) {
  return (
    <div className={cn(
      // Mobile: flat, minimal padding
      'rounded-lg p-4 space-y-3',
      variant === 'flat' && 'bg-transparent',
      variant === 'minimal' && 'bg-surface/30 border border-border/30',
      variant === 'default' && 'bg-surface border border-border/40',
      // Desktop: card tradicional com sombra
      'md:rounded-xl md:p-6 md:shadow-sm md:bg-card md:border-border'
    )}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            {title && (
              <h3 className="text-base font-semibold md:text-lg">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground md:text-sm">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
```

---

### **Fase 2: Componentes Mobile-Native** 📲

#### 2.1 Bottom Sheet para Modais
```typescript
// components/ui/bottom-sheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onOpenChange, title, children }: BottomSheetProps) {
  return (
    <>
      {/* Mobile: Bottom sheet nativo */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="md:hidden h-[85vh] rounded-t-2xl"
        >
          <SheetHeader>
            {/* Handle bar para arrastar */}
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(85vh-80px)] pb-safe">
            {children}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Desktop: Modal tradicional */}
      <Dialog open={open} onOpenChange={onOpenChange} className="hidden md:block">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Substituir em:**
- ✅ `SessionDetailsModal` (histórico)
- ✅ `AddPlayerModal` (nova sessão)
- ✅ `PlayersListModal` (nova sessão)
- ✅ `SuggestionModal` (transferências)
- ✅ Todos os modais de edição

#### 2.2 Mobile List View para Tabelas
```typescript
// components/ui/mobile-list.tsx
interface MobileListItem {
  id: string | number;
  primary: string;
  secondary?: string;
  meta?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
}

interface MobileListProps {
  items: MobileListItem[];
  emptyMessage?: string;
}

export function MobileList({ items, emptyMessage }: MobileListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage || 'Nenhum item encontrado'}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/30">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={item.onClick}
          className={cn(
            'flex items-center gap-3 p-4',
            'active:bg-accent/50 transition-colors',
            item.onClick && 'cursor-pointer'
          )}
        >
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">
                {item.primary}
              </p>
              {item.badge}
            </div>
            {item.secondary && (
              <p className="text-xs text-muted-foreground truncate">
                {item.secondary}
              </p>
            )}
          </div>

          {/* Meta & Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.meta && (
              <span className="text-xs text-muted-foreground">
                {item.meta}
              </span>
            )}
            {item.actions}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Aplicar em:**
- ✅ `SessionsTable` → `SessionsList` (mobile)
- ✅ `RankingTable` → `RankingList` (mobile)
- ✅ Recent sessions (dashboard)

#### 2.3 Pull-to-Refresh
```typescript
// hooks/usePullToRefresh.ts
import { useState, useEffect, useRef } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY.current > 0) {
        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY.current);
        
        if (distance > 0) {
          e.preventDefault();
          setPullDistance(Math.min(distance, 80));
          setIsPulling(distance > 60);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling) {
        await onRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
      startY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, onRefresh]);

  return { isPulling, pullDistance };
}
```

**Componente:**
```typescript
// components/PullToRefresh.tsx
export function PullToRefresh({ 
  onRefresh, 
  children 
}: { 
  onRefresh: () => Promise<void>; 
  children: React.ReactNode;
}) {
  const { isPulling, pullDistance } = usePullToRefresh(onRefresh);

  return (
    <div className="relative">
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center transition-all"
        style={{ 
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: pullDistance / 80
        }}
      >
        <div className="bg-surface rounded-full p-2 shadow-lg">
          <RefreshCw className={cn(
            'h-5 w-5 text-primary transition-transform',
            isPulling && 'animate-spin'
          )} />
        </div>
      </div>

      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

**Aplicar em:**
- ✅ Dashboard principal
- ✅ Histórico
- ✅ Ranking

#### 2.4 Floating Action Button (FAB)
```typescript
// components/ui/fab.tsx
interface FABProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-center';
}

export function FAB({ 
  icon, 
  label, 
  onClick, 
  position = 'bottom-right' 
}: FABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Mobile: FAB fixo
        'md:hidden fixed z-40 flex items-center gap-2',
        'bg-primary text-primary-foreground',
        'rounded-full shadow-2xl',
        'active:scale-95 transition-transform',
        // Position
        position === 'bottom-right' && 'bottom-20 right-4',
        position === 'bottom-center' && 'bottom-20 left-1/2 -translate-x-1/2',
        // Size
        label ? 'px-6 py-4' : 'p-4'
      )}
      aria-label={label}
    >
      {icon}
      {label && (
        <span className="font-semibold text-sm">{label}</span>
      )}
    </button>
  );
}
```

**Aplicar em:**
- ✅ Dashboard → "Nova Sessão"
- ✅ Histórico → Filtros
- ✅ Ranking → Período

---

### **Fase 3: Otimização de Componentes Existentes** 🎨

#### 3.1 Dashboard Principal
**Arquivo:** `app/dashboard/page.tsx`

**Melhorias:**
```tsx
// Estatísticas - antes: 4 cards, depois: grid compacto
<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
  {/* Mobile: card minimal */}
  <div className="bg-surface/50 rounded-lg p-4 space-y-2 md:bg-card md:rounded-xl md:p-6 md:shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground md:text-sm">
        Sessões
      </span>
      <History className="h-4 w-4 text-primary" />
    </div>
    <p className="text-2xl font-bold md:text-3xl">
      {stats.totalSessions}
    </p>
    <p className="text-xs text-muted-foreground">
      {stats.pendingSessions} pendentes
    </p>
  </div>
</div>

{/* Quick Actions - mobile: horizontal scroll */}
<div className="overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0">
  <div className="flex gap-3 md:grid md:grid-cols-4">
    {actions.map(action => (
      <Link 
        href={action.href}
        className={cn(
          // Mobile: compact card
          'flex-shrink-0 w-40 bg-surface rounded-lg p-4',
          'active:scale-95 transition-transform',
          // Desktop: full card
          'md:w-auto md:bg-card md:rounded-xl md:p-6 md:shadow-sm'
        )}
      >
        <div className="space-y-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <action.icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">{action.name}</h3>
        </div>
      </Link>
    ))}
  </div>
</div>

{/* Recent Sessions - mobile: list view */}
<div className="md:hidden">
  <h2 className="text-lg font-semibold px-3 mb-3">Sessões recentes</h2>
  <MobileList
    items={recentSessions.map(session => ({
      id: session.id,
      primary: session.location,
      secondary: `${new Date(session.date).toLocaleDateString('pt-BR')} • ${playerCount} jogadores`,
      meta: `R$ ${totalBuyin}`,
      badge: <StatusBadge status={session.status} />,
      onClick: () => router.push(`/dashboard/history?session=${session.id}`)
    }))}
  />
</div>
```

#### 3.2 Histórico de Sessões
**Arquivo:** `app/dashboard/history/page.tsx`

**Melhorias:**
```tsx
export default function HistoryPage() {
  // ... hooks

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Header com search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar local..."
            className="pl-10 h-11 bg-surface/50 border-border/30"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 md:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Filters - mobile: bottom sheet */}
      <BottomSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        title="Filtros"
      >
        <SessionFilters value={filters} onChange={setFilters} />
      </BottomSheet>

      {/* Sessions - mobile: list, desktop: table */}
      <div className="md:hidden">
        <MobileList
          items={filteredSessions.map(session => ({
            id: session.id,
            primary: session.location,
            secondary: new Date(session.date).toLocaleDateString('pt-BR'),
            meta: `${playerCount} jogadores`,
            badge: <StatusBadge status={session.status} />,
            actions: (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleView(session)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
            onClick: () => handleView(session)
          }))}
          emptyMessage="Nenhuma sessão encontrada"
        />
      </div>

      <div className="hidden md:block">
        <SessionsTable ... />
      </div>

      {/* FAB - Nova Sessão (apenas admins) */}
      {canCreateSession && (
        <FAB
          icon={<Plus className="h-5 w-5" />}
          label="Nova Sessão"
          onClick={() => router.push('/dashboard/new')}
        />
      )}
    </div>
  );
}
```

#### 3.3 Ranking
**Arquivo:** `app/dashboard/ranking/page.tsx`

**Melhorias:**
```tsx
export default function RankingPage() {
  return (
    <div className="space-y-4 md:space-y-8">
      {/* Top 3 - destaque mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 px-3 md:px-0">
        {topPlayers.slice(0, 3).map((player, index) => (
          <div
            key={player.id}
            className={cn(
              'relative rounded-xl p-4 text-center space-y-2',
              // Gradient backgrounds
              index === 0 && 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10',
              index === 1 && 'bg-gradient-to-br from-gray-400/20 to-gray-500/10',
              index === 2 && 'bg-gradient-to-br from-orange-600/20 to-orange-700/10'
            )}
          >
            {/* Medal icon */}
            <div className="mx-auto w-12 h-12 rounded-full bg-background flex items-center justify-center">
              {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
              {index === 1 && <Medal className="h-6 w-6 text-gray-400" />}
              {index === 2 && <Award className="h-6 w-6 text-orange-600" />}
            </div>
            
            {/* Player info */}
            <div className="space-y-1">
              <p className="font-semibold text-sm truncate">{player.name}</p>
              <p className="text-xs text-muted-foreground">
                R$ {player.profit.toFixed(0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Remaining players - mobile: list */}
      <div className="md:hidden px-3">
        <h2 className="text-lg font-semibold mb-3">Classificação</h2>
        <div className="bg-surface/30 rounded-xl divide-y divide-border/30">
          <MobileList
            items={playerStats.slice(3).map((player, index) => ({
              id: player.id,
              primary: (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs w-6">
                    #{index + 4}
                  </span>
                  <span>{player.name}</span>
                </div>
              ),
              secondary: `${player.sessionsPlayed} sessões`,
              meta: (
                <div className="text-right">
                  <p className={cn(
                    'font-semibold text-sm',
                    player.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {player.profit >= 0 ? '+' : ''}R$ {player.profit.toFixed(0)}
                  </p>
                </div>
              )
            }))}
          />
        </div>
      </div>
    </div>
  );
}
```

#### 3.4 Nova Sessão (Wizard)
**Arquivo:** `app/dashboard/new/page.tsx`

**Melhorias:**
```tsx
// Progress bar mais compacto em mobile
<WizardProgress 
  steps={steps}
  currentStep={step}
  className="mb-4 md:mb-8"
  compact // prop para mobile
/>

// Steps com padding reduzido
<div className="space-y-4 md:space-y-6">
  {step === 'create' && (
    <div className="bg-surface/30 rounded-xl p-4 md:bg-card md:p-6 md:shadow-sm">
      <SessionCreateStep ... />
    </div>
  )}
</div>

// Botões fixos no rodapé (mobile)
<div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/30 md:static md:bg-transparent md:border-0 md:mt-6">
  <div className="flex gap-3">
    <Button variant="outline" className="flex-1">
      Voltar
    </Button>
    <Button className="flex-1">
      Próximo
    </Button>
  </div>
</div>
```

---

### **Fase 4: Melhorias de Interação** ⚡

#### 4.1 Haptic Feedback (Web Vibration API)
```typescript
// lib/haptics.ts
export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20]);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 50, 20, 50, 20]);
    }
  }
};
```

**Aplicar em:**
- ✅ Botões de ação primária
- ✅ Confirmação de exclusão
- ✅ Sucesso/erro em forms
- ✅ Pull-to-refresh

#### 4.2 Touch Feedback Visual
```css
/* globals.css - adicionar */
@layer utilities {
  .touch-feedback {
    @apply active:scale-95 active:opacity-80 transition-all duration-100;
  }
  
  .touch-feedback-soft {
    @apply active:scale-98 active:opacity-90 transition-all duration-150;
  }
}
```

**Aplicar em:**
- ✅ Todos os botões
- ✅ Cards clicáveis
- ✅ List items

#### 4.3 Scroll Snap para Carrosséis
```tsx
// Quick actions com snap scroll
<div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
  <div className="flex gap-3 pb-2">
    {actions.map(action => (
      <div className="snap-center flex-shrink-0 w-40">
        {/* action card */}
      </div>
    ))}
  </div>
</div>
```

#### 4.4 Skeleton Loading States
```typescript
// components/ui/skeleton-card.tsx
export function SkeletonCard() {
  return (
    <div className="bg-surface/30 rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted/50" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-muted/50" />
          <div className="h-3 w-32 rounded bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
```

---

### **Fase 5: Tipografia e Hierarquia Visual** 📝

#### 5.1 Sistema de Tipografia Mobile-First
```typescript
// lib/typography.ts
export const typography = {
  display: {
    mobile: 'text-2xl font-bold tracking-tight',
    desktop: 'md:text-4xl'
  },
  title: {
    mobile: 'text-lg font-semibold',
    desktop: 'md:text-2xl'
  },
  subtitle: {
    mobile: 'text-sm font-medium',
    desktop: 'md:text-base'
  },
  body: {
    mobile: 'text-sm',
    desktop: 'md:text-base'
  },
  caption: {
    mobile: 'text-xs text-muted-foreground',
    desktop: 'md:text-sm'
  }
};
```

#### 5.2 Reduzir Hierarquia de Headings
```tsx
// Antes
<h1 className="text-3xl">Dashboard</h1>
<p className="text-sm">Descrição</p>

// Depois (mobile-first)
<div className="space-y-1">
  <h1 className="text-xl font-bold md:text-3xl">Dashboard</h1>
  <p className="text-xs text-muted-foreground md:text-sm">
    Descrição concisa
  </p>
</div>
```

---

### **Fase 6: Navegação e Gestos** 🔄

#### 6.1 Swipe para Ações
```typescript
// hooks/useSwipeGesture.ts
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const [startX, setStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (diff < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
  };

  return { handleTouchStart, handleTouchEnd };
}
```

**Aplicar em:**
- ✅ List items (swipe para deletar)
- ✅ Wizard steps (swipe para navegar)
- ✅ Image gallery

#### 6.2 Bottom Navigation (Mobile)
```typescript
// components/mobile-nav.tsx
export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Início' },
    { href: '/dashboard/history', icon: History, label: 'Histórico' },
    { href: '/dashboard/new', icon: Plus, label: 'Novo', primary: true },
    { href: '/dashboard/ranking', icon: Trophy, label: 'Ranking' },
    { href: '/dashboard/more', icon: Menu, label: 'Mais' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6"
              >
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/50">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn(
                'h-5 w-5',
                isActive && 'scale-110'
              )} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

### **Fase 7: Performance e Safe Areas** 🚀

#### 7.1 Safe Area Support (Notch, Home Indicator)
```css
/* globals.css */
@supports (padding: env(safe-area-inset-bottom)) {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }
  
  .pl-safe {
    padding-left: env(safe-area-inset-left);
  }
  
  .pr-safe {
    padding-right: env(safe-area-inset-right);
  }
}
```

#### 7.2 Viewport Meta Tag
```tsx
// app/layout.tsx
export const metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover' // Para safe areas
  }
}
```

#### 7.3 PWA Optimizations
```json
// public/manifest.json
{
  "name": "Poker Manager",
  "short_name": "Poker",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#0a0a0a",
  "orientation": "portrait",
  "start_url": "/dashboard",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## 📋 Checklist de Implementação

### ✅ Fase 1: Layout Foundation (Prioridade Alta)
- [ ] Criar `lib/mobile-utils.ts` com sistema de espaçamento
- [ ] Criar componente `MobileCard` 
- [ ] Refatorar Dashboard principal com espaçamento mobile
- [ ] Aplicar espaçamento responsivo em todos os layouts
- [ ] Remover nested cards em mobile

### ✅ Fase 2: Mobile Components (Prioridade Alta)
- [ ] Implementar `BottomSheet` component
- [ ] Criar `MobileList` component
- [ ] Adicionar `PullToRefresh` functionality
- [ ] Implementar `FAB` component
- [ ] Converter modais existentes para bottom sheets

### ✅ Fase 3: Pages Optimization (Prioridade Média)
- [ ] Refatorar `/dashboard/page.tsx`
- [ ] Refatorar `/dashboard/history/page.tsx`
- [ ] Refatorar `/dashboard/ranking/page.tsx`
- [ ] Refatorar `/dashboard/new/page.tsx`
- [ ] Converter tabelas para mobile lists

### ✅ Fase 4: Interactions (Prioridade Média)
- [ ] Implementar haptic feedback
- [ ] Adicionar touch feedback visual
- [ ] Implementar scroll snap para carrosséis
- [ ] Criar skeleton loading states
- [ ] Adicionar swipe gestures

### ✅ Fase 5: Navigation (Prioridade Baixa)
- [ ] Implementar bottom navigation (mobile)
- [ ] Adicionar swipe-to-go-back
- [ ] Otimizar breadcrumbs para mobile

### ✅ Fase 6: Polish (Prioridade Baixa)
- [ ] Ajustar tipografia mobile-first
- [ ] Implementar safe areas
- [ ] Otimizar PWA manifest
- [ ] Adicionar splash screens
- [ ] Testes em dispositivos reais

---

## 📊 Métricas de Sucesso

### Antes vs Depois

| Métrica | Antes | Depois (Meta) |
|---------|-------|---------------|
| Padding total (mobile) | ~48px | ~24px |
| Níveis de card nesting | 3-4 | 1-2 |
| Tap target size | 36px | 44px+ |
| Tempo para ação principal | 3 taps | 1-2 taps |
| Uso de espaço vertical | 60% | 85%+ |
| Lighthouse Performance | 80 | 90+ |

### Testes em Dispositivos

- [ ] iPhone SE (375px) - menor tela moderna
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Android médio (360px)
- [ ] Android grande (412px)
- [ ] Tablet (768px)

---

## 🎯 Exemplos Visuais

### Dashboard - Antes vs Depois

**Antes:**
```
┌─────────────────────────┐
│ [Padding 24px]          │
│ ┌───────────────────┐   │
│ │ Card [Shadow]     │   │  ← Card externo
│ │ ┌───────────────┐ │   │
│ │ │ Header 18px   │ │   │
│ │ └───────────────┘ │   │
│ │ ┌───────────────┐ │   │
│ │ │ Card Content  │ │   │  ← Card interno
│ │ │ ┌───────────┐ │ │   │
│ │ │ │ Stats     │ │ │   │  ← Card nested
│ │ │ └───────────┘ │ │   │
│ │ └───────────────┘ │   │
│ └───────────────────┘   │
│ [Padding 24px]          │
└─────────────────────────┘
```

**Depois:**
```
┌─────────────────────────┐
│ [Padding 12px]          │
│ Stats                   │  ← Direto, sem card
│ ┌─────┬─────┬─────┐    │
│ │ 42  │ 8   │ R$  │    │  ← Grid compacto
│ └─────┴─────┴─────┘    │
│                         │
│ Ações Rápidas          │
│ [← → Scroll]           │  ← Horizontal scroll
│ [Nova] [Histórico]     │
│                         │
│ Sessões Recentes       │
│ ┌─────────────────┐    │
│ │ Item 1          │    │  ← List view
│ ├─────────────────┤    │
│ │ Item 2          │    │
│ └─────────────────┘    │
└─────────────────────────┘
```

---

## 🔄 Ordem de Implementação Recomendada

1. **Semana 1: Foundation**
   - Sistema de espaçamento mobile
   - MobileCard component
   - Refatorar dashboard principal

2. **Semana 2: Core Components**
   - BottomSheet para modais
   - MobileList para tabelas
   - FAB implementation

3. **Semana 3: Pages Refactor**
   - Histórico + Ranking
   - Nova sessão wizard
   - Pull-to-refresh

4. **Semana 4: Polish & Test**
   - Haptics e interactions
   - Bottom navigation
   - Testes em dispositivos reais

---

## 💻 Comandos Úteis

```bash
# Desenvolver com mobile view
npm run dev
# Abrir no navegador em: http://localhost:3000
# Pressionar F12 → Toggle Device Toolbar (Ctrl+Shift+M)

# Build e test
npm run build
npm run start

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## 📚 Recursos e Referências

### Design Inspiration
- **iOS HIG**: https://developer.apple.com/design/human-interface-guidelines/
- **Material Design 3**: https://m3.material.io/
- **Tailwind Mobile Patterns**: https://tailwindui.com/

### Libraries Úteis
- `framer-motion` - Animações (já instalado)
- `react-intersection-observer` - Lazy loading
- `vaul` - Bottom sheet nativo (considerar)

### Métricas
- **Lighthouse** - Performance e PWA audit
- **PageSpeed Insights** - Mobile performance
- **Can I Use** - Browser support

---

## ✨ Resultado Esperado

Uma aplicação que:
1. ✅ **Parece nativa** - Sem excesso de borders e sombras
2. ✅ **Usa bem o espaço** - Cada pixel tem propósito
3. ✅ **É rápida** - Feedback imediato nas interações
4. ✅ **É intuitiva** - Gestos e padrões nativos
5. ✅ **É consistente** - Desktop ainda funciona perfeitamente

---

**Desenvolvido para transformar a experiência mobile do Poker Manager! 🎯♠️📱**
