-- Script para criar as tabelas no MySQL do Hostinger
-- Execute este script no painel do Hostinger ou via phpMyAdmin

CREATE DATABASE IF NOT EXISTS u903000160_poker;
USE u903000160_poker;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    buy_in DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rebuy DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    add_on DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_pot DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de participantes
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    buy_in DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rebuy DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    add_on DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_invested DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    profit_loss DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    position INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de transferências
CREATE TABLE IF NOT EXISTS transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    from_participant_id INT NOT NULL,
    to_participant_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (from_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (to_participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Tabela de janta (dinner)
CREATE TABLE IF NOT EXISTS dinner_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    number_of_people INT NOT NULL DEFAULT 0,
    cost_per_person DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Tabela de participantes da janta
CREATE TABLE IF NOT EXISTS dinner_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dinner_id INT NOT NULL,
    participant_id INT NOT NULL,
    is_participating BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dinner_id) REFERENCES dinner_data(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Administrador', 'admin@poker.com', '$2b$10$rQZ8K9vL2mN3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Índices para melhor performance
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_transfers_session ON transfers(session_id);
CREATE INDEX idx_dinner_data_session ON dinner_data(session_id);
CREATE INDEX idx_dinner_participants_dinner ON dinner_participants(dinner_id);
