<?php
/**
 * Teste simples para verificar se o servidor está funcionando
 */

// Headers básicos
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Teste de conexão com banco
try {
    require_once 'config.php';
    
    // Verificar se as tabelas existem
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    // Verificar se usuário admin existe
    $userCheck = $pdo->prepare("SELECT * FROM users WHERE email = 'luisfboff@hotmail.com'");
    $userCheck->execute();
    $admin_user = $userCheck->fetch();
    
    // Verificar se tenant admin existe
    $tenantCheck = $pdo->prepare("SELECT * FROM tenants WHERE email = 'luisfboff@hotmail.com'");
    $tenantCheck->execute();
    $admin_tenant = $tenantCheck->fetch();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Servidor funcionando!',
        'timestamp' => date('Y-m-d H:i:s'),
        'database' => [
            'connected' => true,
            'tables' => $tables,
            'admin_user_exists' => !!$admin_user,
            'admin_tenant_exists' => !!$admin_tenant,
            'admin_user_role' => $admin_user['role'] ?? 'not_found',
            'tenant_status' => $admin_tenant['status'] ?? 'not_found'
        ],
        'php_version' => phpversion(),
        'request_method' => $_SERVER['REQUEST_METHOD']
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro no servidor',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
