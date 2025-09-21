<?php
/**
 * API de Autenticação - Login, Logout, Verificação
 * Sistema SaaS Poker Multi-tenant
 */

require_once 'config.php';
require_once 'jwt_helper.php';

// Limpar sessões expiradas periodicamente
JWTHelper::cleanExpiredSessions($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        if ($endpoint === 'login') {
            handleLogin();
        } elseif ($endpoint === 'logout') {
            handleLogout();
        } elseif ($endpoint === 'refresh') {
            handleRefreshToken();
        } else {
            error('Endpoint não encontrado', 404);
        }
        break;
        
    case 'GET':
        if ($endpoint === 'verify') {
            handleVerifyToken();
        } elseif ($endpoint === 'profile') {
            handleGetProfile();
        } else {
            error('Endpoint não encontrado', 404);
        }
        break;
        
    default:
        error('Método não permitido', 405);
}

/**
 * LOGIN - Autenticar usuário
 */
function handleLogin() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        error('Email e senha são obrigatórios', 400);
    }
    
    $email = trim($input['email']);
    $password = $input['password'];
    
    if (empty($email) || empty($password)) {
        error('Email e senha não podem estar vazios', 400);
    }
    
    try {
        // Buscar usuário com dados do tenant
        $sql = "SELECT 
                    u.id, u.tenant_id, u.name, u.email, u.password_hash, u.role, u.is_active,
                    u.login_attempts, u.locked_until, u.last_login,
                    t.name as tenant_name, t.status as tenant_status, t.plan as tenant_plan
                FROM users u 
                JOIN tenants t ON u.tenant_id = t.id 
                WHERE u.email = ? AND u.is_active = 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            // Log tentativa de login inválida
            logAuditAction(null, null, 'failed_login', null, null, null, ['email' => $email, 'reason' => 'user_not_found']);
            error('Credenciais inválidas', 401);
        }
        
        // Verificar se conta está bloqueada
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            error('Conta temporariamente bloqueada. Tente novamente mais tarde.', 423);
        }
        
        // Verificar se tenant está ativo
        if ($user['tenant_status'] !== 'active') {
            error('Conta pendente de aprovação ou suspensa', 403);
        }
        
        // Verificar senha
        if (!password_verify($password, $user['password_hash'])) {
            // Incrementar tentativas de login
            $attempts = $user['login_attempts'] + 1;
            $locked_until = null;
            
            // Bloquear após 5 tentativas por 30 minutos
            if ($attempts >= 5) {
                $locked_until = date('Y-m-d H:i:s', time() + (30 * 60));
            }
            
            $updateSql = "UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?";
            $updateStmt = $pdo->prepare($updateSql);
            $updateStmt->execute([$attempts, $locked_until, $user['id']]);
            
            // Log tentativa inválida
            logAuditAction($user['tenant_id'], $user['id'], 'failed_login', null, null, null, 
                ['email' => $email, 'reason' => 'wrong_password', 'attempts' => $attempts]);
            
            error('Credenciais inválidas', 401);
        }
        
        // Login bem-sucedido - resetar tentativas
        $updateSql = "UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([$user['id']]);
        
        // Gerar token JWT
        $token_data = [
            'id' => $user['id'],
            'tenant_id' => $user['tenant_id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'tenant_name' => $user['tenant_name'],
            'tenant_plan' => $user['tenant_plan']
        ];
        
        $token = JWTHelper::generateToken($token_data);
        $refresh_token = JWTHelper::generateRefreshToken($user['id']);
        
        // Salvar sessão no banco
        $session_id = JWTHelper::saveUserSession($pdo, $user['id'], $token, $refresh_token);
        
        // Log login bem-sucedido
        logAuditAction($user['tenant_id'], $user['id'], 'successful_login', null, null, null, 
            ['session_id' => $session_id]);
        
        // Resposta de sucesso
        success([
            'message' => 'Login realizado com sucesso',
            'token' => $token,
            'refresh_token' => $refresh_token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'tenant_id' => $user['tenant_id'],
                'tenant_name' => $user['tenant_name'],
                'tenant_plan' => $user['tenant_plan']
            ],
            'expires_in' => 24 * 60 * 60 // 24 horas em segundos
        ]);
        
    } catch (Exception $e) {
        error_log("Erro no login: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * LOGOUT - Invalidar token
 */
function handleLogout() {
    global $pdo;
    
    $token = JWTHelper::getTokenFromHeaders();
    
    if (!$token) {
        error('Token não fornecido', 401);
    }
    
    // Validar token
    $payload = JWTHelper::validateToken($token);
    if (!$payload) {
        error('Token inválido', 401);
    }
    
    try {
        // Invalidar sessão
        $invalidated = JWTHelper::invalidateSession($pdo, $token);
        
        // Log logout
        logAuditAction($payload['tenant_id'], $payload['user_id'], 'logout', null, null, null, []);
        
        success([
            'message' => 'Logout realizado com sucesso',
            'invalidated' => $invalidated
        ]);
        
    } catch (Exception $e) {
        error_log("Erro no logout: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * VERIFICAR TOKEN - Validar se token ainda é válido
 */
function handleVerifyToken() {
    global $pdo;
    
    $token = JWTHelper::getTokenFromHeaders();
    
    if (!$token) {
        error('Token não fornecido', 401);
    }
    
    // Validar token JWT
    $payload = JWTHelper::validateToken($token);
    if (!$payload) {
        error('Token inválido ou expirado', 401);
    }
    
    // Verificar se token ainda existe no banco (não foi invalidado)
    if (!JWTHelper::isTokenValid($pdo, $token)) {
        error('Token foi invalidado', 401);
    }
    
    try {
        // Buscar dados atualizados do usuário
        $sql = "SELECT 
                    u.id, u.tenant_id, u.name, u.email, u.role, u.is_active,
                    t.name as tenant_name, t.status as tenant_status, t.plan as tenant_plan
                FROM users u 
                JOIN tenants t ON u.tenant_id = t.id 
                WHERE u.id = ? AND u.is_active = 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user || $user['tenant_status'] !== 'active') {
            error('Usuário ou tenant inativo', 403);
        }
        
        success([
            'valid' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'tenant_id' => $user['tenant_id'],
                'tenant_name' => $user['tenant_name'],
                'tenant_plan' => $user['tenant_plan']
            ],
            'token_expires' => $payload['exp']
        ]);
        
    } catch (Exception $e) {
        error_log("Erro na verificação de token: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * PERFIL - Obter dados do usuário logado
 */
function handleGetProfile() {
    global $pdo;
    
    $token = JWTHelper::getTokenFromHeaders();
    
    if (!$token) {
        error('Token não fornecido', 401);
    }
    
    $payload = JWTHelper::validateToken($token);
    if (!$payload) {
        error('Token inválido', 401);
    }
    
    try {
        // Buscar dados completos do usuário e tenant
        $sql = "SELECT 
                    u.id, u.tenant_id, u.name, u.email, u.role, u.last_login, u.created_at,
                    t.name as tenant_name, t.status as tenant_status, t.plan as tenant_plan,
                    t.max_sessions_per_month, t.max_users,
                    (SELECT COUNT(*) FROM sessions WHERE tenant_id = u.tenant_id AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as sessions_this_month,
                    (SELECT COUNT(*) FROM users WHERE tenant_id = u.tenant_id AND is_active = 1) as active_users
                FROM users u 
                JOIN tenants t ON u.tenant_id = t.id 
                WHERE u.id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            error('Usuário não encontrado', 404);
        }
        
        success([
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'last_login' => $user['last_login'],
                'member_since' => $user['created_at']
            ],
            'tenant' => [
                'id' => $user['tenant_id'],
                'name' => $user['tenant_name'],
                'status' => $user['tenant_status'],
                'plan' => $user['tenant_plan'],
                'limits' => [
                    'max_sessions_per_month' => $user['max_sessions_per_month'],
                    'max_users' => $user['max_users'],
                    'sessions_this_month' => $user['sessions_this_month'],
                    'active_users' => $user['active_users']
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Erro ao buscar perfil: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * REFRESH TOKEN - Renovar token expirado
 */
function handleRefreshToken() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['refresh_token'])) {
        error('Refresh token é obrigatório', 400);
    }
    
    // Por simplicidade, vamos implementar refresh token básico
    // Em produção, seria mais complexo com validação específica
    
    success([
        'message' => 'Refresh token não implementado ainda',
        'action' => 'Faça login novamente'
    ]);
}

/**
 * FUNÇÃO AUXILIAR - Log de auditoria
 */
function logAuditAction($tenant_id, $user_id, $action, $table_name, $record_id, $old_data, $new_data) {
    global $pdo;
    
    try {
        $sql = "INSERT INTO audit_logs (tenant_id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $tenant_id,
            $user_id,
            $action,
            $table_name,
            $record_id,
            $old_data ? json_encode($old_data) : null,
            $new_data ? json_encode($new_data) : null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    } catch (Exception $e) {
        error_log("Erro ao registrar auditoria: " . $e->getMessage());
    }
}
?>
