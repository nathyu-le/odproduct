# Sửa source ở đâu?

## Layout và font

| File                                         | Vai trò                                                             |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `src/components/layout/Header.tsx`           | Logo, thông báo, tìm kiếm, giỏ hàng, nút menu                       |
| `src/components/layout/Navigation.tsx`       | Các link và chữ trên menu                                           |
| `src/components/layout/Footer.tsx`           | Footer và thông tin liên hệ                                         |
| `src/components/layout/MobileDock.tsx`       | Thanh điều hướng dưới trên điện thoại                               |
| `src/components/layout/LanguageSelector.tsx` | Bộ chọn ngôn ngữ cạnh tìm kiếm / trong admin                        |
| `src/components/layout/SiteLayout.tsx`       | Ghép Header → nội dung trang → Footer                               |
| `src/styles/layout.css`                      | CSS của các thành phần layout trên, font nav/footer và nhãn nhỏ     |
| `src/styles/home-content.css`                | Ba banner và dải logo chạy ngang                                    |
| `src/styles/blog.css`                        | Trang Journal, trang bài viết và editor                             |
| `src/styles/content-settings.css`            | Form chỉnh banner/logo/SEO trong admin                              |
| `src/catalogue.css`                          | Nền tảng giao diện cửa hàng, card, flash sale và các trang mua hàng |
| `src/main.tsx`                               | Entry: nạp CSS/font và đúng gói ngôn ngữ đang chọn                  |
| `src/App.tsx`                                | Router và các trang của ứng dụng                                    |

`src/catalogue-layout.tsx` chỉ giữ export tương thích; không còn chứa cả Header/Nav/Footer trong một file lớn.

## Chức năng

- `src/features/home/`: carousel ảnh/caption từ Settings và marquee logo.
- `src/features/blog/`: danh sách, trang đọc, quản lý bài, rich text editor, nhập DOCX và hàm tạo slug Unicode.
- `src/features/settings/`: cấu hình banner/thương hiệu, SEO website và bản dịch sản phẩm/danh mục.
- `src/i18n/locales/{en,vi,ko,zh}.json`: chữ giao diện của từng ngôn ngữ. Chỉ gói đang dùng được tải xuống. Nội dung bạn nhập có trường bản dịch riêng.
- `public/index.php`: entry PHP, HTML đọc được cho SEO, metadata và version CSS/JS.
- `backend/src/content.php`: lưu/đọc bài, lọc HTML, banner/logo, bản dịch và migration tự động.
- `backend/src/seo.php`: title/description, canonical, hreflang, Open Graph, schema và sitemap.
- `backend/migrations/002_content.sql`: hai bảng mới `blog_posts` và `content_translations`. Không sửa/xoá đơn, tồn kho hoặc tài khoản cũ.

`backend/src/content-schema.php` và `backend/src/locales.php` được sinh khi build; sửa file nguồn SQL/JSON tương ứng thay vì sửa hai file sinh tự động.

## CSS/JS và cache

HTML đi qua PHP: các file CSS/JS entry có `?v=<filemtime>`. Khi file thay đổi, URL version đổi theo. Các chunk CSS/JS còn lại dùng tên hash và HTTP `Cache-Control: no-cache, no-store, must-revalidate`, nên trình duyệt kiểm tra bản mới khi tải lại. Không dùng timestamp thay đổi mỗi giây, không tự reload giữa lúc khách checkout hoặc admin đang soạn bài.

Source React cần build để tạo tài nguyên chạy trên hosting. Khi push lên `main`, `.github/workflows/cpanel-build.yml` tự chạy kiểm tra/build và lưu các ZIP; bạn không phải build trên cPanel. Source và các ZIP đã build được lưu trong Git; cơ chế cPanel đang có tải gói `odproduct-update.zip` theo `deploy.json`. Hosting không chạy Node. Sửa trực tiếp file CSS/JS đã build trên hosting có hiệu lực khi tải lại, nhưng có thể bị thay bằng bản build tiếp theo; nên giữ thay đổi trong source Git.

URL mới là `/products`, `/blog/...`, `/admin/...`; link cũ `/#/...` được chuyển sang URL mới trong trình duyệt. Có hỗ trợ cài ở thư mục con.
