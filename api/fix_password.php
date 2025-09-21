<?php
/**
 * Corrigir hash da senha do admin
 * Execute uma vez para gerar o hash correto
 */

require_once 'config.php';

// Senha que você quer usar
$senha = 'Poker2025!';
$email = 'luisfboff@hotmail.com';

echo "<h1>🔧 Correção de Senha - Super Admin</h1>";

try {
    // Gerar hash correto
    $novo_hash = password_hash($senha, PASSWORD_DEFAULT);
    
    echo "<h2>✅ Hash gerado com sucesso!</h2>";
    echo "<p><strong>Senha:</strong> $senha</p>";
    echo "<p><strong>Novo hash:</strong> $novo_hash</p>";
    
    // Buscar usuário atual
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();
    
    if (!$usuario) {
        echo "<p style='color: red;'>❌ Usuário não encontrado!</p>";
        exit;
    }
    
    echo "<h2>👤 Usuário encontrado:</h2>";
    echo "<p><strong>Nome:</strong> {$usuario['name']}</p>";
    echo "<p><strong>Email:</strong> {$usuario['email']}</p>";
    echo "<p><strong>Role:</strong> {$usuario['role']}</p>";
    echo "<p><strong>Hash atual:</strong> " . substr($usuario['password_hash'], 0, 20) . "...</p>";
    
    // Testar senha atual
    $senha_atual_ok = password_verify($senha, $usuario['password_hash']);
    echo "<p><strong>Senha atual funciona:</strong> " . ($senha_atual_ok ? "✅ SIM" : "❌ NÃO") . "</p>";
    
    if (!$senha_atual_ok) {
        // Atualizar com novo hash
        $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
        $updateStmt->execute([$novo_hash, $email]);
        
        echo "<h2>🔄 Senha atualizada!</h2>";
        
        // Verificar se funcionou
        $verifyStmt = $pdo->prepare("SELECT password_hash FROM users WHERE email = ?");
        $verifyStmt->execute([$email]);
        $novo_usuario = $verifyStmt->fetch();
        
        $teste_final = password_verify($senha, $novo_usuario['password_hash']);
        
        if ($teste_final) {
            echo "<p style='color: green; font-weight: bold;'>🎉 SUCESSO! Senha corrigida e funcionando!</p>";
            echo "<p>Agora você pode fazer login normalmente.</p>";
        } else {
            echo "<p style='color: red;'>❌ Algo deu errado na atualização.</p>";
        }
    } else {
        echo "<p style='color: green;'>✅ Senha já está funcionando corretamente!</p>";
    }
    
    echo "<hr>";
    echo "<h2>🧪 Teste de Login:</h2>";
    echo "<p>Para testar, use:</p>";
    echo "<ul>";
    echo "<li><strong>Email:</strong> $email</li>";
    echo "<li><strong>Senha:</strong> $senha</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erro: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><small>⚠️ <strong>IMPORTANTE:</strong> Delete este arquivo após usar!</small></p>";
?>

<style>
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
</style>
