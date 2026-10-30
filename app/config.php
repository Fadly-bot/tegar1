<?php
declare(strict_types=1);

const APP_ROOT = __DIR__;
const PROJECT_ROOT = __DIR__ . '/..';
const DATABASE_PATH = __DIR__ . '/../database/potong.sqlite';

function db(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;
    if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
        throw new RuntimeException('PDO SQLite belum aktif. Aktifkan ekstensi pdo_sqlite pada PHP.');
    }
    $pdo = new PDO('sqlite:' . DATABASE_PATH, options: [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');
    return $pdo;
}

function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_data(): array
{
    $data = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($data) ? $data : $_POST;
}

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) return null;
    $stmt = db()->prepare('SELECT id, username, name, email, role FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch() ?: null;
}

function require_user(): array
{
    $user = current_user();
    if (!$user) json_response(['error' => 'Silakan masuk terlebih dahulu.'], 401);
    return $user;
}

function require_admin(array $user): void
{
    if ($user['role'] !== 'admin') json_response(['error' => 'Akses hanya untuk admin.'], 403);
}

function safe_user(array $user): array
{
    unset($user['password_hash']);
    return $user;
}
