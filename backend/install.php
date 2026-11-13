<?php
declare(strict_types=1);
// First installation through the browser; disabled after the first admin exists.
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
$marker=__DIR__.'/storage/installed';
if(is_file($marker)){http_response_code(404);exit('Not found');}
if(empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off'){http_response_code(403);exit('Mở trang này bằng HTTPS.');}
ini_set('session.use_strict_mode','1');
session_name('od_install');
session_set_cookie_params(['secure'=>true,'httponly'=>true,'samesite'=>'Strict','path'=>parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH)]);
session_start();
$_SESSION['csrf']??=bin2hex(random_bytes(32));
require __DIR__.'/src/bootstrap.php';
function esc(string $s): string {return htmlspecialchars($s,ENT_QUOTES,'UTF-8');}
$error='';$done=false;$ready=false;$lock=null;
try {
  if(!is_file(__DIR__.'/config.php'))throw new RuntimeException('Điền thông tin database trong api/config.php trước.');
  $c=config();
  if(empty($c['db']['name'])||$c['db']['name']==='TEN_DATABASE'||empty($c['db']['password']))throw new RuntimeException('Điền tên database, user và mật khẩu trong api/config.php trước.');
  if(one("SHOW TABLES LIKE 'users'")&&one('SELECT id FROM users LIMIT 1')){http_response_code(404);exit('Đã cài đặt.');}
  $ready=true;
  if($_SERVER['REQUEST_METHOD']==='POST'){
    if(!hash_equals($_SESSION['csrf'],$_POST['csrf']??''))throw new RuntimeException('Phiên hết hạn. Tải lại trang.');
    // Only someone who knows this shop's configured DB password may create the first admin.
    if(!hash_equals((string)$c['db']['password'],(string)($_POST['database_password']??'')))throw new RuntimeException('Mật khẩu database không đúng.');
    $email=trim($_POST['email']??'');$name=trim($_POST['name']??'');$password=$_POST['password']??'';
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($email)>190||$name===''||mb_strlen($name)>120||strlen($password)<12||strlen($password)>200)throw new RuntimeException('Nhập tên, email hợp lệ và mật khẩu quản trị từ 12 đến 200 ký tự.');
    $lock=fopen(__DIR__.'/storage/install.lock','c');
    if(!$lock||!flock($lock,LOCK_EX|LOCK_NB))throw new RuntimeException('Cài đặt đang được xử lý. Thử lại sau.');
    if(one("SHOW TABLES LIKE 'users'")&&one('SELECT id FROM users LIMIT 1'))throw new RuntimeException('Đã có tài khoản quản trị.');
    db()->exec(file_get_contents(__DIR__.'/migrations/001_schema.sql'));
    if(!one('SELECT id FROM products LIMIT 1'))db()->exec(file_get_contents(__DIR__.'/demo/demo.sql'));
    transaction(function()use($email,$name,$password){query('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)',[$name,$email,password_hash($password,PASSWORD_DEFAULT),'admin']);});
    file_put_contents($marker,date(DATE_ATOM),LOCK_EX);
    $done=true;
  }
}catch(Throwable $e){
  error_log('OD installation: '.get_class($e));
  $error=$e instanceof RuntimeException&&!($e instanceof PDOException)?$e->getMessage():'Chưa kết nối được database. Kiểm tra api/config.php và quyền database trong cPanel.';
}finally{if(is_resource($lock)){flock($lock,LOCK_UN);fclose($lock);}}
?><!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>OD. — Cài cửa hàng</title><style>body{font:14px system-ui;background:#f5f7f1;color:#293222;margin:0;padding:28px 18px}main{max-width:440px;background:white;border:1px solid #e0e7d7;border-radius:14px;padding:28px;margin:4vh auto}h1{font-size:25px;font-weight:500}p{line-height:1.8;color:#6f7c63}label{display:block;font-size:12px;margin-top:18px}input,button{font:inherit;box-sizing:border-box;min-height:44px;border:1px solid #dce4d2;border-radius:8px;width:100%;padding:11px;margin-top:8px}button{background:#c5f36a;cursor:pointer;margin-top:24px}.error{background:#fff0ed;padding:12px;border-radius:8px;color:#a14333}a{color:inherit}</style></head><body><main><h1>od. / Cài cửa hàng</h1><?php if($done):?><p>Đã tạo database, sản phẩm mẫu và tài khoản quản trị. Trang cài đặt đã được khoá.</p><p><a href="../#/admin">Mở trang quản trị →</a></p><?php else:?><p>Tạo quản trị viên đầu tiên. Chỉ thực hiện một lần sau khi upload.</p><?php if($error):?><p class="error"><?=esc($error)?></p><?php endif;?><?php if($ready):?><form method="post"><input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>"><label>Mật khẩu database (xác minh chủ website)<input name="database_password" type="password" required autocomplete="off"></label><label>Họ tên quản trị viên<input name="name" required maxlength="120" autocomplete="name"></label><label>Email đăng nhập<input name="email" type="email" required maxlength="190" autocomplete="username"></label><label>Mật khẩu quản trị (ít nhất 12 ký tự)<input name="password" type="password" required minlength="12" maxlength="200" autocomplete="new-password"></label><button>Tạo cửa hàng</button></form><?php endif;?><?php endif;?></main></body></html>
