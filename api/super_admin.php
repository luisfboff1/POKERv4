<?php
/**
 * API Super Admin - Dashboard Global
 * APENAS para super_admin (Luis) - Ver todos os tenants e estatísticas
 */

require_once 'config.php';
require_once 'middleware/auth_middleware.php';

// Primeiro autenticar, depois verificar se é super admin
$current_user = AuthMiddleware::requireAuth($pdo);
AuthMiddleware::requireGlobalAccess();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'stats') {
            handleGlobalStats();
        } elseif ($action === 'tenants') {
            handleListAllTenants();
        } elseif ($action === 'tenant_details') {
            handleTenantDetails();
        } elseif ($action === 'recent_activity') {
            handleRecentActivity();
        } elseif ($action === 'revenue') {
            handleRevenueReport();
        } else {
            error('Ação não encontrada', 404);
        }
        break;
        
    case 'POST':
        if ($action === 'suspend_tenant') {
            handleSuspendTenant();
        } elseif ($action === 'activate_tenant') {
            handleActivateTenant();
        } elseif ($action === 'change_plan') {
            handleChangePlan();
        } else {
            error('Ação não encontrada', 404);
        }
        break;
        
    default:
        error('Método não permitido', 405);
}

/**
 * ESTATÍSTICAS GLOBAIS
 */
function handleGlobalStats() {
    global $pdo;
    
    try {
        // Usar a view criada no update_roles.sql
        $stmt = $pdo->query("SELECT * FROM super_admin_stats");
        $stats = $stmt->fetch();
        
        // Estatísticas adicionais
        $additionalSql = "
            SELECT 
                -- Crescimento mensal
                (SELECT COUNT(*) FROM tenants WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as new_tenants_this_month,
                (SELECT COUNT(*) FROM users WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as new_users_this_month,
                
                -- Atividade recente
                (SELECT COUNT(*) FROM sessions WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as sessions_last_7_days,
                (SELECT COUNT(*) FROM audit_logs WHERE DATE(created_at) = CURDATE()) as actions_today,
                
                -- Top tenant por sessões
                (SELECT t.name FROM tenants t 
                 JOIN sessions s ON t.id = s.tenant_id 
                 WHERE t.status = 'active' 
                 GROUP BY t.id, t.name 
                 ORDER BY COUNT(s.id) DESC 
                 LIMIT 1) as most_active_tenant,
                
                -- Último login
                (SELECT MAX(last_login) FROM users WHERE is_active = 1) as last_user_login
        ";
        
        $additionalStmt = $pdo->query($additionalSql);
        $additional = $additionalStmt->fetch();
        
        success([
            'overview' => $stats,
            'growth' => $additional,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        error_log("Erro nas estatísticas globais: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * LISTAR TODOS OS TENANTS
 */
function handleListAllTenants() {
    global $pdo;
    
    $status = $_GET['status'] ?? 'all';
    $plan = $_GET['plan'] ?? 'all';
    $limit = min(100, (int)($_GET['limit'] ?? 50));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    
    try {
        $sql = "SELECT * FROM all_tenants_view WHERE 1=1";
        $params = [];
        
        if ($status !== 'all') {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        if ($plan !== 'all') {
            $sql .= " AND plan = ?";
            $params[] = $plan;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $tenants = $stmt->fetchAll();
        
        // Contar total (usar tabela direta para simplificar)
        $countSql = "SELECT COUNT(*) as total FROM tenants WHERE 1=1";
        $countParams = [];
        
        if ($status !== 'all') {
            $countSql .= " AND status = ?";
            $countParams[] = $status;
        }
        
        if ($plan !== 'all') {
            $countSql .= " AND plan = ?";
            $countParams[] = $plan;
        }
        
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($countParams);
        $total = $countStmt->fetch()['total'];
        
        success([
            'tenants' => $tenants,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Erro ao listar tenants: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * DETALHES DE UM TENANT ESPECÍFICO
 */
function handleTenantDetails() {
    global $pdo;
    
    $tenant_id = $_GET['tenant_id'] ?? null;
    
    if (!$tenant_id) {
        error('ID do tenant é obrigatório', 400);
    }
    
    try {
        // Dados básicos do tenant
        $tenantSql = "SELECT * FROM all_tenants_view WHERE id = ?";
        $tenantStmt = $pdo->prepare($tenantSql);
        $tenantStmt->execute([$tenant_id]);
        $tenant = $tenantStmt->fetch();
        
        if (!$tenant) {
            error('Tenant não encontrado', 404);
        }
        
        // Usuários do tenant
        $usersSql = "SELECT id, name, email, role, is_active, last_login, created_at FROM users WHERE tenant_id = ? ORDER BY role DESC, name";
        $usersStmt = $pdo->prepare($usersSql);
        $usersStmt->execute([$tenant_id]);
        $users = $usersStmt->fetchAll();
        
        // Sessões recentes
        $sessionsSql = "SELECT id, date, created_at, JSON_LENGTH(players_data) as player_count FROM sessions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10";
        $sessionsStmt = $pdo->prepare($sessionsSql);
        $sessionsStmt->execute([$tenant_id]);
        $recent_sessions = $sessionsStmt->fetchAll();
        
        // Atividade por mês (últimos 6 meses)
        $activitySql = "
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as sessions_count
            FROM sessions 
            WHERE tenant_id = ? 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
        ";
        $activityStmt = $pdo->prepare($activitySql);
        $activityStmt->execute([$tenant_id]);
        $monthly_activity = $activityStmt->fetchAll();
        
        success([
            'tenant' => $tenant,
            'users' => $users,
            'recent_sessions' => $recent_sessions,
            'monthly_activity' => $monthly_activity
        ]);
        
    } catch (Exception $e) {
        error_log("Erro ao buscar detalhes do tenant: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * ATIVIDADE RECENTE GLOBAL
 */
function handleRecentActivity() {
    global $pdo;
    
    try {
        $sql = "
            SELECT 
                a.action,
                a.created_at,
                a.ip_address,
                u.name as user_name,
                u.email as user_email,
                t.name as tenant_name,
                a.new_data
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN tenants t ON a.tenant_id = t.id
            WHERE a.action IN ('successful_login', 'create_session', 'tenant_registration', 'tenant_approved', 'send_invite')
            ORDER BY a.created_at DESC
            LIMIT 50
        ";
        
        $stmt = $pdo->query($sql);
        $activities = $stmt->fetchAll();
        
        success($activities);
        
    } catch (Exception $e) {
        error_log("Erro na atividade recente: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * RELATÓRIO DE RECEITA
 */
function handleRevenueReport() {
    global $pdo;
    
    try {
        $sql = "
            SELECT 
                plan,
                COUNT(*) as tenant_count,
                CASE 
                    WHEN plan = 'basic' THEN COUNT(*) * 29 
                    WHEN plan = 'premium' THEN COUNT(*) * 59 
                    WHEN plan = 'enterprise' THEN COUNT(*) * 99 
                    ELSE 0 
                END as monthly_revenue
            FROM tenants 
            WHERE status = 'active'
            GROUP BY plan
            ORDER BY monthly_revenue DESC
        ";
        
        $stmt = $pdo->query($sql);
        $revenue_by_plan = $stmt->fetchAll();
        
        // Crescimento mensal
        $growthSql = "
            SELECT 
                DATE_FORMAT(approved_at, '%Y-%m') as month,
                COUNT(*) as new_tenants,
                SUM(CASE 
                    WHEN plan = 'basic' THEN 29 
                    WHEN plan = 'premium' THEN 59 
                    WHEN plan = 'enterprise' THEN 99 
                    ELSE 0 
                END) as monthly_mrr_added
            FROM tenants 
            WHERE status = 'active' 
            AND approved_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(approved_at, '%Y-%m')
            ORDER BY month DESC
        ";
        
        $growthStmt = $pdo->query($growthSql);
        $monthly_growth = $growthStmt->fetchAll();
        
        success([
            'revenue_by_plan' => $revenue_by_plan,
            'monthly_growth' => $monthly_growth,
            'total_mrr' => array_sum(array_column($revenue_by_plan, 'monthly_revenue'))
        ]);
        
    } catch (Exception $e) {
        error_log("Erro no relatório de receita: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * SUSPENDER TENANT
 */
function handleSuspendTenant() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $tenant_id = $input['tenant_id'] ?? null;
    $reason = $input['reason'] ?? 'Suspenso pelo administrador';
    
    if (!$tenant_id) {
        error('ID do tenant é obrigatório', 400);
    }
    
    try {
        $sql = "UPDATE tenants SET status = 'suspended' WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tenant_id]);
        
        // Log da ação
        AuthMiddleware::logAction($pdo, 'suspend_tenant', 'tenants', $tenant_id, null, ['reason' => $reason]);
        
        success(['message' => 'Tenant suspenso com sucesso']);
        
    } catch (Exception $e) {
        error_log("Erro ao suspender tenant: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * ATIVAR TENANT
 */
function handleActivateTenant() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $tenant_id = $input['tenant_id'] ?? null;
    
    if (!$tenant_id) {
        error('ID do tenant é obrigatório', 400);
    }
    
    try {
        $sql = "UPDATE tenants SET status = 'active' WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tenant_id]);
        
        // Log da ação
        AuthMiddleware::logAction($pdo, 'activate_tenant', 'tenants', $tenant_id, null, null);
        
        success(['message' => 'Tenant ativado com sucesso']);
        
    } catch (Exception $e) {
        error_log("Erro ao ativar tenant: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * ALTERAR PLANO DO TENANT
 */
function handleChangePlan() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $tenant_id = $input['tenant_id'] ?? null;
    $new_plan = $input['plan'] ?? null;
    
    if (!$tenant_id || !$new_plan) {
        error('ID do tenant e plano são obrigatórios', 400);
    }
    
    if (!in_array($new_plan, ['basic', 'premium', 'enterprise'])) {
        error('Plano inválido', 400);
    }
    
    // Definir limites
    $plan_limits = [
        'basic' => ['sessions' => 50, 'users' => 2],
        'premium' => ['sessions' => 200, 'users' => 5],
        'enterprise' => ['sessions' => 999999, 'users' => 999999]
    ];
    
    $limits = $plan_limits[$new_plan];
    
    try {
        $sql = "UPDATE tenants SET plan = ?, max_sessions_per_month = ?, max_users = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$new_plan, $limits['sessions'], $limits['users'], $tenant_id]);
        
        // Log da ação
        AuthMiddleware::logAction($pdo, 'change_plan', 'tenants', $tenant_id, null, ['new_plan' => $new_plan]);
        
        success(['message' => 'Plano alterado com sucesso']);
        
    } catch (Exception $e) {
        error_log("Erro ao alterar plano: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}
?>
