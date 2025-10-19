# 🎮 Arquitetura: Players vs Users

## Conceito

### **Players (Jogadores)**
- São pessoas que **jogam poker**
- **NÃO precisam ter conta/login**
- Podem ser adicionados por qualquer admin do tenant
- Armazenam **estatísticas de jogo** (sessions, buyin, cashout, profit, etc.)

### **Users (Usuários)**
- São pessoas com **conta de login** no sistema
- **SEMPRE têm email e senha**
- Podem ter diferentes roles: `super_admin`, `admin`, `player`
- Acessam o dashboard para gerenciar sessions

---

## Relação entre Players e Users

### Cenário 1: Player SEM conta
```
Player: "João Silva"
  ├─ Criado pelo admin
  ├─ Joga nas sessões
  ├─ Tem estatísticas
  └─ user_id: NULL (não tem conta)
```

### Cenário 2: Player COM conta
```
Player: "Maria Santos"
  ├─ Criado pelo admin
  ├─ Joga nas sessões
  ├─ Tem estatísticas
  └─ user_id: 5 ──┐
                  │
User: "maria@example.com"  ◄─┘
  ├─ Pode fazer login
  ├─ Ver suas próprias stats
  └─ player_id: 3 (referência bidirecional)
```

---

## Fluxos de Uso

### 1. Adicionar Player Novo (sem conta)
```
POST /api/players
{
  "name": "Carlos Oliveira",
  "nickname": "Carlão",
  "phone": "11999999999"
}

→ Cria player
→ user_id = NULL
→ Player pode jogar imediatamente
```

### 2. Convidar Player para ter conta
```
POST /api/invites
{
  "player_id": 10,  // Carlos Oliveira
  "email": "carlos@example.com",
  "role": "player"
}

→ Envia email com link de ativação
→ Carlos cria senha
→ Cria user com email
→ Vincula: users.player_id = 10 e players.user_id = [novo_id]
```

### 3. Criar User direto (com player automático)
```
POST /api/auth/register
{
  "name": "Ana Costa",
  "email": "ana@example.com",
  "password": "senha123"
}

→ Cria user
→ Cria player automaticamente com mesmo nome
→ Vincula ambos
```

---

## Estrutura das Tabelas

### `players`
```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  phone VARCHAR(50),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Vínculo com usuário (OPCIONAL)
  user_id INTEGER REFERENCES users(id),
  
  -- Estatísticas de poker
  total_sessions INTEGER DEFAULT 0,
  total_buyin DECIMAL(10,2) DEFAULT 0,
  total_cashout DECIMAL(10,2) DEFAULT 0,
  total_profit DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  last_played TIMESTAMP
);
```

### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,  -- OBRIGATÓRIO
  password_hash VARCHAR(255) NOT NULL, -- OBRIGATÓRIO
  role VARCHAR(20) DEFAULT 'player',
  is_active BOOLEAN DEFAULT true,
  
  -- Vínculo com jogador (OPCIONAL)
  player_id INTEGER REFERENCES players(id),
  
  last_login TIMESTAMP
);
```

---

## APIs

### `/api/players` (GET, POST)
- **GET**: Lista todos os players do tenant
  - Retorna: `id`, `name`, `nickname`, `phone`, `notes`, `user_id`
  - Se `user_id != null`, player tem conta

- **POST**: Cria novo player
  - Campos: `name` (obrigatório), `nickname`, `phone`, `notes`
  - **NÃO** aceita `email` (isso é do user!)

### `/api/auth/login` (POST)
- Login com email + password
- Retorna token JWT com `user.player_id`

### `/api/invites` (POST)
- Convida player para criar conta
- Campos: `player_id`, `email`, `role`
- Envia email com link de ativação

---

## Benefícios desta Arquitetura

✅ **Flexibilidade**: Nem todo jogador precisa ter conta  
✅ **Privacidade**: Players sem conta não têm acesso ao sistema  
✅ **Escalabilidade**: Admin pode adicionar jogadores rapidamente  
✅ **Auditoria**: Estatísticas persistem mesmo se user for deletado  
✅ **Convites**: Sistema de convites para onboarding gradual  

---

## Exemplos de Uso

### Caso de Uso 1: Jogo Casual
```
Admin cria sessão com 6 players:
- João (sem conta)
- Maria (sem conta)
- Pedro (sem conta)
- Ana (sem conta)
- Carlos (sem conta)
- Lucas (sem conta)

→ Admin registra manualmente buyin/cashout de cada um
→ Estatísticas são salvas
→ Ninguém precisa ter login
```

### Caso de Uso 2: Jogo Regular
```
Admin tem grupo fixo:
- João (sem conta) - joga ocasionalmente
- Maria (COM conta) - admin, gerencia sessões
- Pedro (COM conta) - vê suas próprias stats
- Ana (COM conta) - vê suas próprias stats

→ Maria cria sessões
→ Pedro e Ana registram seus próprios buyins/cashouts
→ João ainda não tem conta, admin registra por ele
```

### Caso de Uso 3: Liga Profissional
```
Todos os players têm conta:
- Cada um acessa sistema
- Vê ranking geral
- Vê histórico pessoal
- Sistema de notificações

→ Experiência completa
```

---

## Migração de Dados Legados

Se você tem **players no MySQL antigo com emails**, ao migrar:

1. **Crie users** para players com email
2. **Vincule** `users.player_id` ↔ `players.user_id`
3. **Remova** campo `email` da tabela `players` (não existe no schema novo)

```sql
-- Exemplo de migração
INSERT INTO users (tenant_id, name, email, password_hash, role, player_id)
SELECT 
  p.tenant_id,
  p.name,
  p.email,  -- email vem do player antigo
  '$2a$10$...', -- hash padrão para resetar senha
  'player',
  p.id
FROM old_players p
WHERE p.email IS NOT NULL;

-- Atualizar players com user_id
UPDATE players p
SET user_id = u.id
FROM users u
WHERE u.player_id = p.id;
```

---

## Conclusão

- **Players** = Jogadores (podem ou não ter conta)
- **Users** = Contas de login (sempre têm email)
- **Vínculo** = Opcional e bidirecional
- **Email** = Apenas em `users`, NUNCA em `players`

Esta arquitetura permite **máxima flexibilidade** enquanto mantém **integridade dos dados**! 🎯
