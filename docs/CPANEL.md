# cPanel

Website đang có dữ liệu: dùng [odproduct-update.zip](https://github.com/nathyu-le/odproduct/raw/refs/heads/main/odproduct-update.zip). Extract vào thư mục website. Không import database, không ghi đè config, không chạy install lại. PHP 8.2+.

Lần cài mới mới dùng odproduct-cpanel.zip. Các bước trong [HUONG-DAN.txt](../HUONG-DAN.txt).

Bản update giữ cấu hình PHP do cPanel tạo trong .htaccess. Website chỉ bổ sung domain ảnh bản đồ vào CSP nếu cần. Cron cũ api/bin/cron.php tiếp tục xử lý thông báo/giữ hàng và kiểm tra phiên bản. Bản sao file trước cập nhật nằm trong api/storage/updates/backups, cần được giữ riêng tư.
