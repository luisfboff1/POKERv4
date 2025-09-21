<?php
/**
 * Debug: Verificar dados do usuário após login
 */

require_once 'config.php';
require_once 'middleware/auth_middleware.php';

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Verificar se tem token
    $token = JWTHelper::getTokenFromHeaders();
    
    if (!$token) {
        echo json_encode([
            'error' => 'Sem token',
            'headers' => getallheaders(),
            'server' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'não encontrado'
        ]);
        exit;
    }
    
    // Validar token
    $payload = JWTHelper::validateToken($token);
    
    if (!$payload) {
        echo json_encode([
            'error' => 'Token inválido',
            'token_preview' => substr($token, 0, 20) . '...'
        ]);
        exit;
    }
    
    // Buscar usuário no banco
    $sql = "SELECT 
                u.id, u.tenant_id, u.name, u.email, u.role, u.is_active,
                t.name as tenant_name, t.status as tenant_status, t.plan as tenant_plan
            FROM users u 
            JOIN tenants t ON u.tenant_id = t.id 
            WHERE u.id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    
    echo json_encode([
        'status' => 'success',
        'token_payload' => $payload,
        'user_from_db' => $user,
        'is_super_admin' => $user['role'] === 'super_admin',
        'can_access_global' => $user['role'] === 'super_admin' && $user['tenant_status'] === 'active'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => 'Erro no debug',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
