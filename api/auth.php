<?php
declare(strict_types=1);
require_once __DIR__ . '/../app/config.php';

try {
    $action = $_GET['action'] ?? '';
    if ($action === 'me') {
        $user = current_user();
        json_response(['user' => $user ? safe_user($user) : null]);
    }
    $data = request_data();
    if ($action === 'login') {
        $username = trim((string)($data['username'] ?? ''));
        $password = (string)($data['password'] ?? '');
        $stmt = db()->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) json_response(['error' => 'Username atau password tidak cocok.'], 422);
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$user['id'];
        json_response(['user' => safe_user($user)]);
    }
    if ($action === 'register') {
        $name = trim((string)($data['name'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $username = trim((string)($data['username'] ?? ''));
        $password = (string)($data['password'] ?? '');
        if ($name === '' || $username === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 1) json_response(['error' => 'Lengkapi nama, email valid, username, dan password.'], 422);
        try {
            $stmt = db()->prepare("INSERT INTO users (username, password_hash, name, email, role) VALUES (?, ?, ?, ?, 'customer')");
            $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $name, $email]);
        } catch (PDOException $e) {
            if (str_contains(strtolower($e->getMessage()), 'unique')) json_response(['error' => 'Username sudah dipakai. Coba username lain.'], 422);
            throw $e;
        }
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)db()->lastInsertId();
        json_response(['user' => current_user()], 201);
    }
    if ($action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        json_response(['ok' => true]);
    }
    json_response(['error' => 'Aksi tidak dikenal.'], 404);
} catch (Throwable $e) {
    error_log((string)$e);
    json_response(['error' => 'Terjadi masalah pada server. Pastikan database sudah disiapkan.'], 500);
}
