<?php
/**
 * API de Sessões - Atualizada para SaaS Multi-tenant
 * Agora com autenticação e filtros por tenant
 */

require_once 'config.php';
require_once 'middleware/auth_middleware.php';

// Autenticação obrigatória
$current_user = AuthMiddleware::requireAuth($pdo);
$tenant_id = AuthMiddleware::getCurrentTenantId();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Opcional: buscar uma sessão específica
            if (isset($_GET['id'])) {
                $id = $_GET['id'];
                $stmt = $pdo->prepare("SELECT * FROM sessions WHERE id = ? AND tenant_id = ? LIMIT 1");
                $stmt->execute([$id, $tenant_id]);
                $session = $stmt->fetch();
                if (!$session) error('Sessão não encontrada', 404);
                $session['players_data'] = json_decode($session['players_data'] ?? '[]', true);
                $session['recommendations'] = json_decode($session['recommendations'] ?? '[]', true);
                success($session);
                break;
            }
            // Listar sessões do tenant atual apenas
            $stmt = $pdo->prepare("SELECT * FROM sessions WHERE tenant_id = ? ORDER BY date DESC, id DESC");
            $stmt->execute([$tenant_id]);
            $sessions = $stmt->fetchAll();
            // Converter JSON strings para arrays
            foreach ($sessions as &$session) {
                $session['players_data'] = json_decode($session['players_data'] ?? '[]', true);
                $session['recommendations'] = json_decode($session['recommendations'] ?? '[]', true);
            }
            success($sessions);
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? 'create';
            
            if ($action === 'delete') {
                // Deletar sessão (apenas do próprio tenant)
                $id = $input['id'] ?? null;
                if (!$id) error('ID required', 400);
                
                // Verificar se a sessão pertence ao tenant atual
                $checkStmt = $pdo->prepare("SELECT * FROM sessions WHERE id = ? AND tenant_id = ?");
                $checkStmt->execute([$id, $tenant_id]);
                $existing_session = $checkStmt->fetch();
                
                if (!$existing_session) {
                    error('Sessão não encontrada ou acesso negado', 404);
                }
                
                $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = ? AND tenant_id = ?");
                $stmt->execute([$id, $tenant_id]);
                
                // Atualizar estatísticas dos jogadores após exclusão
                updatePlayersStats($pdo, $tenant_id);
                
                // Log da ação
                AuthMiddleware::logAction($pdo, 'delete_session', 'sessions', $id, $existing_session, null);
                
                success(['deleted' => true]);
                break;
            }

            if ($action === 'update_payments') {
                $id = $input['id'] ?? null;
                if (!$id) error('ID required', 400);
                // Carregar sessão existente
                $checkStmt = $pdo->prepare("SELECT * FROM sessions WHERE id = ? AND tenant_id = ?");
                $checkStmt->execute([$id, $tenant_id]);
                $existing_session = $checkStmt->fetch();
                if (!$existing_session) error('Sessão não encontrada ou acesso negado', 404);
                $current_players = json_decode($existing_session['players_data'] ?? '[]', true);
                $updates = $input['players_data'] ?? [];
                // Índice por id ou nome
                $index = [];
                foreach ($current_players as $i => $p) {
                    $key = isset($p['id']) ? (string)$p['id'] : strtolower($p['name'] ?? '');
                    $index[$key] = $i;
                }
                foreach ($updates as $upd) {
                    $key = isset($upd['id']) ? (string)$upd['id'] : strtolower($upd['name'] ?? '');
                    if (isset($index[$key])) {
                        $idx = $index[$key];
                        // Atualizar apenas flags permitidas
                        if (isset($upd['session_paid'])) $current_players[$idx]['session_paid'] = (bool)$upd['session_paid'];
                        if (isset($upd['janta_paid'])) $current_players[$idx]['janta_paid'] = (bool)$upd['janta_paid'];
                    }
                }
                $stmt = $pdo->prepare("UPDATE sessions SET players_data = ? WHERE id = ? AND tenant_id = ?");
                $stmt->execute([
                    json_encode($current_players),
                    $id,
                    $tenant_id
                ]);
                // Atualizar estatísticas (opcional — pagamentos não influenciam buyin/cashout, mas mantemos consistência)
                updatePlayersStats($pdo, $tenant_id);
                AuthMiddleware::logAction($pdo, 'update_session_payments', 'sessions', $id, $existing_session, ['players_data' => $updates]);
                success(['updated' => true, 'players_data' => $current_players]);
                break;
            }
            
            // Verificar limites do plano antes de criar
            $limits = AuthMiddleware::checkPlanLimits($pdo, 'sessions_monthly');
            if (!$limits['allowed']) {
                error("Limite de sessões mensais atingido ({$limits['limit']}). Upgrade seu plano para continuar.", 403);
            }
            
            // Criar nova sessão
            $stmt = $pdo->prepare("INSERT INTO sessions (tenant_id, date, players_data, recommendations) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $tenant_id,
                $input['date'] ?? date('Y-m-d'),
                json_encode($input['players_data'] ?? []),
                json_encode($input['recommendations'] ?? [])
            ]);
            
            $session_id = $pdo->lastInsertId();
            
            // Atualizar estatísticas dos jogadores
            updatePlayersStats($pdo, $tenant_id);
            
            // Log da ação
            AuthMiddleware::logAction($pdo, 'create_session', 'sessions', $session_id, null, $input);
            
            success([
                'id' => $session_id,
                'limits' => $limits
            ]);
            break;

        case 'PUT':
            // Atualizar sessão (apenas do próprio tenant)
            $id = $_GET['id'] ?? null;
            if (!$id) error('ID required', 400);
            
            // Verificar se a sessão pertence ao tenant atual
            $checkStmt = $pdo->prepare("SELECT * FROM sessions WHERE id = ? AND tenant_id = ?");
            $checkStmt->execute([$id, $tenant_id]);
            $existing_session = $checkStmt->fetch();
            
            if (!$existing_session) {
                error('Sessão não encontrada ou acesso negado', 404);
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("UPDATE sessions SET players_data = ?, recommendations = ?, date = ? WHERE id = ? AND tenant_id = ?");
            $stmt->execute([
                json_encode($input['players_data'] ?? []),
                json_encode($input['recommendations'] ?? []),
                $input['date'] ?? date('Y-m-d'),
                $id,
                $tenant_id
            ]);
            
            // Atualizar estatísticas dos jogadores
            updatePlayersStats($pdo, $tenant_id);
            
            // Log da ação
            AuthMiddleware::logAction($pdo, 'update_session', 'sessions', $id, $existing_session, $input);
            
            success(['updated' => true]);
            break;

        case 'DELETE':
            // Deletar sessão (apenas do próprio tenant)
            $id = $_GET['id'] ?? null;
            if (!$id) error('ID required', 400);
            
            // Verificar se a sessão pertence ao tenant atual
            $checkStmt = $pdo->prepare("SELECT * FROM sessions WHERE id = ? AND tenant_id = ?");
            $checkStmt->execute([$id, $tenant_id]);
            $existing_session = $checkStmt->fetch();
            
            if (!$existing_session) {
                error('Sessão não encontrada ou acesso negado', 404);
            }
            
            $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$id, $tenant_id]);
            
            // Atualizar estatísticas dos jogadores após exclusão
            updatePlayersStats($pdo, $tenant_id);
            
            // Log da ação
            AuthMiddleware::logAction($pdo, 'delete_session', 'sessions', $id, $existing_session, null);
            
            success(['deleted' => true]);
            break;

        default:
            error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error('Server error');
}

/**
 * Função para atualizar estatísticas dos jogadores na tabela players
 * com base nos dados das sessões
 */
function updatePlayersStats($pdo, $tenant_id) {
    try {
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
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Erro ao atualizar estatísticas dos jogadores: " . $e->getMessage());
        return false;
    }
}
?>