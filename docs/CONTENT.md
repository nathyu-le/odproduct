# Blog, banner, thương hiệu và ngôn ngữ

## Đăng bài

Vào **Admin → Bài viết / SEO → Viết bài mới**.

1. Điền tiêu đề H1, slug và mô tả ngắn. Slug tự gợi ý theo tiêu đề; hỗ trợ chữ Hàn/Trung.
2. Soạn nội dung bằng toolbar: heading H2–H4, đậm/nghiêng, danh sách, trích dẫn, căn đoạn, link, bảng, ảnh.
3. **Nhập DOCX** để chèn tài liệu Word vào vị trí con trỏ. File tối đa 10 MB. Ảnh nhúng JPG/PNG/WebP được upload vào website, không gửi tài liệu tới dịch vụ chuyển đổi bên ngoài. Có cảnh báo với định dạng Word không được hỗ trợ; bố cục phức tạp có thể cần chỉnh tay.
4. Thêm ảnh bìa, ALT, SEO title và meta description. Chọn ảnh trong nội dung rồi bấm nút ảnh để sửa ALT/đổi ảnh.
5. **Lưu bài viết** ở trạng thái **Bản nháp** hoặc **Xuất bản / hẹn giờ**. Ngày trống = xuất bản ngay; ngày tương lai = tự hiển thị vào thời điểm đó theo giờ Việt Nam, không cần cron.
6. Có xem trước, bản nháp phục hồi trên trình duyệt, tìm/lọc/phân trang và lưu trữ bài. Nút lưu chờ xử lý ảnh/DOCX hoàn tất. Nếu hai phiên cùng sửa một bài, phiên cũ phải tải lại thay vì ghi đè.

Chức năng đăng bài/cấu hình dành cho quản trị viên. Nhân viên xử lý đơn không có quyền đăng bài. Mỗi ngôn ngữ là một bài riêng trong cùng nhóm; lưu bài hiện tại rồi dùng **Tạo bản dịch mới** để liên kết các bản bằng hreflang.

## Ba banner

Vào **Thiết lập → Banner & thương hiệu**:

- Có đúng 3 banner; bật/tắt độc lập.
- Chọn ảnh chính, ảnh mobile tuỳ chọn, ALT, nhãn nhỏ, tiêu đề, caption, chữ nút, link và màu chữ trên ảnh.
- Ảnh không còn lấy tự động từ sản phẩm. Thay đổi giá/tên sản phẩm không thay ảnh hoặc caption banner.
- Nội dung chữ có 4 tab ngôn ngữ, English là bản gốc. Bản dịch trống dùng nội dung English.
- Có tuỳ chọn tự chạy và thời gian chuyển; mặc định không tự chạy. Tôn trọng chế độ giảm chuyển động.

## Dải logo

Cùng tab trên, phần **Dải thương hiệu** có **Thêm thương hiệu**, upload logo, tên/ALT, link tuỳ chọn, bật/tắt, đổi thứ tự và xoá. Không có giới hạn số logo cố định trong giao diện. Ảnh JPG/PNG/WebP tối đa 5 MB/ảnh.

Dải logo hiện **dưới Flash sale, trên Tìm theo nhu cầu**. Không có logo thì ẩn. Một logo hiển thị tĩnh; nhiều logo chạy ngang với tốc độ ổn định theo số lượng, có tạm dừng và hỗ trợ giảm chuyển động.

## SEO và ngôn ngữ

- **Thiết lập → SEO website**: title/description trang chủ theo ngôn ngữ, ảnh Open Graph mặc định.
- Mỗi bài có title/description riêng; để trống dùng tiêu đề/mô tả ngắn của bài. Sản phẩm có **Bản dịch & SEO theo ngôn ngữ**; danh mục có ô bản dịch riêng.
- Title, description, canonical, hreflang, Open Graph và schema được trả trong HTML từ PHP. Bài đã xuất bản xuất hiện trong `/sitemap.xml`; bài nháp/hẹn giờ tương lai/noindex và các trang đơn/admin không xuất hiện trong sitemap.
- Website mặc định English tại `/`. Chọn Việt `/vi`, Hàn `/ko`, Trung `/zh` cạnh tìm kiếm. Khi đang đọc bài, bộ chọn mở bản dịch được liên kết nếu có; chưa có thì về danh sách bài của ngôn ngữ đó.
- Admin mặc định Việt, có bộ chọn riêng và ghi nhớ lựa chọn riêng. Nội dung sản phẩm/bài viết bạn mới nhập không được tự dịch bằng API; nhập bản dịch ở các trường tương ứng. Thông tin khách hàng và snapshot đơn cũ được giữ nguyên.
- CSS/JS cập nhật version theo file và revalidate khi tải lại; không reload ngang lúc đang nhập đơn/bài.

## Kiểm tra bản cập nhật

Build kiểm tra TypeScript, bản dịch/placeholder, slug Việt–Hàn–Trung, PHP 8.2 và logic flash sale. Đã kiểm tra backend với database thử và các luồng trình duyệt: nhập Word có ảnh/bảng, lưu nháp, mở lại, xuất bản, đọc bài, SEO, đổi ngôn ngữ, chỉnh banner/logo và URL thư mục con.

Hosting thật đã được kiểm tra PHP 8.3.35 có DOM/libxml/cURL/mbstring. Không cần thêm API trả phí hoặc tiến trình Node trên hosting.
