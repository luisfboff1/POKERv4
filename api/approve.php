<?php
/**
 * API de Aprovação - Processar aprovação/rejeição de novos tenants
 * Acessado via links do email de aprovação
 */

require_once 'config.php';

$token = $_GET['token'] ?? '';
$action = $_GET['action'] ?? '';

if (empty($token) || empty($action)) {
    showError('Parâmetros inválidos');
}

if (!in_array($action, ['approve', 'reject'])) {
    showError('Ação inválida');
}

try {
    // Buscar tenant pelo token
    $sql = "SELECT * FROM tenants WHERE approval_token = ? AND status = 'pending'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$token]);
    $tenant = $stmt->fetch();
    
    if (!$tenant) {
        showError('Token inválido ou expirado');
    }
    
    if ($action === 'approve') {
        // APROVAR TENANT
        
        // Atualizar status do tenant
        $updateSql = "UPDATE tenants SET 
                        status = 'active', 
                        approved_at = NOW(), 
                        approved_by = 'luisfboff@hotmail.com',
                        approval_token = NULL 
                      WHERE id = ?";
        
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([$tenant['id']]);
        
        // Ativar usuário admin do tenant
        $userSql = "UPDATE users SET is_active = 1 WHERE tenant_id = ? AND role = 'admin'";
        $userStmt = $pdo->prepare($userSql);
        $userStmt->execute([$tenant['id']]);
        
        // Gerar nova senha temporária
        $temp_password = generateTempPassword();
        $password_hash = password_hash($temp_password, PASSWORD_DEFAULT);
        
        $passSql = "UPDATE users SET password_hash = ? WHERE tenant_id = ? AND role = 'admin'";
        $passStmt = $pdo->prepare($passSql);
        $passStmt->execute([$password_hash, $tenant['id']]);
        
        // Buscar dados do usuário
        $userDataSql = "SELECT * FROM users WHERE tenant_id = ? AND role = 'admin'";
        $userDataStmt = $pdo->prepare($userDataSql);
        $userDataStmt->execute([$tenant['id']]);
        $user = $userDataStmt->fetch();
        
        // Enviar email de boas-vindas
        $welcome_sent = sendWelcomeEmail($tenant, $user, $temp_password);
        
        // Log da aprovação
        logAuditAction($tenant['id'], null, 'tenant_approved', 'tenants', $tenant['id'], 
            ['status' => 'pending'], ['status' => 'active', 'approved_by' => 'luisfboff@hotmail.com']);
        
        showSuccess('Tenant aprovado com sucesso!', [
            'tenant' => $tenant['name'],
            'email' => $tenant['email'],
            'welcome_email_sent' => $welcome_sent
        ]);
        
    } else {
        // REJEITAR TENANT
        
        // Deletar tenant e usuário associado
        $deleteSql = "DELETE FROM tenants WHERE id = ?";
        $deleteStmt = $pdo->prepare($deleteSql);
        $deleteStmt->execute([$tenant['id']]);
        
        // Enviar email de rejeição
        $rejection_sent = sendRejectionEmail($tenant);
        
        // Log da rejeição
        logAuditAction(null, null, 'tenant_rejected', 'tenants', $tenant['id'], 
            $tenant, ['rejected_by' => 'luisfboff@hotmail.com']);
        
        showSuccess('Tenant rejeitado', [
            'tenant' => $tenant['name'],
            'email' => $tenant['email'],
            'rejection_email_sent' => $rejection_sent
        ]);
    }
    
} catch (Exception $e) {
    error_log("Erro na aprovação: " . $e->getMessage());
    showError('Erro interno do servidor');
}

/**
 * Gerar senha temporária
 */
function generateTempPassword() {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return 'poker' . substr(str_shuffle($chars), 0, 6) . '!';
}

/**
 * Enviar email de boas-vindas
 */
function sendWelcomeEmail($tenant, $user, $temp_password) {
    $to = $tenant['email'];
    $subject = "🎉 Bem-vindo ao Poker SaaS - Conta Aprovada!";
    
    $login_url = "https://" . $_SERVER['HTTP_HOST'] . "/login";
    
    $html_body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #28a745; }
            .credentials { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .btn { display: inline-block; padding: 12px 24px; background: #007cba; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎉 Conta Aprovada!</h1>
                <p>Bem-vindo ao Poker SaaS</p>
            </div>
            
            <div class='content'>
                <h2>Olá, " . $user['name'] . "!</h2>
                
                <p>Sua solicitação de cadastro foi <strong>aprovada</strong>! Agora você pode acessar o sistema e começar a gerenciar suas sessões de poker.</p>
                
                <div class='info'>
                    <strong>🏢 Empresa:</strong> " . $tenant['name'] . "<br>
                    <strong>💎 Plano:</strong> " . ucfirst($tenant['plan']) . "<br>
                    <strong>📊 Limite mensal:</strong> " . $tenant['max_sessions_per_month'] . " sessões<br>
                    <strong>👥 Usuários:</strong> Até " . $tenant['max_users'] . " usuários
                </div>
                
                <div class='credentials'>
                    <h3>🔐 Dados de Acesso:</h3>
                    <strong>Email:</strong> " . $user['email'] . "<br>
                    <strong>Senha temporária:</strong> <code>$temp_password</code><br>
                    <br>
                    <small>⚠️ <strong>IMPORTANTE:</strong> Altere sua senha no primeiro acesso!</small>
                </div>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='$login_url' class='btn'>🚀 Fazer Login</a>
                </div>
                
                <h3>📋 Próximos passos:</h3>
                <ol>
                    <li>Faça login com os dados acima</li>
                    <li>Altere sua senha</li>
                    <li>Configure seu perfil</li>
                    <li>Comece a criar suas sessões!</li>
                </ol>
                
                <p>Se tiver alguma dúvida, responda este email que entraremos em contato.</p>
            </div>
            
            <div class='footer'>
                <p>Poker SaaS - Sistema de Gerenciamento de Sessões</p>
                <p>Suporte: luisfboff@hotmail.com</p>
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
        return mail($to, $subject, $html_body, implode("\r\n", $headers));
    } catch (Exception $e) {
        error_log("Erro ao enviar email de boas-vindas: " . $e->getMessage());
        return false;
    }
}

/**
 * Enviar email de rejeição
 */
function sendRejectionEmail($tenant) {
    $to = $tenant['email'];
    $subject = "❌ Solicitação de Cadastro - Poker SaaS";
    
    $html_body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>❌ Solicitação não Aprovada</h1>
            </div>
            
            <div class='content'>
                <p>Olá,</p>
                
                <p>Infelizmente sua solicitação de cadastro para o Poker SaaS não foi aprovada neste momento.</p>
                
                <p>Se você acredita que isso foi um erro ou gostaria de mais informações, entre em contato conosco através do email: <strong>luisfboff@hotmail.com</strong></p>
                
                <p>Atenciosamente,<br>Equipe Poker SaaS</p>
            </div>
        </div>
    </body>
    </html>";
    
    $headers = [
        'From: noreply@poker-saas.com',
        'Reply-To: luisfboff@hotmail.com',
        'Content-Type: text/html; charset=UTF-8'
    ];
    
    try {
        return mail($to, $subject, $html_body, implode("\r\n", $headers));
    } catch (Exception $e) {
        error_log("Erro ao enviar email de rejeição: " . $e->getMessage());
        return false;
    }
}

/**
 * Mostrar página de sucesso
 */
function showSuccess($message, $details = []) {
    ?>
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✅ Sucesso - Poker SaaS</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #28a745; text-align: center; }
            .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success">
                <h1>✅ <?php echo htmlspecialchars($message); ?></h1>
            </div>
            
            <?php if (!empty($details)): ?>
            <div class="details">
                <h3>Detalhes:</h3>
                <?php foreach ($details as $key => $value): ?>
                    <p><strong><?php echo ucfirst(str_replace('_', ' ', $key)); ?>:</strong> 
                       <?php echo is_bool($value) ? ($value ? 'Sim' : 'Não') : htmlspecialchars($value); ?></p>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
            
            <p style="text-align: center; color: #666;">
                <small>Esta janela pode ser fechada.</small>
            </p>
        </div>
    </body>
    </html>
    <?php
    exit;
}

/**
 * Mostrar página de erro
 */
function showError($message) {
    ?>
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>❌ Erro - Poker SaaS</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #dc3545; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="error">
                <h1>❌ Erro</h1>
                <p><?php echo htmlspecialchars($message); ?></p>
            </div>
            
            <p style="text-align: center; color: #666;">
                <small>Entre em contato com o suporte: luisfboff@hotmail.com</small>
            </p>
        </div>
    </body>
    </html>
    <?php
    exit;
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
