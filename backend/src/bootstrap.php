<?php
declare(strict_types=1);
date_default_timezone_set('Asia/Ho_Chi_Minh');
final class HttpError extends RuntimeException
{
  public function __construct(public int $status, string $message)
  {
    parent::__construct($message);
  }
}
function fail(int $status, string $message): never
{
  throw new HttpError($status, $message);
}
function config(): array
{
  static $c;
  if (!$c) {
    $path = getenv('OD_CONFIG') ?: dirname(__DIR__) . '/config.php';
    if (!is_file($path)) {
      fail(503, 'Chưa cấu hình máy chủ. Xem hướng dẫn cài đặt.');
    }
    $c = require $path;
    if (!preg_match('/^[a-f0-9]{64}$/i', $c['app_key'] ?? '')) {
      fail(503, 'Cần cấu hình app_key ngẫu nhiên 64 ký tự hex.');
    }
  }
  return $c;
}
function db(): PDO
{
  static $pdo;
  if (!$pdo) {
    $d = config()['db'];
    $pdo = new PDO(
      "mysql:host={$d['host']};port={$d['port']};dbname={$d['name']};charset=utf8mb4",
      $d['user'],
      $d['password'],
      [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
      ],
    );
    $pdo->exec("SET time_zone='+07:00'");
  }
  return $pdo;
}
function query(string $sql, array $args = []): PDOStatement
{
  $s = db()->prepare($sql);
  $s->execute($args);
  return $s;
}
function one(string $sql, array $args = []): ?array
{
  return query($sql, $args)->fetch() ?: null;
}
function all(string $sql, array $args = []): array
{
  return query($sql, $args)->fetchAll();
}
function now(): string
{
  return date('Y-m-d H:i:s');
}
function json_value(mixed $value): string
{
  return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
}
function setting(string $key): array
{
  $r = one('SELECT value FROM settings WHERE `key`=?', [$key]);
  if ($r) {
    return json_decode($r['value'], true, 512, JSON_THROW_ON_ERROR);
  }
  if (in_array($key, ['store', 'shipping', 'payment'], true)) {
    $defaults = json_decode(
      file_get_contents(dirname(__DIR__) . '/demo/catalog.json'),
      true,
      512,
      JSON_THROW_ON_ERROR,
    );
    return $defaults['settings'][$key];
  }
  return [];
}
function audit(
  ?int $order,
  string $actor,
  string $channel,
  string $action,
  array $detail = [],
): void {
  query(
    'INSERT INTO audit_log(order_id,actor,channel,action,detail,created_at) VALUES(?,?,?,?,?,?)',
    [$order, $actor, $channel, $action, json_value($detail), now()],
  );
}
function transaction(callable $f): mixed
{
  db()->beginTransaction();
  try {
    $r = $f();
    db()->commit();
    return $r;
  } catch (Throwable $e) {
    if (db()->inTransaction()) {
      db()->rollBack();
    }
    throw $e;
  }
}
function integer(mixed $v, int $min = 0, int $max = 1000000000): int
{
  if (filter_var($v, FILTER_VALIDATE_INT) === false || $v < $min || $v > $max) {
    fail(422, 'Giá trị số không hợp lệ.');
  }
  return (int) $v;
}
function clean(mixed $v, int $max = 200): string
{
  if (!is_string($v)) {
    fail(422, 'Dữ liệu không hợp lệ.');
  }
  $s = trim($v);
  if (mb_strlen($s) > $max) {
    fail(422, 'Nội dung quá dài.');
  }
  return $s;
}
function required(array $b, string $key, int $max = 200): string
{
  $s = clean($b[$key] ?? '', $max);
  if ($s === '') {
    fail(422, 'Vui lòng điền đầy đủ thông tin.');
  }
  return $s;
}
function phone(string $p): string
{
  $p = preg_replace('/[\s.()-]/', '', $p);
  if (str_starts_with($p, '+84')) {
    $p = '0' . substr($p, 3);
  }
  if (!preg_match('/^0[35789][0-9]{8}$/', $p)) {
    fail(422, 'Số điện thoại Việt Nam không hợp lệ.');
  }
  return $p;
}
function encrypt_token(string $token): string
{
  $iv = random_bytes(12);
  $tag = '';
  $out = openssl_encrypt(
    $token,
    'aes-256-gcm',
    hex2bin(config()['app_key']),
    OPENSSL_RAW_DATA,
    $iv,
    $tag,
  );
  if ($out === false) {
    throw new RuntimeException('Encryption failed');
  }
  return base64_encode($iv . $tag . $out);
}
function decrypt_token(string $value): string
{
  $s = base64_decode($value, true);
  if ($s === false || strlen($s) < 29) {
    throw new RuntimeException('Invalid encrypted data');
  }
  $plain = openssl_decrypt(
    substr($s, 28),
    'aes-256-gcm',
    hex2bin(config()['app_key']),
    OPENSSL_RAW_DATA,
    substr($s, 0, 12),
    substr($s, 12, 16),
  );
  if ($plain === false) {
    throw new RuntimeException('Cannot decrypt with this app_key');
  }
  return $plain;
}
function rate_limit(string $name, int $limit, int $seconds): void
{
  transaction(function () use ($name, $limit, $seconds) {
    $key = hash('sha256', $name . '|' . ($_SERVER['REMOTE_ADDR'] ?? 'cli'));
    query('INSERT IGNORE INTO rate_limits(bucket,hits,expires_at) VALUES(?,0,?)', [
      $key,
      date('Y-m-d H:i:s', time() + $seconds),
    ]);
    $r = one('SELECT * FROM rate_limits WHERE bucket=? FOR UPDATE', [$key]);
    if ($r['expires_at'] < now()) {
      query('UPDATE rate_limits SET hits=1,expires_at=? WHERE bucket=?', [
        date('Y-m-d H:i:s', time() + $seconds),
        $key,
      ]);
    } else {
      if ((int) $r['hits'] >= $limit) {
        fail(429, 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.');
      }
      query('UPDATE rate_limits SET hits=hits+1 WHERE bucket=?', [$key]);
    }
  });
}
function session_start_safe(): void
{
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }
  session_name('od_session');
  session_set_cookie_params([
    'lifetime' => 0,
    'path' => parse_url(config()['url'], PHP_URL_PATH) ?: '/',
    'secure' => config()['env'] !== 'development',
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
  ini_set('session.use_strict_mode', '1');
  ini_set('session.gc_maxlifetime', '28800');
  session_start();
  $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}
function user(bool $admin = false): array
{
  session_start_safe();
  if (empty($_SESSION['uid']) || ($_SESSION['last'] ?? 0) < time() - 28800) {
    fail(401, 'Vui lòng đăng nhập.');
  }
  $u = one('SELECT id,name,email,role FROM users WHERE id=? AND active=1', [$_SESSION['uid']]);
  if (!$u) {
    fail(401, 'Phiên đăng nhập không hợp lệ.');
  }
  if ($admin && $u['role'] !== 'admin') {
    fail(403, 'Chỉ quản trị viên được thực hiện thao tác này.');
  }
  $_SESSION['last'] = time();
  return $u;
}
function csrf(): void
{
  session_start_safe();
  $v = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  if (!$v || !hash_equals($_SESSION['csrf'], $v)) {
    fail(419, 'Phiên làm việc đã hết hạn. Vui lòng tải lại trang.');
  }
}
