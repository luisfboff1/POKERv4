<?php
// 🧪 TESTE DE CONEXÃO - Debug Completo
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$debug = [
    'status' => 'online',
    'php_version' => PHP_VERSION,
    'timestamp' => date('Y-m-d H:i:s'),
    'current_dir' => __DIR__,
];

// 1. Verificar se .env existe
$env_file = __DIR__ . '/.env';
$debug['env_file'] = [
    'path' => $env_file,
    'exists' => file_exists($env_file),
    'readable' => file_exists($env_file) ? is_readable($env_file) : false,
];

// 2. Tentar carregar .env
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $debug['env_lines_count'] = count($lines);
    $debug['env_vars'] = [];
    
    foreach ($lines as $line) {
        // Ignorar comentários
        if (strpos(trim($line), '#') === 0) continue;
        
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            $_ENV[$key] = $value;
            
            // Mostrar chave (sem valor)
            $debug['env_vars'][$key] = empty($value) ? '(vazio)' : '(configurado - ' . strlen($value) . ' chars)';
        }
    }
} else {
    $debug['env_error'] = '.env não encontrado!';
}

// 3. Verificar variáveis de ambiente
$required_vars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
$debug['required_vars_check'] = [];
foreach ($required_vars as $var) {
    $debug['required_vars_check'][$var] = isset($_ENV[$var]) ? 'OK' : 'FALTANDO';
}

// 4. Tentar conectar com o banco
try {
    $host = $_ENV['DB_HOST'] ?? 'não configurado';
    $dbname = $_ENV['DB_NAME'] ?? 'não configurado';
    $username = $_ENV['DB_USER'] ?? 'não configurado';
    $password = $_ENV['DB_PASSWORD'] ?? '';
    
    $debug['connection_params'] = [
        'host' => $host,
        'dbname' => $dbname,
        'username' => $username,
        'password_length' => strlen($password),
    ];
    
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4", 
        $username, 
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    $debug['database_connection'] = 'SUCESSO!';
    
    // Testar query
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $result = $stmt->fetch();
    $debug['users_count'] = $result['total'];
    
    // Listar tabelas
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $debug['tables'] = $tables;
    
} catch (PDOException $e) {
    $debug['database_connection'] = 'ERRO';
    $debug['database_error'] = $e->getMessage();
    $debug['error_code'] = $e->getCode();
}

echo json_encode($debug, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>

