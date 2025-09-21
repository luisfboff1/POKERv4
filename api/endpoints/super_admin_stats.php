<?php
/**
 * Endpoint específico para estatísticas super admin
 * Caminho alternativo para evitar problemas de cache
 */

// Headers diretos
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';
require_once '../jwt_helper.php';

try {
    // Verificar token
    $token = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Token não fornecido']);
        exit;
    }
    
    $token = str_replace('Bearer ', '', $token);
    $payload = JWTHelper::validateToken($token);
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido']);
        exit;
    }
    
    // Verificar se é super admin
    $sql = "SELECT role FROM users WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user || $user['role'] !== 'super_admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas super administradores']);
        exit;
    }
    
    // Buscar estatísticas
    $stats = [
        'active_tenants' => 0,
        'total_users' => 0,
        'sessions_this_month' => 0,
        'estimated_revenue' => 0
    ];
    
    // Contar tenants ativos
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'");
    $stats['active_tenants'] = $stmt->fetch()['count'];
    
    // Contar usuários ativos
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
    $stats['total_users'] = $stmt->fetch()['count'];
    
    // Contar sessões do mês
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM sessions WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
    $stats['sessions_this_month'] = $stmt->fetch()['count'];
    
    // Calcular receita estimada
    $stmt = $pdo->query("
        SELECT 
            SUM(CASE 
                WHEN plan = 'basic' THEN 29 
                WHEN plan = 'premium' THEN 59 
                WHEN plan = 'enterprise' THEN 99 
                ELSE 0 
            END) as revenue
        FROM tenants WHERE status = 'active'
    ");
    $stats['estimated_revenue'] = $stmt->fetch()['revenue'] ?? 0;
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'overview' => $stats,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}
?>
