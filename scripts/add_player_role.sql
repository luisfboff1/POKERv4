-- Adiciona a opção 'player' à coluna 'role' da tabela 'users' caso seja ENUM
-- Ajuste o nome do banco de dados e tabela conforme necessário

-- Padronize o ENUM para 'super_admin' (com underline)
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'super_admin', 'player') NOT NULL DEFAULT 'user';

-- Atualize registros antigos para o novo padrão
UPDATE users SET role = 'super_admin' WHERE role = 'super admin';

-- Se você usa uma tabela separada para roles, insira o novo role:
-- INSERT INTO roles (name) VALUES ('player');
