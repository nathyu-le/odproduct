# Thiết kế lại giao diện — Catalogue công nghệ

Ngày 14/11/2026. Mục tiêu: nền sáng, chữ đen than, khoảng thở rõ; lime dùng tiết chế. Flash sale có trọng tâm riêng, không phủ màu toàn bộ thẻ sản phẩm.

## 1. Ba concept và quyết định

Điểm dưới đây là đánh giá thiết kế nội bộ trên cùng yêu cầu, không phải điểm nghiên cứu người dùng.

| Concept | Hướng thiết kế | Điểm / 10 |
| --- | --- | ---: |
| Catalogue công nghệ | Ảnh sản phẩm lớn, bố cục sáng, phân cấp rõ, khu ưu đãi tương phản | **9,2** |
| Cửa hàng đô thị | Lưới dày hơn, typography mạnh, ưu tiên duyệt nhanh nhiều sản phẩm | 8,7 |
| Phòng trưng bày | Ít nội dung, nhiều khoảng trắng, ưu tiên ảnh và câu chuyện sản phẩm | 8,5 |

Chọn **Catalogue công nghệ** vì cân bằng việc mua nhanh trên điện thoại, hình ảnh sản phẩm và khả năng nhận diện flash sale. Thiết kế này được triển khai bằng layout, trang chủ và product card mới; bỏ các component cũ tương ứng.

## 2. Cải thiện so với bản trước

- **Trang chủ:** thay hero ảnh tối với chữ chồng lên ảnh bằng bố cục chia đôi: nội dung ở một bên, ảnh và thông tin sản phẩm ở bên còn lại. Mobile đưa flash sale lên ngay sau phần giới thiệu, trước các khối phụ.
- **Màu sắc:** nền trắng ngà, bề mặt trắng, chữ và nút đen than, viền xám nhẹ. Lime dành cho điểm nhấn và trạng thái chọn. Đỏ dành cho giá/nhãn ưu đãi; không tô màu cả ô sản phẩm.
- **Header:** ô tìm kiếm hiện rõ cả trên điện thoại, điều hướng nhất quán, số lượng giỏ hàng có nhãn riêng. Menu hỗ trợ bàn phím, Escape và trả focus.
- **Flash sale:** phần tiêu đề nền than, biểu tượng lime, đồng hồ đúng lịch và hàng sản phẩm nền trắng. Vuốt, cuộn bằng bàn phím hoặc dùng mũi tên để xem toàn bộ sản phẩm; không giới hạn ở hai hay ba sản phẩm.
- **Trạng thái ưu đãi:** có giao diện khi chưa có sale, chỉ có một sản phẩm, nhiều sản phẩm và sale sắp diễn ra. Sale tương lai được ghi rõ thời điểm bắt đầu; không hiển thị giá tương lai như giá đang bán.
- **Product card:** dùng chung cho trang chủ, danh mục và trang flash sale. Ảnh, tên, biến thể, giá và nút thêm giỏ có cấu trúc thống nhất. Yêu thích đồng bộ khi cùng sản phẩm xuất hiện ở nhiều khu vực.
- **Nhãn giảm giá:** giá bán lớn hơn 0 không bị làm tròn thành giảm 100%; kiểm tra ranh giới bắt đầu/kết thúc và khôi phục giá thường.
- **Typography và khoảng cách:** Inter hỗ trợ tiếng Việt, nội dung dễ đọc, nhãn phụ tối thiểu 12px trên các trang đã kiểm tra. Bo góc control 8px, panel 12px, nút thao tác chính tối thiểu 44px.
- **Các trang mua hàng:** đồng bộ màu, chữ, input, tổng tiền, thông tin đơn và phiếu bán hàng. Giữ luồng checkout gọn, tìm địa chỉ/GPS và tra cứu lịch sử bằng số điện thoại.
- **Admin:** tăng độ đọc được của menu, chú thích biểu đồ, bảng, số liệu và hướng dẫn thao tác; chỉnh tương phản theo cùng hệ màu trung tính.
- **Bàn phím và chuyển động:** thêm lối đến nội dung chính, focus rõ, vùng sale cuộn được bằng bàn phím, tôn trọng giảm chuyển động. Khi in phiếu, ẩn header/footer/thanh điều hướng mua sắm.
- **Dọn mã:** gỡ layout, hero, card và trang sale cũ cùng các lớp CSS quảng bá chồng chéo; bổ sung tiêu đề trình duyệt theo trang.

## 3. Tự critique và sửa lại

Điểm “vòng đầu” đánh giá bản concept vừa code, trước khi chỉnh theo checklist. Chỉ chốt bản cuối khi cả sáu mục đạt ít nhất 8,5/10.

| Tiêu chí | Vòng đầu | Điểm cuối | Sửa đổi chính |
| --- | ---: | ---: | --- |
| Hierarchy | 8,1 | **9,2** | Rút gọn hero mobile, đưa flash sale lên trước nội dung phụ, làm rõ CTA và giá |
| Spacing | 8,3 | **9,0** | Chuẩn hóa khoảng cách, chiều cao tên/biến thể và hàng giá, xử lý sale một sản phẩm |
| Contrast | 7,9 | **9,2** | Tăng độ đậm nhãn, timer, giá cũ, tổng tiền, lịch sử đơn và chú thích admin |
| Typography | 8,2 | **9,0** | Tăng cỡ nhãn nhỏ, giảm chữ hoa trang trí, giữ heading medium và line-height dễ đọc |
| Consistency | 8,6 | **9,0** | Dùng chung card/timer, đồng bộ trang sale và các trang mua hàng, bỏ theme cũ xung đột |
| Accessibility | 8,2 | **8,8** | Sửa focus/menu/skip link, kích thước nút, giảm chuyển động, kiểm tra bàn phím và axe |

Trong vòng chỉnh sửa, vị trí bắt đầu flash sale trên màn hình 360px được đưa từ khoảng **923px xuống 664px**. Các điểm trên là tự đánh giá; kết quả kiểm tra thực tế được ghi riêng bên dưới.

## 4. Kiểm tra thực tế

- `npm run build`: TypeScript, parse 13 file PHP, kiểm tra logic nhãn/thời gian sale, build frontend và đóng gói cPanel thành công.
- Chromium/Playwright: trang chủ ở **360, 390, 768, 1440px**, không phát sinh lỗi JavaScript hoặc tràn ngang. Không tìm thấy nhãn chữ dưới 12px trên các trang chủ này.
- axe: không phát hiện vi phạm tự động trong tập quy tắc WCAG A/AA đã chạy trên các kích thước trang chủ trên; danh mục, chi tiết sản phẩm, flash sale, checkout, tra cứu và đơn hàng ở 390px; dashboard và chi tiết đơn admin ở 1440px; giỏ hàng và kết quả lịch sử đơn.
- Kiểm tra riêng sale trống, một sản phẩm và bốn sản phẩm sắp diễn ra tại 360/1440px: số lượng đúng, không tràn ngang, không có timer giả hoặc gắn nhãn đang sale cho ưu đãi tương lai.
- Kiểm tra thao tác: tìm kiếm, thêm giỏ, đồng bộ yêu thích, mũi tên/bàn phím cuộn đủ sản phẩm sale, menu Escape/focus, checkout ba trường chính, GPS/bản đồ và tính khoảng cách, lịch sử đơn cũ theo số điện thoại.
- Kiểm tra trên dữ liệu thử trong database cục bộ; không tạo đơn thử hoặc sửa giá sản phẩm trên hosting. Giá/ưu đãi hiển thị lấy từ cấu hình của cửa hàng.

Ảnh giao diện cuối: [desktop](docs/design/catalogue-desktop.png), [điện thoại](docs/design/catalogue-mobile.png).

## 5. Bàn giao

Source và gói build được lưu cùng commit. `odproduct-update.zip` phục vụ cập nhật tự động; `odproduct-cpanel.zip` là bản đã build để upload/Extract thủ công nếu cần. Gói cập nhật không chứa config thật, database, token, dữ liệu storage hoặc ảnh khách đã upload. Lần thay đổi này không có migration database hay thay đổi quy tắc tính tiền ở backend.

## Cập nhật 15/11/2026 — Flash sale gọn hơn, bỏ nháy chữ khi F5

- Thu gọn header, countdown, padding, nhãn và khoảng cách trong card flash sale. Giữ nguyên màu; bỏ dòng “giá flash sale” lặp lại trong riêng khu sale. Các card ở danh mục vẫn giữ bố cục cũ.
- Mobile 360/390px thấy hai sản phẩm trọn vẹn và một phần sản phẩm tiếp theo; vuốt ngang để xem hết. Desktop 1440px thấy đủ bốn sản phẩm; nhiều hơn vẫn cuộn bằng mũi tên. Không phóng to một sản phẩm thành cả khung.
- Giữ vùng chạm 44px cho yêu thích/thêm giỏ; làm vòng tròn yêu thích nhỏ hơn về mặt hiển thị. Mobile dùng vuốt nên bỏ hàng nút mũi tên và lời nhắc thừa.
- Đưa HTML dự phòng vào `noscript`: trình duyệt có JavaScript không còn nháy trang chữ trước khi React tải. Không thêm màn hình loading. Metadata, canonical, schema và nội dung dự phòng khi tắt JavaScript vẫn được giữ.
- Đo với cùng dữ liệu bốn sale và countdown có ngày: khung 390px giảm từ 712 xuống 419px; khung desktop giảm từ 759 xuống 555px. Chiều cao thực tế có thể thay đổi theo nội dung/ngôn ngữ.
- Kiểm tra Chromium tại 360/390/768/1440px, bốn ngôn ngữ, giá dài, sale trống/một/nhiều/sắp mở, countdown bốn ô, cuộn hết hàng, thao tác vuốt bằng sự kiện chạm, yêu thích/thêm giỏ cục bộ; không tràn ngang hay lỗi JavaScript. Kiểm tra điều hướng/F5 khi trì hoãn JS và chế độ tắt JS đạt. axe WCAG A/AA không ghi nhận lỗi trong vùng flash sale đã kiểm tra. Build và các kiểm tra PHP routing/sanitizer đạt.

## Cập nhật 15/11/2026 — Loading logo OD.

- Thêm splash nền trắng với logo OD. dạng vector (~2 KB), giữ màu thương hiệu. Vệt sáng trắng nghiêng quét ngang logo theo chu kỳ 1,5 giây, sau đó splash fade ra khi trang sẵn sàng.
- Markup/CSS ban đầu nằm trong `index.html`; bộ điều khiển độc lập ở `public/assets/startup.js`; logo ở `public/images/od-logo.svg`; tín hiệu nội dung sẵn sàng ở `src/startup.ts`. Không phụ thuộc logo hay script của website tham chiếu.
- Loading xuất hiện khi mở trang/F5. Chờ nội dung và ảnh banner đầu tiên trong thời gian giới hạn; không chạy lại trên mỗi chuyển trang trong ứng dụng. Chuyển động tắt theo `prefers-reduced-motion`.
- Khóa thao tác nền khi loading; khôi phục tương tác/cuộn sau khi fade. Có retry sau 15 giây nếu bundle không tải được; lỗi API vẫn hiển thị giao diện lỗi bình thường. Ứng dụng vẫn mở được nếu script splash riêng bị chặn.
- Giữ metadata/schema/canonical và nội dung `noscript`; người tắt JavaScript không bị splash che nội dung SEO.
- Kiểm tra Chromium 360/390/1440px: logo xuất hiện trước React, vệt sáng thực sự chuyển động, vị trí giữa màn hình, F5, chuyển trang nội bộ, EN/VI/KO/ZH, cài trong thư mục con, blog/admin lazy load, giảm chuyển động, tắt JS, API lỗi, script splash lỗi và bundle ứng dụng lỗi. Kiểm tra với CSP tương đương cPanel không có vi phạm. Build, PHP routing/sanitizer, checksum và dữ liệu được bảo vệ trong ZIP đạt.

## Cập nhật 15/11/2026 — Thiết kế cửa hàng trong admin

- Thêm **Thiết lập → Thiết kế cửa hàng** với bốn mục: Logo & favicon, Loading, Màu sắc, Nội dung. Có xem trước, chỉ áp dụng sau khi lưu; lưu vào key `branding` trong database, kiểm tra quyền admin và phiên bản để tránh ghi đè giữa các phiên.
- Upload logo header/admin, logo footer riêng, favicon và ảnh loading riêng; chỉnh kích thước desktop/mobile, ALT và tên hiển thị dự phòng. Footer/loading/favicon có thể dùng logo chính khi chưa chọn ảnh riêng. Ảnh upload tiếp tục được bảo toàn qua cập nhật cPanel.
- Thêm bảng chọn màu native, HEX sáu ký tự và RGB 0–255 đồng bộ. Chỉnh màu chính, màu nhấn, nền/chữ, header/footer và các màu riêng của flash sale: tiêu đề, chữ, điểm nhấn, khung sản phẩm, viền, nhãn/giá sale. Chữ trên nút chính tự chọn sáng/tối; có khôi phục bảng màu mặc định.
- Logo/loading/màu được PHP đưa vào HTML trước khi React chạy; có bật/tắt loading, bật/tắt hiệu ứng sáng quét, màu nền và xem trước. Có fallback bằng chữ khi không dùng ảnh logo, hỗ trợ giảm chuyển động và HTML SEO khi tắt JS.
- Thêm chỉnh thông báo đầu trang, tiêu đề/giới thiệu footer và bản dịch EN/VI/KO/ZH. Banners và dải thương hiệu tiếp tục quản lý ở tab riêng.
- Sửa hàng nút lưu/xem trước xuống dòng trên mobile, thu gọn logo trong sidebar, đảm bảo nút đóng modal xem trước không gửi form. Header chuyển sang menu gọn ở màn hình hẹp hơn để đủ chỗ cho logo rộng.
- Đã kiểm tra với database cục bộ: upload và lưu/mở lại, đồng bộ HEX/RGB, xem trước không tự lưu, reset không xoá ảnh, footer đa ngôn ngữ, loading từ HTML đầu tiên, bật/tắt loading, API validation/CSRF/quyền admin-nhân viên/xung đột phiên bản và ảnh giả MIME. Chromium kiểm tra cửa hàng 360/390/1440px; 12 tổ hợp pane admin tại 360/768/1440px không tràn ngang, axe WCAG A/AA không báo lỗi trong vùng thiết kế. Kiểm tra bốn ngôn ngữ admin, cài thư mục con và fallback tên thương hiệu. Build, PHP routing/sanitizer và bảo toàn dữ liệu trong ZIP đạt.

Cách dùng: [Thiết kế cửa hàng](docs/BRANDING.md).
