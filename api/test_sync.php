<?php
// Teste rápido da API de sincronização
require_once 'config.php';

echo "🧪 TESTANDO API DE SINCRONIZAÇÃO\n\n";

// Simular uma requisição POST
$_POST['action'] = 'sync_all';
$_SERVER['REQUEST_METHOD'] = 'POST';

// Simular header de autorização
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer token_fake_para_teste_123456789';

try {
    // Incluir o arquivo da API
    ob_start();
    include 'sync_simple.php';
    $output = ob_get_clean();
    
    echo "📊 Resposta da API:\n";
    echo $output . "\n";
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}

echo "\n✅ Teste concluído!\n";
?>