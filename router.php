<?php
declare(strict_types=1);
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$public = __DIR__ . '/public';
$asset = realpath($public . $path);
if ($path !== '/' && $asset && str_starts_with($asset, realpath($public)) && is_file($asset)) {
    $mime = match (strtolower(pathinfo($asset, PATHINFO_EXTENSION))) {
        'css' => 'text/css; charset=utf-8', 'js' => 'application/javascript; charset=utf-8',
        'png' => 'image/png', 'jpg', 'jpeg' => 'image/jpeg', 'svg' => 'image/svg+xml', default => 'application/octet-stream'
    };
    header('Content-Type: ' . $mime);
    readfile($asset);
    return true;
}
if (str_starts_with($path, '/api/')) {
    $endpoint = __DIR__ . $path;
    if (is_file($endpoint)) { require $endpoint; return true; }
    http_response_code(404); header('Content-Type: application/json'); echo '{"error":"Endpoint tidak ditemukan."}'; return true;
}
if ($path === '/' || $path === '/index.php' || $path === '/login.php') {
    require __DIR__ . '/index.php';
    return true;
}
http_response_code(404); echo 'Tidak ditemukan.';
