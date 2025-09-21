<?php
require_once 'config.php';
require_once 'middleware/auth_middleware.php';

// Função para instalar TCPDF via Composer (executar uma vez)
function installTCPDF() {
    // composer require tecnickcom/tcpdf
    // Este comando deve ser executado no terminal do servidor
}

class PokerPDFGenerator {
    private $pdo;
    private $user;
    
    public function __construct($pdo, $user) {
        $this->pdo = $pdo;
        $this->user = $user;
    }
    
    public function generateSessionPDF($sessionId) {
        // Buscar dados da sessão
        $stmt = $this->pdo->prepare("
            SELECT * FROM sessions 
            WHERE id = ? AND tenant_id = ?
        ");
        $stmt->execute([$sessionId, $this->user['tenant_id']]);
        $session = $stmt->fetch();
        
        if (!$session) {
            throw new Exception('Sessão não encontrada', 404);
        }
        
        $playersData = json_decode($session['players_data'], true) ?? [];
        
        // Por enquanto, gerar PDF simples com HTML2PDF ou similar
        // TODO: Implementar TCPDF completo
        
        $html = $this->generateSessionHTML($session, $playersData);
        
        // Salvar HTML temporário (será PDF real na implementação final)
        $fileName = "session_{$sessionId}_" . date('Y-m-d') . ".html";
        $filePath = __DIR__ . "/temp_pdfs/" . $fileName;
        
        // Criar diretório se não existir
        if (!is_dir(__DIR__ . "/temp_pdfs/")) {
            mkdir(__DIR__ . "/temp_pdfs/", 0755, true);
        }
        
        file_put_contents($filePath, $html);
        
        return [
            'file_name' => $fileName,
            'file_path' => $filePath,
            'download_url' => "/api/download_pdf.php?file=" . urlencode($fileName),
            'session_id' => $sessionId,
            'generated_at' => date('Y-m-d H:i:s')
        ];
    }
    
    public function generateMonthlyReport($month, $year) {
        // Buscar sessões do mês
        $stmt = $this->pdo->prepare("
            SELECT * FROM sessions 
            WHERE tenant_id = ? 
            AND YEAR(date) = ? 
            AND MONTH(date) = ?
            ORDER BY date ASC
        ");
        $stmt->execute([$this->user['tenant_id'], $year, $month]);
        $sessions = $stmt->fetchAll();
        
        $html = $this->generateMonthlyHTML($sessions, $month, $year);
        
        $fileName = "monthly_report_{$year}_{$month}_" . date('Y-m-d') . ".html";
        $filePath = __DIR__ . "/temp_pdfs/" . $fileName;
        
        if (!is_dir(__DIR__ . "/temp_pdfs/")) {
            mkdir(__DIR__ . "/temp_pdfs/", 0755, true);
        }
        
        file_put_contents($filePath, $html);
        
        return [
            'file_name' => $fileName,
            'file_path' => $filePath,
            'download_url' => "/api/download_pdf.php?file=" . urlencode($fileName),
            'month' => $month,
            'year' => $year,
            'sessions_count' => count($sessions),
            'generated_at' => date('Y-m-d H:i:s')
        ];
    }
    
    private function generateSessionHTML($session, $playersData) {
        $date = date('d/m/Y', strtotime($session['date']));
        $totalBuyIns = 0;
        $totalCashOuts = 0;
        
        $playerRows = '';
        foreach ($playersData as $player) {
            $buyIns = array_sum($player['buyIns'] ?? []);
            $cashOut = $player['cashOut'] ?? 0;
            $profit = $cashOut - $buyIns;
            $dinner = $player['dinner']['amount'] ?? 0;
            
            $totalBuyIns += $buyIns;
            $totalCashOuts += $cashOut;
            
            $profitClass = $profit >= 0 ? 'profit-positive' : 'profit-negative';
            
            $playerRows .= "
                <tr>
                    <td>{$player['name']}</td>
                    <td>R$ " . number_format($buyIns, 2, ',', '.') . "</td>
                    <td>R$ " . number_format($cashOut, 2, ',', '.') . "</td>
                    <td class='{$profitClass}'>R$ " . number_format($profit, 2, ',', '.') . "</td>
                    <td>R$ " . number_format($dinner, 2, ',', '.') . "</td>
                </tr>
            ";
        }
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Sessão de Poker - {$date}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #3b82f6;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #3b82f6;
                    margin: 0;
                }
                .session-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #3b82f6;
                    color: white;
                }
                .profit-positive {
                    color: #10b981;
                    font-weight: bold;
                }
                .profit-negative {
                    color: #ef4444;
                    font-weight: bold;
                }
                .summary {
                    background: #f0f9ff;
                    border: 1px solid #3b82f6;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>🎯 Poker SaaS</h1>
                <h2>Relatório da Sessão</h2>
                <p>Data: {$date}</p>
            </div>
            
            <div class='session-info'>
                <h3>Informações da Sessão</h3>
                <p><strong>Data:</strong> {$date}</p>
                <p><strong>Jogadores:</strong> " . count($playersData) . "</p>
                <p><strong>Total em Jogo:</strong> R$ " . number_format($totalBuyIns, 2, ',', '.') . "</p>
            </div>
            
            <h3>Resultados dos Jogadores</h3>
            <table>
                <thead>
                    <tr>
                        <th>Jogador</th>
                        <th>Buy-ins</th>
                        <th>Cash-out</th>
                        <th>Lucro/Prejuízo</th>
                        <th>Janta</th>
                    </tr>
                </thead>
                <tbody>
                    {$playerRows}
                </tbody>
            </table>
            
            <div class='summary'>
                <h3>Resumo Financeiro</h3>
                <p><strong>Total Buy-ins:</strong> R$ " . number_format($totalBuyIns, 2, ',', '.') . "</p>
                <p><strong>Total Cash-outs:</strong> R$ " . number_format($totalCashOuts, 2, ',', '.') . "</p>
                <p><strong>Diferença:</strong> R$ " . number_format($totalCashOuts - $totalBuyIns, 2, ',', '.') . "</p>
            </div>
            
            <div class='footer'>
                <p>Gerado automaticamente pelo Poker SaaS em " . date('d/m/Y H:i') . "</p>
                <p>Tenant: {$this->user['tenant_id']} | Usuário: {$this->user['name']}</p>
            </div>
        </body>
        </html>
        ";
    }
    
    private function generateMonthlyHTML($sessions, $month, $year) {
        $monthName = [
            1 => 'Janeiro', 2 => 'Fevereiro', 3 => 'Março', 4 => 'Abril',
            5 => 'Maio', 6 => 'Junho', 7 => 'Julho', 8 => 'Agosto',
            9 => 'Setembro', 10 => 'Outubro', 11 => 'Novembro', 12 => 'Dezembro'
        ][$month];
        
        $totalSessions = count($sessions);
        $totalBuyIns = 0;
        $totalCashOuts = 0;
        $playerStats = [];
        
        $sessionRows = '';
        foreach ($sessions as $session) {
            $playersData = json_decode($session['players_data'], true) ?? [];
            $sessionBuyIns = 0;
            $sessionCashOuts = 0;
            
            foreach ($playersData as $player) {
                $buyIns = array_sum($player['buyIns'] ?? []);
                $cashOut = $player['cashOut'] ?? 0;
                
                $sessionBuyIns += $buyIns;
                $sessionCashOuts += $cashOut;
                
                // Estatísticas por jogador
                if (!isset($playerStats[$player['name']])) {
                    $playerStats[$player['name']] = [
                        'sessions' => 0,
                        'buyIns' => 0,
                        'cashOuts' => 0,
                        'profit' => 0
                    ];
                }
                
                $playerStats[$player['name']]['sessions']++;
                $playerStats[$player['name']]['buyIns'] += $buyIns;
                $playerStats[$player['name']]['cashOuts'] += $cashOut;
                $playerStats[$player['name']]['profit'] += ($cashOut - $buyIns);
            }
            
            $totalBuyIns += $sessionBuyIns;
            $totalCashOuts += $sessionCashOuts;
            
            $sessionRows .= "
                <tr>
                    <td>" . date('d/m/Y', strtotime($session['date'])) . "</td>
                    <td>" . count($playersData) . "</td>
                    <td>R$ " . number_format($sessionBuyIns, 2, ',', '.') . "</td>
                    <td>R$ " . number_format($sessionCashOuts, 2, ',', '.') . "</td>
                </tr>
            ";
        }
        
        // Top 5 jogadores
        uasort($playerStats, function($a, $b) {
            return $b['profit'] <=> $a['profit'];
        });
        
        $topPlayersRows = '';
        $count = 0;
        foreach ($playerStats as $name => $stats) {
            if ($count >= 5) break;
            
            $profitClass = $stats['profit'] >= 0 ? 'profit-positive' : 'profit-negative';
            $topPlayersRows .= "
                <tr>
                    <td>{$name}</td>
                    <td>{$stats['sessions']}</td>
                    <td>R$ " . number_format($stats['buyIns'], 2, ',', '.') . "</td>
                    <td>R$ " . number_format($stats['cashOuts'], 2, ',', '.') . "</td>
                    <td class='{$profitClass}'>R$ " . number_format($stats['profit'], 2, ',', '.') . "</td>
                </tr>
            ";
            $count++;
        }
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Relatório Mensal - {$monthName} {$year}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
                .header h1 { color: #3b82f6; margin: 0; }
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                .summary-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
                .summary-card h3 { margin: 0 0 10px 0; color: #3b82f6; }
                .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #3b82f6; color: white; }
                .profit-positive { color: #10b981; font-weight: bold; }
                .profit-negative { color: #ef4444; font-weight: bold; }
                .section { margin: 30px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>🎯 Poker SaaS</h1>
                <h2>Relatório Mensal</h2>
                <p>{$monthName} de {$year}</p>
            </div>
            
            <div class='summary-grid'>
                <div class='summary-card'>
                    <h3>Sessões</h3>
                    <div class='value'>{$totalSessions}</div>
                </div>
                <div class='summary-card'>
                    <h3>Jogadores Únicos</h3>
                    <div class='value'>" . count($playerStats) . "</div>
                </div>
                <div class='summary-card'>
                    <h3>Total Buy-ins</h3>
                    <div class='value'>R$ " . number_format($totalBuyIns, 2, ',', '.') . "</div>
                </div>
                <div class='summary-card'>
                    <h3>Total Cash-outs</h3>
                    <div class='value'>R$ " . number_format($totalCashOuts, 2, ',', '.') . "</div>
                </div>
            </div>
            
            <div class='section'>
                <h3>Sessões do Mês</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Jogadores</th>
                            <th>Buy-ins</th>
                            <th>Cash-outs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$sessionRows}
                    </tbody>
                </table>
            </div>
            
            <div class='section'>
                <h3>Top 5 Jogadores</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Jogador</th>
                            <th>Sessões</th>
                            <th>Buy-ins</th>
                            <th>Cash-outs</th>
                            <th>Lucro/Prejuízo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$topPlayersRows}
                    </tbody>
                </table>
            </div>
            
            <div class='footer'>
                <p>Gerado automaticamente pelo Poker SaaS em " . date('d/m/Y H:i') . "</p>
                <p>Tenant: {$this->user['tenant_id']} | Usuário: {$this->user['name']}</p>
            </div>
        </body>
        </html>
        ";
    }
}

// Endpoint para download de PDF
if (isset($_GET['action']) && $_GET['action'] === 'generate') {
    try {
        AuthMiddleware::requireAuth($pdo);
        $currentUser = AuthMiddleware::getCurrentUser();
        
        $generator = new PokerPDFGenerator($pdo, $currentUser);
        
        $type = $_GET['type'] ?? 'session';
        
        if ($type === 'session') {
            $sessionId = $_GET['session_id'] ?? null;
            if (!$sessionId) {
                throw new Exception('ID da sessão é obrigatório');
            }
            
            $result = $generator->generateSessionPDF($sessionId);
        } elseif ($type === 'monthly') {
            $month = $_GET['month'] ?? date('n');
            $year = $_GET['year'] ?? date('Y');
            
            $result = $generator->generateMonthlyReport($month, $year);
        } else {
            throw new Exception('Tipo de relatório inválido');
        }
        
        echo json_encode([
            'success' => true,
            'data' => $result
        ]);
        
    } catch (Exception $e) {
        http_response_code($e->getCode() ?: 500);
        echo json_encode([
            'error' => $e->getMessage()
        ]);
    }
}
?>
