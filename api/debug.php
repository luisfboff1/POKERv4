<?php
// 🧪 DEBUG - Verificar configuração do servidor
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$debug = [
    'status' => 'online',
    'php_version' => PHP_VERSION,
    'timestamp' => date('Y-m-d H:i:s'),
    'env_file_exists' => file_exists(__DIR__ . '/.env'),
    'config_exists' => file_exists(__DIR__ . '/config.php'),
    'auth_exists' => file_exists(__DIR__ . '/auth.php'),
];

// Verificar variáveis de ambiente (sem expor valores)
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $debug['env_vars'] = [];
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $debug['env_vars'][] = trim($key) . ' = ' . (empty(trim($value)) ? '(vazio)' : '(configurado)');
        }
    }
}

// Tentar conexão com banco
try {
    require_once 'config.php';
    $debug['database'] = 'conectado';
    
    // Testar query simples
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $result = $stmt->fetch();
    $debug['users_count'] = $result['total'];
    
} catch (Exception $e) {
    $debug['database'] = 'erro';
    $debug['database_error'] = $e->getMessage();
}

echo json_encode($debug, JSON_PRETTY_PRINT);
?>

