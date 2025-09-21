<?php
header('Content-Type: application/json');

// Verificar se Composer foi executado
$composerResults = [
    'vendor_exists' => is_dir(__DIR__ . '/vendor'),
    'autoload_exists' => file_exists(__DIR__ . '/vendor/autoload.php'),
    'phpmailer_exists' => class_exists('PHPMailer\\PHPMailer\\PHPMailer'),
    'composer_json_exists' => file_exists(__DIR__ . '/composer.json'),
    'env_file_exists' => file_exists(__DIR__ . '/.env'),
    'current_directory' => __DIR__,
    'directory_contents' => scandir(__DIR__)
];

// Tentar carregar autoload
if ($composerResults['autoload_exists']) {
    try {
        require_once __DIR__ . '/vendor/autoload.php';
        $composerResults['autoload_loaded'] = true;
        
        // Verificar PHPMailer após carregar
        $composerResults['phpmailer_after_autoload'] = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
    } catch (Exception $e) {
        $composerResults['autoload_error'] = $e->getMessage();
    }
}

// Verificar arquivo .env
if ($composerResults['env_file_exists']) {
    $composerResults['env_contents'] = file_get_contents(__DIR__ . '/.env');
}

echo json_encode([
    'status' => 'success',
    'composer_check' => $composerResults,
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
?>
