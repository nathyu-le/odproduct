# cPanel

Dùng [muaplus-cpanel-v3.zip](https://github.com/nathyu-le/odproduct/raw/refs/heads/main/muaplus-cpanel-v3.zip) cho cả cài mới và cập nhật. [Hướng dẫn A–Z](../HUONG-DAN.txt) và [kết quả kiểm tra](../KIEM-TRA.txt).

PHP 8.2+ 64-bit, MySQL/MariaDB, HTTPS. Upload và Extract trực tiếp vào thư mục tên miền đang chứa index.html. Gói không có cấu hình thật, dữ liệu storage, ảnh upload hoặc .htaccess. Không xoá dữ liệu cũ và không chạy cài lại website đang hoạt động.

Cài mới mở api/install.php, điền MySQL và tạo admin trong trình duyệt. PHP bổ sung quy tắc bảo vệ thư mục, cache HTML vào .htaccess, giữ nguyên PHP handler cPanel. ZIP mang thời gian build thật và UTC timestamp.

Cron api/bin/cron.php dùng cùng PHP với website, xử lý hàng đợi Telegram/giữ hàng và kiểm tra build. Backup trong api/storage/updates/backups được chặn truy cập HTTP. Không đưa config/token/password lên Git.
