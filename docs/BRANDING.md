# Thiết kế cửa hàng trong admin

Vào **Thiết lập → Thiết kế cửa hàng**, hoặc mở `/admin/settings?tab=branding`. Chỉ quản trị viên được lưu cấu hình này.

## 1. Logo & favicon

- **Logo header / admin**: upload logo chính. Chỉnh chiều rộng cho desktop và mobile riêng; ảnh được giữ tỉ lệ và giới hạn chiều cao để không đẩy lệch header. Trong admin, logo được thu nhỏ để vừa sidebar.
- **Tên hiển thị khi chưa có ảnh logo**: tên/chữ thương hiệu dùng khi chưa upload hoặc ảnh lỗi.
- **Mô tả logo (ALT)**: tên hoặc mô tả cho trình đọc màn hình. Để trống sẽ dùng tên cửa hàng.
- **Logo footer**: ảnh riêng, phù hợp khi footer có nền tối. Để trống sẽ dùng logo chính.
- **Favicon / biểu tượng tab**: nên dùng PNG vuông 512 × 512px. Để trống sẽ dùng logo chính, hoặc biểu tượng OD. mặc định nếu chưa có ảnh logo.

Hỗ trợ JPG, PNG và WebP, tối đa 5 MB và 6000px mỗi chiều. PNG trong suốt phù hợp cho logo. Chọn **Xoá ảnh** để bỏ ảnh đang gán; thao tác này không xoá file đang được dùng ở nơi khác.

Tên cửa hàng, địa chỉ, điện thoại và email vẫn chỉnh tại tab **Cửa hàng**. Logo của dải thương hiệu và ba banner vẫn nằm ở **Banner & thương hiệu**.

## 2. Loading

- Bật/tắt loading khi mở web hoặc F5.
- Upload **Ảnh loading riêng**, hoặc để trống để dùng logo chính. Khi chỉ dùng tên thương hiệu bằng chữ, loading có thể dùng chính chữ đó.
- Chỉnh chiều rộng ảnh, màu nền và bật/tắt vệt sáng quét qua logo.
- Bấm **Xem trước loading** để kiểm tra trước khi lưu.

Loading tự ẩn khi nội dung sẵn sàng, không chạy lại trên mỗi lần chuyển trang nội bộ. Thiết bị bật giảm chuyển động sẽ tắt hiệu ứng. Nếu tải ứng dụng thất bại, có nút thử lại. Người tắt JavaScript vẫn đọc được HTML SEO dự phòng.

Ảnh loading và màu được PHP đọc từ database ngay khi trả trang, nên ảnh đã chọn xuất hiện từ đầu; không chờ API rồi mới thay logo.

## 3. Màu sắc

Bấm vào **ô màu** để mở bảng chọn màu của trình duyệt. Có thể nhập:

- **HEX**: sáu ký tự sau dấu `#`, ví dụ `#313131`.
- **RGB**: mỗi kênh R, G, B từ `0` đến `255`. Các ô RGB, HEX và ô màu đồng bộ với nhau.

Nhóm **Màu sắc website** có màu chính/nút mua hàng, màu nhấn, nền website, nền card/biểu mẫu, chữ, header và footer. Chữ trên nút chính được tự chọn sáng/tối theo màu nền.

Nhóm **Màu flash sale** có màu nền tiêu đề, chữ tiêu đề, điểm nhấn, nền vùng sản phẩm, viền và nhãn/giá sale. Màu nền tiêu đề và nền vùng sản phẩm là hai lựa chọn riêng.

**Khôi phục màu mặc định** đưa bảng màu website/flash sale về mặc định trong bản nháp. Logo và nội dung vẫn được giữ. Bấm **Lưu giao diện** để áp dụng việc khôi phục.

Màu được áp dụng cho cửa hàng; các control của admin giữ giao diện quản trị dễ đọc. Màu vốn có trong ảnh logo/sản phẩm được giữ theo file ảnh.

## 4. Nội dung

Bật/tắt thanh thông báo đầu trang, chỉnh câu thông báo, tiêu đề và giới thiệu footer. Có ô nội dung English, Việt, Hàn và Trung. Bản dịch để trống sẽ dùng nội dung gốc; nội dung mới nhập không được tự dịch.

## Xem trước và lưu

Bản xem trước phản ánh thay đổi chưa lưu. Trên điện thoại có thể bấm **Xem trước trực tiếp** để chuyển tới vùng xem trước.

Bấm **Lưu giao diện**, chờ thông báo thành công rồi mở cửa hàng. Trang tải mới sẽ dùng cấu hình vừa lưu. Các trang đang mở cập nhật dữ liệu theo cơ chế làm mới hiện có. Chờ upload xong trước khi lưu. Nếu có người lưu ở phiên khác, tải lại trước khi chỉnh tiếp để tránh ghi đè.

Các thiết lập lưu ở key `branding` trong bảng `settings`. Không cần import SQL, chạy cron mới hoặc sửa source để đổi logo/màu/ảnh loading. Cập nhật code qua Git/cPanel giữ nguyên cấu hình, database và ảnh đã upload.
