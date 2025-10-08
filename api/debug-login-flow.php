<?php
// 🧪 DEBUG LOGIN COMPLETO - Testar todo o fluxo de autenticação
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$debug = [
    'status' => 'testing_login',
    'timestamp' => date('Y-m-d H:i:s'),
];

try {
    // 1. Testar carregamento de arquivos
    $debug['step_1'] = 'Loading config files...';
    require_once 'config.php';
    require_once 'jwt_helper.php';
    $debug['step_1'] = 'Files loaded successfully';

    // 2. Testar conexão PDO
    $debug['step_2'] = 'Testing PDO connection...';
    if (!isset($pdo)) {
        throw new Exception('PDO connection not found');
    }
    $debug['step_2'] = 'PDO connection OK';

    // 3. Testar busca de usuário
    $debug['step_3'] = 'Testing user query...';
    $email = 'luisfboff@hotmail.com';
    $sql = "SELECT 
                u.id, u.tenant_id, u.name, u.email, u.password_hash, u.role, u.is_active,
                u.login_attempts, u.locked_until, u.last_login, u.player_id,
                t.name as tenant_name, t.status as tenant_status, t.plan as tenant_plan
            FROM users u 
            JOIN tenants t ON u.tenant_id = t.id 
            WHERE u.email = ? AND u.is_active = 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        $debug['step_3_error'] = 'User not found or inactive';
    } else {
        $debug['step_3'] = 'User found: ' . $user['name'];
        $debug['user_data'] = [
            'id' => $user['id'],
            'tenant_id' => $user['tenant_id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'is_active' => $user['is_active'],
            'tenant_name' => $user['tenant_name'],
            'tenant_status' => $user['tenant_status'],
            'login_attempts' => $user['login_attempts'],
            'locked_until' => $user['locked_until'],
        ];
    }

    // 4. Testar verificação de senha
    if ($user) {
        $debug['step_4'] = 'Testing password verification...';
        $password = 'password'; // Senha padrão do hash no banco
        $password_ok = password_verify($password, $user['password_hash']);
        $debug['step_4'] = $password_ok ? 'Password verified OK' : 'Password verification FAILED';
        $debug['password_hash_info'] = [
            'hash_length' => strlen($user['password_hash']),
            'hash_starts_with' => substr($user['password_hash'], 0, 10),
            'password_tested' => $password,
            'verification_result' => $password_ok
        ];
    }

    // 5. Testar geração de JWT
    if ($user && isset($password_ok) && $password_ok) {
        $debug['step_5'] = 'Testing JWT generation...';
        
        $token_data = [
            'id' => $user['id'],
            'tenant_id' => $user['tenant_id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'tenant_name' => $user['tenant_name'],
            'tenant_plan' => $user['tenant_plan']
        ];
        
        $jwt_token = JWTHelper::generateToken($token_data);
        $debug['step_5'] = 'JWT generated successfully';
        $debug['jwt_info'] = [
            'token_length' => strlen($jwt_token),
            'token_parts' => count(explode('.', $jwt_token)),
            'token_preview' => substr($jwt_token, 0, 50) . '...'
        ];
    }

    // 6. Testar resposta JSON completa
    $debug['step_6'] = 'Testing complete response...';
    if (isset($jwt_token)) {
        $response = [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'tenant_id' => $user['tenant_id'],
                'tenant_name' => $user['tenant_name']
            ],
            'token' => $jwt_token
        ];
        $debug['step_6'] = 'Complete response ready';
        $debug['final_response_size'] = strlen(json_encode($response));
    }

} catch (Exception $e) {
    $debug['error'] = $e->getMessage();
    $debug['error_line'] = $e->getLine();
    $debug['error_file'] = $e->getFile();
    $debug['error_trace'] = $e->getTraceAsString();
}

echo json_encode($debug, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>