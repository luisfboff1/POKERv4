# Sistema de Vinculação Jogador-Usuário

## Objetivo
Permitir que ao convidar um novo usuário, seja possível vinculá-lo a um jogador existente no banco ou criar um novo jogador, para que cada usuário tenha um dashboard personalizado com suas métricas, dívidas e recebimentos.

## Estrutura Atual vs. Desejada

### Atual:
- `users` (login/auth): id, name, email, password_hash, role, tenant_id
- `players` (jogadores de poker): id, name, tenant_id, stats de poker

### Desejada:
- `users` (login/auth): id, name, email, password_hash, role, tenant_id, **player_id**
- `players` (jogadores de poker): id, name, tenant_id, stats de poker, **user_id**

## Implementação Sugerida

### 1. Alteração no Banco de Dados
```sql
-- Adicionar colunas de vinculação
ALTER TABLE users ADD COLUMN player_id INT NULL;
ALTER TABLE players ADD COLUMN user_id INT NULL;

-- Criar foreign keys
ALTER TABLE users ADD FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE players ADD FOREIGN KEY (user_id) REFERENCES users(id);
```

### 2. Fluxo de Convite Aprimorado

#### No formulário de convite:
- Campo email (obrigatório)
- Campo nome (opcional)
- **Novo:** Dropdown "Vincular a jogador existente" ou "Criar novo jogador"
- Se "existente": Busca/autocomplete dos jogadores do tenant
- Se "novo": Campos adicionais do jogador (nome completo, apelido, etc.)

#### No backend (invite.php):
```php
// Ao aceitar convite
if ($player_link_type === 'existing') {
    // Vincular a jogador existente
    $player_id = $input['selected_player_id'];
    // Verificar se jogador pertence ao mesmo tenant
    // Verificar se jogador não já tem usuário vinculado
} else {
    // Criar novo jogador
    $player_id = createNewPlayer($tenant_id, $name, $additional_data);
}

// Criar usuário com vinculação
$user_id = createUser($email, $password, $name, $tenant_id, $player_id);

// Atualizar jogador com user_id
updatePlayerUserId($player_id, $user_id);
```

### 3. Dashboard Personalizado

#### Para usuários com jogador vinculado:
- **Métricas pessoais:** winrate, profit/loss, sessões jogadas
- **Financeiro:** quanto deve receber, quanto deve pagar
- **Histórico:** suas participações em sessões
- **Ranking:** posição no grupo

#### Para usuários sem jogador (admins):
- Dashboard atual (visão geral do grupo)

### 4. Modificações na UI

#### Página de convites:
- Novo campo no formulário
- Preview do jogador selecionado (se existente)

#### Dashboard do usuário:
- Detecção automática: se `user.player_id` existe, mostrar dashboard de jogador
- Caso contrário, mostrar dashboard de admin

#### Páginas de sessão:
- Ao adicionar jogador, verificar se já tem usuário vinculado
- Mostrar indicador visual (ex: ícone de usuário ao lado do nome)

### 5. Casos de Uso

#### Caso 1: Admin convida jogador existente
1. Admin vai em "Convites"
2. Seleciona "Vincular a jogador existente"
3. Busca pelo nome do jogador
4. Jogador recebe email e cria conta
5. Conta fica automaticamente vinculada

#### Caso 2: Admin convida nova pessoa
1. Admin vai em "Convites"
2. Seleciona "Criar novo jogador"
3. Preenche dados do jogador
4. Pessoa recebe email e cria conta
5. Novo jogador é criado e vinculado

#### Caso 3: Jogador faz login
1. Usuário faz login
2. Sistema detecta player_id
3. Redireciona para dashboard de jogador
4. Mostra métricas, dívidas, histórico pessoal

### 6. Benefícios

- **Separação clara:** Autenticação vs. Dados de poker
- **Dashboard personalizado:** Cada jogador vê só seus dados
- **Gestão simplificada:** Admin pode convidar e vincular facilmente
- **Escalabilidade:** Suporta múltiplos tenants com jogadores únicos
- **Flexibilidade:** Usuário pode ou não ter jogador vinculado

### 7. Implementação Gradual

#### Fase 1: Estrutura base
- Alterar tabelas do banco
- Modificar sistema de convites
- Atualizar APIs

#### Fase 2: Dashboard personalizado
- Detectar tipo de usuário
- Criar componentes de dashboard de jogador
- Implementar métricas pessoais

#### Fase 3: Integrações
- Vincular sessões existentes
- Migrar dados atuais
- Testes e refinamentos

### 8. Considerações Técnicas

- **Migração:** Como vincular usuários/jogadores existentes?
- **Validação:** Garantir que jogador pertence ao tenant correto
- **Performance:** Otimizar queries com JOINs user-player
- **Segurança:** Usuário só acessa dados do próprio jogador
- **UX:** Interface clara para admin escolher tipo de vinculação

---

*Este planejamento pode ser refinado conforme implementação e feedback.*