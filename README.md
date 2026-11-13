# OD. Store

**Website đang chạy:** [Tải bản cập nhật](https://github.com/nathyu-le/odproduct/raw/refs/heads/main/odproduct-update.zip). Upload và Extract vào đúng thư mục website. Không chứa config, dữ liệu đơn, uploads hay SQL; không chạy lại cài đặt.

**Cài mới:** [Tải bản đầy đủ](https://github.com/nathyu-le/odproduct/raw/refs/heads/main/odproduct-cpanel.zip). Upload → điền MySQL → mở api/install.php một lần.

Hướng dẫn ngắn: [HUONG-DAN.txt](HUONG-DAN.txt).

Bản này có giao diện mới; Flash sale riêng cho khách và admin; biểu đồ doanh thu/lợi nhuận, biểu đồ tròn, cảnh báo kho; địa chỉ có gợi ý bản đồ và tự cập nhật quãng đường/phí khi chọn.

Sau lần upload bản update, PHP tự kiểm tra bản build GitHub qua cron hoặc sau lượt truy cập trên PHP-FPM/LiteSpeed. Gói phải khớp SHA256; sao lưu file trước cập nhật, giữ nguyên cấu hình và dữ liệu. Không cần tài khoản GitHub trên hosting. Cấu hình trạng thái cập nhật nằm ở api/storage/updates (không công khai). Git là nơi lưu source và bản build.

Source React/TypeScript + PHP/MySQL. Khi chỉnh source, trợ lý/máy phát triển chạy `npm ci` và `npm run build`; lệnh build tạo cả ZIP đầy đủ, ZIP cập nhật và deploy.json. Hosting không chạy Node hay Docker. Không push code chưa được build rồi kỳ vọng ZIP tự thay đổi.

PHP 8.2+ 64-bit. Routing dùng OSRM-compatible HTTPS, gợi ý địa chỉ qua Photon, bản đồ OSM/CARTO. Các dịch vụ công khai phù hợp đánh giá/lưu lượng nhỏ; có thể đổi endpoint cấu hình khi dùng nhà cung cấp riêng. Phí/tổng tiền và tồn kho được kiểm tra ở backend. QR ngân hàng demo ghi rõ và chuyển khoản xác nhận thủ công.

Nguồn ảnh/font: [docs/ASSETS.md](docs/ASSETS.md).
