# Upload lên cPanel

Dùng file [odproduct-cpanel.zip](https://github.com/nathyu-le/odproduct/raw/refs/heads/main/odproduct-cpanel.zip), không dùng ZIP source của GitHub.

Các bước nằm trong [HUONG-DAN.txt](../HUONG-DAN.txt): upload và extract, điền thông tin database trong api/config.php, mở trang install.php một lần để tạo admin. Không cần tự build, import SQL, tạo key hay dùng Terminal trên hosting.

Telegram/routing chỉ cần cấu hình nếu sử dụng. Webhook có nút đăng ký trong admin; cron cần cho gửi/thử lại thông báo và hết hạn giữ hàng. Khi cập nhật bản cũ, giữ config.php, storage và uploads.
