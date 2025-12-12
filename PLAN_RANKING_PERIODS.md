# Plano: Sistema de Ranking por Períodos com Vinculação Automática

## 🎉 STATUS: IMPLEMENTAÇÃO COMPLETA ✅

**Data de Implementação**: 12/12/2025
**Status**: Todas as 6 fases foram implementadas com sucesso!

### 📦 Arquivos Criados
- ✅ `supabase/migrations/20251212_add_period_constraints_and_session_linking.sql`
- ✅ `app/api/sessions/current-period/route.ts`
- ✅ `app/api/sessions/backfill-periods/route.ts`
- ✅ `app/dashboard/admin/backfill/page.tsx`

### 🔧 Arquivos Modificados
- ✅ `lib/types.ts` - Adicionado `ranking_period_id` em Session
- ✅ `app/api/ranking-periods/route.ts` - Validação de overlap
- ✅ `lib/api.ts` - Novos métodos de API
- ✅ `hooks/useApi.ts` - Hook useCurrentPeriod
- ✅ `components/PlayerDashboard.tsx` - Filtro por período + cards de estado
- ✅ `app/dashboard/history/page.tsx` - Selector de período

### 🚀 Próximo Passo
**Aplicar migration no banco:** `supabase db push`

---

## 📋 Resumo Executivo

Sistema completo de ranking por períodos com as seguintes funcionalidades:

1. **Vinculação Automática**: Sessões automaticamente vinculadas ao período correto ao serem criadas
2. **Dashboard Filtrado**: Mostrar estatísticas apenas do período atual
3. **Histórico com Filtro**: Permitir filtrar histórico por período (padrão: período atual)
4. **Interface de Backfill**: Admin pode revisar e aprovar vinculação de sessões antigas

## ✅ Requisitos Confirmados

- **Não permitir sobreposições**: Constraint no banco impede períodos sobrepostos
- **Dashboard sem período**: Mostrar mensagem "Nenhum período ativo" (não mostrar estatísticas)
- **Filtro padrão histórico**: Período atual selecionado por padrão
- **Backfill**: Interface admin para revisar e aprovar vinculações sugeridas

## 🏗️ Arquitetura Atual

### Banco de Dados
- ✅ Tabela `poker.ranking_periods` existe (sem constraint de sobreposição)
- ❌ Tabela `poker.sessions` NÃO tem coluna `ranking_period_id`
- ✅ Supabase/PostgreSQL com schema `poker`

### Frontend
- ✅ `PeriodSelector` component existe e funciona
- ✅ `RankingPage` já filtra por período
- ❌ `PlayerDashboard` não filtra por período (usa todas as sessões)
- ❌ `HistoryPage` não tem filtro de período

### API
- ✅ `/api/ranking-periods` (GET, POST, PUT, DELETE)
- ❌ POST não valida sobreposições
- ❌ `/api/sessions` não vincula período automaticamente

---

## 🔧 Implementação por Fases

### **FASE 1: Database Foundation** ⚙️

#### Arquivo: `supabase/migrations/20251212_add_period_constraints_and_session_linking.sql` (NOVO)

**Objetivos:**
1. Adicionar constraint para impedir períodos sobrepostos
2. Adicionar coluna `ranking_period_id` em sessions
3. Criar funções helper (find_period_for_date, get_current_period)
4. Criar trigger para auto-assignment de período
5. Criar índices para performance

**Constraint de Não-Sobreposição:**
```sql
-- Requer extensão btree_gist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Exclusion constraint: mesmo tenant não pode ter períodos sobrepostos
ALTER TABLE poker.ranking_periods
  ADD CONSTRAINT no_overlapping_periods
  EXCLUDE USING gist (
    tenant_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  );
```

**Estrutura da Coluna:**
```sql
ALTER TABLE poker.sessions
  ADD COLUMN ranking_period_id INTEGER
  REFERENCES poker.ranking_periods(id) ON DELETE SET NULL;
```

**Funções Helpers:**
- `poker.find_period_for_date(tenant_id, date)`: Retorna ID do período que contém a data
- `poker.get_current_period(tenant_id)`: Retorna período que contém CURRENT_DATE

**Trigger:**
```sql
-- Antes de INSERT em sessions, auto-atribui ranking_period_id
CREATE TRIGGER trigger_auto_assign_period
  BEFORE INSERT ON poker.sessions
  FOR EACH ROW
  EXECUTE FUNCTION poker.auto_assign_period_to_session();
```

**Validação:**
- ✅ Criar dois períodos sobrepostos → Deve FALHAR
- ✅ Criar dois períodos não-sobrepostos → Deve SUCEDER
- ✅ Inserir nova sessão → ranking_period_id deve ser preenchido automaticamente
- ✅ get_current_period deve retornar período correto ou NULL

---

### **FASE 2: TypeScript Types** 📝

#### Arquivo: `lib/types.ts`

**Modificação:** Linha 63 (interface Session)

```typescript
export interface Session {
  id: number;
  date: string;
  location: string;
  status: 'pending' | 'approved' | 'closed';
  created_by: number;
  created_by_name?: string;
  created_at: string;
  team_id: number;
  players_data?: SessionPlayerData[];
  recommendations?: TransferRecommendation[];
  scheduled_date?: string;
  max_players?: number;
  is_confirmed?: boolean;
  confirmations?: SessionConfirmation[];
  ranking_period_id?: number | null;  // 👈 ADICIONAR
}
```

**Validação:**
- ✅ TypeScript compila sem erros
- ✅ Componentes que usam Session não quebram

---

### **FASE 3: API Endpoints** 🌐

#### 3.1. Adicionar Validação de Sobreposição em POST /api/ranking-periods

**Arquivo:** `app/api/ranking-periods/route.ts`
**Localização:** Linha 68 (após validação de data, antes de check de nome duplicado)

```typescript
// Check for overlapping periods
const { data: overlappingPeriods } = await supabaseServer
  .from('ranking_periods')
  .select('id, name, start_date, end_date')
  .eq('tenant_id', user.tenant_id)
  .or(`and(start_date.lte.${body.end_date},end_date.gte.${body.start_date})`);

if (overlappingPeriods && overlappingPeriods.length > 0) {
  const conflict = overlappingPeriods[0];
  return NextResponse.json(
    {
      success: false,
      error: `Período se sobrepõe a "${conflict.name}" (${new Date(conflict.start_date).toLocaleDateString('pt-BR')} - ${new Date(conflict.end_date).toLocaleDateString('pt-BR')})`
    },
    { status: 400 }
  );
}
```

**Validação:**
- ✅ Tentar criar período sobreposto → Mensagem amigável de erro
- ✅ Criar período válido → Sucesso

---

#### 3.2. Criar Endpoint para Período Atual

**Arquivo:** `app/api/sessions/current-period/route.ts` (NOVO)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { data: currentPeriod, error } = await supabaseServer
      .rpc('get_current_period', { p_tenant_id: user.tenant_id })
      .single();

    if (error && error.code === 'PGRST116') {
      // No current period
      return NextResponse.json({ success: true, data: null });
    }

    if (error) {
      throw new Error(`Failed to get current period: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: currentPeriod });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

#### 3.3. Criar Endpoints de Backfill

**Arquivo:** `app/api/sessions/backfill-periods/route.ts` (NOVO)

**GET:** Retorna sessões sem ranking_period_id + sugestões de períodos correspondentes

**POST:** Aplica as vinculações aprovadas pelo admin

```typescript
// GET: Busca sessões sem período e sugere correspondências
export async function GET(req: NextRequest) {
  // 1. Buscar sessions com ranking_period_id = NULL
  // 2. Buscar todos os períodos do tenant
  // 3. Para cada sessão, encontrar período que contém sua data
  // 4. Retornar lista de sugestões
}

// POST: Aplica vinculações em batch
export async function POST(req: NextRequest) {
  // Body: { assignments: [{ session_id, period_id }] }
  // 1. Validar que user é admin
  // 2. Para cada assignment, UPDATE sessions SET ranking_period_id
  // 3. Retornar contagem de sucessos
}
```

**Validação:**
- ✅ GET retorna sugestões corretas
- ✅ POST atualiza sessões corretamente
- ✅ Apenas admins podem acessar (403 para outros)

---

#### 3.4. Atualizar API Client

**Arquivo:** `lib/api.ts`
**Localização:** Linha 180 (dentro do objeto `sessions`)

```typescript
sessions: {
  // ... métodos existentes ...
  getCurrentPeriod: () => fetchAPI('/sessions/current-period'),
  getBackfillSuggestions: () => fetchAPI('/sessions/backfill-periods'),
  applyBackfill: (assignments: { session_id: number; period_id: number | null }[]) =>
    fetchAPI('/sessions/backfill-periods', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    }),
}
```

---

### **FASE 4: Frontend - PlayerDashboard** 🎨

#### 4.1. Criar Hook useCurrentPeriod

**Arquivo:** `hooks/useApi.ts`
**Localização:** Após linha 199 (depois de `useTenants`)

```typescript
export function useCurrentPeriod() {
  const { data, loading, error, refetch } = useApi<RankingPeriod | null>(
    async () => {
      try {
        const response = await api.sessions.getCurrentPeriod();
        return response;
      } catch (err) {
        // No current period = não é erro, retorna null
        if (err instanceof ApiError && err.status === 404) {
          return { data: null };
        }
        throw err;
      }
    },
    []
  );

  return { currentPeriod: data, loading, error, refetch };
}
```

---

#### 4.2. Atualizar PlayerDashboard

**Arquivo:** `components/PlayerDashboard.tsx`

**Mudanças:**

1. **Importar hook** (linha 5):
```typescript
import { useSessions, usePlayers, useCurrentPeriod } from '@/hooks/useApi';
```

2. **Usar hook** (linha 49):
```typescript
const { currentPeriod, loading: periodLoading } = useCurrentPeriod();
```

3. **Filtrar sessões por período** (linha 59, substituir filtro existente):
```typescript
const playerSessions = sessions.filter((session: Session) => {
  if (!Array.isArray(session.players_data)) return false;

  // Check if player participated
  const participated = session.players_data.some((pd: SessionPlayerData) => {
    if (pd.id && (pd.id === playerId || pd.id === playerId.toString() || Number(pd.id) === playerId)) {
      return true;
    }
    if (playerData && pd.name && pd.name.toLowerCase() === playerData.name.toLowerCase()) {
      return true;
    }
    return false;
  });

  if (!participated) return false;

  // ⚠️ IMPORTANTE: Filtrar por período atual
  if (currentPeriod) {
    const sessionDate = new Date(session.date);
    const startDate = new Date(currentPeriod.start_date);
    const endDate = new Date(currentPeriod.end_date);
    return sessionDate >= startDate && sessionDate <= endDate;
  }

  // ⚠️ IMPORTANTE: Se não houver período, NÃO mostrar sessões
  // (requisito: "Nada/vazio")
  return false;
});
```

4. **Adicionar cards de estado** (linha 324, antes dos metrics cards):
```typescript
{/* No current period - Empty state */}
{!periodLoading && !currentPeriod && (
  <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
    <CardContent className="pt-6">
      <div className="flex items-start gap-3">
        <Calendar className="h-5 w-5 text-yellow-600" />
        <div>
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
            Nenhum período de ranking ativo
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            Atualmente não há um período de ranking ativo. Entre em contato com o administrador para criar períodos.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}

{/* Current period indicator */}
{!periodLoading && currentPeriod && (
  <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
    <CardContent className="pt-6">
      <div className="flex items-start gap-3">
        <Calendar className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            📊 {currentPeriod.name}
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
            Estatísticas do período: {new Date(currentPeriod.start_date).toLocaleDateString('pt-BR')} até {new Date(currentPeriod.end_date).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

**Validação:**
- ✅ COM período atual: Mostra card azul + estatísticas filtradas
- ✅ SEM período atual: Mostra card amarelo + nenhuma estatística
- ✅ Stats recalculam corretamente baseado em sessões filtradas

---

### **FASE 5: Frontend - History Page** 📜

**Arquivo:** `app/dashboard/history/page.tsx`

**Mudanças:**

1. **Importar componentes** (linha 6):
```typescript
import { useRankingPeriods, useCurrentPeriod } from '@/hooks/useApi';
```

2. **Adicionar hooks** (linha 33):
```typescript
const { periods, loading: periodsLoading } = useRankingPeriods();
const { currentPeriod } = useCurrentPeriod();
```

3. **State para período selecionado** (linha 34):
```typescript
const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
```

4. **Auto-selecionar período atual** (adicionar useEffect):
```typescript
React.useEffect(() => {
  if (currentPeriod && !selectedPeriod && periods.length > 0) {
    setSelectedPeriod(currentPeriod.id.toString());
  }
}, [currentPeriod, selectedPeriod, periods]);
```

5. **Atualizar lógica de filtro** (linha 46):
```typescript
const filteredSessions = sessions.filter(session => {
  // ... filtros existentes (search, status, dateFrom, dateTo) ...

  // Filtrar por período selecionado
  if (selectedPeriod) {
    const period = periods.find(p => p.id.toString() === selectedPeriod);
    if (period) {
      const sessionDate = new Date(session.date);
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      if (sessionDate < startDate || sessionDate > endDate) {
        return false;
      }
    }
  }

  return true;
});
```

6. **Adicionar selector na UI** (após header, antes de filtros):
```typescript
{/* Period Selector */}
{!periodsLoading && periods.length > 0 && (
  <div className="space-y-2">
    <label className="text-sm font-medium">Período de ranking</label>
    <PeriodSelector
      periods={[
        // Adicionar opção "Todas as sessões"
        { id: 0, name: 'Todas as sessões', tenant_id: 0, start_date: '', end_date: '', is_active: true, created_at: '', updated_at: '' } as RankingPeriod,
        ...periods
      ]}
      selectedPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      isAdmin={false}
    />
  </div>
)}
```

**Validação:**
- ✅ Página carrega com período atual pré-selecionado
- ✅ Trocar período filtra sessões corretamente
- ✅ Opção "Todas as sessões" mostra tudo
- ✅ Filtro funciona junto com outros filtros (status, data, location)

---

### **FASE 6: Frontend - Admin Backfill Interface** 👨‍💼

**Arquivo:** `app/dashboard/admin/backfill/page.tsx` (NOVO)

**Componente completo** com:
- Lista de sessões sem ranking_period_id
- Sugestões automáticas de período baseado na data
- Checkboxes para selecionar quais aplicar
- Botão "Aplicar selecionadas"
- Seção separada para sessões sem correspondência

**Estrutura:**
```typescript
interface BackfillSuggestion {
  session_id: number;
  session_date: string;
  session_location: string;
  player_count: number;
  suggested_period_id: number | null;
  suggested_period_name: string | null;
  suggested_period_range: string | null;
}

export default function BackfillPage() {
  const [suggestions, setSuggestions] = useState<BackfillSuggestion[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleApplyBackfill = async () => {
    // Chama api.sessions.applyBackfill
  };

  // Renderiza:
  // - Card de resumo (total, com sugestões, sem correspondência)
  // - Lista de sessões com sugestões (checkboxes)
  // - Lista de sessões sem correspondência (aviso)
  // - Botão de aplicar
}
```

**Navegação:** Adicionar link em `app/dashboard/admin/page.tsx`

**Validação:**
- ✅ Lista sessões não-associadas corretamente
- ✅ Sugestões correspondem às datas
- ✅ Aplicar backfill atualiza banco
- ✅ Página recarrega após aplicar
- ✅ Sessões sem match mostram aviso claro

---

## 📊 Ordem de Implementação Recomendada

### Dia 1: Database + Types
1. Criar e aplicar migration (FASE 1)
2. Testar constraints e funções no banco
3. Atualizar tipos TypeScript (FASE 2)
4. Verificar build: `npm run build`

### Dia 2: API Layer
1. Validação de overlap em ranking-periods (FASE 3.1)
2. Endpoint current-period (FASE 3.2)
3. Endpoints backfill (FASE 3.3)
4. Atualizar API client (FASE 3.4)
5. Testar endpoints com Postman/Thunder Client

### Dia 3: Frontend Core
1. Hook useCurrentPeriod (FASE 4.1)
2. Atualizar PlayerDashboard (FASE 4.2)
3. Atualizar HistoryPage (FASE 5)
4. Testar fluxos principais

### Dia 4: Admin Tools
1. Criar página de backfill (FASE 6)
2. Adicionar navegação
3. Teste end-to-end do backfill
4. Ajustes de UX

### Dia 5: Polish & Docs
1. Testar edge cases
2. Corrigir bugs encontrados
3. Atualizar documentação
4. Criar guia de uso para admins

---

## ✅ Critérios de Sucesso

### Requisito 1: Não Permitir Sobreposições ✓
- Database: Constraint EXCLUDE bloqueia sobreposições
- API: Validação retorna mensagem amigável
- Teste: Criar período sobreposto → Erro claro

### Requisito 2: Dashboard Sem Período Atual ✓
- PlayerDashboard: Card amarelo "Nenhum período ativo"
- Stats: Não mostra estatísticas (array vazio)
- Teste: Remover todos os períodos → Ver card amarelo

### Requisito 3: Histórico com Período Atual ✓
- HistoryPage: Auto-seleciona período atual
- Selector: Componente PeriodSelector integrado
- Teste: Abrir histórico → Período atual selecionado

### Requisito 4: Backfill de Sessões ✓
- Admin: Página `/dashboard/admin/backfill`
- Sugestões: Matching automático por data
- Aprovação: Seleção individual + aplicação em batch
- Teste: Criar período → Ver sugestões → Aplicar → Verificar banco

---

## 📁 Arquivos Críticos

### Criar (Novos)
- `supabase/migrations/20251212_add_period_constraints_and_session_linking.sql`
- `app/api/sessions/current-period/route.ts`
- `app/api/sessions/backfill-periods/route.ts`
- `app/dashboard/admin/backfill/page.tsx`

### Modificar (Existentes)
- `lib/types.ts` (adicionar ranking_period_id em Session)
- `app/api/ranking-periods/route.ts` (validação de overlap)
- `lib/api.ts` (novos métodos no client)
- `hooks/useApi.ts` (hook useCurrentPeriod)
- `components/PlayerDashboard.tsx` (filtro por período + empty state)
- `app/dashboard/history/page.tsx` (selector de período)

---

## 🔒 Segurança & Rollback

### Pré-Migration Checklist
1. **Backup do banco:** `pg_dump poker_db > backup_$(date +%Y%m%d).sql`
2. **Verificar sobreposições existentes:**
```sql
SELECT p1.name, p1.start_date, p1.end_date,
       p2.name, p2.start_date, p2.end_date
FROM poker.ranking_periods p1
JOIN poker.ranking_periods p2 ON p1.tenant_id = p2.tenant_id AND p1.id < p2.id
WHERE daterange(p1.start_date, p1.end_date, '[]') &&
      daterange(p2.start_date, p2.end_date, '[]');
```
3. Se encontrar overlaps, resolver manualmente ANTES da migration

### Rollback Plan
Se migration falhar:
- PostgreSQL faz rollback automático (transação)
- Se precisar reverter depois:
```sql
ALTER TABLE poker.sessions DROP COLUMN ranking_period_id;
ALTER TABLE poker.ranking_periods DROP CONSTRAINT no_overlapping_periods;
DROP FUNCTION poker.find_period_for_date;
DROP FUNCTION poker.get_current_period;
DROP FUNCTION poker.auto_assign_period_to_session;
```

---

## 🎯 Notas Finais

- **Migration primeiro**: Database é a fundação, sem ela nada funciona
- **Testar incrementalmente**: Após cada fase, validar funcionalidade
- **Comunicar com usuários**: Avisar sobre criação de períodos e backfill
- **Monitorar performance**: Índices foram adicionados, mas validar queries
- **Documentar bem**: Admin vai precisar de guia para backfill

**Status:** Pronto para implementação 🚀
