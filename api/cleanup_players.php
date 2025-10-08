<?php
// Script para limpar colunas desnecessárias da tabela players
// Agora o ranking é calculado dinamicamente!

require_once 'config.php';

try {
    $pdo = new PDO($dsn, $username, $password, $options);
    
    echo "🧹 LIMPANDO TABELA PLAYERS - CÁLCULO DINÂMICO\n\n";
    
    // Zerar todas as estatísticas salvas (não precisamos mais delas)
    $stmt = $pdo->prepare("
        UPDATE players SET 
            total_sessions = 0,
            total_buyin = 0.00,
            total_cashout = 0.00,
            total_profit = 0.00,
            win_rate = 0.00,
            best_session = 0.00,
            worst_session = 0.00,
            last_played = NULL,
            avg_session_time = 0
        WHERE tenant_id = 1
    ");
    
    $stmt->execute();
    $affected = $stmt->rowCount();
    
    echo "✅ Zeradas estatísticas de $affected jogadores\n";
    echo "📊 Agora o ranking é calculado dinamicamente das sessões!\n\n";
    
    // Mostrar contadores
    $stmt = $pdo->query("SELECT COUNT(*) FROM players WHERE tenant_id = 1");
    $playersCount = $stmt->fetchColumn();
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM sessions WHERE tenant_id = 1 AND status = 'approved'");
    $sessionsCount = $stmt->fetchColumn();
    
    echo "📋 RESUMO:\n";
    echo "   👥 Jogadores cadastrados: $playersCount\n";
    echo "   📈 Sessões aprovadas: $sessionsCount\n";
    echo "   🔄 Ranking: Calculado dinamicamente\n\n";
    
    echo "🎉 VANTAGENS DO CÁLCULO DINÂMICO:\n";
    echo "   ✅ Sempre atualizado automaticamente\n";
    echo "   ✅ Excluiu sessão? Ranking atualiza na hora\n";
    echo "   ✅ Não precisa sincronizar nada\n";
    echo "   ✅ Dados sempre consistentes\n";
    echo "   ✅ Mais simples e confiável\n\n";
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
?>