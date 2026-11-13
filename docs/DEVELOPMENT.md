# Phát triển local

Cần Node.js 22+ và Docker Compose. Docker chỉ dành cho phát triển; không cài Docker lên cPanel để chạy ứng dụng.

```bash
npm ci
npm run setup:local
# Sinh work/config.local.php có key ngẫu nhiên, bị gitignore.
docker compose up -d --build
docker compose exec api php backend/bin/console.php migrate
docker compose exec api php backend/bin/console.php seed
docker compose exec api php backend/bin/console.php user admin@example.com 'Quản trị local'
npm run dev
```

API bind localhost:8081, Vite ở localhost:5173 và proxy `/api`, `/uploads`. Database không mở cổng public. Mật khẩu trong compose chỉ dành development, không dùng production. Chưa chạy chuỗi lệnh runtime này trong đợt bàn giao source trước.

Nếu build trong môi trường có CA của proxy riêng, dùng secret BuildKit thay vì tắt kiểm tra TLS:

```bash
docker build --secret id=proxy_ca,src=/path/to/combined-ca.pem -t odproduct-php .
docker compose up -d --no-build
```

Trong môi trường thông thường không có proxy CA, `docker compose up --build` không cần secret. Dockerfile không lưu CA/credential vào image.

```bash
npm run check        # TypeScript
npm run check:php    # Parser PHP 8.2, không thực thi PHP
npm run build        # Hai kiểm tra cú pháp trên + Vite + gói cPanel
npm run format       # Định dạng source, không chạy test
npm run demo:sql     # Sinh lại demo.sql sau khi đổi fixture JSON
```

Không có test suite nghiệp vụ đã thực thi. Dùng [MANUAL-QA.md](MANUAL-QA.md) khi bắt đầu tự kiểm thử. Nếu cần test tự động, tạo DB test tách biệt và không dùng token Telegram/ngân hàng production.

Không chỉnh file trong `dist/` hay `build/cpanel/` làm source; build sẽ sinh lại. Database schema và demo SQL được commit. PHP không dùng Composer, không yêu cầu extension build riêng trên cPanel.
