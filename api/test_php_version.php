<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'OK',
    'file' => __FILE__,
    'time' => date('Y-m-d H:i:s'),
    'sha1' => sha1_file(__FILE__),
    'php_version' => phpversion()
]);
