<?php
declare(strict_types=1);
require_once __DIR__ . '/../app/config.php';

try {
    $user = require_user();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        if ($user['role'] === 'admin') {
            require_admin($user);
            $status = $_GET['status'] ?? 'all';
            $sql = 'SELECT o.*, u.username, u.name, u.email FROM orders o JOIN users u ON u.id = o.user_id';
            $params = [];
            if ($status !== 'all') { $sql .= ' WHERE o.status = ?'; $params[] = $status; }
            $sql .= ' ORDER BY o.created_at DESC, o.id DESC';
            $stmt = db()->prepare($sql); $stmt->execute($params);
            $orders = $stmt->fetchAll();
            if (($_GET['summary'] ?? '') === '1') {
                json_response(['orders' => $orders]);
            }
            json_response(['orders' => $orders]);
        }
        $stmt = db()->prepare('SELECT code AS id, package, price, deadline, notes, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC');
        $stmt->execute([$user['id']]);
        json_response(['orders' => $stmt->fetchAll()]);
    }
    $data = request_data();
    if ($method === 'POST') {
        $packages = ['Short & simple' => 50000, 'Creator cut' => 150000, 'Project cut' => 300000];
        $package = trim((string)($data['package'] ?? ''));
        if (!isset($packages[$package])) json_response(['error' => 'Pilih paket yang tersedia.'], 422);
        $deadline = trim((string)($data['deadline'] ?? 'Fleksibel'));
        if (!in_array($deadline, ['Fleksibel', '1–3 hari', '3–7 hari', 'Lebih dari 1 minggu'], true)) $deadline = 'Fleksibel';
        $drive = trim((string)($data['drive'] ?? ''));
        if ($drive !== '' && !filter_var($drive, FILTER_VALIDATE_URL)) json_response(['error' => 'Tautan footage harus berupa URL yang valid.'], 422);
        $code = 'PTG-' . strtoupper(bin2hex(random_bytes(3)));
        $stmt = db()->prepare('INSERT INTO orders (code, user_id, package, price, deadline, drive_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$code, $user['id'], $package, $packages[$package], $deadline, $drive, trim((string)($data['notes'] ?? ''))]);
        json_response(['id' => $code, 'ok' => true], 201);
    }
    if ($method === 'PATCH') {
        require_admin($user);
        $code = trim((string)($data['id'] ?? ''));
        $status = (string)($data['status'] ?? '');
        if (!in_array($status, ['Menunggu konfirmasi', 'Dalam pengerjaan', 'Selesai'], true)) json_response(['error' => 'Status tidak valid.'], 422);
        $stmt = db()->prepare('UPDATE orders SET status = ? WHERE code = ?');
        $stmt->execute([$status, $code]);
        if (!$stmt->rowCount()) json_response(['error' => 'Pesanan tidak ditemukan.'], 404);
        json_response(['ok' => true]);
    }
    json_response(['error' => 'Metode tidak didukung.'], 405);
} catch (Throwable $e) {
    error_log((string)$e);
    $message = str_contains($e->getMessage(), 'PDO SQLite')
        ? 'Database SQLite belum aktif di runtime ini. Aktifkan pdo_sqlite atau gunakan storage persisten.'
        : 'Terjadi masalah pada server. Pastikan database sudah disiapkan.';
    json_response(['error' => $message, 'code' => 'DATABASE_UNAVAILABLE'], 503);
}
