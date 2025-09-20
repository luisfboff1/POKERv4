<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Listar todas as sessões
            $stmt = $pdo->query("SELECT * FROM sessions ORDER BY date DESC, id DESC");
            $sessions = $stmt->fetchAll();
            
            // Converter JSON strings para arrays
            foreach ($sessions as &$session) {
                $session['players_data'] = json_decode($session['players_data'] ?? '[]', true);
                $session['recommendations'] = json_decode($session['recommendations'] ?? '[]', true);
            }
            
            success($sessions);
            break;

        case 'POST':
            // Criar nova sessão
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("INSERT INTO sessions (date, players_data, recommendations) VALUES (?, ?, ?)");
            $stmt->execute([
                $input['date'] ?? date('Y-m-d'),
                json_encode($input['players_data'] ?? []),
                json_encode($input['recommendations'] ?? [])
            ]);
            
            success(['id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            // Atualizar sessão
            $id = $_GET['id'] ?? null;
            if (!$id) error('ID required', 400);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("UPDATE sessions SET players_data = ?, recommendations = ?, date = ? WHERE id = ?");
            $stmt->execute([
                json_encode($input['players_data'] ?? []),
                json_encode($input['recommendations'] ?? []),
                $input['date'] ?? date('Y-m-d'),
                $id
            ]);
            
            success(['updated' => true]);
            break;

        case 'DELETE':
            // Deletar sessão
            $id = $_GET['id'] ?? null;
            if (!$id) error('ID required', 400);
            
            $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = ?");
            $stmt->execute([$id]);
            
            success(['deleted' => true]);
            break;

        default:
            error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error('Server error');
}
?>