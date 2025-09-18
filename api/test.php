<?php
// Teste simples da API PHP
echo "API PHP funcionando!<br>";
echo "Data/Hora: " . date('Y-m-d H:i:s') . "<br>";

// Teste de conexão com MySQL
try {
    require_once 'config.php';
    echo "✅ Conexão com MySQL: OK<br>";
    
    // Teste de query simples
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $result = $stmt->fetch();
    echo "✅ Query MySQL: OK (usuários: " . $result['total'] . ")<br>";
    
} catch (Exception $e) {
    echo "❌ Erro MySQL: " . $e->getMessage() . "<br>";
}

echo "<br>APIs disponíveis:<br>";
echo "- /api/sessions.php<br>";
echo "- /api/dinner.php<br>";
echo "- /api/players.php<br>";
?>
