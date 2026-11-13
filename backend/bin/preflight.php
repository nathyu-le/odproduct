<?php
// CLI only: run with the same PHP version used by the domain in cPanel.
if (PHP_SAPI !== 'cli') {
  http_response_code(404);
  exit();
}
$checks = [
  'PHP >= 8.2' => version_compare(PHP_VERSION, '8.2', '>='),
  '64-bit integers' => PHP_INT_SIZE === 8,
];
foreach (['pdo_mysql', 'curl', 'mbstring', 'openssl', 'fileinfo', 'session'] as $e) {
  $checks['Extension ' . $e] = extension_loaded($e);
}
$checks['Storage writable'] = is_writable(dirname(__DIR__) . '/storage');
echo 'PHP ' . PHP_VERSION . "\n";
foreach ($checks as $name => $ok) {
  echo ($ok ? '[OK] ' : '[FAIL] ') . $name . "\n";
}
if (is_file(dirname(__DIR__) . '/config.php') || getenv('OD_CONFIG')) {
  try {
    require dirname(__DIR__) . '/src/bootstrap.php';
    echo 'Database: ' . db()->getAttribute(PDO::ATTR_SERVER_VERSION) . "\n";
    echo 'URL: ' . config()['url'] . "\n";
  } catch (Throwable $e) {
    $checks['Database'] = false;
    echo '[FAIL] Database/config: ' . $e->getMessage() . "\n";
  }
} else {
  echo "[TODO] Copy config.example.php to config.php and set credentials\n";
}
exit(in_array(false, $checks, true) ? 1 : 0);
