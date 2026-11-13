<?php
if (PHP_SAPI !== 'cli') {
  http_response_code(404);
  exit();
}
require dirname(__DIR__) . '/src/commerce.php';
require dirname(__DIR__) . '/src/telegram.php';
$cmd = $argv[1] ?? 'help';
if ($cmd === 'migrate') {
  db()->exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (filename VARCHAR(190) PRIMARY KEY, applied_at DATETIME NOT NULL) ENGINE=InnoDB',
  );
  $files = glob(dirname(__DIR__) . '/migrations/*.sql');
  sort($files);
  foreach ($files as $file) {
    $name = basename($file);
    if (one('SELECT filename FROM schema_migrations WHERE filename=?', [$name])) {
      continue;
    }
    db()->exec(file_get_contents($file));
    query('INSERT INTO schema_migrations(filename,applied_at) VALUES(?,?)', [$name, now()]);
    echo $name . " applied\n";
  }
  echo "Migrations complete\n";
} elseif ($cmd === 'seed') {
  require __DIR__ . '/seed.php';
} elseif ($cmd === 'user') {
  $email = $argv[2] ?? '';
  $name = $argv[3] ?? 'Quản trị viên';
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    exit("Valid email required\n");
  }
  fwrite(STDOUT, 'Mật khẩu (ít nhất 12 ký tự), nhập qua stdin: ');
  $pass = trim(fgets(STDIN));
  if (strlen($pass) < 12) {
    exit("Too short\n");
  }
  query(
    'INSERT INTO users(name,email,password,role) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE password=VALUES(password),active=1',
    [$name, $email, password_hash($pass, PASSWORD_DEFAULT), 'admin'],
  );
  echo "User saved\n";
} elseif ($cmd === 'cron') {
  $ids = all(
    "SELECT id FROM orders WHERE status='received' AND paid_amount=0 AND payment_status!='review' AND expires_at<?",
    [now()],
  );
  foreach ($ids as $o) {
    try {
      transition(
        (int) $o['id'],
        'cancel',
        ['reason' => 'Hết hạn giữ hàng 24 giờ'],
        'cron',
        'system',
      );
    } catch (Throwable $e) {
      error_log($e->getMessage());
    }
  }
  query('DELETE FROM rate_limits WHERE expires_at<?', [now()]);
  query('DELETE FROM telegram_pending WHERE expires_at<?', [now()]);
  echo json_value(outbox_run()) . "\n";
} elseif ($cmd === 'webhook') {
  $t = telegram_config();
  if (strlen($t['secret']) < 32) {
    exit("Configure a random Telegram secret with at least 32 characters\n");
  }
  echo json_value(
    telegram_request('setWebhook', [
      'url' => config()['url'] . '/api/index.php?route=telegram/webhook',
      'secret_token' => $t['secret'],
      'allowed_updates' => ['message', 'callback_query'],
    ]),
  ) . "\n";
} else {
  echo "Commands: migrate, seed, user <email> [name] (password from stdin), cron, webhook\n";
}
