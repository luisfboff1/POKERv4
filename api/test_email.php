<?php
header('Content-Type: application/json');

// Verificar configuração de email
$emailDebug = [
    'composer_autoload' => file_exists(__DIR__ . '/vendor/autoload.php'),
    'email_config_exists' => file_exists(__DIR__ . '/email_config.php'),
    'env_file_exists' => file_exists(__DIR__ . '/.env'),
    'current_directory' => __DIR__
];

// Tentar carregar email_config
try {
    if ($emailDebug['composer_autoload']) {
        require_once __DIR__ . '/vendor/autoload.php';
        $emailDebug['autoload_loaded'] = true;
    }
    
    if ($emailDebug['email_config_exists']) {
        require_once __DIR__ . '/email_config.php';
        $emailDebug['email_config_loaded'] = true;
        
        // Verificar constantes definidas
        $emailDebug['smtp_constants'] = [
            'SMTP_HOST' => defined('SMTP_HOST') ? SMTP_HOST : 'NOT_DEFINED',
            'SMTP_PORT' => defined('SMTP_PORT') ? SMTP_PORT : 'NOT_DEFINED',
            'SMTP_USERNAME' => defined('SMTP_USERNAME') ? SMTP_USERNAME : 'NOT_DEFINED',
            'SMTP_PASSWORD' => defined('SMTP_PASSWORD') ? (SMTP_PASSWORD ? 'SET' : 'EMPTY') : 'NOT_DEFINED',
            'FROM_EMAIL' => defined('FROM_EMAIL') ? FROM_EMAIL : 'NOT_DEFINED'
        ];
        
        // Verificar se PHPMailer está disponível
        $emailDebug['phpmailer_available'] = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
        
        // Testar envio de email simples (apenas estrutura)
        if ($emailDebug['phpmailer_available']) {
            try {
                $testResult = sendEmail(
                    'teste@exemplo.com', 
                    'Teste do Sistema', 
                    'Este é um teste do sistema de email',
                    true
                );
                $emailDebug['test_email_result'] = $testResult;
            } catch (Exception $e) {
                $emailDebug['test_email_error'] = $e->getMessage();
            }
        }
    }
    
} catch (Exception $e) {
    $emailDebug['error'] = $e->getMessage();
}

// Verificar arquivo .env se existir
if ($emailDebug['env_file_exists']) {
    $envContent = file_get_contents(__DIR__ . '/.env');
    $emailDebug['env_preview'] = substr($envContent, 0, 200) . '...';
    $emailDebug['env_has_smtp'] = strpos($envContent, 'SMTP_') !== false;
}

// Verificar estrutura de arquivos
$emailDebug['directory_structure'] = [
    'api_files' => array_slice(scandir(__DIR__), 2, 20), // Primeiros 20 arquivos
    'vendor_exists' => is_dir(__DIR__ . '/vendor'),
    'temp_pdfs_exists' => is_dir(__DIR__ . '/temp_pdfs')
];

echo json_encode([
    'status' => 'success',
    'email_debug' => $emailDebug,
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
?>
