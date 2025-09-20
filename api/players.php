<?php
require_once 'config.php';

try {
    // Buscar jogadores únicos de todas as sessões
    $stmt = $pdo->query("
        SELECT DISTINCT JSON_EXTRACT(players_data, '$[*].name') as names 
        FROM sessions 
        WHERE players_data IS NOT NULL
    ");
    
    $results = $stmt->fetchAll();
    $players = [];
    
    foreach ($results as $result) {
        if ($result['names']) {
            $names = json_decode($result['names'], true);
            if (is_array($names)) {
                foreach ($names as $name) {
                    if ($name && !in_array($name, $players)) {
                        $players[] = $name;
                    }
                }
            }
        }
    }
    
    sort($players);
    respondSuccess($players);
    
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    respondError('Database error');
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    respondError('Internal server error');
}
?>