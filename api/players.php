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
                // Buscar jogadores únicos do tenant atual
                $stmt = $pdo->prepare("
                    SELECT DISTINCT 
                        JSON_UNQUOTE(JSON_EXTRACT(players.value, '$.name')) as name,
                        JSON_UNQUOTE(JSON_EXTRACT(players.value, '$.email')) as email,
                        JSON_UNQUOTE(JSON_EXTRACT(players.value, '$.id')) as id
                    FROM sessions s
                    CROSS JOIN JSON_TABLE(s.players_data, '$[*]' COLUMNS (
                        value JSON PATH '$'
                    )) as players
                    WHERE s.tenant_id = ? 
                    AND s.players_data IS NOT NULL
                    AND JSON_UNQUOTE(JSON_EXTRACT(players.value, '$.name')) IS NOT NULL
                    ORDER BY name
                ");
                $stmt->execute([$tenant_id]);
                $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Converter para formato esperado pelo frontend
                $formatted_players = [];
                foreach ($players as $player) {
                    $formatted_players[] = [
                        'id' => intval($player['id'] ?? 0),
                        'name' => $player['name'],
                        'email' => $player['email'] ?? '',
                        'role' => 'player',
                        'status' => 'active',
                        'team_id' => $tenant_id
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
                
                // Verificar se jogador já existe neste tenant
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as count
                    FROM sessions s
                    CROSS JOIN JSON_TABLE(s.players_data, '$[*]' COLUMNS (
                        name VARCHAR(255) PATH '$.name'
                    )) as players
                    WHERE s.tenant_id = ? 
                    AND players.name = ?
                ");
                $stmt->execute([$tenant_id, $name]);
                $exists = $stmt->fetch()['count'] > 0;
                
                if ($exists) {
                    error('Jogador já existe', 409);
                }
                
                // Retornar dados do novo jogador (será adicionado na sessão)
                $new_player = [
                    'id' => time() . rand(1000, 9999), // ID temporário único
                    'name' => $name,
                    'email' => $email,
                    'role' => 'player',
                    'status' => 'active',
                    'team_id' => $tenant_id,
                    'created' => true // Flag para indicar que foi criado
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