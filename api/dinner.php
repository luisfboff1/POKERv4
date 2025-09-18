<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Extrair ID dos dados de janta se presente
$dinnerId = null;
if (preg_match('/\/api\/dinner\/(\d+)/', $path, $matches)) {
    $dinnerId = $matches[1];
}

try {
    switch ($method) {
        case 'GET':
            if ($dinnerId) {
                // Buscar dados de janta específicos
                $stmt = $pdo->prepare("SELECT * FROM dinner_data WHERE id = ?");
                $stmt->execute([$dinnerId]);
                $dinner = $stmt->fetch();
                
                if (!$dinner) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Dados de janta não encontrados']);
                    exit;
                }
                
                // Buscar participantes da janta
                $stmt = $pdo->prepare("SELECT * FROM dinner_participants WHERE dinner_id = ?");
                $stmt->execute([$dinnerId]);
                $participants = $stmt->fetchAll();
                
                $dinner['participants'] = $participants;
                echo json_encode(['data' => $dinner]);
            } else {
                // Buscar todos os dados de janta
                $userId = $_GET['userId'] ?? null;
                
                if ($userId) {
                    $stmt = $pdo->prepare("SELECT * FROM dinner_data WHERE user_id = ? ORDER BY created_at DESC");
                    $stmt->execute([$userId]);
                } else {
                    $stmt = $pdo->prepare("SELECT * FROM dinner_data ORDER BY created_at DESC");
                    $stmt->execute();
                }
                
                $dinners = $stmt->fetchAll();
                echo json_encode(['data' => $dinners]);
            }
            break;
            
        case 'POST':
            // Criar novos dados de janta
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Debug: Log dos dados recebidos
            error_log("Dados de janta recebidos: " . json_encode($input));
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO dinner_data (session_id, total_amount, payer, division_type, custom_amount, user_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            try {
                $stmt->execute([
                    $input['session_id'] ?? null,
                    $input['total_amount'] ?? 0,
                    $input['payer'] ?? '',
                    $input['division_type'] ?? 'equal',
                    $input['custom_amount'] ?? 0,
                    $input['user_id'] ?? 1
                ]);
            } catch (PDOException $e) {
                error_log("Erro ao inserir dados de janta: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao salvar dados de janta: ' . $e->getMessage()]);
                exit;
            }
            
            $dinnerId = $pdo->lastInsertId();
            
            // Salvar participantes da janta se fornecidos
            if (isset($input['participants']) && is_array($input['participants'])) {
                foreach ($input['participants'] as $participant) {
                    $stmt = $pdo->prepare("
                        INSERT INTO dinner_participants (dinner_id, name, amount, paid) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $dinnerId,
                        $participant['name'] ?? '',
                        $participant['amount'] ?? 0,
                        $participant['paid'] ? 1 : 0
                    ]);
                }
            }
            
            echo json_encode(['data' => ['id' => $dinnerId]]);
            break;
            
        case 'PUT':
            if (!$dinnerId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID dos dados de janta é obrigatório']);
                exit;
            }
            
            // Atualizar dados de janta
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                UPDATE dinner_data 
                SET total_amount = ?, payer = ?, division_type = ?, custom_amount = ?, updated_at = NOW()
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['totalAmount'] ?? 0,
                $input['payer'] ?? '',
                $input['divisionType'] ?? 'equal',
                $input['customAmount'] ?? 0,
                $dinnerId
            ]);
            
            // Atualizar participantes da janta
            if (isset($input['participants']) && is_array($input['participants'])) {
                // Deletar participantes existentes
                $stmt = $pdo->prepare("DELETE FROM dinner_participants WHERE dinner_id = ?");
                $stmt->execute([$dinnerId]);
                
                // Inserir novos participantes
                foreach ($input['participants'] as $participant) {
                    $stmt = $pdo->prepare("
                        INSERT INTO dinner_participants (dinner_id, name, amount, paid) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $dinnerId,
                        $participant['name'] ?? '',
                        $participant['amount'] ?? 0,
                        $participant['paid'] ? 1 : 0
                    ]);
                }
            }
            
            echo json_encode(['data' => ['success' => true]]);
            break;
            
        case 'DELETE':
            if (!$dinnerId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID dos dados de janta é obrigatório']);
                exit;
            }
            
            // Deletar participantes da janta
            $stmt = $pdo->prepare("DELETE FROM dinner_participants WHERE dinner_id = ?");
            $stmt->execute([$dinnerId]);
            
            // Deletar dados de janta
            $stmt = $pdo->prepare("DELETE FROM dinner_data WHERE id = ?");
            $stmt->execute([$dinnerId]);
            
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
