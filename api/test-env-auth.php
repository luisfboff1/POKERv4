<?php
// 🧪 TESTE COMPLETO DE AMBIENTE E AUTENTICAÇÃO
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

// 1. Verificar .env
$env_file = __DIR__ . '/.env';
$debug['env_file'] = [
    'path' => $env_file,
    'exists' => file_exists($env_file),
    'readable' => file_exists($env_file) ? is_readable($env_file) : false,
];

if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $debug['env_lines_count'] = count($lines);
    $debug['env_vars'] = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            $_ENV[$key] = $value;
            $debug['env_vars'][$key] = empty($value) ? '(vazio)' : '(configurado - ' . strlen($value) . ' chars)';
        }
    }
} else {
    $debug['env_error'] = '.env não encontrado!';
}

// 2. Checar variáveis obrigatórias
$required_vars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
$debug['required_vars_check'] = [];
foreach ($required_vars as $var) {
    $debug['required_vars_check'][$var] = isset($_ENV[$var]) ? 'OK' : 'FALTANDO';
}

// 3. Testar conexão com banco
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
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $result = $stmt->fetch();
    $debug['users_count'] = $result['total'];
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $debug['tables'] = $tables;
} catch (PDOException $e) {
    $debug['database_connection'] = 'ERRO';
    $debug['database_error'] = $e->getMessage();
    $debug['error_code'] = $e->getCode();
}

// 4. Testar JWT_SECRET
$jwt_secret = $_ENV['JWT_SECRET'] ?? '';
$debug['jwt_secret_status'] = empty($jwt_secret) ? 'FALTANDO ou VAZIO' : 'CONFIGURADO (' . strlen($jwt_secret) . ' chars)';

// 5. Testar autenticação (simulação)
if (!empty($jwt_secret)) {
    // Simular geração de token
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode(['user_id' => 1, 'iat' => time()]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", $jwt_secret, true));
    $jwt = "$header.$payload.$signature";
    $debug['jwt_sample'] = $jwt;
    $debug['jwt_sample_length'] = strlen($jwt);
} else {
    $debug['jwt_sample'] = 'Não gerado: JWT_SECRET ausente.';
}

echo json_encode($debug, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
