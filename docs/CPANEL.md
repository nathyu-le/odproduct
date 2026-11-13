# Cài trên cPanel

## 1. Kiểm tra hosting

Chưa có quyền truy cập hosting hoặc phiên bản chính xác từ chủ hosting. Source hướng tới PHP **8.2+ 64-bit**, MySQL **8.0+** / MariaDB **10.6+**, Apache 2.4 hoặc LiteSpeed tương thích `.htaccess`.

Trong MultiPHP Manager/Select PHP Version chọn PHP phù hợp cho domain. Bật `pdo_mysql`, `curl`, `mbstring`, `openssl`, `fileinfo`, `session`. Upload tối đa ít nhất 5MB; `post_max_size` phải lớn hơn `upload_max_filesize`, khuyến nghị lần lượt 10MB và 8MB. PHP-FPM nên bật nếu hosting hỗ trợ.

Trong Terminal chạy preflight bằng đúng PHP mà domain sử dụng:

```bash
/opt/cpanel/ea-php82/root/usr/bin/php /home/CPUSER/public_html/api/bin/preflight.php
```

Đường dẫn PHP phụ thuộc nhà cung cấp (CloudLinux có thể là `/opt/alt/php82/usr/bin/php`). Hỏi nhà cung cấp nếu không thấy đúng đường dẫn. Công cụ in phiên bản PHP, extension, quyền ghi storage và phiên bản DB sau cấu hình; đây không phải kết quả kiểm thử ứng dụng.

Nếu không có Terminal, kiểm tra các mục tương ứng trong cPanel, dùng phpMyAdmin để xem phiên bản DB và cài theo mục 5B.

## 2. Build và upload

Trên máy phát triển có Node.js 22+:

```bash
npm ci
npm run build
```

Nội dung `build/cpanel/` có HTML/CSS/JS, ảnh/font, `api/`, `uploads/` và `.htaccess`. Upload cả file ẩn. **Không upload node_modules, work/, .git hoặc nguyên repo vào public_html.**

- Domain chính: chép nội dung vào `/home/CPUSER/public_html/`.
- Thư mục con: chép vào `/home/CPUSER/public_html/shop/`.
- Source dùng HashRouter và đường dẫn asset tương đối; không cần rewrite tất cả request về index.html.
- Nếu domain đang có website, chọn thư mục riêng; không ghi đè file website cũ.

`.htaccess` bảo vệ config, install.key, src/bin/migrations/storage/demo; chặn thực thi script trong uploads, tắt listing và đặt header. Hosting cần cho phép các directive tương ứng. Nếu HTTP 500 sau upload, kiểm tra Apache Error Log với nhà cung cấp trước khi bỏ quy tắc bảo vệ. Thư mục `api/storage` và `uploads` phải ghi được bởi tài khoản PHP; thường 755 cho thư mục, 644 cho file, không dùng 777.

## 3. HTTPS

Bật AutoSSL cho domain và bật **Force HTTPS Redirect** trong cPanel. Cài đặt và webhook đều dùng URL HTTPS chính thức. Môi trường production dùng cookie `Secure`, `HttpOnly`, `SameSite=Lax`; HTTP sẽ không giữ phiên đăng nhập. Geolocation cũng cần HTTPS.

Không cấu hình `env=development` trên hosting để chữa lỗi cookie. Nếu HTTPS kết thúc ở reverse proxy, nhờ nhà cung cấp cấu hình biến HTTPS đúng cho PHP, không tự tin mọi header forwarded từ khách.

## 4. Database và config

Tạo database và user riêng trong MySQL Database Wizard, gán quyền cho đúng database. Dùng tên có prefix cPanel thực tế.

Sao chép `api/config.example.php` thành `api/config.php`, điền:

```php
return [
  'env' => 'production',
  'url' => 'https://your-domain.com/shop',
  'app_key' => '64_KY_TU_HEX_NGAU_NHIEN_THAY_VAO_DAY',
  'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'cpuser_store',
    'user' => 'cpuser_storeuser',
    'password' => 'MAT_KHAU_DB_RIENG',
  ],
  'routing' => [
    'enabled' => false,
    'base_url' => 'https://router.project-osrm.org',
    'timeout' => 5,
  ],
  'telegram' => [
    'token' => '',
    'secret' => '',
    'chat_id' => '',
    'allowed_users' => [],
  ],
];
```

Tạo key bằng lệnh chạy trên máy riêng/cPanel Terminal:

```bash
php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'
```

Hoặc với Node.js cục bộ:

```bash
node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))'
```

Key thật là chuỗi hex 64 ký tự, không phải placeholder. Không gửi key, bot token hay mật khẩu DB vào chat, Git hoặc frontend. Giữ bản backup key an toàn: đổi/mất key sẽ không giải mã được token theo dõi đã lưu và cấu hình Telegram trong DB. Sau upload cấu hình đặt quyền 600 nếu PHP chạy dưới chủ tài khoản và hosting hỗ trợ.

`OD_CONFIG` có thể trỏ tới file cấu hình ngoài public_html nếu cấu hình PHP-FPM/hosting cho phép. Nếu dùng, cần áp dụng cho cả PHP web và lệnh cron.

## 5A. Cài bằng Terminal

Các lệnh dưới dùng tên PHP mẫu `php`; thay bằng đường dẫn PHP đúng ở mục 1. Đường dẫn ví dụ cài domain chính:

```bash
cd /home/CPUSER/public_html
php api/bin/preflight.php
php api/bin/console.php migrate
php api/bin/console.php seed
php api/bin/console.php user admin@your-domain.com 'Chủ cửa hàng'
```

Lệnh `user` đọc mật khẩu từ stdin; nhập mật khẩu ít nhất 12 ký tự. Chạy trong Terminal riêng tin cậy; input có thể hiện ký tự theo cấu hình terminal. Không truyền mật khẩu trong đối số lệnh. `user` trên email đã có sẽ thay mật khẩu và mở lại tài khoản; chỉ dùng khi có chủ đích.

`seed` chỉ thêm demo khi chưa có sản phẩm. Không chạy lại demo SQL trên DB có dữ liệu. Không có doanh thu, khách hàng hay đơn hàng giả được tạo.

## 5B. Cài khi không có Terminal

1. Cấu hình `api/config.php` như mục 4.
2. Tạo file `api/install.key` qua File Manager, nội dung là một chuỗi bí mật ngẫu nhiên ít nhất 32 ký tự. Giữ nguyên `.htaccess` để file này không được tải công khai.
3. Mở `https://your-domain.com/shop/api/setup.php` bằng HTTPS, nhập mã trên, tên, email và mật khẩu admin.
4. Trình cài tạo schema và admin đầu tiên, xoá `install.key`, ghi file khoá trong storage. Nếu đã có user, trình cài từ chối.
5. Dùng phpMyAdmin chọn đúng DB rồi import `api/demo/demo.sql` **một lần** để có sản phẩm demo. Có thể tải SQL từ gói source trên máy; không cần mở URL thư mục demo.
6. Xoá `api/setup.php` sau cài đặt nếu muốn. Không để lại install.key.

Nếu tự import `api/migrations/001_schema.sql` trước, setup vẫn tạo admin vào schema hiện có. Không có màn hình web nhận mật khẩu DB; cấu hình luôn qua file phía server.

## 6. Cấu hình trong admin

Mở `/#/admin` hoặc `/shop/#/admin`, đăng nhập tài khoản vừa tạo.

- **Cửa hàng:** tên, địa chỉ, liên hệ, nội dung banner/hero.
- **Vận chuyển:** tọa độ kho, phí cơ bản, km bao gồm, phí mỗi km, giới hạn phạm vi, điều kiện miễn ship, cách/bước làm tròn.
- **Thanh toán:** bật COD/chuyển khoản; điền BIN ngân hàng, tài khoản, chủ tài khoản, hướng dẫn và mẫu có `{code}`. Ban đầu là DEMO. Chỉ tắt nhãn demo khi đã thay bằng thông tin thật.
- **Telegram:** nhập bot token/secret, chat ID và Telegram User ID được phép. Token/secret được mã hoá bằng app_key trong DB và không được API đọc ngược về trình duyệt.
- **Nhân viên:** tạo tài khoản riêng. Nhân viên xử lý trạng thái/ghi chú/huỷ trước giao; admin mới xác nhận thu tiền, hoàn/trả, báo phí, nhập chi phí và xem báo cáo.

## 7. Routing và bản đồ

Frontend dùng OSM tile để khách chọn vị trí. Nếu tile không tải, vẫn có thể nhập tọa độ hoặc dùng geolocation. Không có API geocoding tự chuyển địa chỉ thành tọa độ.

Backend gọi endpoint OSRM-compatible:

```text
GET {base_url}/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=false
```

Đọc `routes[0].distance` theo mét. Muốn tính tự động, cấu hình endpoint HTTPS thực tế rồi đặt `routing.enabled=true` trong config. Cần outbound HTTPS/cURL từ hosting. Server công khai `router.project-osrm.org` chỉ dành đánh giá, không có cam kết chất lượng cho shop production; dùng dịch vụ có hợp đồng hoặc OSRM tự quản. Khi thay nhà cung cấp khác định dạng, cần sửa adapter `distance()`.

Bản đồ hiển thị điểm; phí được tính từ routing xe chạy, không dùng đường chim bay. Không có routing/tọa độ hoặc request lỗi: phí/tổng để trống và hiện chờ báo phí. Admin báo mức phí, khách mở link đơn chấp nhận tổng mới. Chưa chấp nhận thì không xác nhận thanh toán hay đưa đơn sang xử lý.

## 8. Telegram webhook và cron

Tạo bot với BotFather, thêm bot vào chat được phép, bảo đảm bot gửi tin được. Telegram User ID là số, không phải `@username`; với group/supergroup Chat ID thường là số âm. Secret chỉ chứa a-z/A-Z, số, `_` hoặc `-`, từ 32 đến 256 ký tự.

Sau khi lưu cấu hình, đăng ký webhook:

```bash
php /home/CPUSER/public_html/api/bin/console.php webhook
```

Nếu không có Terminal, nhờ nhà cung cấp chạy lệnh hoặc tạo cron **một lần**, xem log kết quả rồi gỡ cron đăng ký webhook đó. URL webhook do admin hiển thị đúng theo config.url. Không đặt bot token trong URL lệnh cron hoặc file JavaScript.

Tạo cron chạy mỗi phút trong cPanel:

```cron
* * * * * /opt/cpanel/ea-php82/root/usr/bin/php /home/CPUSER/public_html/api/bin/console.php cron >> /home/CPUSER/od-cron.log 2>&1
```

Cài thư mục con thì sửa thành `/public_html/shop/api/...`. Cron cần thiết cho gửi thông báo, thử lại và hết hạn giữ hàng; không có tiến trình Node chạy liên tục.

Outbox gửi tối đa 10 việc mỗi lượt, timeout 8 giây/request, retry tăng dần, tối đa 8 lần rồi báo failed trong admin. Trạng thái processing có lease để phục hồi lượt cron bị ngắt. Sau sửa cấu hình, nút thử lại đưa failed về pending. Việc gửi có thể lặp khi mạng timeout sau Telegram đã nhận; thao tác đơn vẫn được kiểm tra và chống cập nhật lặp. DB là nguồn trạng thái chính. Admin/trang khách tự tải lại dữ liệu mỗi 15 giây; Telegram thông báo theo lượt cron, thường trong phút kế tiếp.

Nút nhận tiền cần xác nhận lại. Nút huỷ chọn lý do hoặc nhập `/cancel <nonce> <lý do>`; nonce hết hạn sau 5 phút. Huỷ không tự hoàn tiền. Chỉ chat và user trong whitelist được thao tác.

## 9. Nâng cấp và backup

Backup DB, config.php, uploads và app_key trước cập nhật. Build package là output sinh lại; đừng dùng build/cpanel làm thư mục production đang chạy. Khi upload bản mới, giữ nguyên config.php, uploads và dữ liệu storage trên hosting. Chạy migration mới bằng CLI nếu release có thêm migration; không import lại demo.

Trước nhận đơn thật, tự kiểm thử theo [MANUAL-QA.md](MANUAL-QA.md). Bản source này chưa qua kiểm thử runtime/hạ tầng thực tế theo yêu cầu bàn giao source trước.
