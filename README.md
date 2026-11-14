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

Sau upload, PHP-FPM/LiteSpeed hoặc cron có thể tải bản build từ GitHub, kiểm tra SHA256, backup và bảo toàn dữ liệu/cấu hình. Hosting phải kết nối được GitHub. Git lưu cả source và build. Khi push source lên `main`, GitHub Actions tự kiểm tra, build và ghi lại gói cPanel; hosting tải bản mới theo cơ chế hiện có.

Source React/TypeScript + PHP/MySQL. Máy phát triển chạy `npm ci` và `npm run build`, tạo `muaplus-cpanel-v3.zip`, `odproduct-cpanel.zip`, `odproduct-update.zip`, `deploy.json`. Không chạy các lệnh này trên hosting.

Workflow [Build cPanel package](.github/workflows/cpanel-build.yml) chạy trên GitHub, không cần Node trên hosting hoặc cPanel token trong Git. Có kiểm tra checksum, cấu hình được bảo toàn và xác minh bản mới/SEO/cache trên muaplus.com.

## Hướng dẫn xử lý đơn COD và đọc số liệu trên dashboard

**Giao hàng và ghi nhận thu tiền là hai việc riêng.** Bấm “Xác nhận giao thành công” chưa tự đánh dấu đã thu tiền COD.

### Ví dụ: tiền hàng 150.000đ, phí giao thu khách 20.000đ

Trong ví dụ này, **150.000đ là tiền hàng chưa gồm ship**, không có giảm giá. Tổng khách phải trả là **170.000đ**. Nếu 150.000đ đã là tổng gồm ship 20.000đ thì tiền hàng chỉ còn 130.000đ; cần đọc đúng các khoản đã lưu trong đơn.

### Các bước thao tác trong admin

Vào **Đơn hàng → mở đơn cần xử lý**. Trạng thái “Đã nhận đơn” được tạo tự động khi khách đặt thành công. Thao tác tiếp theo như sau; khi hộp xác nhận mở ra, kiểm tra lại rồi bấm **“Xác nhận thao tác”**.

1. **Kiểm tra thông tin → “Xác nhận đơn”.** Kiểm tra sản phẩm, số lượng, tồn kho, địa chỉ và tổng tiền 170.000đ trước khi nhận xử lý.
2. **“Chuẩn bị hàng”.** Lấy đủ sản phẩm, kiểm tra và đóng gói.
3. **Bàn giao hàng cho shipper → “Bắt đầu giao”.** Đơn chuyển sang đang giao.
4. **Khách đã nhận hàng → “Xác nhận giao thành công”.** Web bắt đầu ghi nhận doanh thu bán hàng của đơn. Nếu shipper còn giữ tiền COD thì thanh toán vẫn để chưa thu.
5. **Đã nhận tiền hoặc đối soát COD đầy đủ → “Ghi nhận đã thu đủ tiền”.** Nút này ghi nhận thanh toán toàn bộ tổng đơn **170.000đ**. Hiện không có ô nhập số tiền thu một phần. Không bấm chỉ vì khách vừa đặt hàng hoặc vì đơn đã giao xong.
6. **“Thao tác bổ sung” → “Nhập chi phí thực tế”.** Nhập **“Phí giao thực trả”** và **“Chi phí khác”**, rồi xác nhận. Có thể nhập chi phí ngay khi biết số thực tế; không bắt buộc chờ đến bước cuối.

Nếu phí giao trên đơn đã được tính và xác nhận là 20.000đ, tiếp tục quy trình trên. Nếu đơn hiện **“Cần báo phí giao trước”**, bấm **“Báo phí giao”**, nhập phí thu khách rồi gửi khách liên kết đơn để họ chấp nhận tổng mới. Khi đang **“Chờ khách đồng ý phí giao”**, cần chờ khách xác nhận trước khi xử lý tiếp.

### Phí thu khách khác phí thực trả: nhập thế nào?

| Khoản | Số tiền ví dụ |
| --- | ---: |
| Tiền hàng | 150.000đ |
| Phí giao thu khách trên web | 20.000đ |
| Tổng khách trả | **170.000đ** |
| Phí giao thực tế phải trả shipper | **30.000đ** |

Trong **“Phí giao thực trả”**, nhập **`30000`**: toàn bộ số phải trả shipper. Không nhập phí thu khách 20.000đ, cũng không chỉ nhập phần chênh lệch 10.000đ.

Phần giao hàng của đơn này bị hụt **10.000đ**, vì thu khách 20.000đ nhưng trả shipper 30.000đ. Web tính phần hụt này vào lãi sau chi phí. Nhập chi phí thực tế không đổi phí đã chốt với khách hoặc tổng thanh toán của đơn.

**“Chi phí khác”** dùng cho các khoản phát sinh của đơn, ví dụ đóng gói. Nhập `0` nếu không có. Nếu chưa nhập đủ chi phí thực tế, báo cáo chưa phản ánh đủ chi phí ngoài đời.

Giả sử **giá vốn hàng bán là 100.000đ** và chi phí khác bằng 0:

```text
Lãi gộp         = 150.000 − 100.000 = 50.000đ
Lãi sau chi phí = 50.000 + 20.000 − 30.000 − 0 = 40.000đ
```

Giá vốn 100.000đ ở đây là số giả định để minh hoạ. Báo cáo dùng giá vốn đã lưu theo sản phẩm/biến thể tại thời điểm đặt đơn; đổi giá vốn sản phẩm sau đó không sửa lại giá vốn của đơn cũ.

### Các số trên dashboard có nghĩa gì?

Các ô tính theo khoảng ngày đang chọn. Báo cáo nhóm đơn theo **ngày đặt**, dùng múi giờ Việt Nam; doanh thu bán hàng chỉ ghi nhận khi đơn giao thành công.

| Ô trên dashboard | Cách hiểu | Ví dụ sau khi giao xong, thu đủ tiền và nhập đủ chi phí |
| --- | --- | ---: |
| **Doanh thu thuần** | Tiền bán sản phẩm sau giảm giá và điều chỉnh trả hàng; chưa trừ giá vốn, chưa gồm phí ship | **150.000đ** |
| **Lãi sau chi phí** | Doanh thu thuần − giá vốn + phí ship thu khách − phí giao thực trả − chi phí khác | **40.000đ** |
| **Thực thu ròng** | Tiền đơn đã ghi nhận thu − tiền đã hoàn khách | **170.000đ** |
| **Công nợ** | Số tiền đơn còn chưa ghi nhận thu, có tính điều chỉnh hoàn/trả | **0đ** |

Nếu đã giao đơn nhưng chưa ghi nhận thu COD, trong ví dụ chưa hoàn/trả này **thực thu bằng 0đ, công nợ vẫn là 170.000đ**. Khoản còn chờ có thể là tiền shipper chưa đối soát, không nhất thiết là khách chưa trả.

**Tên “Thực thu ròng” hiện dễ gây nhầm:** số này chưa trừ giá vốn, phí giao hoặc chi phí khác, và không phải số dư tài khoản ngân hàng. Muốn xem đơn lời/lỗ bao nhiêu, đọc **“Lãi sau chi phí”**. Số lãi âm nghĩa các khoản giá vốn và chi phí đã ghi nhận đang vượt doanh thu và phí giao thu khách được ghi nhận.

### Shipper trừ phí trước khi chuyển tiền COD

Ví dụ shipper thu khách **170.000đ**, giữ lại **30.000đ** phí giao và chuyển cửa hàng **140.000đ**:

1. Đối chiếu đủ: **140.000đ chuyển về + 30.000đ phí giao = 170.000đ khách đã thanh toán**.
2. Khi đã đối soát đầy đủ, bấm **“Ghi nhận đã thu đủ tiền”** cho đơn 170.000đ.
3. Nhập **“Phí giao thực trả” = `30000`**. Nếu đã nhập trước đó, kiểm tra số đúng; đây là cập nhật tổng chi phí của đơn, không cộng thêm 30.000đ lần nữa.

**Giới hạn hiện tại:** dashboard vẫn hiển thị “Thực thu ròng” **170.000đ**, còn khoản thực chuyển về tài khoản là **140.000đ**. Web chưa có mục đối soát COD riêng để theo dõi số chuyển ròng, tiền shipper đang giữ hoặc thu từng phần. Lãi sau chi phí vẫn tính phí giao theo khoản thực trả đã nhập.
