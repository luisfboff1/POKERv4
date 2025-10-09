<?php
/**
 * Script para diagnosticar e corrigir problema com paid_transfers
 */

require_once 'config.php';

echo "=== DIAGNÓSTICO PAID_TRANSFERS ===\n";
echo "Data: " . date('Y-m-d H:i:s') . "\n\n";

try {
    // 1. Verificar se a coluna paid_transfers existe
    echo "1. Verificando estrutura da tabela sessions...\n";
    $stmt = $pdo->query("DESCRIBE sessions");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $has_paid_transfers = false;
    $has_recommendations = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'paid_transfers') {
            $has_paid_transfers = true;
            echo "   ✅ Coluna 'paid_transfers' EXISTS - Tipo: {$column['Type']}\n";
        }
        if ($column['Field'] === 'recommendations') {
            $has_recommendations = true;
            echo "   ✅ Coluna 'recommendations' EXISTS - Tipo: {$column['Type']}\n";
        }
    }
    
    if (!$has_paid_transfers) {
        echo "   ❌ Coluna 'paid_transfers' NÃO EXISTE!\n";
        echo "   🔧 SOLUÇÃO: Execute a migração add_transfers_support.sql\n";
    }
    
    if (!$has_recommendations) {
        echo "   ❌ Coluna 'recommendations' NÃO EXISTE!\n";
        echo "   🔧 SOLUÇÃO: Execute a migração add_transfers_support.sql\n";
    }
    
    // 2. Testar INSERT e UPDATE se colunas existem
    if ($has_paid_transfers && $has_recommendations) {
        echo "\n2. Testando operações na base...\n";
        
        // Contar sessões existentes
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM sessions");
        $total_sessions = $stmt->fetch()['total'];
        echo "   📊 Total de sessões na base: {$total_sessions}\n";
        
        if ($total_sessions > 0) {
            // Testar UPDATE em uma sessão existente
            $stmt = $pdo->query("SELECT id, paid_transfers, recommendations FROM sessions LIMIT 1");
            $session = $stmt->fetch();
            
            if ($session) {
                echo "   🧪 Testando UPDATE na sessão ID: {$session['id']}\n";
                echo "   📝 paid_transfers atual: " . ($session['paid_transfers'] ?: 'NULL') . "\n";
                echo "   📝 recommendations atual: " . ($session['recommendations'] ?: 'NULL') . "\n";
                
                // Fazer um UPDATE de teste
                $test_paid_transfers = '{"test_from_test_to": true}';
                $update_stmt = $pdo->prepare("UPDATE sessions SET paid_transfers = ? WHERE id = ?");
                $result = $update_stmt->execute([$test_paid_transfers, $session['id']]);
                
                if ($result) {
                    echo "   ✅ UPDATE executado com sucesso\n";
                    echo "   📊 Linhas afetadas: " . $update_stmt->rowCount() . "\n";
                    
                    // Verificar se foi salvo
                    $check_stmt = $pdo->prepare("SELECT paid_transfers FROM sessions WHERE id = ?");
                    $check_stmt->execute([$session['id']]);
                    $updated = $check_stmt->fetch();
                    
                    if ($updated && $updated['paid_transfers'] === $test_paid_transfers) {
                        echo "   ✅ Dados salvos corretamente na base!\n";
                        
                        // Reverter o teste
                        $revert_stmt = $pdo->prepare("UPDATE sessions SET paid_transfers = ? WHERE id = ?");
                        $revert_stmt->execute([$session['paid_transfers'], $session['id']]);
                        echo "   🔄 Teste revertido\n";
                    } else {
                        echo "   ❌ ERRO: Dados não foram salvos corretamente!\n";
                        echo "   📝 Esperado: {$test_paid_transfers}\n";
                        echo "   📝 Encontrado: " . ($updated['paid_transfers'] ?: 'NULL') . "\n";
                    }
                } else {
                    echo "   ❌ ERRO no UPDATE: " . implode(' | ', $update_stmt->errorInfo()) . "\n";
                }
            }
        }
    }
    
    // 3. Verificar logs de erro recentes
    echo "\n3. Verificando logs de erro PHP...\n";
    $error_log = ini_get('error_log');
    if ($error_log && file_exists($error_log)) {
        $lines = file($error_log);
        $recent_lines = array_slice($lines, -20); // Últimas 20 linhas
        $relevant_errors = array_filter($recent_lines, function($line) {
            return strpos($line, 'paid_transfers') !== false || strpos($line, 'session.php') !== false;
        });
        
        if (!empty($relevant_errors)) {
            echo "   ⚠️  Erros relevantes encontrados:\n";
            foreach ($relevant_errors as $error) {
                echo "   📝 " . trim($error) . "\n";
            }
        } else {
            echo "   ✅ Nenhum erro relacionado encontrado nos logs recentes\n";
        }
    } else {
        echo "   ℹ️  Log de erro não encontrado ou inacessível\n";
    }
    
    echo "\n=== RESUMO ===\n";
    if ($has_paid_transfers && $has_recommendations) {
        echo "✅ Estrutura da base parece correta\n";
        echo "🔍 Verifique os logs de debug no session.php para mais detalhes\n";
    } else {
        echo "❌ PROBLEMA ENCONTRADO: Colunas necessárias não existem\n";
        echo "🔧 EXECUTE IMEDIATAMENTE:\n";
        echo "   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recommendations JSON DEFAULT NULL;\n";
        echo "   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paid_transfers JSON DEFAULT NULL;\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERRO CRÍTICO: " . $e->getMessage() . "\n";
    echo "🔍 Verifique as configurações de conexão com a base de dados\n";
}

echo "\n=== FIM DO DIAGNÓSTICO ===\n";
?>