# Scripts de Banco de Dados - Poker Manager

Este diretório contém todos os scripts SQL necessários para criar e manter a estrutura do banco de dados do Poker Manager.

## Arquivos

### `create_database.sql`
Script principal que cria toda a estrutura do banco de dados:
- **Tabelas principais:** tenants, users, players, sessions, user_invites, audit_logs, player_transfers
- **Views:** super_admin_stats, all_tenants_view
- **Índices:** Para otimização de performance
- **Dados iniciais:** Super admin e tenant padrão
- **Triggers:** Para manter estatísticas atualizadas

## Como usar

### 1. Primeira instalação
```bash
# Via linha de comando MySQL
mysql -u seu_usuario -p seu_banco < create_database.sql

# Via phpMyAdmin
# Copie e cole o conteúdo do arquivo na aba SQL
```

### 2. Migração para novo banco
1. Exporte os dados do banco atual (apenas dados, não estrutura)
2. Execute `create_database.sql` no novo banco
3. Importe os dados exportados

### 3. Backup da estrutura
```bash
# Backup apenas da estrutura
mysqldump -u usuario -p --no-data seu_banco > estrutura_backup.sql

# Backup completo (estrutura + dados)
mysqldump -u usuario -p seu_banco > backup_completo.sql
```

## Estrutura do Banco

### Hierarquia Principal
```
tenants (clientes/grupos)
├── users (login/autenticação)
├── players (dados de poker)
├── sessions (partidas)
├── user_invites (convites)
└── audit_logs (logs de auditoria)
```

### Relacionamentos
- Cada **tenant** pode ter múltiplos usuários e jogadores
- Cada **usuário** pertence a um tenant e pode ter um jogador vinculado
- Cada **sessão** pertence a um tenant e é criada por um usuário
- **Convites** conectam novos usuários a tenants
- **Transferências** registram pagamentos entre jogadores

### Recursos Avançados
- **Multi-tenancy:** Isolamento completo entre clientes
- **Auditoria:** Log de todas as ações importantes
- **Views otimizadas:** Para relatórios e estatísticas
- **Índices compostos:** Para queries rápidas
- **Constraints:** Integridade referencial garantida

## Configuração de Ambiente

### Variáveis necessárias (.env)
```env
DB_HOST=localhost
DB_NAME=poker_manager
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_CHARSET=utf8mb4
```

### Permissões MySQL necessárias
- SELECT, INSERT, UPDATE, DELETE
- CREATE, ALTER, DROP (para estrutura)
- INDEX (para otimizações)
- TRIGGER (para automações)

## Manutenção

### Limpeza automática
O sistema já possui rotinas para:
- Limpar convites expirados
- Manter logs de auditoria organizados
- Atualizar estatísticas de jogadores

### Monitoramento
Use as views criadas para monitorar:
- `super_admin_stats`: Estatísticas globais
- `all_tenants_view`: Dados completos dos tenants

## Notas Importantes

1. **Idempotência:** O script pode ser executado múltiplas vezes sem problemas
2. **Charset:** UTF-8 completo (utf8mb4) para suporte a emojis e caracteres especiais
3. **Foreign Keys:** Garantem integridade, mas cuidado ao deletar registros
4. **JSON:** Campos players_data e audit_logs usam JSON nativo do MySQL 5.7+
5. **Timestamps:** Todos com timezone UTC, ajuste conforme necessário

## Troubleshooting

### Erro de charset
```sql
ALTER DATABASE poker_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erro de foreign key
```sql
SET FOREIGN_KEY_CHECKS = 0;
-- Execute o script
SET FOREIGN_KEY_CHECKS = 1;
```

### Verificar se tudo foi criado
```sql
SHOW TABLES;
SHOW TRIGGERS;
SELECT * FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'poker_manager';
```