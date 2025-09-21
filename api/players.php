<?php
/**
 * API de Jogadores - Atualizada para SaaS Multi-tenant
 * Agora com autenticação e filtros por tenant
 */

require_once 'config.php';
require_once 'middleware/auth_middleware.php';

// Autenticação obrigatória
$current_user = AuthMiddleware::requireAuth($pdo);
$tenant_id = AuthMiddleware::getCurrentTenantId();

try {
    // Buscar jogadores únicos apenas do tenant atual
    $stmt = $pdo->prepare("SELECT players_data FROM sessions WHERE tenant_id = ? AND players_data IS NOT NULL");
    $stmt->execute([$tenant_id]);
    $sessions = $stmt->fetchAll();
    
    $players = [];
    foreach ($sessions as $session) {
        $data = json_decode($session['players_data'], true);
        if (is_array($data)) {
            foreach ($data as $player) {
                if (isset($player['name']) && !in_array($player['name'], $players)) {
                    $players[] = $player['name'];
                }
            }
        }
    }
    
    sort($players);
    success($players);
    
} catch (Exception $e) {
    error('Server error');
}
?>