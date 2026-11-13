# OD. Store

Website thương mại điện tử tiếng Việt, ưu tiên điện thoại, gồm storefront React, quản trị, API PHP/MySQL và bot Telegram xử lý đơn.

**Bàn giao source trước theo yêu cầu. Build TypeScript/Vite và phân tích cú pháp PHP đã chạy; chưa chạy ứng dụng với MySQL, kiểm thử nghiệp vụ, trình duyệt, thiết bị hay tích hợp thật. Chưa triển khai lên hosting.**

## Công nghệ

- React 19, TypeScript, Vite, Tailwind CSS 4; component tự xây theo phong cách shadcn/Vercel, Inter có tiếng Việt.
- PHP 8.2+ 64-bit, PDO MySQL, MySQL 8.0+ hoặc MariaDB 10.6+ là mục tiêu triển khai; cần kiểm tra hosting thực tế trước cài.
- Frontend build thành file tĩnh; PHP chạy trên hosting cPanel, **không cần Node.js chạy trên hosting**.
- InnoDB transaction, kho có version để chống ghi đè, snapshot giá bán/giá vốn, tiền VND nguyên.
- Leaflet/OpenStreetMap chọn điểm nhận; OSRM-compatible routing tính quãng đường ở backend.
- VietQR tạo QR theo số tiền/nội dung; đối soát chuyển khoản thủ công, không kết nối xác thực ngân hàng.
- Telegram webhook có secret + danh sách chat/user được phép; gửi qua outbox và cron.

## Bắt đầu

```bash
npm ci
npm run build
```

Upload **nội dung** thư mục `build/cpanel/` vào `public_html/` hoặc thư mục con. Thực hiện cấu hình database, tạo admin và cron theo [hướng dẫn cPanel](docs/CPANEL.md). Các lệnh trên chỉ biên dịch, phân tích cú pháp và đóng gói; không chạy test nghiệp vụ.

Truy cập cửa hàng tại `https://domain/` và admin tại `https://domain/#/admin`. Nếu cài vào `/shop/`, dùng `https://domain/shop/` và `https://domain/shop/#/admin`. Trong `api/config.php`, `url` phải khớp đường dẫn và không có dấu `/` cuối.

Không có mật khẩu admin mặc định. Dữ liệu ngân hàng được seed là **DEMO**, không dùng để nhận tiền thật.

## Cấu trúc

```text
src/                    React storefront, admin, design system, xuất PDF/CSV
public/images/          Ảnh minh hoạ sản phẩm/góc làm việc, lưu tại chỗ
public/fonts/           Noto Sans cho PDF tiếng Việt
backend/index.php       API entrypoint (production: api/index.php)
backend/src/            Auth/CSRF, thương mại, quản trị, Telegram
backend/migrations/     SQL schema
backend/demo/           Fixture JSON + SQL demo không có dữ liệu khách hàng
backend/bin/            Preflight, migration, seed, admin, cron, webhook
backend/setup.php       Trình tạo admin một lần qua HTTPS, cần install.key riêng
scripts/                Build package, sinh SQL demo, cấu hình local
build/cpanel/           Gói upload sau khi build (không commit)
docs/                   Cài đặt, kiến trúc, bàn giao và danh sách tự kiểm thử
```

## Chức năng đã có trong source

- Trang chủ: banner nội dung, danh mục, sản phẩm ghim/nổi bật và flash sale có giờ bắt đầu/kết thúc.
- Danh mục, tìm kiếm, lọc giá/còn hàng, sắp xếp; chi tiết sản phẩm, nhiều ảnh và biến thể.
- Giỏ hàng giữ bằng localStorage; mã giảm giá; checkout không tài khoản; backend tính lại giá/kho/tổng tiền, yêu cầu khách xác nhận lại nếu quote thay đổi.
- Phí giao theo routing và quy tắc cấu hình. Routing lỗi/chưa bật: phí và tổng là `null`, không phải 0; admin báo phí rồi khách chấp nhận.
- COD, chuyển khoản và QR. “Tôi đã chuyển khoản” chỉ chuyển sang chờ kiểm tra.
- Link đơn token ngẫu nhiên, mã tra cứu riêng + điện thoại, giới hạn tra cứu, không index trang đơn.
- Phiếu bán hàng snapshot, in và tải PDF tiếng Việt.
- Admin/nhân viên; sản phẩm/biến thể/SKU/ảnh/giá vốn/kho/danh mục/flash sale/coupon; đơn hàng, trạng thái, chi phí, nội bộ, huỷ/hoàn/trả, audit.
- Báo cáo ngày/tuần/tháng/khoảng ngày, lọc trạng thái; doanh thu thuần, giá vốn, lãi gộp, ship, chi phí, lãi sau chi phí, thực thu và công nợ; CSV mở bằng Excel và PDF.
- Telegram: xác nhận đơn/nhận tiền/chuẩn bị/giao/hoàn thành/huỷ; xác nhận thêm cho nhận tiền và huỷ; lý do huỷ; outbox retry.

[Quy tắc nghiệp vụ và API](docs/ARCHITECTURE.md) · [Thiết lập local](docs/DEVELOPMENT.md) · [Tình trạng bàn giao](docs/HANDOFF.md) · [Danh sách tự kiểm thử](docs/MANUAL-QA.md) · [Nguồn tài nguyên](docs/ASSETS.md)
