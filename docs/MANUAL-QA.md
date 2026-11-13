# Danh sách tự kiểm thử — chưa thực hiện

Dùng staging/DB riêng, thông tin khách giả và bot test. Các mục dưới là hướng dẫn và kết quả **mong đợi**, chưa phải biên bản pass/fail.

## Bộ số chuẩn

| Khoản                            |   Mong đợi |
| -------------------------------- | ---------: |
| Studio H1, SL 1                  | 1.290.000đ |
| K68 Essential, SL 1              |   890.000đ |
| Tiền hàng                        | 2.180.000đ |
| Giảm giá                         |         0đ |
| Phí 5km: 15.000đ/3km + 5.000đ/km |    25.000đ |
| Tổng thanh toán                  | 2.205.000đ |
| Giá vốn H1 + K68                 | 1.400.000đ |
| Giao thực trả                    |    30.000đ |
| Chi phí khác                     |    10.000đ |
| Lãi gộp                          |   780.000đ |
| Lãi sau chi phí                  |   765.000đ |

Chọn đúng hai sản phẩm demo, không dùng mã. Routing thật phải trả 5km để kiểm tra quãng đường; đừng giả khoảng cách từ frontend. Có thể kiểm tra nhánh báo phí thủ công bằng mức 25.000đ khi routing tắt. Với nhánh manual, checkout phải hiện tổng chờ xác nhận; sau admin báo phí và khách đồng ý, tổng mới bằng 2.205.000đ.

Đánh dấu giao thành công, nhập chi phí thực, đối chiếu giá/tiền ở đơn, Telegram, phiếu/PDF, CSV/PDF báo cáo. Báo cáo chỉ có lãi mẫu sau giao thành công; trước đó doanh thu ghi nhận = 0.

## Mua hàng

- [ ] Trang chủ, danh mục, search có dấu tiếng Việt, lọc giá/còn hàng, sắp xếp.
- [ ] Nhiều ảnh, biến thể, SKU, giá flash trước/trong/sau khoảng áp dụng.
- [ ] Thêm/tăng/giảm/xoá giỏ, reload giữ giỏ; sản phẩm ngừng bán/hết hàng có thông báo.
- [ ] Coupon hợp lệ, hết hạn, chưa bắt đầu, thiếu mức tối thiểu, hết lượt; số giảm phân bổ khớp tổng.
- [ ] Checkout kiểm tra điện thoại/địa chỉ; chọn map, geolocation bị từ chối, nhập tọa độ.
- [ ] Routing timeout/lỗi, thiếu tọa độ: phí `null`, không hiển thị 0đ; ngoài phạm vi bị từ chối.
- [ ] Manual quote phải được khách xác nhận; trước đó không thanh toán/xử lý đơn.
- [ ] Đổi giá/flash/coupon sau quote: server từ chối và yêu cầu xem lại tổng.
- [ ] Hai request checkout cùng key đồng thời chỉ tạo một đơn và một lần trừ kho.
- [ ] Hai khách tranh SKU cuối: chỉ một người giữ hàng; kho không âm.

## Thanh toán, trạng thái, kho

- [ ] COD và bank có trạng thái xử lý/thanh toán độc lập.
- [ ] “Tôi đã chuyển khoản” chỉ thành review, chưa paid; QR khớp tổng/nội dung.
- [ ] Demo hiển thị rõ, không dùng tài khoản demo để chuyển tiền.
- [ ] Admin/Telegram nhận tiền cần xác nhận có chủ đích; bước trạng thái không hợp lệ bị chặn.
- [ ] Huỷ trước dispatch với từng lý do, kho/coupon trả một lần; tiền đã thu vẫn còn cho đến thao tác refund.
- [ ] Hết hạn giữ hàng qua cron; không huỷ đơn vừa được xác nhận, paid hoặc review.
- [ ] Refund một phần/toàn phần không vượt thực thu; retry cùng request_key không thực hiện lần hai.
- [ ] Trả một phần/toàn bộ theo dòng hàng; doanh thu/giá vốn/kho đảo tương ứng, không nhập kho nếu chỉ hoàn tiền.
- [ ] Hoàn phí ship dùng shipping_reversal; không trừ refund tiền hai lần vào doanh thu.
- [ ] Sửa giá vốn sản phẩm sau bán không thay giá vốn/lợi nhuận lịch sử.
- [ ] Hai admin sửa kho hoặc checkout xảy ra lúc mở form: form version cũ bị từ chối.

## Telegram và riêng tư

- [ ] Token/secret không có trong asset JS hay API công khai.
- [ ] Sai secret, chat không cho phép, user không cho phép bị từ chối.
- [ ] Nhận tiền/huỷ có bước xác nhận; nonce sai user/chat/hết hạn không dùng được.
- [ ] Callback lặp không đổi trạng thái/ghi nhận tiền/nhả kho lần hai.
- [ ] Bot lỗi hoặc mạng lỗi vẫn lưu đơn; outbox backoff, failed, retry sau sửa cấu hình.
- [ ] Admin/trang theo dõi cập nhật sau reload/poll; Telegram đọc từ DB hiện tại.
- [ ] Token đơn khác, token sai, lookup sai/mạo danh/thử nhiều lần không lộ khách.
- [ ] Staff không gọi được sản phẩm admin có giá vốn, thu tiền/refund/chi phí/cấu hình/report/user.
- [ ] CSRF sai/thiếu bị chặn; phiên hết hạn/khóa user chặn API; SQL injection và XSS không thực thi.
- [ ] Config, install.key, demo/src/bin/storage không tải được qua HTTP.
- [ ] Upload file giả ảnh, SVG, PHP, ảnh quá lớn bị từ chối; file upload không thực thi được.

## Hiển thị và xuất dữ liệu

- [ ] 360px, 390px, tablet, desktop: không tràn ngang; nút chạm, menu, dialog, giỏ, bàn phím ảo.
- [ ] Loading, rỗng, mất mạng, lỗi form, disabled, focus bàn phím và toast rõ ràng.
- [ ] Bảng admin đổi sang card trên điện thoại, pagination/filters hoạt động.
- [ ] Link riêng mở lại được; trang đơn noindex, referrer không rò token.
- [ ] Phiếu in chỉ có phiếu, PDF tiếng Việt đủ dấu, số tiền khớp snapshot, không bị cắt trang.
- [ ] CSV mở Excel đúng dấu, không thực thi công thức từ dữ liệu khách; PDF báo cáo có tổng và đúng filter.
- [ ] Báo cáo ngày/tuần/tháng/khoảng ngày qua ranh giới múi giờ Việt Nam.
- [ ] Cài domain chính và thư mục con: asset/API/upload/cookie/webhook đều đúng đường dẫn.
