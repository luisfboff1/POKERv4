# DataTable Implementation - Conversão de Cards para Tabelas

## Resumo
Implementação de um componente `DataTable` avançado e reutilizável que substitui as visualizações baseadas em cards por tabelas customizáveis em todas as etapas de sessão, histórico e ranking.

## Componente DataTable

### Localização
`/components/ui/data-table.tsx`

### Funcionalidades Principais

#### 1. **Ordenação (Sorting)**
- Click nos headers das colunas para ordenar
- Suporte para ordenação ascendente/descendente
- Indicador visual com ícone de seta
- Componente auxiliar `DataTableColumnHeader` para headers ordenáveis

#### 2. **Filtragem (Filtering)**
- Campo de busca/filtro por coluna específica
- Busca em tempo real
- Placeholder customizável
- Pode ser habilitado/desabilitado por tabela

#### 3. **Visibilidade de Colunas**
- Botão "Colunas" para abrir painel de configuração
- Checkboxes para mostrar/ocultar cada coluna
- Layout responsivo do painel (grid 2-4 colunas)
- Estado persistido durante a sessão

#### 4. **Responsividade Mobile**
- `overflow-auto` para scroll horizontal em telas pequenas
- Texto truncado com `max-w-[200px]` e `truncate`
- Atributo `title` para ver texto completo em hover
- Headers com `whitespace-nowrap` para evitar quebra

#### 5. **Customização**
- Props para habilitar/desabilitar cada feature
- Suporte para click em linha (`onRowClick`)
- Classes CSS customizáveis
- Estilo consistente com shadcn/ui

### Props do DataTable

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];     // Definição das colunas
  data: TData[];                            // Dados a exibir
  searchKey?: string;                       // Chave da coluna para busca
  searchPlaceholder?: string;               // Placeholder do input de busca
  onRowClick?: (row: TData) => void;       // Callback de click na linha
  className?: string;                       // Classes CSS extras
  enableColumnVisibility?: boolean;         // Habilitar controle de colunas
  enableSorting?: boolean;                  // Habilitar ordenação
  enableFiltering?: boolean;                // Habilitar filtragem
}
```

## Implementações por Página

### 1. SessionPlayersStep (`/app/dashboard/new/steps/SessionPlayersStep.tsx`)

**Antes:** Cards individuais para cada jogador
**Depois:** Tabela com colunas:
- Jogador (com número de posição)
- Buy-in
- Ações (botão remover)

**Features Habilitadas:**
- ✅ Ordenação
- ✅ Filtragem por nome
- ✅ Visibilidade de colunas

### 2. SessionActiveStep (`/app/dashboard/new/steps/SessionActiveStep.tsx`)

**Antes:** Tabela HTML básica
**Depois:** DataTable avançado com colunas:
- Jogador
- Buy-in inicial
- Rebuys (com botões para adicionar/editar/remover)
- Janta (input editável)
- Total (buy-in + rebuys)
- Ações (botão adicionar rebuy)

**Features Habilitadas:**
- ✅ Ordenação
- ✅ Filtragem por nome
- ✅ Visibilidade de colunas

**Funcionalidades Especiais:**
- Inputs editáveis dentro das células (janta)
- Chips com valores de rebuys individuais
- Botões de ação em cada rebuy (editar/remover)
- Modal de confirmação para remover rebuys

### 3. SessionCashoutStep (`/app/dashboard/new/steps/SessionCashoutStep.tsx`)

**Antes:** Cards/divs com grid layout
**Depois:** Tabela com colunas:
- Jogador (com informações de buy-in e janta)
- Cash-out (input editável)
- Resultado (calculado automaticamente, colorido)

**Features Habilitadas:**
- ✅ Ordenação
- ✅ Filtragem por nome
- ✅ Visibilidade de colunas

**Funcionalidades Especiais:**
- Inputs editáveis dentro das células
- Cálculo automático de lucro/prejuízo
- Cores condicionais (verde para lucro, vermelho para prejuízo)

### 4. SessionsTable (`/app/dashboard/history/components/sessions-table.tsx`)

**Antes:** Tabela básica com Table component
**Depois:** DataTable avançado com colunas:
- Data
- Local
- Jogadores
- Total Buy-in
- Total Cash-out
- Status (com ícone)
- Ações (visualizar/deletar)

**Features Habilitadas:**
- ✅ Ordenação
- ✅ Filtragem por local
- ✅ Visibilidade de colunas

### 5. Ranking Table (`/app/dashboard/ranking/page.tsx`)

**Antes:** Tabela básica com Table component
**Depois:** DataTable avançado com colunas:
- Posição (com ícones de troféu para top 3)
- Jogador (nome + email)
- Sessões
- Buy-in Total
- Cash-out Total
- Lucro Total (com ícone de tendência)
- Lucro/Sessão
- Taxa de Vitória
- Maior Ganho
- Maior Perda

**Features Habilitadas:**
- ✅ Ordenação
- ✅ Filtragem por nome
- ✅ Visibilidade de colunas

**Funcionalidades Especiais:**
- Ícones especiais para top 3 (troféu, medalha, prêmio)
- Indicadores visuais de tendência (seta para cima/baixo)
- Cores condicionais para valores positivos/negativos

## Dependências Adicionadas

```json
{
  "@tanstack/react-table": "^8.x.x"
}
```

## Padrão de Definição de Colunas

```typescript
const columns: ColumnDef<DataType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    cell: ({ row }) => row.getValue("name"),
  },
  {
    id: "custom",
    header: "Ações",
    cell: ({ row }) => (
      <Button onClick={(e) => {
        e.stopPropagation(); // Prevenir propagação se houver onRowClick
        handleAction(row.original);
      }}>
        Ação
      </Button>
    ),
  },
];
```

## Boas Práticas Implementadas

### 1. **Stop Propagation em Ações**
Quando há `onRowClick` definido, usar `e.stopPropagation()` em botões e inputs dentro das células

### 2. **Headers Ordenáveis**
Usar `DataTableColumnHeader` para colunas que devem ser ordenáveis

### 3. **Formatação Consistente**
Usar helpers de formatação (`formatCurrency`) para manter consistência

### 4. **Acessibilidade**
- Headers com `title` attribute
- Texto truncado com tooltip via `title`
- Cores com contraste adequado
- Botões com labels descritivos

## Conclusão

A implementação do DataTable fornece uma solução robusta, escalável e customizável para visualização de dados tabulares em todo o sistema. Todas as features requisitadas foram implementadas:

✅ Tabelas com shadcn/ui
✅ Responsivo para mobile
✅ Totalmente customizável
✅ Ocultar/mostrar colunas
✅ Texto respeitando tamanho da coluna
✅ Colunas adaptam ao tamanho da tabela
✅ Ordenação
✅ Filtros por jogador
✅ Componente reutilizável usado em múltiplas páginas
