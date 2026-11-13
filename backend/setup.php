<?php
declare(strict_types=1);
// Optional one-time cPanel installer when Terminal is unavailable.
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
$keyFile = __DIR__ . '/install.key';
$installedFile = __DIR__ . '/storage/installed';
if (!is_file($keyFile) || is_file($installedFile)) {
  http_response_code(404);
  exit('Not found');
}
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') {
  http_response_code(403);
  exit('Open this installer using HTTPS.');
}
ini_set('session.use_strict_mode', '1');
session_name('od_install');
session_set_cookie_params([
  'secure' => true,
  'httponly' => true,
  'samesite' => 'Strict',
  'path' => parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH),
]);
session_start();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
$error = '';
$done = false;
function esc(string $s): string
{
  return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  try {
    $key = trim(file_get_contents($keyFile));
    if (strlen($key) < 32 || !hash_equals($key, trim($_POST['install_key'] ?? ''))) {
      throw new RuntimeException('Mã cài đặt không đúng.');
    }
    if (!hash_equals($_SESSION['csrf'], $_POST['csrf'] ?? '')) {
      throw new RuntimeException('Phiên đã hết hạn. Tải lại trang.');
    }
    $email = trim($_POST['email'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $password = $_POST['password'] ?? '';
    if (
      !filter_var($email, FILTER_VALIDATE_EMAIL) ||
      strlen($email) > 190 ||
      $name === '' ||
      strlen($name) > 120 ||
      strlen($password) < 12 ||
      strlen($password) > 200
    ) {
      throw new RuntimeException('Nhập tên, email hợp lệ và mật khẩu từ 12 đến 200 ký tự.');
    }
    require __DIR__ . '/src/bootstrap.php';
    $lock = fopen(__DIR__ . '/storage/setup.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
      throw new RuntimeException('Một tiến trình cài đặt khác đang chạy.');
    }
    db()->exec(file_get_contents(__DIR__ . '/migrations/001_schema.sql'));
    if (one('SELECT id FROM users LIMIT 1')) {
      throw new RuntimeException(
        'Đã có tài khoản. Cài đặt bị khoá; dùng CLI để quản lý tài khoản.',
      );
    }
    transaction(function () use ($name, $email, $password) {
      query('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)', [
        $name,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        'admin',
      ]);
    });
    if (file_put_contents($installedFile, date(DATE_ATOM), LOCK_EX) === false) {
      throw new RuntimeException('Không ghi được file khoá cài đặt. Xoá install.key thủ công.');
    }
    unlink($keyFile);
    flock($lock, LOCK_UN);
    fclose($lock);
    $done = true;
  } catch (Throwable $e) {
    error_log('OD setup: ' . get_class($e));
    $error =
      $e instanceof RuntimeException && !($e instanceof PDOException)
        ? $e->getMessage()
        : 'Cài đặt thất bại. Kiểm tra config.php, quyền ghi storage và kết nối database trong cPanel.';
  }
}
?><!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>OD. · Cài đặt</title><style>body{font:14px system-ui;background:#f5f7f1;color:#293222;margin:0;padding:32px 18px}main{max-width:440px;background:white;border:1px solid #e0e7d7;border-radius:14px;padding:28px;margin:4vh auto}h1{font-size:25px;font-weight:500}p{line-height:1.8;color:#6f7c63}label{display:block;font-size:12px;margin-top:18px}input,button{font:inherit;box-sizing:border-box;min-height:44px;border:1px solid #dce4d2;border-radius:8px;width:100%;padding:11px;margin-top:8px}button{background:#c5f36a;cursor:pointer;margin-top:24px}.error{background:#fff0ed;padding:12px;border-radius:8px;color:#a14333}a{color:inherit}</style><main><h1>od. / Cài đặt cửa hàng</h1><?php if (
  $done
): ?><p>Đã tạo tài khoản quản trị. Import <strong>demo/demo.sql</strong> bằng phpMyAdmin nếu cần dữ liệu minh hoạ, sau đó mở <a href="../#/admin">trang quản trị</a>.</p><p>Đã khoá trình cài đặt. Có thể xoá setup.php khỏi hosting.</p><?php else: ?><p>Cần cấu hình config.php trước. Chỉ người có mã trong file install.key mới được tạo quản trị viên đầu tiên.</p><?php if (
  $error
): ?><p class="error"><?= esc(
  $error,
) ?></p><?php endif; ?><form method="post"><input type="hidden" name="csrf" value="<?= esc(
  $_SESSION['csrf'],
) ?>"><label>Mã cài đặt riêng<input name="install_key" type="password" required autocomplete="off"></label><label>Họ tên<input name="name" required maxlength="120"></label><label>Email quản trị<input name="email" type="email" required maxlength="190" autocomplete="username"></label><label>Mật khẩu (tối thiểu 12 ký tự)<input name="password" type="password" required minlength="12" maxlength="200" autocomplete="new-password"></label><button>Cài schema & tạo quản trị viên</button></form><?php endif; ?></main></html>
