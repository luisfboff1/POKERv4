
<?php
/**
 * API de Convites - Sistema hierárquico de usuários
 * Permite admins convidarem novos membros para seus tenants
 */

// CORS headers para todas as rotas da API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
require_once 'middleware/auth_middleware.php';
require_once 'email_config.php';

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
        } elseif ($action === 'remove_member') {
            handleRemoveMember();
        } elseif ($action === 'reset_member_password') {
            handleResetMemberPassword();
        } else {
            error('Ação não encontrada', 404);
        }
        break;
        
    case 'GET':
        if ($action === 'list') {
            handleListInvites();
        } elseif ($action === 'pending') {
            handlePendingInvites();
        } elseif ($action === 'members') {
            handleListGroupMembers();
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
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Apenas administradores podem enviar convites - DEBUG',
            'debug' => [
                'user_role' => $current_user['role'] ?? 'NULL',
                'expected_roles' => ['admin', 'super_admin'],
                'current_user' => $current_user
            ]
        ]);
        exit;
    }
    
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    // Debug: log do input recebido
    error_log("DEBUG invite.php - Raw input: " . $raw_input);
    error_log("DEBUG invite.php - Parsed input: " . json_encode($input));    if (!$input || !isset($input['email'])) {
        error_log("DEBUG invite.php - Email não fornecido. Input: " . json_encode($input));
        error('Email é obrigatório', 400);
    }
    
    $email = trim(strtolower($input['email']));
    $name = trim($input['name'] ?? '');
    $role = trim($input['role'] ?? 'player');  // Mudança: default para 'player' e trim
    $target_tenant_id = $input['tenant_id'] ?? $current_user['tenant_id'];
    
    // Debug: log dos valores extraídos
    error_log("DEBUG invite.php - Email: $email, Role: '$role' (type: " . gettype($role) . "), Name: $name");
    error_log("DEBUG invite.php - Role length: " . strlen($role));
    error_log("DEBUG invite.php - Role bytes: " . bin2hex($role));
    error_log("DEBUG invite.php - Role comparison - is 'player': " . ($role === 'player' ? 'true' : 'false') . ", is 'admin': " . ($role === 'admin' ? 'true' : 'false'));
    error_log("DEBUG invite.php - in_array result: " . (in_array($role, ['player', 'admin']) ? 'true' : 'false'));

    // Dados de vinculação de jogador (apenas para role 'player')
    $playerLinkType = $input['playerLinkType'] ?? null;
    $selectedPlayerId = $input['selectedPlayerId'] ?? null;
    $newPlayerData = $input['newPlayerData'] ?? null;

    // Debug: log dos dados de vinculação
    error_log("DEBUG invite.php - PlayerLinkType: $playerLinkType, SelectedPlayerId: $selectedPlayerId");

    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        error('Email inválido', 400);
    }

    // DEBUG DIRETO NA RESPOSTA - Para você copiar e colar
    $debug_info = [
        'raw_input' => $raw_input,
        'json_decode_success' => ($input ? 'SUCCESS' : 'FAILED'),
        'json_error' => json_last_error_msg(),
        'input_array' => $input,
        'email_extracted' => $email,
        'role_extracted' => $role,
        'role_type' => gettype($role),
        'role_length' => strlen($role),
        'role_is_string' => (is_string($role) ? 'YES' : 'NO'),
        'role_equals_player' => ($role === 'player' ? 'YES' : 'NO'),
        'role_equals_admin' => ($role === 'admin' ? 'YES' : 'NO'),
        'in_array_result' => (in_array($role, ['player', 'admin']) ? 'YES' : 'NO'),
        'valid_roles' => ['player', 'admin'],
        'role_hex' => bin2hex($role)
    ];
    
    // Retornar debug diretamente na resposta se role inválido
    if (!in_array($role, ['player', 'admin'])) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Role inválido',
            'debug' => $debug_info
        ]);
        exit;
    }
    // Validações específicas para vinculação de jogador (admin ou player podem ter jogador vinculado)
    if ($playerLinkType) {
        if ($playerLinkType === 'existing' && !$selectedPlayerId) {
            error('Jogador deve ser selecionado para vinculação', 400);
        }
        
        if ($playerLinkType === 'new' && (!$newPlayerData || !isset($newPlayerData['name']) || trim($newPlayerData['name']) === '')) {
            error('Nome do jogador é obrigatório', 400);
        }
        
        // Se vinculando a jogador existente, verificar se existe e está disponível
        if ($playerLinkType === 'existing' && $selectedPlayerId) {
            $checkPlayerSql = "SELECT id, user_id, tenant_id FROM players WHERE id = ?";
            $checkPlayerStmt = $pdo->prepare($checkPlayerSql);
            $checkPlayerStmt->execute([$selectedPlayerId]);
            $existingPlayer = $checkPlayerStmt->fetch();
            
            if (!$existingPlayer) {
                error('Jogador não encontrado', 404);
            }
            
            if ($existingPlayer['tenant_id'] != $target_tenant_id) {
                error('Jogador não pertence a este grupo', 403);
            }
            
            if ($existingPlayer['user_id']) {
                error('Jogador já possui usuário vinculado', 409);
            }
        }
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
        $insertSql = "INSERT INTO user_invites (tenant_id, invited_by_user_id, email, name, role, invite_token, expires_at, player_id) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $player_id_for_invite = null;
        if ($playerLinkType === 'existing' && $selectedPlayerId) {
            $player_id_for_invite = $selectedPlayerId;
        }
        
        $insertStmt = $pdo->prepare($insertSql);
        $insertStmt->execute([
            $target_tenant_id,
            $current_user['id'],
            $email,
            $name,
            $role,
            $invite_token,
            $expires_at,
            $player_id_for_invite
        ]);
        
        $invite_id = $pdo->lastInsertId();
        
        // Enviar email de convite
        $email_sent = sendInviteEmail($tenant, $current_user, $email, $name, $role, $invite_token);
        
        // Se for novo jogador, armazenar dados temporariamente em uma coluna JSON
        if ($playerLinkType === 'new' && $newPlayerData) {
            $updateSql = "UPDATE user_invites SET notes = ? WHERE id = ?";
            $updateStmt = $pdo->prepare($updateSql);
            $updateStmt->execute([json_encode($newPlayerData), $invite_id]);
        }
        
        // Log da ação
        AuthMiddleware::logAction($pdo, 'send_invite', 'user_invites', $invite_id, null, [
            'email' => $email,
            'role' => $role,
            'target_tenant_id' => $target_tenant_id,
            'player_link_type' => $playerLinkType,
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
        
    // Excluir convite do banco
    $deleteSql = "DELETE FROM user_invites WHERE id = ?";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->execute([$invite_id]);
        
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
    $subject = "🎯 {$inviter['name']} te convidou para a home game: {$tenant['name']}";
    $accept_url = BASE_URL . "/accept-invite?token=" . $token;
    
    // Usar o template atualizado do email_config.php
    $html_body = getInviteEmailTemplate($inviter['name'], $tenant['name'], $accept_url);
    
    // Enviar email real
    try {
        $result = sendEmail($email, $subject, $html_body, true);
        return $result['success'];
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

/**
 * LISTAR MEMBROS DO GRUPO (para tenant admin)
 */
function handleListGroupMembers() {
    global $pdo, $current_user;
    
    try {
        // Listar usuários do mesmo tenant
        $stmt = $pdo->prepare("
            SELECT id, name, email, role, created_at, last_login
            FROM users 
            WHERE tenant_id = ?
            ORDER BY role DESC, name ASC
        ");
        $stmt->execute([$current_user['tenant_id']]);
        $members = $stmt->fetchAll();
        
        success($members);
        
    } catch (Exception $e) {
        error_log("Erro ao listar membros: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * REMOVER MEMBRO DO GRUPO (para tenant admin)
 */
function handleRemoveMember() {
    global $pdo, $current_user;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $user_id = $input['user_id'] ?? null;
        
        if (!$user_id) {
            error('ID do usuário é obrigatório', 400);
        }
        
        // Verificar se usuário pertence ao mesmo tenant
        $stmt = $pdo->prepare("SELECT role, name, tenant_id FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            error('Usuário não encontrado', 404);
        }
        
        if ($user['tenant_id'] != $current_user['tenant_id']) {
            error('Usuário não pertence ao seu grupo', 403);
        }
        
        if ($user['role'] === 'admin') {
            error('Não é possível remover administradores', 403);
        }
        
        if ($user_id == $current_user['id']) {
            error('Você não pode remover a si mesmo', 403);
        }
        
        // Remover usuário
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        
        // Log da ação
        AuthMiddleware::logAction($pdo, 'remove_member', 'users', $user_id, $user, null);
        
        success(['message' => 'Membro removido com sucesso']);
        
    } catch (Exception $e) {
        error_log("Erro ao remover membro: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}

/**
 * RESETAR SENHA DE MEMBRO (para tenant admin)
 */
function handleResetMemberPassword() {
    global $pdo, $current_user;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $user_id = $input['user_id'] ?? null;
        $new_password = $input['new_password'] ?? '';
        
        if (!$user_id || !$new_password) {
            error('ID do usuário e nova senha são obrigatórios', 400);
        }
        
        if (strlen($new_password) < 6) {
            error('Senha deve ter pelo menos 6 caracteres', 400);
        }
        
        // Verificar se usuário pertence ao mesmo tenant
        $stmt = $pdo->prepare("SELECT name, tenant_id FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            error('Usuário não encontrado', 404);
        }
        
        if ($user['tenant_id'] != $current_user['tenant_id']) {
            error('Usuário não pertence ao seu grupo', 403);
        }
        
        // Atualizar senha
        $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->execute([$password_hash, $user_id]);
        
        // Log da ação
        AuthMiddleware::logAction($pdo, 'reset_member_password', 'users', $user_id, null, ['password_reset' => true]);
        
        success(['message' => 'Senha alterada com sucesso']);
        
    } catch (Exception $e) {
        error_log("Erro ao resetar senha: " . $e->getMessage());
        error('Erro interno do servidor', 500);
    }
}
?>
