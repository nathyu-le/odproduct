# OD. Store

**Bản upload cPanel:** [Tải odproduct-cpanel.zip](https://github.com/nathyu-le/odproduct/raw/refs/heads/main/odproduct-cpanel.zip)

ZIP đã chứa frontend build sẵn và PHP. Upload → Extract → điền MySQL trong `api/config.php` → mở `api/install.php` một lần để tạo admin/sản phẩm mẫu. Không cần Node.js, Docker hoặc Terminal trên hosting.

Đọc [HUONG-DAN.txt](HUONG-DAN.txt). Source trên repo để lưu và chỉnh sửa về sau; không upload nguyên repo lên hosting.

Giữ nguyên storefront, admin, giỏ hàng, checkout, quản lý kho/đơn, thanh toán thủ công, báo cáo, phiếu PDF và Telegram. Giữ riêng trạng thái thanh toán và giao hàng; tiền và tồn kho tính ở PHP/MySQL. Ngân hàng demo được ghi rõ, không phải kết nối đối soát ngân hàng.

Khi cần sửa source rồi build lại trên máy phát triển:

```bash
npm ci
npm run build
```

Kết quả: `odproduct-cpanel.zip`. Thư mục `build/cpanel` là nội dung bên trong ZIP. Hosting không phải chạy các lệnh này.

PHP 8.2+ 64-bit, MySQL 8.0+/MariaDB 10.6+ là mục tiêu. Đã biên dịch TypeScript/Vite và phân tích cú pháp PHP; kiểm thử nghiệp vụ/runtime để chủ repo tự thực hiện theo yêu cầu. Chưa triển khai lên hosting.

Ảnh/font/license: [docs/ASSETS.md](docs/ASSETS.md).
