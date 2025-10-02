<?php
/**
 * Configuração Centralizada da Aplicação
 * Define caminhos e URLs de forma dinâmica baseado no ambiente
 */

// Carregar variáveis de ambiente do .env se existir
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Detectar ambiente
$isProduction = ($_ENV['APP_ENV'] ?? 'production') === 'production';

// Detectar protocolo (HTTP ou HTTPS)
$protocol = 'https'; // Default para produção
if (isset($_SERVER['HTTPS'])) {
    $protocol = $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
} elseif (isset($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
    $protocol = $_SERVER['HTTP_X_FORWARDED_PROTO'];
}

// Detectar host
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

// Detectar base path automaticamente
// Por exemplo: Se script está em /poker/api/config.php, base path é /poker
$scriptPath = $_SERVER['SCRIPT_NAME'] ?? '';
$basePath = '';
if (strpos($scriptPath, '/api/') !== false) {
    $basePath = dirname(dirname($scriptPath)); // Sobe 2 níveis
} elseif (dirname($scriptPath) !== '/' && dirname($scriptPath) !== '\\') {
    $basePath = dirname($scriptPath);
}
// Normalizar path
if ($basePath === '/' || $basePath === '\\') {
    $basePath = '';
}

// === CONFIGURAÇÕES GLOBAIS ===

// URL base da aplicação (pode ser sobrescrita por variável de ambiente)
if (!defined('APP_BASE_URL')) {
    define('APP_BASE_URL', $_ENV['BASE_URL'] ?? ($protocol . '://' . $host . $basePath));
}

// Path base da aplicação (ex: /poker ou vazio para raiz)
if (!defined('APP_BASE_PATH')) {
    define('APP_BASE_PATH', $_ENV['APP_BASE_PATH'] ?? $basePath);
}

// Diretório temporário da aplicação
if (!defined('APP_TEMP_DIR')) {
    define('APP_TEMP_DIR', $_ENV['TEMP_DIR'] ?? (sys_get_temp_dir() . '/poker_app'));
}

// Ambiente (production, development, staging)
if (!defined('APP_ENV')) {
    define('APP_ENV', $_ENV['APP_ENV'] ?? 'production');
}

// Diretório de logs
if (!defined('APP_LOG_DIR')) {
    define('APP_LOG_DIR', $_ENV['LOG_DIR'] ?? (APP_TEMP_DIR . '/logs'));
}

// === CRIAR DIRETÓRIOS NECESSÁRIOS ===

if (!is_dir(APP_TEMP_DIR)) {
    @mkdir(APP_TEMP_DIR, 0755, true);
}

if (!is_dir(APP_LOG_DIR)) {
    @mkdir(APP_LOG_DIR, 0755, true);
}

// Diretório para PDFs temporários
$pdfDir = APP_TEMP_DIR . '/pdfs';
if (!is_dir($pdfDir)) {
    @mkdir($pdfDir, 0755, true);
}
if (!defined('APP_PDF_DIR')) {
    define('APP_PDF_DIR', $pdfDir);
}

// === FUNÇÕES AUXILIARES ===

/**
 * Retorna URL completa para um path relativo
 * @param string $path - Path relativo (ex: "/api/session.php" ou "/login")
 * @return string - URL completa
 */
function app_url($path = '') {
    $path = ltrim($path, '/');
    $basePath = APP_BASE_PATH ? rtrim(APP_BASE_PATH, '/') : '';
    return APP_BASE_URL . ($path ? '/' . $path : '');
}

/**
 * Retorna path completo considerando o base path
 * @param string $path - Path relativo (ex: "/login" ou "api/session.php")
 * @return string - Path completo (ex: "/poker/login")
 */
function app_path($path = '') {
    $path = ltrim($path, '/');
    $basePath = APP_BASE_PATH ? rtrim(APP_BASE_PATH, '/') : '';
    return $basePath . ($path ? '/' . $path : '');
}

/**
 * Limpa arquivos antigos de um diretório
 * @param string $dir - Diretório para limpar
 * @param int $maxAge - Idade máxima em segundos (padrão: 24 horas)
 */
function clean_old_files($dir, $maxAge = 86400) {
    if (!is_dir($dir)) return;
    
    $files = glob($dir . '/*');
    $now = time();
    
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file) >= $maxAge)) {
            @unlink($file);
        }
    }
}

// === LOG HELPER ===

/**
 * Registra mensagem em arquivo de log
 * @param string $message - Mensagem a registrar
 * @param string $level - Nível do log (info, warning, error)
 */
function app_log($message, $level = 'info') {
    $timestamp = date('Y-m-d H:i:s');
    $logFile = APP_LOG_DIR . '/app_' . date('Y-m-d') . '.log';
    $logMessage = "[{$timestamp}] [{$level}] {$message}\n";
    @file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// === DEBUG INFO (apenas em desenvolvimento) ===

if (APP_ENV === 'development' && isset($_GET['debug_config'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'APP_BASE_URL' => APP_BASE_URL,
        'APP_BASE_PATH' => APP_BASE_PATH,
        'APP_TEMP_DIR' => APP_TEMP_DIR,
        'APP_LOG_DIR' => APP_LOG_DIR,
        'APP_PDF_DIR' => APP_PDF_DIR,
        'APP_ENV' => APP_ENV,
        'detected_protocol' => $protocol,
        'detected_host' => $host,
        'detected_script_path' => $scriptPath,
        'detected_base_path' => $basePath
    ], JSON_PRETTY_PRINT);
    exit;
}
?>
