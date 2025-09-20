<?php
require_once 'config.php';

try {
    // Buscar todos os jogadores únicos
    $stmt = $pdo->query("SELECT players_data FROM sessions WHERE players_data IS NOT NULL");
    $sessions = $stmt->fetchAll();
    
    $players = [];
    foreach ($sessions as $session) {
        $data = json_decode($session['players_data'], true);
        if (is_array($data)) {
            foreach ($data as $player) {
                if (isset($player['name']) && !in_array($player['name'], $players)) {
                    $players[] = $player['name'];
                }
            }
        }
    }
    
    sort($players);
    success($players);
    
} catch (Exception $e) {
    error('Server error');
}
?>