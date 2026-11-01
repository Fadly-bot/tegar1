<?php
declare(strict_types=1);
require __DIR__ . '/app/config.php';

// Render the public homepage at the project root. Keep the login form inside
// this page; it is revealed by the Masuk button in the frontend.
$base = __DIR__ . '/app';
?><!doctype html>
<html lang="id">
<?php require $base . '/includes/head.php'; ?>
<link rel="stylesheet" href="/assets/css/app.css">
<body>
<?php require $base . '/views/partials/header.php'; ?>
<?php require $base . '/views/pages/home.php'; ?>
<?php require $base . '/views/pages/auth.php'; ?>
<?php require $base . '/views/pages/dashboard.php'; ?>
<?php require $base . '/views/partials/footer.php'; ?>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script src="/assets/js/app.js" defer></script>
</body>
</html>
