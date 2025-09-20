<?php
require_once 'config.php';

function validateSessionData($data) {
    if (!$data || !isset($data['players_data']) || !is_array($data['players_data'])) {
        respondError('Invalid session data', 400);
    }
    
    foreach ($data['players_data'] as $player) {
        if (!isset($player['name']) || empty($player['name'])) {
            respondError('All players must have a name', 400);
        }
    }
    
    return true;
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM sessions ORDER BY date DESC, id DESC");
            $sessions = $stmt->fetchAll();
            
            foreach ($sessions as &$session) {
                if (isset($session['players_data'])) {
                    $session['players_data'] = json_decode($session['players_data'], true);
                }
                if (isset($session['recommendations'])) {
                    $session['recommendations'] = json_decode($session['recommendations'], true);
                }
            }
            
            respondSuccess($sessions);
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            validateSessionData($input);

            $stmt = $pdo->prepare("INSERT INTO sessions (date, players_data, recommendations) VALUES (?, ?, ?)");
            $stmt->execute([
                $input['date'] ?? date('Y-m-d'),
                json_encode($input['players_data']),
                json_encode($input['recommendations'] ?? [])
            ]);
            
            respondSuccess(['id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            $id = $_GET['id'] ?? null;
            if (!$id || !is_numeric($id)) {
                respondError('Invalid ID', 400);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            validateSessionData($input);

            $stmt = $pdo->prepare("UPDATE sessions SET players_data = ?, recommendations = ?, date = ? WHERE id = ?");
            $stmt->execute([
                json_encode($input['players_data']),
                json_encode($input['recommendations'] ?? []),
                $input['date'] ?? date('Y-m-d'),
                $id
            ]);
            
            if ($stmt->rowCount() === 0) {
                respondError('Session not found', 404);
            }
            
            respondSuccess(['updated' => true]);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id || !is_numeric($id)) {
                respondError('Invalid ID', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                respondError('Session not found', 404);
            }
            
            respondSuccess(['deleted' => true]);
            break;

        default:
            respondError('Method not allowed', 405);
    }
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    respondError('Database error');
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    respondError('Internal server error');
}
?>