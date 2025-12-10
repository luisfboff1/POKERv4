# Ranking por Períodos (Semestres) - Guia de Uso

## Visão Geral

Esta funcionalidade permite que administradores criem períodos personalizados de ranking (semestres, trimestres, meses, etc.) e vejam o ranking histórico de jogadores para cada período.

## Funcionalidades

### Para Todos os Usuários

- **Ranking Atual**: Visualize o ranking geral com todas as sessões (padrão)
- **Rankings Históricos**: Selecione um período específico para ver o ranking daquele intervalo de tempo
- **Filtros**: Rankings são calculados dinamicamente baseados apenas nas sessões dentro do período selecionado

### Para Administradores

- **Criar Períodos**: Definir novos períodos com nome, descrição e intervalo de datas
- **Editar Períodos**: Modificar períodos existentes
- **Excluir Períodos**: Remover períodos que não são mais necessários
- **Gerenciar Status**: Ativar/desativar períodos

## Como Usar

### Visualizar Rankings por Período

1. Acesse a página **Ranking** no menu principal
2. Use o seletor de período no topo da página:
   - **"Ranking Atual"** = Todas as sessões (padrão)
   - Selecione um período histórico específico para filtrar

### Criar um Novo Período (Admin)

1. Na página de Ranking, clique no botão **"Novo período"**
2. Preencha o formulário:
   - **Nome**: Ex: "1º Semestre 2024", "Novembro 2024"
   - **Descrição**: (Opcional) Detalhes adicionais sobre o período
   - **Data inicial**: Data de início do período
   - **Data final**: Data de término do período
   - **Período ativo**: Marque para tornar o período visível
3. Clique em **"Criar"**

### Editar um Período (Admin)

1. Selecione o período desejado no seletor
2. Clique no ícone de **edição** (lápis) que aparece abaixo do seletor
3. Modifique os campos desejados
4. Clique em **"Atualizar"**

### Excluir um Período (Admin)

1. Selecione o período desejado no seletor
2. Clique no ícone de **exclusão** (lixeira) que aparece abaixo do seletor
3. Confirme a exclusão

## Exemplos de Uso

### Semestres
```
Nome: 1º Semestre 2024
Data inicial: 2024-01-01
Data final: 2024-06-30
```

```
Nome: 2º Semestre 2024
Data inicial: 2024-07-01
Data final: 2024-12-31
```

### Trimestres
```
Nome: Q1 2024
Data inicial: 2024-01-01
Data final: 2024-03-31
```

### Meses
```
Nome: Novembro 2024
Data inicial: 2024-11-01
Data final: 2024-11-30
```

### Eventos Especiais
```
Nome: Torneio de Verão
Descrição: Torneio especial realizado no verão
Data inicial: 2024-12-20
Data final: 2025-01-10
```

## Cálculo de Estatísticas

Quando um período é selecionado:

- **Sessões**: Apenas sessões com data entre `start_date` e `end_date` são incluídas
- **Estatísticas**: Todas as métricas são recalculadas dinamicamente:
  - Total de sessões jogadas
  - Total de buy-in
  - Total de cash-out
  - Lucro/prejuízo
  - Lucro por sessão
  - Taxa de vitória
  - Maior ganho
  - Maior perda

## Isolamento Multi-Tenant

- Cada tenant (grupo/organização) tem seus próprios períodos
- Períodos não são compartilhados entre tenants
- Apenas administradores do tenant podem gerenciar períodos

## API Endpoints

Para desenvolvedores que desejam integrar com a API:

### Listar Períodos
```
GET /api/ranking-periods
```

### Criar Período
```
POST /api/ranking-periods
Body: {
  "name": "1º Semestre 2024",
  "description": "Descrição opcional",
  "start_date": "2024-01-01",
  "end_date": "2024-06-30",
  "is_active": true
}
```

### Atualizar Período
```
PUT /api/ranking-periods/{id}
Body: {
  "name": "Novo nome",
  ...
}
```

### Excluir Período
```
DELETE /api/ranking-periods/{id}
```

## Banco de Dados

A tabela `poker.ranking_periods` armazena os períodos com:
- `id`: ID único
- `tenant_id`: ID do tenant (isolamento multi-tenant)
- `name`: Nome do período
- `description`: Descrição opcional
- `start_date`: Data inicial
- `end_date`: Data final
- `is_active`: Status ativo/inativo
- `created_by`: ID do usuário que criou
- `created_at`, `updated_at`: Timestamps

## Migração

Para aplicar a migração do banco de dados:

```bash
supabase db push --project-ref jhodhxvvhohygijqcxbo
```

Arquivo de migração: `supabase/migrations/20251210191024_create_ranking_periods.sql`

## Notas Importantes

1. **Datas**: Use formato ISO (YYYY-MM-DD)
2. **Validação**: Data final deve ser >= data inicial
3. **Nomes únicos**: Cada período deve ter nome único dentro do tenant
4. **Períodos sobrepostos**: São permitidos (ex: semestres e meses podem se sobrepor)
5. **Auditoria**: Todas as operações CRUD são registradas em `audit_logs`

## Segurança

- RLS (Row Level Security) garante isolamento entre tenants
- Apenas admins podem criar/editar/excluir períodos
- Todos os usuários podem visualizar períodos do seu tenant
