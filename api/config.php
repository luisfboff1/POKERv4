<?php
// Configuração simplificada - SEM INFORMAÇÕES SENSÍVEIS
error_reporting(0);
ini_set('display_errors', 0);

// Carregar .env se existir
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Conexão com banco (usando .env)
try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? 'test';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASSWORD'] ?? '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
    exit;
}

// Funções simples
function success($data) {
    echo json_encode(['data' => $data]);
    exit;
}

function error($msg, $code = 500) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}
?>