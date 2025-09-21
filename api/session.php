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
            // Verificar limites do plano antes de criar
            $limits = AuthMiddleware::checkPlanLimits($pdo, 'sessions_monthly');
            if (!$limits['allowed']) {
                error("Limite de sessões mensais atingido ({$limits['limit']}). Upgrade seu plano para continuar.", 403);
            }
            
            // Criar nova sessão
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("INSERT INTO sessions (tenant_id, date, players_data, recommendations) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $tenant_id,
                $input['date'] ?? date('Y-m-d'),
                json_encode($input['players_data'] ?? []),
                json_encode($input['recommendations'] ?? [])
            ]);
            
            $session_id = $pdo->lastInsertId();
            
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
?>