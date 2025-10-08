<?php
// Script para adicionar dados de exemplo (APENAS PARA TESTE)
require_once 'config.php';

try {
    $pdo = new PDO($dsn, $username, $password, $options);
    
    echo "🔧 Adicionando dados de exemplo...\n\n";
    
    // 1. Inserir tenant padrão (se não existir)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM tenants WHERE id = 1");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO tenants (id, name, email, plan, status, max_users, max_sessions_per_month, approved_at) 
            VALUES (1, 'Poker Manager Admin', 'luisfboff@hotmail.com', 'enterprise', 'active', 999, 999, NOW())
        ");
        $stmt->execute();
        echo "✅ Tenant criado\n";
    } else {
        echo "ℹ️  Tenant já existe\n";
    }
    
    // 2. Inserir usuário admin (se não existir)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = 'luisfboff@hotmail.com'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        // Senha: password
        $hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        $stmt = $pdo->prepare("
            INSERT INTO users (tenant_id, name, email, password_hash, role, is_active) 
            VALUES (1, 'Luis Boff', 'luisfboff@hotmail.com', ?, 'admin', 1)
        ");
        $stmt->execute([$hash]);
        echo "✅ Usuário admin criado\n";
    } else {
        echo "ℹ️  Usuário admin já existe\n";
    }
    
    // 3. Inserir alguns jogadores de exemplo (se não existirem)
    $players = [
        ['João Silva', 'joao@example.com'],
        ['Maria Santos', 'maria@example.com'],
        ['Pedro Costa', 'pedro@example.com'],
        ['Ana Lima', 'ana@example.com'],
        ['Carlos Rocha', 'carlos@example.com']
    ];
    
    $playersInserted = 0;
    foreach ($players as [$name, $email]) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM players WHERE name = ? AND tenant_id = 1");
        $stmt->execute([$name]);
        if ($stmt->fetchColumn() == 0) {
            $stmt = $pdo->prepare("
                INSERT INTO players (tenant_id, name, name_normalized, email, is_active, status) 
                VALUES (1, ?, ?, ?, 1, 'active')
            ");
            $stmt->execute([$name, strtolower($name), $email]);
            $playersInserted++;
        }
    }
    echo "✅ $playersInserted novos jogadores criados\n";
    
    // 4. Inserir uma sessão de exemplo (se não existir)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM sessions WHERE tenant_id = 1");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $playersData = json_encode([
            [
                "name" => "João Silva",
                "buyin" => 100.00,
                "cashout" => 150.00,
                "profit" => 50.00
            ],
            [
                "name" => "Maria Santos",
                "buyin" => 100.00,
                "cashout" => 75.00,
                "profit" => -25.00
            ]
        ]);
        
        $stmt = $pdo->prepare("
            INSERT INTO sessions (tenant_id, date, location, status, players_data, total_buyin, total_cashout, players_count, created_by) 
            VALUES (1, CURDATE(), 'Sala de Poker', 'approved', ?, 200.00, 225.00, 2, 1)
        ");
        $stmt->execute([$playersData]);
        echo "✅ Sessão de exemplo criada\n";
    } else {
        echo "ℹ️  Sessões já existem\n";
    }
    
    // 5. Contar resultados
    echo "\n📊 RESUMO:\n";
    
    $tables = ['tenants', 'users', 'players', 'sessions'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "   $table: $count registros\n";
    }
    
    echo "\n🎉 Dados de exemplo adicionados com sucesso!\n";
    echo "🔑 Login: luisfboff@hotmail.com / password\n";
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
?>