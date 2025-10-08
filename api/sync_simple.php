<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    // Verificar autenticação
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        throw new Exception('Token de autenticação necessário');
    }

    $token = substr($authHeader, 7);
    
    // Validação básica do token (você pode melhorar isso)
    if (strlen($token) < 10) {
        throw new Exception('Token inválido');
    }

    $pdo = new PDO($dsn, $username, $password, $options);
    
    $action = $_POST['action'] ?? $_GET['action'] ?? 'sync_all';
    
    switch($action) {
        case 'sync_all':
            $result = syncAllPlayers($pdo);
            break;
            
        case 'reset_all':
            $result = resetAndSyncAll($pdo);
            break;
            
        default:
            throw new Exception('Ação não reconhecida: ' . $action);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Sincronização concluída com sucesso',
        'data' => $result
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function syncAllPlayers($pdo) {
    // Primeiro, buscar todos os players
    $stmt = $pdo->query("SELECT id, name FROM players WHERE is_active = 1");
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updated = 0;
    
    foreach ($players as $player) {
        // Calcular estatísticas para cada player
        $stats = calculatePlayerStats($pdo, $player['name']);
        
        // Atualizar o player
        $updateStmt = $pdo->prepare("
            UPDATE players SET 
                total_sessions = ?,
                total_buyin = ?,
                total_cashout = ?,
                total_profit = ?,
                win_rate = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        
        $winRate = $stats['total_buyin'] > 0 ? ($stats['total_profit'] / $stats['total_buyin']) * 100 : 0;
        
        $updateStmt->execute([
            $stats['total_sessions'],
            $stats['total_buyin'],
            $stats['total_cashout'],
            $stats['total_profit'],
            $winRate,
            $player['id']
        ]);
        
        $updated++;
    }
    
    return ['players_updated' => $updated];
}

function resetAndSyncAll($pdo) {
    // Primeiro, zerar todas as estatísticas
    $pdo->exec("
        UPDATE players SET 
            total_sessions = 0,
            total_buyin = 0.00,
            total_cashout = 0.00,
            total_profit = 0.00,
            win_rate = 0.00,
            updated_at = NOW()
    ");
    
    // Depois sincronizar
    return syncAllPlayers($pdo);
}

function calculatePlayerStats($pdo, $playerName) {
    // Buscar todas as sessões onde este player participou
    $stmt = $pdo->prepare("
        SELECT players_data 
        FROM sessions 
        WHERE status = 'approved' 
        AND JSON_SEARCH(players_data, 'one', ?) IS NOT NULL
    ");
    
    $stmt->execute([$playerName]);
    $sessions = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $totalSessions = 0;
    $totalBuyin = 0;
    $totalCashout = 0;
    
    foreach ($sessions as $playersDataJson) {
        $playersData = json_decode($playersDataJson, true);
        
        if (is_array($playersData)) {
            foreach ($playersData as $playerData) {
                if (isset($playerData['name']) && $playerData['name'] === $playerName) {
                    $totalSessions++;
                    $totalBuyin += (float)($playerData['buyin'] ?? 0);
                    $totalCashout += (float)($playerData['cashout'] ?? 0);
                }
            }
        }
    }
    
    return [
        'total_sessions' => $totalSessions,
        'total_buyin' => $totalBuyin,
        'total_cashout' => $totalCashout,
        'total_profit' => $totalCashout - $totalBuyin
    ];
}
?>