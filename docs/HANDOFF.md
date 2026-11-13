# Tình trạng bàn giao source

Theo yêu cầu tiếp theo của chủ repo, ưu tiên mã nguồn trước; chủ repo sẽ chạy test và kiểm thử sau.

| Hạng mục                                                   | Trạng thái                                           |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| Storefront React, admin, PHP API, SQL schema/demo          | Có source                                            |
| Cấu hình mẫu, preflight, setup admin một lần, cron/webhook | Có source và hướng dẫn                               |
| TypeScript, parser PHP, Vite production build              | Đã thực hiện khi đóng gói                            |
| Chạy migration/seed với DB thực                            | Chưa thực hiện                                       |
| Kiểm thử COD, ngân hàng, kho, huỷ, hoàn/trả, báo cáo       | Chưa thực hiện                                       |
| Telegram bot/webhook thật, routing thật, HTTPS cPanel      | Chưa cấu hình/chưa kiểm thử                          |
| Browser, responsive trên thiết bị, PDF/in thực tế          | Chưa kiểm thử                                        |
| Cài lên hosting cPanel                                     | Chưa có quyền truy cập/phiên bản chính xác           |
| So khớp ảnh giao diện tham chiếu                           | Không nhận được ảnh trong hội thoại; dựng theo mô tả |

Không có tuyên bố test pass hoặc số liệu doanh thu/lợi nhuận thực tế. Các con số 2.180.000đ, 2.205.000đ, 780.000đ, 765.000đ trong tài liệu là **kết quả mong đợi của ví dụ kiểm thử**, không phải số liệu test đã chạy.

Cần cấu hình trước vận hành:

1. PHP version/extensions, database/user/password, app_key, URL và HTTPS.
2. Thông tin cửa hàng thật; ngân hàng/BIN/chủ tài khoản thật và bỏ nhãn demo có chủ đích.
3. Endpoint routing có chất lượng phù hợp, bật routing, tọa độ kho/quy tắc giao. Nếu chưa có, dùng cơ chế báo phí thủ công.
4. Bot token, secret, chat/user whitelist, đăng ký webhook và cron.
5. Đánh giá/tự kiểm thử các luồng ở MANUAL-QA; đặc biệt request đồng thời, bảo vệ `.htaccess`, in/PDF tiếng Việt và mobile 360px.

Giới hạn mô hình hiện tại: một kho, VND, mua không tài khoản; không có kết nối xác thực giao dịch ngân hàng; không geocoding địa chỉ tự động; không hoá đơn điện tử; báo cáo hoàn/trả điều chỉnh theo nhóm ngày đặt; chưa có quy trình riêng cho giao thất bại trước khi nhận hoàn về kho. Những điểm này không được che bằng trạng thái/thành công giả.
