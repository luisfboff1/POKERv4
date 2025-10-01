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

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? 'list';
            
            if ($action === 'list') {
                // Buscar jogadores da tabela dedicada
                $stmt = $pdo->prepare("
                    SELECT 
                        id,
                        name,
                        email,
                        total_sessions,
                        total_buyin,
                        total_cashout,
                        status,
                        created_at
                    FROM players 
                    WHERE tenant_id = ? 
                    AND status = 'active'
                    ORDER BY name
                ");
                $stmt->execute([$tenant_id]);
                $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Converter para formato esperado pelo frontend
                $formatted_players = [];
                foreach ($players as $player) {
                    $formatted_players[] = [
                        'id' => intval($player['id']),
                        'name' => $player['name'],
                        'email' => $player['email'] ?? '',
                        'role' => 'player',
                        'status' => $player['status'],
                        'team_id' => $tenant_id,
                        'total_sessions' => intval($player['total_sessions']),
                        'total_buyin' => floatval($player['total_buyin']),
                        'total_cashout' => floatval($player['total_cashout'])
                    ];
                }
                
                success($formatted_players);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? '';
            
            if ($action === 'create') {
                $name = trim($input['name'] ?? '');
                $email = trim($input['email'] ?? '');
                
                if (empty($name)) {
                    error('Nome é obrigatório', 400);
                }
                
                // Normalizar nome (lowercase, sem acentos)
                $name_normalized = strtolower($name);
                $name_normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name_normalized);
                $name_normalized = preg_replace('/[^a-z0-9 ]/', '', $name_normalized);
                $name_normalized = trim($name_normalized);
                
                // Upsert: inserir ou atualizar se já existe
                $stmt = $pdo->prepare("
                    INSERT INTO players (
                        tenant_id, name, name_normalized, email, status
                    ) VALUES (?, ?, ?, ?, 'active')
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = COALESCE(VALUES(email), email),
                        status = 'active',
                        updated_at = CURRENT_TIMESTAMP
                ");
                
                $stmt->execute([$tenant_id, $name, $name_normalized, $email]);
                
                // Buscar o jogador (novo ou existente)
                $stmt = $pdo->prepare("
                    SELECT id, name, email, status, created_at
                    FROM players 
                    WHERE tenant_id = ? AND name_normalized = ?
                ");
                $stmt->execute([$tenant_id, $name_normalized]);
                $player = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$player) {
                    error('Erro ao criar/encontrar jogador', 500);
                }
                
                // Retornar dados do jogador
                $new_player = [
                    'id' => intval($player['id']),
                    'name' => $player['name'],
                    'email' => $player['email'] ?? '',
                    'role' => 'player',
                    'status' => $player['status'],
                    'team_id' => $tenant_id,
                    'created' => true // Flag para indicar que foi processado
                ];
                
                success($new_player);
            }
            break;
            
        default:
            error('Método não permitido', 405);
    }
    
} catch (Exception $e) {
    error('Erro no servidor: ' . $e->getMessage());
}
?>