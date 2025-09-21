<?php
/**
 * API de Convites - Sistema hierárquico de usuários
 * Permite admins convidarem novos membros para seus tenants
 */

require_once 'config.php';
require_once 'middleware/auth_middleware.php';

// Autenticação obrigatória
$current_user = AuthMiddleware::requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Limpar convites expirados
cleanExpiredInvites($pdo);

switch ($method) {
    case 'POST':
        if ($action === 'send') {
            handleSendInvite();
        } else {
            error('Ação não encontrada', 404);
        }
        break;
        
    case 'GET':
        if ($action === 'list') {
            handleListInvites();
        } elseif ($action === 'pending') {
            handlePendingInvites();
        } else {
            error('Ação não encontrada', 404);
        }
        break;
        
    case 'DELETE':
        if ($action === 'cancel') {
            handleCancelInvite();
        } else {
            error('Ação não encontrada', 404);
        }
        break;
        
    default:
        error('Método não permitido', 405);
}

/**
 * ENVIAR CONVITE - Apenas admins podem convidar
 */
function handleSendInvite() {
    global $pdo, $current_user;
    
    // Verificar se é admin (tenant_admin ou super_admin)
    if (!in_array($current_user['role'], ['admin', 'super_admin'])) {
        error('Apenas administradores podem enviar convites', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        error('Email é obrigatório', 400);
    }
    
    $email = trim(strtolower($input['email']));
    $name = trim($input['name'] ?? '');
    $role = $input['role'] ?? 'user';
    $target_tenant_id = $input['tenant_id'] ?? $current_user['tenant_id'];
    
    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        error('Email inválido', 400);
    }
    
    // Validar role
    if (!in_array($role, ['user', 'admin'])) {
        error('Role inválido', 400);
    }
    
    // SUPER ADMIN pode convidar para qualquer tenant
    // TENANT ADMIN só pode convidar para seu próprio tenant
    if ($current_user['role'] === 'admin' && $target_tenant_id != $current_user['tenant_id']) {
        error('Você só pode convidar para seu próprio grupo', 403);
    }
    
    try {
        // Verificar se email já existe no sistema
        $checkUserSql = "SELECT id, tenant_id FROM users WHERE email = ?";
        $checkUserStmt = $pdo->prepare($checkUserSql);
        $checkUserStmt->execute([$email]);
        $existingUser = $checkUserStmt->fetch();
        
        if ($existingUser) {
            if ($existingUser['tenant_id'] == $target_tenant_id) {
                error('Usuário já é membro deste grupo', 409);
            } else {
                error('Email já está em uso em outro grupo', 409);
            }
        }
        
        // Verificar se já existe convite pendente
        $checkInviteSql = "SELECT id FROM user_invites WHERE email = ? AND tenant_id = ? AND status = 'pending'";
        $checkInviteStmt = $pdo->prepare($checkInviteSql);
        $checkInviteStmt->execute([$email, $target_tenant_id]);
        
        if ($checkInviteStmt->fetch()) {
            error('Já existe um convite pendente para este email neste grupo', 409);
        }
        
        // Verificar limites do tenant
        $limits = AuthMiddleware::checkPlanLimits($pdo, 'users');
        if (!$limits['allowed'] && $current_user['role'] !== 'super_admin') {
            error("Limite de usuários atingido ({$limits['limit']}). Upgrade seu plano para continuar.", 403);
        }
        
        // Buscar dados do tenant de destino
        $tenantSql = "SELECT * FROM tenants WHERE id = ?";
        $tenantStmt = $pdo->prepare($tenantSql);
        $tenantStmt->execute([$target_tenant_id]);
        $tenant = $tenantStmt->fetch();
        
        if (!$tenant) {
            error('Tenant não encontrado', 404);
        }
        
        // Gerar token único
        $invite_token = 'invite_' . bin2hex(random_bytes(32));
        $expires_at = date('Y-m-d H:i:s', time() + (7 * 24 * 60 * 60)); // 7 dias
        
        // Inserir convite
        $insertSql = "INSERT INTO user_invites (tenant_id, invited_by_user_id, email, name, role, invite_token, expires_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $insertStmt = $pdo->prepare($insertSql);
        $insertStmt->execute([
            $target_tenant_id,
            $current_user['id'],
            $email,
            $name,
            $role,
            $invite_token,
            $expires_at
        ]);
        
        $invite_id = $pdo->lastInsertId();
        
        // Enviar email de convite
        $email_sent = sendInviteEmail($tenant, $current_user, $email, $name, $role, $invite_token);
        
        // Log da ação
        AuthMiddleware::logAction($pdo, 'send_invite', 'user_invites', $invite_id, null, [
            'email' => $email,
            'role' => $role,
            'target_tenant_id' => $target_tenant_id,
            'email_sent' => $email_sent
        ]);
        
        success([
            'message' => 'Convite enviado com sucesso!',
            'invite_id' => $invite_id,
            'email' => $email,
            'expires_at' => $expires_at,
            'email_sent' => $email_sent
        ]);
        
    } catch (Exception $e) {
        error_log("Erro ao enviar convite: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * LISTAR CONVITES - Ver convites enviados
 */
function handleListInvites() {
    global $pdo, $current_user;
    
    try {
        $sql = "SELECT 
                    i.*,
                    t.name as tenant_name,
                    u.name as invited_by_name
                FROM user_invites i
                JOIN tenants t ON i.tenant_id = t.id
                JOIN users u ON i.invited_by_user_id = u.id
                WHERE ";
        
        $params = [];
        
        // SUPER ADMIN vê todos os convites
        if ($current_user['role'] === 'super_admin') {
            $sql .= "1 = 1";
        } else {
            // TENANT ADMIN vê apenas convites do seu tenant
            $sql .= "i.tenant_id = ?";
            $params[] = $current_user['tenant_id'];
        }
        
        $sql .= " ORDER BY i.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $invites = $stmt->fetchAll();
        
        success($invites);
        
    } catch (Exception $e) {
        error_log("Erro ao listar convites: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * CONVITES PENDENTES - Para dashboard
 */
function handlePendingInvites() {
    global $pdo, $current_user;
    
    try {
        $sql = "SELECT 
                    i.*,
                    t.name as tenant_name
                FROM user_invites i
                JOIN tenants t ON i.tenant_id = t.id
                WHERE i.status = 'pending' AND i.expires_at > NOW() AND ";
        
        $params = [];
        
        if ($current_user['role'] === 'super_admin') {
            $sql .= "1 = 1";
        } else {
            $sql .= "i.tenant_id = ?";
            $params[] = $current_user['tenant_id'];
        }
        
        $sql .= " ORDER BY i.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $invites = $stmt->fetchAll();
        
        success($invites);
        
    } catch (Exception $e) {
        error_log("Erro ao buscar convites pendentes: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * CANCELAR CONVITE
 */
function handleCancelInvite() {
    global $pdo, $current_user;
    
    $invite_id = $_GET['id'] ?? null;
    
    if (!$invite_id) {
        error('ID do convite é obrigatório', 400);
    }
    
    try {
        // Buscar convite
        $sql = "SELECT * FROM user_invites WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$invite_id]);
        $invite = $stmt->fetch();
        
        if (!$invite) {
            error('Convite não encontrado', 404);
        }
        
        // Verificar permissões
        if ($current_user['role'] !== 'super_admin' && 
            ($invite['tenant_id'] != $current_user['tenant_id'] || $invite['invited_by_user_id'] != $current_user['id'])) {
            error('Você não pode cancelar este convite', 403);
        }
        
        // Cancelar convite
        $updateSql = "UPDATE user_invites SET status = 'expired' WHERE id = ?";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([$invite_id]);
        
        // Log da ação
        AuthMiddleware::logAction($pdo, 'cancel_invite', 'user_invites', $invite_id, $invite, null);
        
        success(['message' => 'Convite cancelado com sucesso']);
        
    } catch (Exception $e) {
        error_log("Erro ao cancelar convite: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * ENVIAR EMAIL DE CONVITE
 */
function sendInviteEmail($tenant, $inviter, $email, $name, $role, $token) {
    $subject = "🎯 Convite para Poker SaaS - " . $tenant['name'];
    $accept_url = "https://" . $_SERVER['HTTP_HOST'] . "/api/accept_invite.php?token=" . $token;
    
    $role_text = $role === 'admin' ? 'Administrador' : 'Membro';
    
    $html_body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007cba; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #007cba; }
            .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎯 Você foi convidado!</h1>
                <p>Poker SaaS - Sistema de Gerenciamento</p>
            </div>
            
            <div class='content'>
                <h2>Olá" . ($name ? ", $name" : "") . "!</h2>
                
                <p><strong>" . $inviter['name'] . "</strong> convidou você para participar do grupo de poker:</p>
                
                <div class='info'>
                    <strong>🏢 Grupo:</strong> " . $tenant['name'] . "<br>
                    <strong>👤 Seu papel:</strong> $role_text<br>
                    <strong>💎 Plano:</strong> " . ucfirst($tenant['plan']) . "<br>
                    <strong>📧 Seu email:</strong> $email
                </div>
                
                <p>Como <strong>$role_text</strong>, você poderá:</p>
                <ul>";
    
    if ($role === 'admin') {
        $html_body .= "
                    <li>✅ Criar e gerenciar sessões de poker</li>
                    <li>✅ Convidar outros membros</li>
                    <li>✅ Ver relatórios e estatísticas</li>
                    <li>✅ Gerenciar configurações do grupo</li>";
    } else {
        $html_body .= "
                    <li>✅ Visualizar sessões do grupo</li>
                    <li>✅ Ver seu histórico de jogos</li>
                    <li>✅ Acompanhar ranking</li>
                    <li>✅ Participar das atividades</li>";
    }
    
    $html_body .= "
                </ul>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='$accept_url' class='btn'>🚀 Aceitar Convite</a>
                </div>
                
                <p><small>⏰ <strong>Importante:</strong> Este convite expira em 7 dias.</small></p>
                <p><small>Se você não solicitou este convite, pode ignorar este email.</small></p>
            </div>
            
            <div class='footer'>
                <p>Poker SaaS - Sistema de Gerenciamento de Sessões</p>
                <p>Convidado por: " . $inviter['name'] . " (" . $inviter['email'] . ")</p>
            </div>
        </div>
    </body>
    </html>";
    
    $headers = [
        'From: noreply@poker-saas.com',
        'Reply-To: ' . $inviter['email'],
        'Content-Type: text/html; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    try {
        return mail($email, $subject, $html_body, implode("\r\n", $headers));
    } catch (Exception $e) {
        error_log("Erro ao enviar email de convite: " . $e->getMessage());
        return false;
    }
}

/**
 * LIMPAR CONVITES EXPIRADOS
 */
function cleanExpiredInvites($pdo) {
    try {
        $sql = "UPDATE user_invites SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW()";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->rowCount();
    } catch (Exception $e) {
        error_log("Erro ao limpar convites expirados: " . $e->getMessage());
        return 0;
    }
}
?>
