<?php
/**
 * API Aceitar Convite - Processar convites enviados por email
 * Permite novos usuários se cadastrarem em tenants existentes
 */

require_once 'config.php';
require_once 'app_config.php';

$token = $_GET['token'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if (empty($token)) {
    if ($action === 'validate') {
        http_response_code(400);
        echo json_encode(['error' => 'Token de convite inválido']);
        exit;
    } else {
        showError('Token de convite inválido');
    }
}

if ($method === 'GET') {
    if ($action === 'validate') {
        // Validar convite via JSON (para React)
        validateInviteJSON($token);
    } else {
        // Mostrar formulário de cadastro (HTML)
        showInviteForm($token);
    }
} elseif ($method === 'POST') {
    if ($action === 'accept') {
        // Processar cadastro via JSON (para React)
        processInviteJSON($token);
    } else {
        // Processar cadastro via HTML (fallback)
        processInvite($token);
    }
} else {
    showError('Método não permitido');
}

/**
 * MOSTRAR FORMULÁRIO DE CADASTRO
 */
function showInviteForm($token) {
    global $pdo;
    
    try {
        // Buscar convite
        $sql = "SELECT 
                    i.*,
                    t.name as tenant_name,
                    t.plan as tenant_plan,
                    u.name as inviter_name
                FROM user_invites i
                JOIN tenants t ON i.tenant_id = t.id
                JOIN users u ON i.invited_by_user_id = u.id
                WHERE i.invite_token = ? AND i.status = 'pending' AND i.expires_at > NOW()";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$token]);
        $invite = $stmt->fetch();
        
        if (!$invite) {
            showError('Convite inválido, expirado ou já utilizado');
        }
        
        // Mostrar formulário
        ?>
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🎯 Aceitar Convite - Poker SaaS</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #333;
                    margin-bottom: 10px;
                }
                .invite-info {
                    background: #e8f4fd;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 25px;
                    border-left: 4px solid #007cba;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #333;
                }
                input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                }
                input:focus {
                    outline: none;
                    border-color: #007cba;
                }
                input:disabled {
                    background: #f5f5f5;
                    color: #666;
                }
                button {
                    width: 100%;
                    background: #28a745;
                    color: white;
                    padding: 15px;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                button:hover {
                    background: #218838;
                }
                .role-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                    color: white;
                }
                .role-admin { background: #dc3545; }
                .role-user { background: #28a745; }
                .expires {
                    color: #666;
                    font-size: 14px;
                    text-align: center;
                    margin-top: 15px;
                }
                .error {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Convite para Poker SaaS</h1>
                    <p>Complete seu cadastro para participar!</p>
                </div>
                
                <div class="invite-info">
                    <h3>📋 Detalhes do Convite:</h3>
                    <p><strong>🏢 Grupo:</strong> <?php echo htmlspecialchars($invite['tenant_name']); ?></p>
                    <p><strong>👤 Convidado por:</strong> <?php echo htmlspecialchars($invite['inviter_name']); ?></p>
                    <p><strong>🎭 Seu papel:</strong> 
                        <span class="role-badge role-<?php echo $invite['role']; ?>">
                            <?php echo $invite['role'] === 'admin' ? 'Administrador' : 'Membro'; ?>
                        </span>
                    </p>
                    <p><strong>💎 Plano:</strong> <?php echo ucfirst($invite['tenant_plan']); ?></p>
                </div>
                
                <form id="acceptForm" method="POST">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
                    
                    <div class="form-group">
                        <label>📧 Email:</label>
                        <input type="email" name="email" value="<?php echo htmlspecialchars($invite['email']); ?>" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>👤 Nome Completo:</label>
                        <input type="text" name="name" value="<?php echo htmlspecialchars($invite['name'] ?? ''); ?>" 
                               placeholder="Digite seu nome completo" required>
                    </div>
                    
                    <div class="form-group">
                        <label>🔐 Senha:</label>
                        <input type="password" name="password" placeholder="Crie uma senha segura" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label>🔐 Confirmar Senha:</label>
                        <input type="password" name="confirm_password" placeholder="Digite a senha novamente" required minlength="6">
                    </div>
                    
                    <button type="submit">🚀 Aceitar Convite e Criar Conta</button>
                </form>
                
                <div class="expires">
                    ⏰ Este convite expira em: <?php echo date('d/m/Y H:i', strtotime($invite['expires_at'])); ?>
                </div>
            </div>
            
            <script>
                document.getElementById('acceptForm').addEventListener('submit', function(e) {
                    const password = document.querySelector('input[name="password"]').value;
                    const confirmPassword = document.querySelector('input[name="confirm_password"]').value;
                    
                    if (password !== confirmPassword) {
                        e.preventDefault();
                        alert('As senhas não coincidem!');
                        return false;
                    }
                    
                    if (password.length < 6) {
                        e.preventDefault();
                        alert('A senha deve ter pelo menos 6 caracteres!');
                        return false;
                    }
                });
            </script>
        </body>
        </html>
        <?php
        
    } catch (Exception $e) {
        error_log("Erro ao mostrar formulário de convite: " . $e->getMessage());
        showError('Erro interno do servidor');
    }
}

/**
 * PROCESSAR CADASTRO VIA CONVITE
 */
function processInvite($token) {
    global $pdo;
    
    $name = trim($_POST['name'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    // Validações básicas
    if (empty($name) || empty($password)) {
        showError('Nome e senha são obrigatórios');
    }
    
    if ($password !== $confirm_password) {
        showError('As senhas não coincidem');
    }
    
    if (strlen($password) < 6) {
        showError('A senha deve ter pelo menos 6 caracteres');
    }
    
    try {
        // Buscar convite
        $sql = "SELECT 
                    i.*,
                    t.name as tenant_name,
                    t.status as tenant_status
                FROM user_invites i
                JOIN tenants t ON i.tenant_id = t.id
                WHERE i.invite_token = ? AND i.status = 'pending' AND i.expires_at > NOW()";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$token]);
        $invite = $stmt->fetch();
        
        if (!$invite) {
            showError('Convite inválido, expirado ou já utilizado');
        }
        
        if ($invite['tenant_status'] !== 'active') {
            showError('O grupo está inativo ou pendente de aprovação');
        }
        
        // Verificar se email já existe
        $checkUserSql = "SELECT id FROM users WHERE email = ?";
        $checkUserStmt = $pdo->prepare($checkUserSql);
        $checkUserStmt->execute([$invite['email']]);
        
        if ($checkUserStmt->fetch()) {
            showError('Este email já está cadastrado no sistema');
        }
        
        // Criar usuário
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        $createUserSql = "INSERT INTO users (tenant_id, name, email, password_hash, role, is_active, created_at) 
                          VALUES (?, ?, ?, ?, ?, 1, NOW())";
        
        $createUserStmt = $pdo->prepare($createUserSql);
        $createUserStmt->execute([
            $invite['tenant_id'],
            $name,
            $invite['email'],
            $password_hash,
            $invite['role']
        ]);
        
        $user_id = $pdo->lastInsertId();
        
        // Marcar convite como aceito
        $updateInviteSql = "UPDATE user_invites SET status = 'accepted', accepted_at = NOW() WHERE id = ?";
        $updateInviteStmt = $pdo->prepare($updateInviteSql);
        $updateInviteStmt->execute([$invite['id']]);
        
        // Log da ação
        logAuditAction($invite['tenant_id'], $user_id, 'accept_invite', 'users', $user_id, null, [
            'invite_id' => $invite['id'],
            'role' => $invite['role']
        ]);
        
        // Mostrar sucesso
        showSuccess($invite['tenant_name'], $invite['email'], $invite['role']);
        
    } catch (Exception $e) {
        error_log("Erro ao processar convite: " . $e->getMessage());
        showError('Erro interno do servidor');
    }
}

/**
 * MOSTRAR PÁGINA DE SUCESSO
 */
function showSuccess($tenant_name, $email, $role) {
    // Usar app_path() para gerar link correto independente do ambiente
    $loginPath = app_path('login');
    ?>
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✅ Conta Criada - Poker SaaS</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
            }
            .success-icon {
                font-size: 60px;
                color: #28a745;
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
            }
            .info {
                background: #d4edda;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 4px solid #28a745;
            }
            .btn {
                display: inline-block;
                background: #007cba;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
            }
            .btn:hover {
                background: #005a8b;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">🎉</div>
            <h1>Conta Criada com Sucesso!</h1>
            
            <p>Parabéns! Você agora é membro do grupo <strong><?php echo htmlspecialchars($tenant_name); ?></strong>.</p>
            
            <div class="info">
                <h3>📋 Suas Credenciais:</h3>
                <p><strong>📧 Email:</strong> <?php echo htmlspecialchars($email); ?></p>
                <p><strong>🎭 Papel:</strong> <?php echo $role === 'admin' ? 'Administrador' : 'Membro'; ?></p>
                <p><strong>🔐 Senha:</strong> A que você acabou de criar</p>
            </div>
            
            <a href="<?php echo htmlspecialchars($loginPath); ?>" class="btn">🚀 Fazer Login</a>
            
            <p><small>Agora você pode fazer login e começar a usar o sistema!</small></p>
        </div>
    </body>
    </html>
    <?php
    exit;
}

/**
 * MOSTRAR PÁGINA DE ERRO
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
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
            }
            .error-icon {
                font-size: 60px;
                color: #dc3545;
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="error-icon">❌</div>
            <h1>Erro</h1>
            <p><?php echo htmlspecialchars($message); ?></p>
            <p><small>Se o problema persistir, entre em contato com o suporte.</small></p>
        </div>
    </body>
    </html>
    <?php
    exit;
}

/**
 * LOG DE AUDITORIA
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

/**
 * VALIDAR CONVITE VIA JSON (para React)
 */
function validateInviteJSON($token) {
    global $pdo;
    
    try {
        // Buscar convite válido
        $stmt = $pdo->prepare("
            SELECT ui.*, t.name as tenant_name, u.name as invited_by_name
            FROM user_invites ui
            JOIN tenants t ON ui.tenant_id = t.id
            JOIN users u ON ui.invited_by_user_id = u.id
            WHERE ui.invite_token = ? 
            AND ui.status = 'pending'
            AND ui.expires_at > NOW()
        ");
        $stmt->execute([$token]);
        $invite = $stmt->fetch();
        
        if (!$invite) {
            http_response_code(404);
            echo json_encode(['error' => 'Convite não encontrado ou expirado']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'email' => $invite['email'],
                'name' => $invite['name'],
                'role' => $invite['role'],
                'tenant_name' => $invite['tenant_name'],
                'invited_by_name' => $invite['invited_by_name'],
                'expires_at' => $invite['expires_at']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao validar convite']);
    }
}

/**
 * PROCESSAR CONVITE VIA JSON (para React)
 */
function processInviteJSON($token) {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $name = trim($input['name'] ?? '');
        $password = $input['password'] ?? '';
        
        if (empty($name) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome e senha são obrigatórios']);
            exit;
        }
        
        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Senha deve ter pelo menos 6 caracteres']);
            exit;
        }
        
        // Buscar convite válido
        $stmt = $pdo->prepare("
            SELECT * FROM user_invites 
            WHERE invite_token = ? 
            AND status = 'pending'
            AND expires_at > NOW()
        ");
        $stmt->execute([$token]);
        $invite = $stmt->fetch();
        
        if (!$invite) {
            http_response_code(404);
            echo json_encode(['error' => 'Convite não encontrado ou expirado']);
            exit;
        }
        
        // Verificar se email já existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$invite['email']]);
        
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Usuário já cadastrado com este email']);
            exit;
        }
        
        // Criar usuário
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("
            INSERT INTO users (tenant_id, name, email, role, password_hash, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $invite['tenant_id'],
            $name,
            $invite['email'],
            $invite['role'],
            $passwordHash
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Marcar convite como aceito
        $stmt = $pdo->prepare("
            UPDATE user_invites 
            SET status = 'accepted', accepted_at = NOW() 
            WHERE invite_token = ?
        ");
        $stmt->execute([$token]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Convite aceito com sucesso!',
            'user_id' => $userId,
            'email' => $invite['email'],
            'tenant_id' => $invite['tenant_id']
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao processar convite: ' . $e->getMessage()]);
    }
}
?>
