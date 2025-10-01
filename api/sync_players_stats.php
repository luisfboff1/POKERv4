<?php
/**
 * API para sincronizar estatísticas dos jogadores
 * Recalcula todas as estatísticas baseadas nas sessões existentes
 */

require_once 'config.php';
require_once 'middleware/auth_middleware.php';

// Autenticação obrigatória
$current_user = AuthMiddleware::requireAuth($pdo);
$tenant_id = AuthMiddleware::getCurrentTenantId();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method !== 'POST') {
        error('Método não permitido', 405);
    }
    
    // Calcular estatísticas agregadas de todos os jogadores
    $stmt = $pdo->prepare("
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(pd.value, '$.name')) as player_name,
            COUNT(*) as total_sessions,
            SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(pd.value, '$.buyin')) AS DECIMAL(10,2))) as total_buyin,
            SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(pd.value, '$.cashout')) AS DECIMAL(10,2))) as total_cashout
        FROM sessions s
        CROSS JOIN JSON_TABLE(
            s.players_data,
            '$[*]' COLUMNS (
                value JSON PATH '$'
            )
        ) pd
        WHERE s.tenant_id = ?
        AND JSON_UNQUOTE(JSON_EXTRACT(pd.value, '$.name')) IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(pd.value, '$.name')) != ''
        GROUP BY JSON_UNQUOTE(JSON_EXTRACT(pd.value, '$.name'))
    ");
    
    $stmt->execute([$tenant_id]);
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updated_players = 0;
    
    // Para cada jogador, fazer upsert na tabela players
    foreach ($stats as $stat) {
        $name = $stat['player_name'];
        $name_normalized = strtolower($name);
        $name_normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name_normalized);
        $name_normalized = preg_replace('/[^a-z0-9 ]/', '', $name_normalized);
        $name_normalized = trim($name_normalized);
        
        $updateStmt = $pdo->prepare("
            INSERT INTO players (
                tenant_id, 
                name, 
                name_normalized, 
                total_sessions, 
                total_buyin, 
                total_cashout,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, 'active')
            ON DUPLICATE KEY UPDATE
                total_sessions = VALUES(total_sessions),
                total_buyin = VALUES(total_buyin),
                total_cashout = VALUES(total_cashout),
                status = 'active',
                updated_at = CURRENT_TIMESTAMP
        ");
        
        $updateStmt->execute([
            $tenant_id,
            $name,
            $name_normalized,
            intval($stat['total_sessions']),
            floatval($stat['total_buyin'] ?? 0),
            floatval($stat['total_cashout'] ?? 0)
        ]);
        
        $updated_players++;
    }
    
    // Log da ação
    AuthMiddleware::logAction($pdo, 'sync_players_stats', 'players', null, null, [
        'players_updated' => $updated_players
    ]);
    
    success([
        'synced' => true,
        'players_updated' => $updated_players,
        'total_players_found' => count($stats)
    ]);
    
} catch (Exception $e) {
    error('Erro no servidor: ' . $e->getMessage());
}
?>