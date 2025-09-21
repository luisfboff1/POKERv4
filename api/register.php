<?php
/**
 * API de Registro - Cadastro de novos clientes
 * Sistema de aprovação via email
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    error('Método não permitido', 405);
}

// Receber dados do formulário
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    error('Dados inválidos', 400);
}

// Validar campos obrigatórios
$required_fields = ['name', 'email', 'company', 'phone', 'plan'];
foreach ($required_fields as $field) {
    if (empty($input[$field])) {
        error("Campo '$field' é obrigatório", 400);
    }
}

$name = trim($input['name']);
$email = trim(strtolower($input['email']));
$company = trim($input['company']);
$phone = trim($input['phone']);
$plan = $input['plan'];
$message = trim($input['message'] ?? '');

// Validar email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error('Email inválido', 400);
}

// Validar plano
$valid_plans = ['basic', 'premium', 'enterprise'];
if (!in_array($plan, $valid_plans)) {
    error('Plano inválido', 400);
}

try {
    // Verificar se email já existe
    $checkStmt = $pdo->prepare("SELECT id FROM tenants WHERE email = ?");
    $checkStmt->execute([$email]);
    if ($checkStmt->fetch()) {
        error('Email já cadastrado', 409);
    }
    
    // Gerar token de aprovação
    $approval_token = bin2hex(random_bytes(32));
    
    // Definir limites do plano
    $plan_limits = [
        'basic' => ['sessions' => 50, 'users' => 2],
        'premium' => ['sessions' => 200, 'users' => 5],
        'enterprise' => ['sessions' => 999999, 'users' => 999999]
    ];
    
    $limits = $plan_limits[$plan];
    
    // Inserir novo tenant
    $sql = "INSERT INTO tenants (name, email, phone, company, status, plan, max_sessions_per_month, max_users, approval_token, created_at) 
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, NOW())";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $company,
        $email,
        $phone,
        $company,
        $plan,
        $limits['sessions'],
        $limits['users'],
        $approval_token
    ]);
    
    $tenant_id = $pdo->lastInsertId();
    
    // Criar usuário admin para o tenant
    $password_hash = password_hash('temp123', PASSWORD_DEFAULT); // Senha temporária
    
    $userSql = "INSERT INTO users (tenant_id, name, email, password_hash, role, is_active, created_at) 
                VALUES (?, ?, ?, ?, 'admin', 0, NOW())"; // Inativo até aprovação
    
    $userStmt = $pdo->prepare($userSql);
    $userStmt->execute([$tenant_id, $name, $email, $password_hash]);
    
    // Enviar email de aprovação para admin
    $approval_sent = sendApprovalEmail($tenant_id, $company, $email, $name, $plan, $phone, $message, $approval_token);
    
    // Log da ação
    logAuditAction($tenant_id, null, 'tenant_registration', 'tenants', $tenant_id, null, [
        'company' => $company,
        'email' => $email,
        'plan' => $plan,
        'approval_email_sent' => $approval_sent
    ]);
    
    success([
        'message' => 'Cadastro realizado com sucesso!',
        'status' => 'pending_approval',
        'tenant_id' => $tenant_id,
        'next_steps' => 'Aguarde a aprovação do administrador. Você receberá um email quando sua conta for ativada.'
    ]);
    
} catch (Exception $e) {
    error_log("Erro no registro: " . $e->getMessage());
    error('Erro interno do servidor', 500);
}

/**
 * Enviar email de aprovação para admin
 */
function sendApprovalEmail($tenant_id, $company, $email, $name, $plan, $phone, $message, $approval_token) {
    $admin_email = 'luisfboff@hotmail.com';
    $subject = "🎯 Nova Solicitação de Cadastro - Poker SaaS";
    
    $approve_url = "https://" . $_SERVER['HTTP_HOST'] . "/api/approve.php?token=" . $approval_token . "&action=approve";
    $reject_url = "https://" . $_SERVER['HTTP_HOST'] . "/api/approve.php?token=" . $approval_token . "&action=reject";
    
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
            .actions { text-align: center; margin: 30px 0; }
            .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .btn-approve { background: #28a745; color: white; }
            .btn-reject { background: #dc3545; color: white; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎯 Nova Solicitação de Cadastro</h1>
                <p>Sistema Poker SaaS</p>
            </div>
            
            <div class='content'>
                <h2>Detalhes do Cliente:</h2>
                
                <div class='info'>
                    <strong>👤 Nome:</strong> $name<br>
                    <strong>🏢 Empresa:</strong> $company<br>
                    <strong>📧 Email:</strong> $email<br>
                    <strong>📱 Telefone:</strong> $phone<br>
                    <strong>💎 Plano:</strong> " . ucfirst($plan) . "
                </div>
                
                " . ($message ? "<div class='info'><strong>💬 Mensagem:</strong><br>$message</div>" : "") . "
                
                <div class='actions'>
                    <a href='$approve_url' class='btn btn-approve'>✅ APROVAR</a>
                    <a href='$reject_url' class='btn btn-reject'>❌ REJEITAR</a>
                </div>
                
                <p><small><strong>Nota:</strong> Ao aprovar, o cliente receberá um email com instruções de acesso.</small></p>
            </div>
            
            <div class='footer'>
                <p>Sistema Poker SaaS - Gerenciamento Automático</p>
                <p>ID do Tenant: $tenant_id | Token: " . substr($approval_token, 0, 8) . "...</p>
            </div>
        </div>
    </body>
    </html>";
    
    $headers = [
        'From: noreply@poker-saas.com',
        'Reply-To: luisfboff@hotmail.com',
        'Content-Type: text/html; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    try {
        $sent = mail($admin_email, $subject, $html_body, implode("\r\n", $headers));
        
        if (!$sent) {
            error_log("Falha ao enviar email de aprovação para: $admin_email");
        }
        
        return $sent;
    } catch (Exception $e) {
        error_log("Erro ao enviar email: " . $e->getMessage());
        return false;
    }
}

/**
 * Log de auditoria
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
