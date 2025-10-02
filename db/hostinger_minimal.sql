-- =============================================
-- SCRIPT MÍNIMO PARA HOSTINGER EXTREMAMENTE RESTRITIVO
-- =============================================
-- Para ambientes onde até DROP TABLE IF EXISTS falha
-- Execução manual necessária
-- =============================================

-- Desabilitar verificações temporariamente
SET sql_mode = '';

-- =============================================
-- EXECUTE PRIMEIRO: REMOVER TABELAS EXISTENTES
-- =============================================
-- Execute estes comandos UM POR VEZ se as tabelas já existem:

-- DROP TABLE audit_logs;
-- DROP TABLE user_invites;  
-- DROP TABLE sessions;
-- DROP TABLE players;
-- DROP TABLE users;
-- DROP TABLE tenants;

-- =============================================
-- 1. CRIAR TENANTS
-- =============================================
CREATE TABLE tenants (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50) DEFAULT NULL,
  plan varchar(20) DEFAULT 'basic',
  status varchar(20) DEFAULT 'pending',
  max_users int(11) DEFAULT 10,
  max_sessions_per_month int(11) DEFAULT 50,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at timestamp NULL DEFAULT NULL,
  suspended_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 2. CRIAR USERS
-- =============================================
CREATE TABLE users (
  id int(11) NOT NULL AUTO_INCREMENT,
  tenant_id int(11) NOT NULL,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(20) DEFAULT 'player',
  is_active tinyint(1) DEFAULT 1,
  last_login timestamp NULL DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  player_id int(11) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 3. CRIAR PLAYERS
-- =============================================
CREATE TABLE players (
  id int(11) NOT NULL AUTO_INCREMENT,
  tenant_id int(11) NOT NULL,
  name varchar(255) NOT NULL,
  nickname varchar(100) DEFAULT NULL,
  phone varchar(50) DEFAULT NULL,
  notes text DEFAULT NULL,
  is_active tinyint(1) DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id int(11) DEFAULT NULL,
  total_sessions int(11) DEFAULT 0,
  total_buyin decimal(10,2) DEFAULT 0.00,
  total_cashout decimal(10,2) DEFAULT 0.00,
  total_profit decimal(10,2) DEFAULT 0.00,
  win_rate decimal(5,2) DEFAULT 0.00,
  avg_session_time int(11) DEFAULT 0,
  best_session decimal(10,2) DEFAULT 0.00,
  worst_session decimal(10,2) DEFAULT 0.00,
  last_played timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 4. CRIAR SESSIONS
-- =============================================
CREATE TABLE sessions (
  id int(11) NOT NULL AUTO_INCREMENT,
  tenant_id int(11) NOT NULL,
  date date NOT NULL,
  location varchar(255) NOT NULL DEFAULT 'Local não informado',
  status varchar(20) DEFAULT 'pending',
  created_by int(11) NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at timestamp NULL DEFAULT NULL,
  closed_at timestamp NULL DEFAULT NULL,
  players_data longtext DEFAULT NULL,
  session_fee decimal(8,2) DEFAULT 0.00,
  janta_fee decimal(8,2) DEFAULT 0.00,
  rake_percentage decimal(5,2) DEFAULT 0.00,
  total_buyin decimal(10,2) DEFAULT 0.00,
  total_cashout decimal(10,2) DEFAULT 0.00,
  total_profit decimal(10,2) DEFAULT 0.00,
  players_count int(11) DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 5. CRIAR USER_INVITES
-- =============================================
CREATE TABLE user_invites (
  id int(11) NOT NULL AUTO_INCREMENT,
  tenant_id int(11) NOT NULL,
  invited_by_user_id int(11) NOT NULL,
  email varchar(255) NOT NULL,
  name varchar(255) DEFAULT NULL,
  role varchar(20) DEFAULT 'player',
  invite_token varchar(128) NOT NULL,
  status varchar(20) DEFAULT 'pending',
  expires_at timestamp NOT NULL,
  accepted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  player_id int(11) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 6. CRIAR AUDIT_LOGS
-- =============================================
CREATE TABLE audit_logs (
  id int(11) NOT NULL AUTO_INCREMENT,
  tenant_id int(11) DEFAULT NULL,
  user_id int(11) DEFAULT NULL,
  action varchar(100) NOT NULL,
  table_name varchar(64) DEFAULT NULL,
  record_id int(11) DEFAULT NULL,
  old_data longtext DEFAULT NULL,
  new_data longtext DEFAULT NULL,
  ip_address varchar(45) DEFAULT NULL,
  user_agent text DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 7. ADICIONAR ÍNDICES
-- =============================================

ALTER TABLE tenants ADD UNIQUE INDEX email_unique (email);

ALTER TABLE users ADD UNIQUE INDEX email_unique (email);
ALTER TABLE users ADD INDEX tenant_id_idx (tenant_id);

ALTER TABLE players ADD INDEX tenant_id_idx (tenant_id);
ALTER TABLE players ADD INDEX name_idx (name);

ALTER TABLE sessions ADD INDEX tenant_id_idx (tenant_id);
ALTER TABLE sessions ADD INDEX date_idx (date);
ALTER TABLE sessions ADD INDEX created_by_idx (created_by);

ALTER TABLE user_invites ADD UNIQUE INDEX token_unique (invite_token);
ALTER TABLE user_invites ADD INDEX tenant_id_idx (tenant_id);
ALTER TABLE user_invites ADD INDEX email_idx (email);
ALTER TABLE user_invites ADD INDEX expires_at_idx (expires_at);

ALTER TABLE audit_logs ADD INDEX tenant_id_idx (tenant_id);
ALTER TABLE audit_logs ADD INDEX user_id_idx (user_id);
ALTER TABLE audit_logs ADD INDEX action_idx (action);
ALTER TABLE audit_logs ADD INDEX created_at_idx (created_at);

-- =============================================
-- 8. DADOS INICIAIS
-- =============================================

INSERT INTO tenants (id, name, email, plan, status, max_users, max_sessions_per_month, approved_at) 
VALUES (1, 'Poker Manager Admin', 'luis.boff@evcomx.com.br', 'enterprise', 'active', 999, 999, NOW());

INSERT INTO users (id, tenant_id, name, email, password_hash, role, is_active) 
VALUES (1, 1, 'Luis Fernando Boff', 'luis.boff@evcomx.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 1);

-- =============================================
-- 9. VERIFICAÇÃO
-- =============================================

SELECT 'Banco criado com sucesso!' as Status;
SELECT COUNT(*) as tenants_count FROM tenants;
SELECT COUNT(*) as users_count FROM users;

-- =============================================
-- INSTRUÇÕES DE USO
-- =============================================

-- SE DER ERRO "Table already exists":
-- 1. Execute os DROP TABLE um por vez (descomentados no início)
-- 2. Execute este script novamente

-- ALTERAR SENHA:
-- UPDATE users SET password_hash = 'SEU_HASH_BCRYPT' WHERE id = 1;

-- CONFIGURAR .env:
-- DB_HOST=localhost
-- DB_NAME=u903000160_poker
-- DB_USER=u903000160_poker
-- DB_PASSWORD=sua_senha

-- =============================================
-- SCRIPT MÍNIMO CONCLUÍDO
-- =============================================