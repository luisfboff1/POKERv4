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
    // Verificar autenticação básica
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        throw new Exception('Token de autenticação necessário');
    }

    $pdo = new PDO($dsn, $username, $password, $options);
    
    echo json_encode([
        'success' => true,
        'message' => 'Status das sessões atualizados automaticamente',
        'data' => updateSessionStatus($pdo)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function updateSessionStatus($pdo) {
    // Buscar todas as sessões
    $stmt = $pdo->query("
        SELECT id, players_data, status 
        FROM sessions 
        WHERE tenant_id = 1
        ORDER BY date DESC
    ");
    
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $updated = 0;
    
    foreach ($sessions as $session) {
        $playersData = json_decode($session['players_data'], true);
        
        if (!is_array($playersData)) {
            continue;
        }
        
        // Calcular novo status baseado nos dados
        $newStatus = calculateSessionStatus($playersData);
        
        // Se mudou o status, atualizar
        if ($newStatus !== $session['status']) {
            $updateStmt = $pdo->prepare("
                UPDATE sessions 
                SET status = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            
            $updateStmt->execute([$newStatus, $session['id']]);
            $updated++;
        }
    }
    
    return [
        'sessions_checked' => count($sessions),
        'sessions_updated' => $updated
    ];
}

function calculateSessionStatus($playersData) {
    if (empty($playersData)) {
        return 'pending';
    }
    
    $hasIncompleteData = false;
    
    foreach ($playersData as $player) {
        // Verificar se tem dados básicos obrigatórios
        if (empty($player['name'])) {
            $hasIncompleteData = true;
            continue;
        }
        
        // Verificar se buyin e cashout estão definidos
        if (!isset($player['buyin']) || !isset($player['cashout'])) {
            $hasIncompleteData = true;
            continue;
        }
        
        // Verificar se são valores válidos (não negativos)
        if ($player['buyin'] < 0 || $player['cashout'] < 0) {
            $hasIncompleteData = true;
            continue;
        }
    }
    
    // Se todos os dados estão completos, sessão está concluída
    return $hasIncompleteData ? 'pending' : 'approved';
}
?>