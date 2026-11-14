# MUAPLUS / OD. Store

[**Tải muaplus-cpanel-v3.zip — bản đầy đủ đã build để upload cPanel**](https://github.com/nathyu-le/odproduct/raw/refs/heads/main/muaplus-cpanel-v3.zip)

Upload ZIP vào đúng thư mục tên miền, cạnh `index.html`, rồi Extract và ghi đè. Website đang có dữ liệu tiếp tục dùng cấu hình và tài khoản cũ; không chạy cài lại. Gói không chứa cấu hình thật, dữ liệu đơn, ảnh upload hoặc `.htaccess` của hosting.

Cài mới: chọn PHP 8.2+, tạo MySQL database/user trong cPanel, upload ZIP rồi mở `/api/install.php`. Form tự tạo cấu hình, bảng, dữ liệu mẫu và quản trị viên. Không cần import SQL, Node.js, Docker hay Terminal trên hosting. Hỗ trợ domain chính và thư mục con.

- [Hướng dẫn A–Z](HUONG-DAN.txt)
- [Kết quả kiểm tra thực tế](KIEM-TRA.txt)
- [Cấu trúc source: Header/Nav/Footer, CSS và cache](docs/CODE-MAP.md)
- [Cách dùng blog, DOCX, 3 banner, logo và đa ngôn ngữ](docs/CONTENT.md)
- [Nguồn ảnh và font](docs/ASSETS.md)
- [Thiết kế lại: concept, tự critique, changelog và ảnh giao diện](DESIGN-CHANGELOG.md)

Giao diện cửa hàng, trang flash sale `/flash-sale`, quản lý flash sale `/admin/flash-sales`, dashboard với biểu đồ từ database, địa chỉ nhận hàng có gợi ý và tự lấy vị trí. Backend kiểm tra phí/tổng tiền, tồn kho, thanh toán, hoàn trả, quyền và báo cáo.

Telegram, tài khoản ngân hàng và vị trí kho cần cấu hình thật trong admin. Routing mặc định tắt; lỗi lấy quãng đường sẽ yêu cầu xác nhận phí thủ công. QR mẫu ghi rõ demo; không có kết nối xác nhận ngân hàng tự động.

Sau upload, PHP-FPM/LiteSpeed hoặc cron có thể tải bản build từ GitHub, kiểm tra SHA256, backup và bảo toàn dữ liệu/cấu hình. Hosting phải kết nối được GitHub. Git lưu cả source và build; sửa source phải build trước khi push.

Source React/TypeScript + PHP/MySQL. Máy phát triển chạy `npm ci` và `npm run build`, tạo `muaplus-cpanel-v3.zip`, `odproduct-cpanel.zip`, `odproduct-update.zip`, `deploy.json`. Không chạy các lệnh này trên hosting.
