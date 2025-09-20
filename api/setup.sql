-- Criar tabela de sessões
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE DEFAULT (CURRENT_DATE),
    players_data JSON COMMENT 'Dados dos jogadores: buy-ins, cash-out, janta, etc.',
    recommendations JSON COMMENT 'Recomendações de pagamento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;