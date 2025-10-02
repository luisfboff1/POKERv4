-- Adiciona a opção 'player' à coluna 'role' da tabela 'users' caso seja ENUM
-- Ajuste o nome do banco de dados e tabela conforme necessário

-- Exemplo para MySQL/MariaDB com ENUM
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'super admin', 'player') NOT NULL DEFAULT 'user';

-- Se você usa uma tabela separada para roles, insira o novo role:
-- INSERT INTO roles (name) VALUES ('player');
