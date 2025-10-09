<?php
/**
 * Script para ver logs recentes da API session.php
 */

echo "=== LOGS RECENTES DA API ===\n";
echo "Data: " . date('Y-m-d H:i:s') . "\n\n";

// Verificar múltiplos locais possíveis de logs
$possible_logs = [
    ini_get('error_log'),
    '/var/log/apache2/error.log',
    '/var/log/nginx/error.log', 
    '/tmp/php_errors.log',
    './error.log',
    '../error.log'
];

$log_found = false;

foreach ($possible_logs as $log_path) {
    if (!$log_path) continue;
    
    if (file_exists($log_path) && is_readable($log_path)) {
        echo "📂 Verificando: {$log_path}\n";
        
        // Ler últimas 50 linhas
        $lines = file($log_path);
        if ($lines) {
            $recent_lines = array_slice($lines, -50);
            
            // Filtrar linhas relevantes
            $relevant = array_filter($recent_lines, function($line) {
                return strpos($line, 'DEBUG:') !== false || 
                       strpos($line, 'paid_transfers') !== false ||
                       strpos($line, 'session.php') !== false ||
                       strpos($line, 'update_payments') !== false;
            });
            
            if (!empty($relevant)) {
                echo "📝 Logs relevantes encontrados:\n";
                foreach ($relevant as $line) {
                    echo "   " . trim($line) . "\n";
                }
                $log_found = true;
            }
        }
        echo "\n";
    }
}

if (!$log_found) {
    echo "❌ Nenhum log relevante encontrado\n";
    echo "💡 Tente fazer uma requisição de teste para gerar logs\n";
    echo "\n";
    
    // Mostrar configuração atual de logs
    echo "📋 Configuração de logs PHP:\n";
    echo "   error_log: " . (ini_get('error_log') ?: 'não configurado') . "\n";
    echo "   log_errors: " . (ini_get('log_errors') ? 'habilitado' : 'desabilitado') . "\n";
    echo "   display_errors: " . (ini_get('display_errors') ? 'habilitado' : 'desabilitado') . "\n";
}

// Criar um teste simples de log
file_put_contents('test_debug.log', date('Y-m-d H:i:s') . " - Teste de log criado\n", FILE_APPEND);
if (file_exists('test_debug.log')) {
    echo "✅ Teste de escrita de log funcionando (test_debug.log criado)\n";
}

echo "\n=== INSTRUÇÕES ===\n";
echo "1. Execute o diagnóstico: php debug_paid_transfers.php\n";
echo "2. Faça um teste de salvar transferência no frontend\n";
echo "3. Execute novamente: php " . __FILE__ . "\n";
echo "4. Procure por linhas com 'DEBUG:' nos logs\n";

?>