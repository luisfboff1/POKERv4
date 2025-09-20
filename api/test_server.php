<?php
// Habilitar exibição de erros
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Informações do servidor
$serverInfo = [
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'http_host' => $_SERVER['HTTP_HOST'],
    'server_protocol' => $_SERVER['SERVER_PROTOCOL'],
    'https' => isset($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : 'off',
    'time' => date('Y-m-d H:i:s'),
    'error_log' => ini_get('error_log'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit')
];

// Testar conexão com o banco
try {
    $host = 'srv1437.hstgr.io';
    $dbname = 'u903000160_poker';
    $username = 'u903000160_poker';
    $password = 'Poker2025!';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $serverInfo['database'] = [
        'status' => 'connected',
        'tables' => []
    ];
    
    // Listar tabelas
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $serverInfo['database']['tables'] = $tables;
    
} catch (PDOException $e) {
    $serverInfo['database'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// Testar permissões de arquivo
$serverInfo['file_permissions'] = [
    'api_dir' => is_writable(__DIR__) ? 'writable' : 'not writable',
    'parent_dir' => is_writable(dirname(__DIR__)) ? 'writable' : 'not writable'
];

// Retornar informações
echo json_encode($serverInfo, JSON_PRETTY_PRINT);
