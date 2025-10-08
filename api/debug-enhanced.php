<?php
// =============================================
// DEBUG ENHANCED - SCRIPT PARA DIAGNÓSTICO COMPLETO
// =============================================

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Função para executar SQL seguro
function executeSafeSQL($query) {
    global $pdo;
    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

// Função para verificar tabelas
function checkAllTables() {
    global $pdo;
    $result = [];
    
    try {
        // Listar todas as tabelas
        $tables = executeSafeSQL("SHOW TABLES");
        $result['tables'] = $tables;
        
        // Verificar cada tabela principal
        $mainTables = ['tenants', 'users', 'players', 'sessions', 'user_invites'];
        
        foreach ($mainTables as $table) {
            $count = executeSafeSQL("SELECT COUNT(*) as count FROM `$table`");
            $structure = executeSafeSQL("DESCRIBE `$table`");
            
            $result['table_info'][$table] = [
                'count' => $count[0]['count'] ?? 0,
                'structure' => $structure,
                'sample_data' => executeSafeSQL("SELECT * FROM `$table` LIMIT 3")
            ];
        }
        
        return $result;
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

// Verificar autenticação
function checkAuth() {
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        }
    }
    
    return [
        'has_token' => !empty($token),
        'token_length' => $token ? strlen($token) : 0,
        'token_preview' => $token ? substr($token, 0, 20) . '...' : null
    ];
}

// Processar requisições
$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'php_version' => phpversion(),
    'database_connected' => false
];

try {
    // Testar conexão com banco
    $pdo->exec('SELECT 1');
    $response['database_connected'] = true;
    
    // Verificar autenticação
    $response['auth_check'] = checkAuth();
    
    // Processar diferentes ações
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'check_tables':
                $response['data'] = checkAllTables();
                break;
                
            case 'test_sql':
                $query = $input['query'] ?? '';
                if (!empty($query)) {
                    // Só permitir SELECT para segurança
                    if (stripos(trim($query), 'SELECT') === 0 || 
                        stripos(trim($query), 'SHOW') === 0 || 
                        stripos(trim($query), 'DESCRIBE') === 0) {
                        $response['data'] = executeSafeSQL($query);
                        $response['query'] = $query;
                    } else {
                        $response['error'] = 'Apenas queries SELECT, SHOW e DESCRIBE são permitidas';
                    }
                } else {
                    $response['error'] = 'Query não fornecida';
                }
                break;
                
            default:
                $response['data'] = checkAllTables();
                break;
        }
    } else {
        // GET request - retornar info geral
        $response['data'] = [
            'database_info' => [
                'host' => $host ?? 'não definido',
                'database' => $database ?? 'não definido',
                'charset' => 'utf8mb4'
            ],
            'environment' => [
                'php_version' => phpversion(),
                'pdo_available' => extension_loaded('pdo'),
                'pdo_mysql_available' => extension_loaded('pdo_mysql'),
                'server_time' => date('Y-m-d H:i:s'),
                'timezone' => date_default_timezone_get()
            ],
            'quick_checks' => checkAllTables()
        ];
    }
    
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    $response['trace'] = $e->getTraceAsString();
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>