<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Extrair ID da sessão se presente
$sessionId = null;
if (preg_match('/\/api\/sessions\/(\d+)/', $path, $matches)) {
    $sessionId = $matches[1];
}

try {
    switch ($method) {
        case 'GET':
            if ($sessionId) {
                // Buscar sessão específica
                $stmt = $pdo->prepare("SELECT * FROM sessions WHERE id = ?");
                $stmt->execute([$sessionId]);
                $session = $stmt->fetch();
                
                if (!$session) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Sessão não encontrada']);
                    exit;
                }
                
                // Buscar participantes
                $stmt = $pdo->prepare("SELECT * FROM participants WHERE session_id = ?");
                $stmt->execute([$sessionId]);
                $participants = $stmt->fetchAll();
                
                // Buscar transferências
                $stmt = $pdo->prepare("SELECT * FROM transfers WHERE session_id = ?");
                $stmt->execute([$sessionId]);
                $transfers = $stmt->fetchAll();
                
                $session['participants'] = $participants;
                $session['transfers'] = $transfers;
                
                echo json_encode(['data' => $session]);
            } else {
                // Buscar todas as sessões
                $userId = $_GET['userId'] ?? null;
                
                if ($userId) {
                    $stmt = $pdo->prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC");
                    $stmt->execute([$userId]);
                } else {
                    $stmt = $pdo->prepare("SELECT * FROM sessions ORDER BY created_at DESC");
                    $stmt->execute();
                }
                
                $sessions = $stmt->fetchAll();
                echo json_encode(['data' => $sessions]);
            }
            break;
            
        case 'POST':
            // Criar nova sessão
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO sessions (name, date, buy_in, rebuy, addon, total_pot, user_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $input['name'] ?? '',
                $input['date'] ?? date('Y-m-d'),
                $input['buyIn'] ?? 0,
                $input['rebuy'] ?? 0,
                $input['addon'] ?? 0,
                $input['totalPot'] ?? 0,
                $input['userId'] ?? 1
            ]);
            
            $sessionId = $pdo->lastInsertId();
            
            // Salvar participantes se fornecidos
            if (isset($input['participants']) && is_array($input['participants'])) {
                foreach ($input['participants'] as $participant) {
                    $stmt = $pdo->prepare("
                        INSERT INTO participants (session_id, name, buy_in, rebuy, addon, total_invested, final_amount, profit_loss) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $sessionId,
                        $participant['name'] ?? '',
                        $participant['buyIn'] ?? 0,
                        $participant['rebuy'] ?? 0,
                        $participant['addon'] ?? 0,
                        $participant['totalInvested'] ?? 0,
                        $participant['finalAmount'] ?? 0,
                        $participant['profitLoss'] ?? 0
                    ]);
                }
            }
            
            // Salvar transferências se fornecidas
            if (isset($input['transfers']) && is_array($input['transfers'])) {
                foreach ($input['transfers'] as $transfer) {
                    $stmt = $pdo->prepare("
                        INSERT INTO transfers (session_id, from_player, to_player, amount, description) 
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $sessionId,
                        $transfer['fromPlayer'] ?? '',
                        $transfer['toPlayer'] ?? '',
                        $transfer['amount'] ?? 0,
                        $transfer['description'] ?? ''
                    ]);
                }
            }
            
            echo json_encode(['data' => ['id' => $sessionId]]);
            break;
            
        case 'DELETE':
            if (!$sessionId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID da sessão é obrigatório']);
                exit;
            }
            
            // Deletar transferências
            $stmt = $pdo->prepare("DELETE FROM transfers WHERE session_id = ?");
            $stmt->execute([$sessionId]);
            
            // Deletar participantes
            $stmt = $pdo->prepare("DELETE FROM participants WHERE session_id = ?");
            $stmt->execute([$sessionId]);
            
            // Deletar sessão
            $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = ?");
            $stmt->execute([$sessionId]);
            
            echo json_encode(['data' => ['success' => true]]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}
?>
