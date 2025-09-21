<?php
/**
 * Teste de login simplificado para debug
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

// Só aceitar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

try {
    require_once 'config.php';
    
    // Receber dados
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['error' => 'Dados inválidos', 'received' => file_get_contents('php://input')]);
        exit;
    }
    
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['error' => 'Email e senha obrigatórios']);
        exit;
    }
    
    // Buscar usuário
    $sql = "SELECT 
                u.id, u.tenant_id, u.name, u.email, u.password_hash, u.role, u.is_active,
                t.name as tenant_name, t.status as tenant_status, t.plan as tenant_plan
            FROM users u 
            JOIN tenants t ON u.tenant_id = t.id 
            WHERE u.email = ? AND u.is_active = 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode([
            'error' => 'Usuário não encontrado',
            'debug' => [
                'email_searched' => $email,
                'query_executed' => true
            ]
        ]);
        exit;
    }
    
    // Verificar senha
    $password_valid = password_verify($password, $user['password_hash']);
    
    if (!$password_valid) {
        echo json_encode([
            'error' => 'Senha incorreta',
            'debug' => [
                'user_found' => true,
                'password_hash_exists' => !empty($user['password_hash']),
                'password_length' => strlen($password),
                'hash_format' => substr($user['password_hash'], 0, 10) . '...'
            ]
        ]);
        exit;
    }
    
    // Sucesso - login básico sem JWT por enquanto
    echo json_encode([
        'status' => 'success',
        'message' => 'Login realizado com sucesso!',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'tenant_id' => $user['tenant_id'],
            'tenant_name' => $user['tenant_name'],
            'tenant_plan' => $user['tenant_plan'],
            'tenant_status' => $user['tenant_status']
        ],
        'debug' => [
            'password_verified' => true,
            'tenant_active' => $user['tenant_status'] === 'active'
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erro interno',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
