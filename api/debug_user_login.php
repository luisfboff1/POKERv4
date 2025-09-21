<?php
require_once 'config.php';

header('Content-Type: application/json');

$email = $_GET['email'] ?? 'luisfboff@gmail.com';
$password = $_GET['password'] ?? 'Teste1234';

try {
    // Buscar usuário no banco
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, role, tenant_id, created_at FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode([
            'success' => false,
            'error' => 'Usuário não encontrado',
            'email_searched' => $email
        ]);
        exit;
    }

    // Verificar senha
    $password_check = password_verify($password, $user['password_hash']);
    
    echo json_encode([
        'success' => true,
        'user_found' => true,
        'user_data' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'tenant_id' => $user['tenant_id'],
            'created_at' => $user['created_at']
        ],
        'password_test' => [
            'provided_password' => $password,
            'stored_hash' => $user['password_hash'],
            'password_verify_result' => $password_check,
            'hash_info' => password_get_info($user['password_hash'])
        ],
        'debug_info' => [
            'php_version' => phpversion(),
            'password_hash_test' => password_hash($password, PASSWORD_DEFAULT)
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Erro no debug: ' . $e->getMessage()
    ]);
}
?>
