<?php
// Configurações de Email para o Sistema
require_once __DIR__ . '/vendor/autoload.php'; // Composer autoload

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Carregar variáveis de ambiente do arquivo .env
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue; // Pular comentários
        }
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Configurações SMTP - Usar variáveis de ambiente por segurança
define('SMTP_HOST', $_ENV['SMTP_HOST'] ?? 'mail.luisfboff.com');
define('SMTP_PORT', $_ENV['SMTP_PORT'] ?? 587);
define('SMTP_USERNAME', $_ENV['SMTP_USERNAME'] ?? 'noreply@luisfboff.com');
define('SMTP_PASSWORD', $_ENV['SMTP_PASSWORD'] ?? ''); // Vem do GitHub Secrets
define('SMTP_ENCRYPTION', $_ENV['SMTP_ENCRYPTION'] ?? 'tls');

// Configurações do remetente
define('FROM_EMAIL', 'noreply@luisfboff.com');
define('FROM_NAME', 'Poker SaaS');

// URL base do sistema
define('BASE_URL', 'https://poker.luisfboff.com');

// Função principal para enviar email
function sendEmail($to, $subject, $body, $isHTML = true) {
    $mail = new PHPMailer(true);

    try {
        // Configurações do servidor
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        // Configurações do remetente
        $mail->setFrom(FROM_EMAIL, FROM_NAME);
        $mail->addAddress($to);

        // Conteúdo do email
        $mail->isHTML($isHTML);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        // Enviar
        $mail->send();
        
        return [
            'success' => true,
            'message' => 'Email enviado com sucesso',
            'to' => $to,
            'subject' => $subject
        ];
        
    } catch (Exception $e) {
        // Log do erro
        error_log("Erro ao enviar email: {$mail->ErrorInfo}");
        
        // Fallback: salvar em arquivo para debug
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'to' => $to,
            'subject' => $subject,
            'body' => $body,
            'error' => $mail->ErrorInfo
        ];
        
        file_put_contents(__DIR__ . '/email_log.txt', json_encode($logData) . "\n", FILE_APPEND);
        
        return [
            'success' => false,
            'message' => 'Erro ao enviar email: ' . $mail->ErrorInfo,
            'error' => $mail->ErrorInfo
        ];
    }
}

// Template para convite
function getInviteEmailTemplate($inviterName, $tenantName, $inviteLink) {
    return "
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .header h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
            }
            .header h2 {
                margin: 0;
                font-size: 18px;
                opacity: 0.9;
            }
            .content { 
                padding: 40px 30px; 
                background: white; 
            }
            .invite-box {
                background: #f8fafc;
                border-left: 4px solid #3b82f6;
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .invite-text {
                font-size: 18px;
                color: #1e40af;
                font-weight: 500;
                margin: 0;
            }
            .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white !important; 
                padding: 15px 40px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 25px 0; 
                font-weight: bold;
                font-size: 16px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
                transition: all 0.3s ease;
            }
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
            }
            .features {
                background: #f1f5f9;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }
            .features ul {
                margin: 0;
                padding-left: 20px;
            }
            .features li {
                margin: 8px 0;
                color: #475569;
            }
            .footer { 
                text-align: center; 
                color: #64748b; 
                font-size: 12px; 
                padding: 20px;
                background: #f8fafc;
                border-top: 1px solid #e2e8f0;
            }
            .link-fallback {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 12px;
                color: #92400e;
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎯 Poker SaaS</h1>
                <h2>Você foi convidado!</h2>
            </div>
            
            <div class='content'>
                <div class='invite-box'>
                    <p class='invite-text'>
                        <strong>{$inviterName}</strong> te convidou para fazer parte da home game dele: <strong>{$tenantName}</strong>
                    </p>
                </div>
                
                <p>🎉 Parabéns! Você foi selecionado para participar de um grupo exclusivo de poker.</p>
                
                <div class='features'>
                    <h4 style='margin-top: 0; color: #1e40af;'>O que você pode fazer no Poker SaaS:</h4>
                    <ul>
                        <li>🎮 <strong>Acompanhar sessões</strong> - Veja todos os jogos em tempo real</li>
                        <li>📊 <strong>Estatísticas detalhadas</strong> - Sua performance e ranking</li>
                        <li>💰 <strong>Controle financeiro</strong> - Buy-ins, cash-outs e lucros</li>
                        <li>🏆 <strong>Rankings atualizados</strong> - Veja quem está ganhando</li>
                        <li>🤖 <strong>PokerBot IA</strong> - Assistente inteligente para análises</li>
                    </ul>
                </div>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <p style='font-size: 16px; margin-bottom: 20px;'>
                        <strong>Clique no botão abaixo para aceitar o convite:</strong>
                    </p>
                    
                    <a href='{$inviteLink}' class='button'>
                        🚀 Aceitar Convite e Começar
                    </a>
                </div>
                
                <div class='link-fallback'>
                    <strong>⚠️ Se o botão não funcionar:</strong><br>
                    Copie e cole este link no seu navegador:<br>
                    <code>{$inviteLink}</code>
                </div>
                
                <p style='text-align: center; margin-top: 30px; font-style: italic; color: #64748b;'>
                    Bem-vindo à família! 🃏✨
                </p>
            </div>
            
            <div class='footer'>
                <p><strong>Poker SaaS</strong> - Sistema de Gerenciamento de Poker</p>
                <p>Este email foi enviado automaticamente por <strong>{$inviterName}</strong></p>
                <p style='margin-top: 15px;'>
                    Se você não solicitou este convite, pode ignorar este email com segurança.
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
}

// Template para aprovação de novo tenant
function getTenantApprovalTemplate($tenantName, $email, $approveLink, $rejectLink) {
    return "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .buttons { text-align: center; margin: 30px 0; }
            .approve { 
                background: #10b981; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 0 10px; 
            }
            .reject { 
                background: #ef4444; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 0 10px; 
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎯 Poker SaaS - Admin</h1>
                <h2>Nova Solicitação de Cadastro</h2>
            </div>
            
            <div class='content'>
                <h3>Nova solicitação de tenant:</h3>
                
                <p><strong>Nome/Empresa:</strong> {$tenantName}</p>
                <p><strong>Email:</strong> {$email}</p>
                <p><strong>Data:</strong> " . date('d/m/Y H:i') . "</p>
                
                <div class='buttons'>
                    <a href='{$approveLink}' class='approve'>✅ Aprovar</a>
                    <a href='{$rejectLink}' class='reject'>❌ Rejeitar</a>
                </div>
                
                <p><small>Clique em um dos botões acima para processar a solicitação.</small></p>
            </div>
        </div>
    </body>
    </html>
    ";
}
?>
