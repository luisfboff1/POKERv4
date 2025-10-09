<?php
/**
 * Script de teste para verificar se a coluna paid_transfers existe
 */

require_once 'config.php';

try {
    // Verificar se a coluna paid_transfers existe
    $stmt = $pdo->query("DESCRIBE sessions");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "=== COLUNAS DA TABELA SESSIONS ===\n";
    foreach ($columns as $column) {
        echo "- $column\n";
    }
    
    $has_paid_transfers = in_array('paid_transfers', $columns);
    echo "\n=== RESULTADO ===\n";
    echo "Coluna 'paid_transfers' existe: " . ($has_paid_transfers ? "SIM ✅" : "NÃO ❌") . "\n";
    
    if (!$has_paid_transfers) {
        echo "\n=== SOLUÇÃO ===\n";
        echo "Execute a migração: db/add_paid_transfers_column.sql\n";
        echo "Ou execute este comando SQL:\n";
        echo "ALTER TABLE sessions ADD COLUMN paid_transfers JSON DEFAULT NULL;\n";
    } else {
        // Testar uma consulta simples
        echo "\n=== TESTE DE CONSULTA ===\n";
        $stmt = $pdo->query("SELECT id, paid_transfers FROM sessions LIMIT 1");
        $result = $stmt->fetch();
        if ($result) {
            echo "Primeira sessão - ID: {$result['id']}, paid_transfers: " . ($result['paid_transfers'] ?: 'NULL') . "\n";
        } else {
            echo "Nenhuma sessão encontrada na base\n";
        }
    }
    
} catch (Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
}
?>