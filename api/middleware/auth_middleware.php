<?php
/**
 * Middleware de Autenticação
 * Valida tokens JWT e controla acesso às APIs
 */

require_once __DIR__ . '/../jwt_helper.php';

class AuthMiddleware {
    private static $current_user = null;
    private static $current_tenant = null;
    
    /**
     * Verificar autenticação obrigatória
     */
    public static function requireAuth($pdo) {
        $token = JWTHelper::getTokenFromHeaders();
        
        if (!$token) {
            http_response_code(401);
            echo json_encode(['error' => 'Token de autenticação necessário']);
            exit;
        }
        
        // Validar token JWT
        $payload = JWTHelper::validateToken($token);
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['error' => 'Token inválido ou expirado']);
            exit;
        }
        
        // Verificar se token ainda é válido no banco
        if (!JWTHelper::isTokenValid($pdo, $token)) {
            http_response_code(401);
            echo json_encode(['error' => 'Token foi invalidado']);
            exit;
        }
        
        // Buscar dados atuais do usuário
        try {
            $sql = "SELECT 
                        u.id, u.tenant_id, u.name, u.email, u.role, u.is_active,
                        t.name as tenant_name, t.status as tenant_status, t.plan as tenant_plan,
                        t.max_sessions_per_month, t.max_users
                    FROM users u 
                    JOIN tenants t ON u.tenant_id = t.id 
                    WHERE u.id = ? AND u.is_active = 1";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$payload['user_id']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                http_response_code(403);
                echo json_encode(['error' => 'Usuário não encontrado ou inativo']);
                exit;
            }
            
            if ($user['tenant_status'] !== 'active') {
                http_response_code(403);
                echo json_encode(['error' => 'Tenant inativo ou pendente de aprovação']);
                exit;
            }
            
            // Salvar dados do usuário atual
            self::$current_user = $user;
            self::$current_tenant = [
                'id' => $user['tenant_id'],
                'name' => $user['tenant_name'],
                'status' => $user['tenant_status'],
                'plan' => $user['tenant_plan'],
                'max_sessions_per_month' => $user['max_sessions_per_month'],
                'max_users' => $user['max_users']
            ];
            
            return $user;
            
        } catch (Exception $e) {
            error_log("Erro no middleware de auth: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Erro interno do servidor']);
            exit;
        }
    }
    
    /**
     * Verificar se usuário tem role específica
     */
    public static function requireRole($required_role) {
        if (!self::$current_user) {
            http_response_code(401);
            echo json_encode(['error' => 'Usuário não autenticado']);
            exit;
        }
        
        $user_role = self::$current_user['role'];
        
        // Hierarquia de roles: user < admin < super_admin
        $role_hierarchy = ['user' => 1, 'admin' => 2, 'super_admin' => 3];
        
        $user_level = $role_hierarchy[$user_role] ?? 0;
        $required_level = $role_hierarchy[$required_role] ?? 999;
        
        if ($user_level < $required_level) {
            http_response_code(403);
            echo json_encode(['error' => 'Permissões insuficientes']);
            exit;
        }
        
        return true;
    }
    
    /**
     * Verificar se é SUPER ADMIN
     */
    public static function requireSuperAdmin() {
        return self::requireRole('super_admin');
    }
    
    /**
     * Verificar se pode acessar modo global (apenas super_admin)
     */
    public static function requireGlobalAccess() {
        if (!self::$current_user || self::$current_user['role'] !== 'super_admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado. Apenas super administradores podem acessar dados globais.']);
            exit;
        }
        return true;
    }
    
    /**
     * Obter usuário atual
     */
    public static function getCurrentUser() {
        return self::$current_user;
    }
    
    /**
     * Obter tenant atual
     */
    public static function getCurrentTenant() {
        return self::$current_tenant;
    }
    
    /**
     * Obter tenant_id atual
     */
    public static function getCurrentTenantId() {
        return self::$current_tenant ? self::$current_tenant['id'] : null;
    }
    
    /**
     * Verificar se usuário pertence ao tenant específico
     */
    public static function belongsToTenant($tenant_id) {
        if (!self::$current_user) {
            return false;
        }
        
        return self::$current_user['tenant_id'] == $tenant_id;
    }
    
    /**
     * Verificar limites do plano
     */
    public static function checkPlanLimits($pdo, $limit_type) {
        if (!self::$current_tenant) {
            return false;
        }
        
        $tenant_id = self::$current_tenant['id'];
        
        try {
            switch ($limit_type) {
                case 'sessions_monthly':
                    // Contar sessões do mês atual
                    $sql = "SELECT COUNT(*) as count FROM sessions 
                            WHERE tenant_id = ? 
                            AND MONTH(created_at) = MONTH(NOW()) 
                            AND YEAR(created_at) = YEAR(NOW())";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$tenant_id]);
                    $result = $stmt->fetch();
                    
                    $current_count = $result['count'];
                    $limit = self::$current_tenant['max_sessions_per_month'];
                    
                    return [
                        'allowed' => $current_count < $limit,
                        'current' => $current_count,
                        'limit' => $limit,
                        'remaining' => max(0, $limit - $current_count)
                    ];
                    
                case 'users':
                    // Contar usuários ativos
                    $sql = "SELECT COUNT(*) as count FROM users 
                            WHERE tenant_id = ? AND is_active = 1";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$tenant_id]);
                    $result = $stmt->fetch();
                    
                    $current_count = $result['count'];
                    $limit = self::$current_tenant['max_users'];
                    
                    return [
                        'allowed' => $current_count < $limit,
                        'current' => $current_count,
                        'limit' => $limit,
                        'remaining' => max(0, $limit - $current_count)
                    ];
                    
                default:
                    return ['allowed' => true, 'current' => 0, 'limit' => 999999, 'remaining' => 999999];
            }
        } catch (Exception $e) {
            error_log("Erro ao verificar limites: " . $e->getMessage());
            return ['allowed' => false, 'current' => 0, 'limit' => 0, 'remaining' => 0];
        }
    }
    
    /**
     * Log de auditoria automático
     */
    public static function logAction($pdo, $action, $table_name = null, $record_id = null, $old_data = null, $new_data = null) {
        if (!self::$current_user) {
            return false;
        }
        
        try {
            $sql = "INSERT INTO audit_logs (tenant_id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                self::$current_user['tenant_id'],
                self::$current_user['id'],
                $action,
                $table_name,
                $record_id,
                $old_data ? json_encode($old_data) : null,
                $new_data ? json_encode($new_data) : null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
            
            return $pdo->lastInsertId();
        } catch (Exception $e) {
            error_log("Erro ao registrar auditoria: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Middleware opcional (não obrigatório ter token)
     */
    public static function optionalAuth($pdo) {
        $token = JWTHelper::getTokenFromHeaders();
        
        if (!$token) {
            return null; // Sem token, mas não é erro
        }
        
        $payload = JWTHelper::validateToken($token);
        if (!$payload || !JWTHelper::isTokenValid($pdo, $token)) {
            return null; // Token inválido, mas não é erro
        }
        
        // Tentar carregar dados do usuário
        try {
            $sql = "SELECT 
                        u.id, u.tenant_id, u.name, u.email, u.role, u.is_active,
                        t.name as tenant_name, t.status as tenant_status, t.plan as tenant_plan
                    FROM users u 
                    JOIN tenants t ON u.tenant_id = t.id 
                    WHERE u.id = ? AND u.is_active = 1";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$payload['user_id']]);
            $user = $stmt->fetch();
            
            if ($user && $user['tenant_status'] === 'active') {
                self::$current_user = $user;
                self::$current_tenant = [
                    'id' => $user['tenant_id'],
                    'name' => $user['tenant_name'],
                    'status' => $user['tenant_status'],
                    'plan' => $user['tenant_plan']
                ];
                return $user;
            }
            
        } catch (Exception $e) {
            error_log("Erro no auth opcional: " . $e->getMessage());
        }
        
        return null;
    }
}
?>
