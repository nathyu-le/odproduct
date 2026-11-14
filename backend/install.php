<?php
// Keep this entry readable by older PHP so an unsupported host gets a useful message.
header("Cache-Control: no-store, no-cache, must-revalidate");
header("X-Robots-Tag: noindex, nofollow");
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
function install_escape($s)
{
    return htmlspecialchars((string) $s, ENT_QUOTES, "UTF-8");
}
$errors = [];
$done = false;
$lock = null;
if (PHP_VERSION_ID < 80200) {
    $errors[] =
        "Hosting đang dùng PHP " .
        PHP_VERSION .
        ". Chọn PHP 8.2 hoặc 8.3 trong cPanel rồi tải lại trang này.";
}
if (PHP_INT_SIZE < 8) {
    $errors[] = "Cần PHP 64-bit để tính tiền chính xác.";
}
foreach (
    ["pdo_mysql", "curl", "mbstring", "openssl", "fileinfo", "session", "zlib", "dom"]
    as $extension
) {
    if (!extension_loaded($extension)) {
        $errors[] =
            "Bật extension " . $extension . " trong phần PHP của cPanel.";
    }
}
if (empty($_SERVER["HTTPS"]) || $_SERVER["HTTPS"] === "off") {
    $errors[] = "Mở website bằng HTTPS trước khi cài đặt.";
}
$storage = __DIR__ . "/storage";
if (!is_dir($storage)) {
    @mkdir($storage, 0755, true);
}
if (!is_writable($storage)) {
    $errors[] = "Thư mục api/storage cần có quyền ghi của tài khoản hosting.";
}
$marker = $storage . "/installed";
if (is_file($marker)) {
    header("Location: ../#/admin");
    exit();
}
$defaultUrl =
    "https://" .
    ($_SERVER["HTTP_HOST"] ?? "localhost") .
    rtrim(
        dirname(dirname($_SERVER["SCRIPT_NAME"] ?? "/api/install.php")),
        "/.",
    );
$existing = null;
$replaceTemplate = false;
if (!$errors) {
    require_once __DIR__ . "/src/updater.php";
    deployment_prepare_access();
    ini_set("session.use_strict_mode", "1");
    session_name("od_install");
    session_set_cookie_params([
        "secure" => true,
        "httponly" => true,
        "samesite" => "Strict",
        "path" => parse_url(
            $_SERVER["REQUEST_URI"] ?? "/api/install.php",
            PHP_URL_PATH,
        ),
    ]);
    session_start();
    if (empty($_SESSION["csrf"])) {
        $_SESSION["csrf"] = bin2hex(random_bytes(32));
    }
    if (is_file(__DIR__ . "/config.php")) {
        try {
            $config = require __DIR__ . "/config.php";
            if (
                is_array($config) &&
                !empty($config["db"]["password"]) &&
                ($config["db"]["name"] ?? "") !== "TEN_DATABASE"
            ) {
                $existing = $config;
            } else {
                $replaceTemplate = true;
            }
        } catch (Throwable $e) {
            $errors[] =
                "api/config.php hiện có lỗi cú pháp. Giữ bản sao và sửa file cấu hình trước khi tiếp tục.";
        }
    }
}
if (!$errors && $existing) {
    try {
        $d = $existing["db"];
        $pdo = new PDO(
            "mysql:host=" .
                $d["host"] .
                ";port=" .
                ($d["port"] ?? 3306) .
                ";dbname=" .
                $d["name"] .
                ";charset=utf8mb4",
            $d["user"],
            $d["password"],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
        );
        if (
            $pdo->query("SHOW TABLES LIKE 'users'")->fetch() &&
            $pdo->query("SELECT id FROM users LIMIT 1")->fetch()
        ) {
            header("Location: ../#/admin");
            exit();
        }
    } catch (Throwable $e) {
        $errors[] =
            "Cấu hình database đã có nhưng chưa kết nối được. Kiểm tra api/config.php; trang cài đặt sẽ không ghi đè cấu hình này.";
    }
}
if (!$errors && ($_SERVER["REQUEST_METHOD"] ?? "GET") === "POST") {
    try {
        if (!hash_equals($_SESSION["csrf"], (string) ($_POST["csrf"] ?? ""))) {
            throw new RuntimeException(
                "Phiên làm việc hết hạn. Tải lại trang.",
            );
        }
        $email = trim($_POST["admin_email"] ?? "");
        $name = trim($_POST["admin_name"] ?? "");
        $password = (string) ($_POST["admin_password"] ?? "");
        if (
            !filter_var($email, FILTER_VALIDATE_EMAIL) ||
            strlen($email) > 190 ||
            $name === "" ||
            mb_strlen($name) > 120 ||
            strlen($password) < 12 ||
            strlen($password) > 200
        ) {
            throw new RuntimeException(
                "Nhập tên, email hợp lệ và mật khẩu quản trị từ 12 ký tự.",
            );
        }
        $url = rtrim(trim($_POST["site_url"] ?? $defaultUrl), "/");
        if (
            !filter_var($url, FILTER_VALIDATE_URL) ||
            parse_url($url, PHP_URL_SCHEME) !== "https"
        ) {
            throw new RuntimeException("URL website phải là HTTPS hợp lệ.");
        }
        if ($existing) {
            if (
                !hash_equals(
                    (string) $existing["db"]["password"],
                    (string) ($_POST["db_password"] ?? ""),
                )
            ) {
                throw new RuntimeException(
                    "Mật khẩu database không khớp cấu hình hiện có.",
                );
            }
            $config = $existing;
        } else {
            $dbName = trim($_POST["db_name"] ?? "");
            $dbUser = trim($_POST["db_user"] ?? "");
            $dbPassword = (string) ($_POST["db_password"] ?? "");
            $owner = get_current_user();
            if (
                !preg_match('/^[A-Za-z0-9_]{1,64}$/', $dbName) ||
                !preg_match('/^[A-Za-z0-9_]{1,64}$/', $dbUser) ||
                strlen($dbPassword) < 8
            ) {
                throw new RuntimeException(
                    "Điền đúng tên database, user và mật khẩu do cPanel cấp.",
                );
            }
            $prefixes = [$owner . "_", substr($owner, 0, 8) . "_"];
            $nameOwned = false;
            $userOwned = false;
            foreach ($prefixes as $prefix) {
                if (strpos($dbName, $prefix) === 0) {
                    $nameOwned = true;
                }
                if (strpos($dbUser, $prefix) === 0) {
                    $userOwned = true;
                }
            }
            if (!$nameOwned || !$userOwned) {
                throw new RuntimeException(
                    "Database và user phải có prefix của tài khoản hosting " .
                        $owner .
                        ". Dùng tên đầy đủ hiển thị trong cPanel.",
                );
            }
            $config = [
                "env" => "production",
                "url" => $url,
                "app_key" => bin2hex(random_bytes(32)),
                "db" => [
                    "host" => "localhost",
                    "port" => 3306,
                    "name" => $dbName,
                    "user" => $dbUser,
                    "password" => $dbPassword,
                ],
                "routing" => [
                    "enabled" => false,
                    "base_url" => "https://router.project-osrm.org",
                    "timeout" => 5,
                ],
                "telegram" => [
                    "token" => "",
                    "secret" => "",
                    "chat_id" => "",
                    "allowed_users" => [],
                ],
            ];
        }
        $d = $config["db"];
        $pdo = new PDO(
            "mysql:host=" .
                $d["host"] .
                ";port=" .
                ($d["port"] ?? 3306) .
                ";dbname=" .
                $d["name"] .
                ";charset=utf8mb4",
            $d["user"],
            $d["password"],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
        );
        $pdo->exec("SET time_zone='+07:00'");
        $lock = fopen($storage . "/install.lock", "c");
        if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
            throw new RuntimeException(
                "Có lượt cài đặt đang xử lý. Thử lại sau.",
            );
        }
        if (
            $pdo->query("SHOW TABLES LIKE 'users'")->fetch() &&
            $pdo->query("SELECT id FROM users LIMIT 1")->fetch()
        ) {
            throw new RuntimeException(
                "Cửa hàng đã có quản trị viên. Hãy đăng nhập, không cài lại.",
            );
        }
        $pdo->exec(file_get_contents(__DIR__ . "/migrations/001_schema.sql"));
        if (!$pdo->query("SELECT id FROM products LIMIT 1")->fetch()) {
            $pdo->exec(file_get_contents(__DIR__ . "/demo/demo.sql"));
        }
        if (!$existing) {
            $file = __DIR__ . "/config.php";
            $target = $replaceTemplate
                ? __DIR__ .
                    "/storage/config-" .
                    bin2hex(random_bytes(8)) .
                    ".php"
                : $file;
            $handle = fopen($target, "x");
            if (!$handle) {
                throw new RuntimeException(
                    "Không thể tạo config.php hoặc file đã được tạo bởi tiến trình khác.",
                );
            }
            $text = "<?php\nreturn " . var_export($config, true) . ";\n";
            if (fwrite($handle, $text) !== strlen($text)) {
                fclose($handle);
                throw new RuntimeException("Không lưu được cấu hình database.");
            }
            fclose($handle);
            chmod($target, 0600);
            if ($replaceTemplate && !rename($target, $file)) {
                throw new RuntimeException("Không thay được cấu hình mẫu.");
            }
        }
        $pdo->beginTransaction();
        $s = $pdo->prepare(
            "INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
        );
        $s->execute([
            $name,
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            "admin",
        ]);
        $pdo->commit();
        file_put_contents($marker, date(DATE_ATOM), LOCK_EX);
        require_once __DIR__ . "/src/updater.php";
        deployment_prepare_access();
        $done = true;
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("OD install: " . get_class($e));
        $errors[] =
            $e instanceof PDOException
                ? "Chưa kết nối/ghi được database. Kiểm tra user đã được cấp ALL PRIVILEGES cho đúng database."
                : $e->getMessage();
    } finally {
        if (is_resource($lock)) {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
?><!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>OD. — Cài cửa hàng</title><style>body{font:14px system-ui;background:#f5f7f1;color:#293222;margin:0;padding:28px 18px}main{max-width:620px;background:#fff;border:1px solid #e0e7d7;border-radius:14px;padding:30px;margin:3vh auto}h1{font-size:27px;font-weight:500;margin-bottom:12px}h2{font-size:16px;font-weight:500;margin:25px 0 12px;padding-top:20px;border-top:1px solid #e6ebdf}p{line-height:1.8;color:#76816b;font-size:12px}label{display:block;font-size:12px;margin-top:16px}input,button{font:inherit;box-sizing:border-box;min-height:46px;border:1px solid #dce4d2;border-radius:8px;width:100%;padding:12px;margin-top:8px}button{background:#c5f36a;cursor:pointer;margin-top:24px}.error{background:#fff0ed;padding:13px;border-radius:8px;color:#a14333}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}a{color:inherit}.brand{font-size:45px;letter-spacing:-4px;margin-bottom:20px}.brand span{color:#9dbe65}@media(max-width:500px){main{padding:24px}.grid{display:block}}</style></head><body><main><div class="brand">od<span>.</span></div><?php if (
    $done
): ?><h1>Cửa hàng đã sẵn sàng.</h1><p>Đã tạo bảng dữ liệu, sản phẩm mẫu và quản trị viên. Trang cài đặt đã tự khoá.</p><p><a href="../#/admin">Đăng nhập quản trị →</a> &nbsp; <a href="../">Xem cửa hàng →</a></p><?php else: ?><h1>Tạo cửa hàng của bạn.</h1><p>Điền thông tin database lấy trong cPanel. Website tự tạo bảng, dữ liệu mẫu và tài khoản quản trị.</p><?php
foreach ($errors as $error): ?><p class="error"><?= install_escape(
    $error,
) ?></p><?php endforeach;
if (
    PHP_VERSION_ID >= 80200 &&
    !is_file($marker) &&
    !empty($_SESSION["csrf"])
): ?><form method="post"><input type="hidden" name="csrf" value="<?= install_escape(
    $_SESSION["csrf"],
) ?>"><label>URL website<input name="site_url" type="url" required value="<?= install_escape(
    $existing["url"] ?? $defaultUrl,
) ?>"></label><h2>01 / Database MySQL</h2><?php if (
    !$existing
): ?><div class="grid"><label>Tên database đầy đủ<input name="db_name" required placeholder="<?= install_escape(
    get_current_user(),
) ?>_shop" autocomplete="off"></label><label>User database đầy đủ<input name="db_user" required placeholder="<?= install_escape(
    get_current_user(),
) ?>_shop" autocomplete="off"></label></div><?php else: ?><p>Giữ cấu hình database đang có. Nhập mật khẩu database để xác minh chủ cửa hàng.</p><?php endif; ?><label>Mật khẩu database<input name="db_password" type="password" required autocomplete="off"></label><h2>02 / Quản trị viên</h2><div class="grid"><label>Họ tên<input name="admin_name" required maxlength="120" autocomplete="name"></label><label>Email đăng nhập<input name="admin_email" type="email" required maxlength="190" autocomplete="username"></label></div><label>Mật khẩu quản trị (tối thiểu 12 ký tự)<input name="admin_password" type="password" required minlength="12" maxlength="200" autocomplete="new-password"></label><button>Cài cửa hàng</button><p>Chỉ thực hiện một lần. Thông tin ngân hàng/sản phẩm mẫu có nhãn minh hoạ; cấu hình cửa hàng thật trong admin.</p></form><?php endif;
endif; ?></main></body></html>
