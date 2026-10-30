<?php
declare(strict_types=1);
require_once __DIR__ . '/../app/config.php';

$schema = file_get_contents(__DIR__ . '/schema.sql');
db()->exec($schema);
$stmt = db()->prepare('INSERT OR IGNORE INTO users (username, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?)');
$stmt->execute(['a', password_hash('a', PASSWORD_DEFAULT), 'Alya Demo', 'alya@example.com', 'customer']);
$stmt->execute(['admin', password_hash('admin', PASSWORD_DEFAULT), 'Admin Potong', 'admin@potong.studio', 'admin']);
echo "Database siap. Akun demo: a/a dan admin/admin.\n";
