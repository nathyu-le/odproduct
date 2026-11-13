# Tài nguyên và ghi chú thiết kế

Không có ảnh giao diện tham chiếu truy cập được trong hội thoại. Thiết kế dựa mô tả: nền trắng/xám nhẹ, than, trắng ngà, lime tiết chế; Inter, viền nhẹ, control 8px/card 12–16px; responsive CSS từ 360px. Chưa đối chiếu bằng browser/thiết bị.

Ảnh minh hoạ từ Unsplash được tải vào `public/images/`, frontend không phụ thuộc hotlink ảnh sản phẩm:

| File            | ID ảnh nguồn trên images.unsplash.com |
| --------------- | ------------------------------------- |
| headphones.jpg  | photo-1546435770-a3e426bf472b         |
| keyboard.jpg    | photo-1587829741301-dc798b83add3      |
| mouse.jpg       | photo-1527814050087-3793815479db      |
| speaker.jpg     | photo-1608043152269-423dbba4e7e1      |
| earbuds.jpg     | photo-1606220945770-b5b6c2c55bf1      |
| desk.jpg        | photo-1593062096033-9a26b09da705      |
| headphones2.jpg | photo-1583394838336-acd977736f90      |
| keyboard2.jpg   | photo-1618384887929-16ec33fab9ef      |

Nguồn ảnh: [Unsplash](https://unsplash.com/license). Tên thương mại OD./SKU/giá trong demo là minh hoạ, ảnh không xác nhận mẫu hàng/nhãn hiệu tương ứng. Thay bằng ảnh sản phẩm thực khi vận hành.

Inter Variable qua `@fontsource-variable/inter`, SIL OFL; file license được kèm trong `public/fonts/OFL-Inter.txt`. Noto Sans Regular từ kho [notofonts/noto-fonts](https://github.com/notofonts/noto-fonts), dùng nhúng PDF, license tại `public/fonts/OFL-NotoSans.txt`. Icon Lucide qua lucide-react (ISC). Các dependency giữ thông tin license trong package tương ứng.

Bản đồ ghi attribution OpenStreetMap. Cần tuân thủ [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) và chọn nhà cung cấp phù hợp khi lưu lượng tăng; source không prefetch hàng loạt tile. QR từ img.vietqr.io chỉ minh hoạ/công cụ tạo QR, không phải tích hợp kiểm tra thanh toán.
