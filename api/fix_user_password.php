<?php
require_once 'config.php';

header('Content-Type: text/html; charset=UTF-8');

$userId = $_GET['user_id'] ?? 2; // ID do usuário criado
$newPassword = $_GET['password'] ?? '123456'; // Senha desejada

echo "<h1>🔧 Corrigir Senha do Usuário</h1>";

try {
    // Buscar usuário
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "<p style='color: red;'>❌ Usuário não encontrado</p>";
        exit;
    }
    
    echo "<h2>👤 Usuário Encontrado:</h2>";
    echo "<p><strong>ID:</strong> {$user['id']}</p>";
    echo "<p><strong>Nome:</strong> {$user['name']}</p>";
    echo "<p><strong>Email:</strong> {$user['email']}</p>";
    echo "<p><strong>Hash atual:</strong> " . substr($user['password_hash'], 0, 20) . "...</p>";
    
    // Testar senha atual
    $currentPasswordWorks = password_verify($newPassword, $user['password_hash']);
    echo "<p><strong>Senha atual funciona:</strong> " . ($currentPasswordWorks ? '✅ SIM' : '❌ NÃO') . "</p>";
    
    if (!$currentPasswordWorks) {
        // Gerar novo hash
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        
        echo "<h2>🔄 Gerando novo hash...</h2>";
        echo "<p><strong>Senha:</strong> {$newPassword}</p>";
        echo "<p><strong>Novo hash:</strong> " . substr($newHash, 0, 30) . "...</p>";
        
        // Atualizar no banco
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->execute([$newHash, $userId]);
        
        echo "<h2>✅ Senha atualizada!</h2>";
        
        // Testar nova senha
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch();
        
        $newPasswordWorks = password_verify($newPassword, $updatedUser['password_hash']);
        
        if ($newPasswordWorks) {
            echo "<p style='color: green; font-weight: bold;'>🎉 SUCESSO! Senha corrigida e funcionando!</p>";
        } else {
            echo "<p style='color: red; font-weight: bold;'>❌ Erro: Senha ainda não funciona</p>";
        }
    }
    
    echo "<hr>";
    echo "<h2>🧪 Teste de Login:</h2>";
    echo "<p>Para testar, use:</p>";
    echo "<ul>";
    echo "<li><strong>Email:</strong> {$user['email']}</li>";
    echo "<li><strong>Senha:</strong> {$newPassword}</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erro: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><small>⚠️ <strong>IMPORTANTE:</strong> Delete este arquivo após usar!</small></p>";

echo "<style>
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f5f5;
}
h1, h2 {
    color: #333;
}
p {
    margin: 10px 0;
}
ul {
    background: #e8f4fd;
    padding: 15px;
    border-radius: 5px;
}
hr {
    margin: 30px 0;
    border: none;
    border-top: 1px solid #ddd;
}
</style>";
?>
