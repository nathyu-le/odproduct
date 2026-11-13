# Kiến trúc và quy tắc nghiệp vụ

## Nguồn dữ liệu

MySQL/MariaDB là nguồn dữ liệu chính. localStorage chỉ giữ `variant_id`, số lượng và mã coupon trong giỏ; backend không tin giá/giá vốn/phí ship/tổng tiền gửi từ trình duyệt. Dữ liệu sản phẩm demo dùng fixture chung `backend/demo/catalog.json`, từ đó sinh `demo.sql` bằng `npm run demo:sql`.

`orders`, `order_items` giữ snapshot tên/SKU/biến thể, giá bán, giá vốn, phân bổ giảm giá, cửa hàng, ngân hàng và quy tắc giao tại lúc đặt. Thay đổi sản phẩm sau này không sửa snapshot đơn cũ. Báo phí thủ công là thay đổi được ghi nhận riêng trên đơn, cần khách chấp nhận lại.

## Đặt hàng và tồn kho

1. Quote đọc biến thể đang bán, áp dụng flash sale đúng thời điểm máy chủ, kiểm tra kho, coupon, routing và quy tắc giao.
2. Quote công khai có HMAC `quote_hash`. Khi đặt, backend tính lại trong transaction, so sánh hash; thay giá/phí/coupon thì yêu cầu khách xem lại và xác nhận lần nữa.
3. `Idempotency-Key` ngẫu nhiên từ trình duyệt được hash. `checkout_keys` khóa từng request để hai request đồng thời với cùng key trả cùng đơn, kể cả khi chỉ còn một sản phẩm. `orders.idempotency_key` còn có unique constraint.
4. Khóa biến thể theo ID tăng dần bằng `FOR UPDATE`, chốt giá vốn, tạo đơn/dòng hàng, giảm tồn khả dụng và ghi `inventory_moves` trong cùng transaction.
5. Xác nhận/chuẩn bị/giao không giảm kho lần hai. Huỷ trước dispatch trả kho đúng một lần bằng cờ `stock_released`. Coupon được trả lượt khi huỷ.
6. Kho/biến thể có `version`. Admin gửi version đã đọc; thay đổi tồn kho từ checkout/huỷ/trả làm version tăng, nên form cũ không ghi đè số kho mới. Sau lỗi 409 cần tải lại sản phẩm.
7. Cron huỷ đơn vẫn ở bước đã nhận, chưa thu tiền, chưa chờ kiểm tra chuyển khoản và đã quá 24 giờ. Điều kiện được kiểm tra lại dưới khóa, tránh huỷ đơn vừa được xác nhận/thu tiền.
8. Trả hàng chỉ cho đơn đã giao; số lượng tích lũy không vượt số đã bán. Nhập lại kho chỉ khi hàng thực sự được nhận lại và có thể bán.

Đơn đang giao không có thao tác huỷ trực tiếp để tránh trả kho trước khi hàng trở về. Trường hợp giao thất bại/hoàn về cần một quy trình vận hành riêng trước khi mở rộng trạng thái; không giả nhận hàng về kho. Source hiện xử lý huỷ trước dispatch và trả sau giao thành công.

## Trạng thái

```text
received → confirmed → preparing → shipping → delivered
    └──────────┴──────────┘ → cancelled (trước dispatch)
```

Thanh toán độc lập:

```text
pending → review (khách báo chuyển khoản) → paid (admin/Telegram xác nhận)
pending ────────────────────────────────→ paid (COD thực thu)
paid → partial_refund → refunded
```

- Chuyển khoản phải được xác nhận thu tiền trước khi xác nhận/chuẩn bị/giao đơn.
- COD không tự đánh dấu đã thu khi đổi sang giao thành công; vẫn cần thao tác nhận tiền.
- Huỷ đơn không thay trạng thái hoàn tiền và không xoá tiền đã thu.
- Refund tiền và return hàng là hai phần trong cùng form: số tiền thực hoàn điều chỉnh dòng tiền; số lượng trả điều chỉnh doanh thu, giá vốn và kho.
- Form hoàn/trả có `request_key`; retry cùng request không hoàn/trả lần hai.
- Phần phí giao được hoàn về doanh thu nhập trong `shipping_reversal`; không tự suy ra từ số tiền hoàn vì hoàn tiền có thể diễn ra vào thời điểm khác.

## Phí giao

Routing trả mét, lưu km với ba chữ số thập phân. Khoảng cách vượt `max_km` bị từ chối ngay cả khi đủ mức miễn ship. Mức miễn ship xét tiền hàng **sau giảm giá**, chưa cộng ship.

```text
km_thêm = max(0, km_thực − km_bao_gồm)
km_tính = làm_tròn(km_thêm / bước) × bước
phí = phí_cơ_bản + km_tính × giá_mỗi_km
```

`ceil`: làm tròn lên; `nearest`: làm tròn gần nhất; `exact`: giữ khoảng cách. Cuối cùng phí làm tròn về VND nguyên. Cấu hình demo 15.000đ/3km + 5.000đ/km, bước 1km, ceil: 5km → 25.000đ.

Routing chưa cấu hình/lỗi hoặc chưa có tọa độ: `shipping_fee` và `total` là `null`, trạng thái `pending`. Báo phí thủ công đặt `awaiting_customer`; chỉ guest token của đơn chấp nhận mới thành `confirmed`. Mức phí, người báo và quy tắc lưu ở snapshot/audit.

## Báo cáo và hoàn/trả

Chỉ đơn `delivered` ghi nhận doanh thu sản phẩm và giá vốn. Tiền thu của đơn chưa giao vẫn được hiển thị riêng. Đơn huỷ chưa thực hiện có doanh thu và giá vốn bằng 0; chi phí đã phát sinh vẫn được tính, không che lỗ.

```text
doanh thu thuần = Σ(đơn giá snapshot × SL − giảm giá phân bổ − doanh thu dòng đã trả)
giá vốn = Σ(giá vốn snapshot × SL − giá vốn dòng đã trả)
lãi gộp = doanh thu thuần − giá vốn
ship thu ròng = phí ship gốc − phần phí ship đã điều chỉnh hoàn
lãi sau chi phí = lãi gộp + ship thu ròng − phí giao thực trả − chi phí khác
thực thu ròng = tiền đã nhận − tiền thực hoàn
công nợ = max(0, tổng nghĩa vụ sau điều chỉnh − thực thu ròng), hoặc 0 với đơn huỷ
```

Giảm giá được phân bổ theo tỷ trọng tiền hàng trước giảm, dòng cuối nhận phần lẻ để tổng luôn khớp. Với trả một phần, doanh thu đảo theo số lượng tích luỹ, dòng trả cuối bù sai số nguyên. Hoàn tiền thuần túy không trừ doanh thu lần nữa. Ví dụ bồi hoàn mà không trả hàng là điều chỉnh dòng tiền; nếu cần nghiệp vụ chiết khấu sau bán độc lập, bổ sung sổ điều chỉnh doanh thu riêng thay vì giả lập trả kho.

Báo cáo dùng **ngày đặt đơn** làm nhóm, Asia/Ho_Chi_Minh. Hoàn/trả ở ngày khác điều chỉnh lại nhóm ngày đặt gốc; đây là báo cáo vận hành theo nhóm đơn, không phải sổ kế toán pháp định theo ngày hạch toán. Phiếu bán hàng không phải hoá đơn điện tử.

## Auth, dữ liệu riêng và upload

Session PHP HttpOnly/Secure/SameSite, regenerate ID khi login, hết hạn không hoạt động sau 8 giờ. User phải còn active và đúng role trên mỗi request. Mọi POST ngoài Telegram webhook đều cần CSRF token. Password dùng `password_hash`/`password_verify`.

Nhân viên chỉ có API xử lý đơn; không đọc catalog admin có giá vốn, thiết lập, tài khoản, audit tổng hoặc báo cáo. Giá vốn/chi phí được lọc khỏi response đơn của staff; lịch sử refund/cost không trả phần tài chính cho staff. API khách không trả giá vốn, nội bộ hay actor audit. Các endpoint GET riêng vẫn kiểm tra quyền.

Token theo dõi là 32 byte ngẫu nhiên (64 ký tự hex), DB lưu hash dùng để tra và bản mã AES-256-GCM để trả lại link cho yêu cầu idempotent/tra cứu hợp lệ. Mã tra cứu 12 ký tự ngẫu nhiên + số điện thoại. Mã đơn không phải mã công khai tuần tự. Lookup 6 lần/15 phút/IP, login 8 lần/15 phút/IP, checkout 15 lần/5 phút/IP, quote 60 lần/phút/IP. Giới hạn theo REMOTE_ADDR, không tin X-Forwarded-For tuỳ ý.

Upload chỉ admin; kiểm tra PHP upload error, giới hạn 5MB, MIME bằng fileinfo, kích thước thật tối đa 6000×6000, JPG/PNG/WebP, tên ngẫu nhiên. Không nhận SVG, file script hay đường dẫn bên ngoài; thư mục uploads chặn handler script. Mô tả và tên sản phẩm render như text, không chèn HTML tùy ý.

## Telegram

Bot token/secret có thể ở config phía server hoặc bản mã trong settings DB (bản admin lưu có ưu tiên). API chỉ trả cờ configured, chat ID và user whitelist. Webhook xác minh secret header, chat và user trước xử lý.

Các thay đổi trạng thái thực hiện qua cùng `transition()` với admin, có transaction, kiểm tra bước và audit actor/channel. `update_id` được ghi sau xử lý; state transition và nhận tiền/huỷ là idempotent nên retry không thực hiện lại. Nonce xác nhận gắn user/chat/action, hết hạn 5 phút. Lỗi chuyển trạng thái được trả về Telegram qua callback alert.

Outbox được ghi cùng transaction đơn và cập nhật quan trọng. Cron claim việc dưới lock, có lease 120 giây, retry/backoff và trạng thái lỗi. Gửi Telegram là **at-least-once**, có thể có tin trùng khi response timeout; không hứa exactly-once với API bên ngoài.

## API chính

Tất cả qua `api/index.php?route=...`; query lọc được nối bằng `&`.

| Route                                                     | Phương thức | Quyền                                                   |
| --------------------------------------------------------- | ----------- | ------------------------------------------------------- |
| session, catalog                                          | GET         | Khách                                                   |
| quote, orders, lookup                                     | POST        | Khách + CSRF; orders có Idempotency-Key                 |
| order/{token}                                             | GET         | Token riêng                                             |
| order/{token}/review, accept-shipping                     | POST        | Token + CSRF                                            |
| login, logout                                             | POST        | CSRF                                                    |
| admin/orders, admin/orders/{id}                           | GET         | Staff/admin                                             |
| admin/orders/{id}/{action}                                | POST        | Staff/admin; paid/refund/costs/shipping_quote chỉ admin |
| admin/products/categories/coupons/users/settings          | GET/POST    | Admin                                                   |
| admin/report, admin/audit                                 | GET         | Admin                                                   |
| admin/upload, admin/telegram/config, admin/telegram/retry | POST        | Admin                                                   |
| telegram/webhook                                          | POST        | Secret header + whitelist, không dùng session/CSRF      |

Các request SQL dùng tham số PDO. API JSON không trả lỗi nội bộ/DB credential. Không bật CORS cho origin bên ngoài.
