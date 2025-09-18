<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Buscar todos os jogadores
            $userId = $_GET['userId'] ?? null;
            
            if ($userId) {
                $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$userId]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM users ORDER BY name");
                $stmt->execute();
            }
            
            $players = $stmt->fetchAll();
            echo json_encode(['data' => $players]);
            break;
            
        case 'POST':
            // Criar novo jogador
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO users (name, email, role, created_at, updated_at) 
                VALUES (?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $input['name'] ?? '',
                $input['email'] ?? '',
                $input['role'] ?? 'user'
            ]);
            
            $playerId = $pdo->lastInsertId();
            echo json_encode(['data' => ['id' => $playerId]]);
            break;
            
        case 'PUT':
            // Atualizar jogador
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID do jogador é obrigatório']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                UPDATE users 
                SET name = ?, email = ?, role = ?, updated_at = NOW()
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['name'] ?? '',
                $input['email'] ?? '',
                $input['role'] ?? 'user',
                $input['id']
            ]);
            
            echo json_encode(['data' => ['success' => true]]);
            break;
            
        case 'DELETE':
            // Deletar jogador
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID do jogador é obrigatório']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$input['id']]);
            
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
