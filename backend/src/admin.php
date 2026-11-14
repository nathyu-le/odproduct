<?php
require_once __DIR__ . "/commerce.php";
function save_product(array $b, array $u): array
{
    content_schema();
    return transaction(function () use ($b, $u) {
        $id = isset($b["id"]) ? integer($b["id"], 1) : null;
        $name = required($b, "name", 180);
        $slug = required($b, "slug", 180);
        if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
            fail(422, "Slug chỉ chứa a-z, số và dấu gạch ngang.");
        }
        $images = $b["images"] ?? [];
        if (!is_array($images) || count($images) > 12) {
            fail(422, "Tối đa 12 ảnh.");
        }
        foreach ($images as $image) {
            if (
                !is_string($image) ||
                strlen($image) > 500 ||
                !preg_match(
                    '~^(images/|uploads/)[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp)$~',
                    $image,
                ) ||
                str_contains($image, "..")
            ) {
                fail(422, "Ảnh phải được upload hoặc thuộc thư mục images.");
            }
        }
        $category = integer($b["category_id"] ?? null, 1);
        $flash =
            ($b["flash_price"] ?? "") !== ""
                ? integer($b["flash_price"])
                : null;
        $start = $b["flash_start"] ?? null ?: null;
        $end = $b["flash_end"] ?? null ?: null;
        if (
            $flash !== null &&
            (!$start || !$end || strtotime($end) <= strtotime($start))
        ) {
            fail(422, "Thời gian flash sale không hợp lệ.");
        }
        $vals = [
            $category,
            $name,
            $slug,
            clean($b["brand"] ?? "", 80),
            clean($b["description"] ?? "", 20000),
            json_value($images),
            (int) !empty($b["active"]),
            (int) !empty($b["featured"]),
            (int) !empty($b["pinned"]),
            integer($b["sort_order"] ?? 0),
            $flash,
            $start,
            $end,
        ];
        if ($id) {
            query(
                "UPDATE products SET category_id=?,name=?,slug=?,brand=?,description=?,images=?,active=?,featured=?,pinned=?,sort_order=?,flash_price=?,flash_start=?,flash_end=? WHERE id=?",
                [...$vals, $id],
            );
        } else {
            query(
                "INSERT INTO products(category_id,name,slug,brand,description,images,active,featured,pinned,sort_order,flash_price,flash_start,flash_end,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [...$vals, now()],
            );
            $id = (int) db()->lastInsertId();
        }
        $variants = $b["variants"] ?? [];
        if (
            !is_array($variants) ||
            !count($variants) ||
            count($variants) > 30
        ) {
            fail(422, "Cần từ 1 đến 30 biến thể.");
        }
        foreach ($variants as $v) {
            $vals = [
                $id,
                required($v, "sku", 80),
                required($v, "name", 100),
                integer($v["price"]),
                integer($v["cost"]),
                integer($v["stock"], 0, 1000000),
                (int) !empty($v["active"]),
            ];
            if (!empty($v["id"])) {
                $previous = one(
                    "SELECT stock FROM variants WHERE id=? AND product_id=? FOR UPDATE",
                    [$v["id"], $id],
                );
                query(
                    "UPDATE variants SET product_id=?,sku=?,name=?,price=?,cost=?,stock=?,active=?,version=version+1 WHERE id=? AND product_id=? AND version=?",
                    [
                        ...$vals,
                        integer($v["id"], 1),
                        $id,
                        integer($v["version"] ?? null, 1),
                    ],
                );
                if ((int) query("SELECT ROW_COUNT() n")->fetch()["n"] !== 1) {
                    fail(
                        409,
                        "Tồn kho/biến thể đã được cập nhật. Tải lại danh sách sản phẩm rồi sửa lại.",
                    );
                }
                $delta = (int) $v["stock"] - (int) $previous["stock"];
                if ($delta) {
                    inventory((int) $v["id"], null, $delta, "admin_adjustment");
                }
            } else {
                query(
                    "INSERT INTO variants(product_id,sku,name,price,cost,stock,active) VALUES(?,?,?,?,?,?,?)",
                    $vals,
                );
            }
        }
        if (isset($b["translations"]) && is_array($b["translations"])) {
            content_save_translations("product", (int) $id, $b["translations"]);
        }
        audit(null, $u["email"], "admin", "product_saved", [
            "product_id" => $id,
            "name" => $name,
            "variants" => array_map(
                fn($v) => array_intersect_key(
                    $v,
                    array_flip([
                        "id",
                        "sku",
                        "name",
                        "price",
                        "cost",
                        "stock",
                        "active",
                    ]),
                ),
                $variants,
            ),
        ]);
        return ["id" => $id];
    });
}
function save_settings(string $key, array $b, array $u): array
{
    if (!in_array($key, ["store", "shipping", "payment"], true)) {
        fail(422, "Thiết lập không hợp lệ.");
    }
    if ($key === "shipping") {
        foreach (["base_fee", "per_km", "max_km", "free_above"] as $k) {
            $b[$k] = integer($b[$k] ?? null);
        }
        $b["included_km"] = filter_var(
            $b["included_km"] ?? null,
            FILTER_VALIDATE_FLOAT,
        );
        if (
            $b["included_km"] === false ||
            $b["included_km"] < 0 ||
            $b["included_km"] > $b["max_km"]
        ) {
            fail(422, "Số km bao gồm không hợp lệ.");
        }
        $b["round_step"] = (float) ($b["round_step"] ?? 0);
        if (
            !in_array(
                $b["round_mode"] ?? "",
                ["ceil", "nearest", "exact"],
                true,
            ) ||
            $b["round_step"] <= 0 ||
            $b["round_step"] > 10
        ) {
            fail(422, "Quy tắc làm tròn không hợp lệ.");
        }
        foreach (["origin_lat" => 90, "origin_lng" => 180] as $k => $max) {
            if (!is_numeric($b[$k] ?? null) || abs((float) $b[$k]) > $max) {
                fail(422, "Tọa độ kho không hợp lệ.");
            }
        }
    }
    if ($key === "payment") {
        foreach (
            [
                "bank_bin",
                "bank_account",
                "bank_owner",
                "instructions",
                "transfer_template",
            ]
            as $k
        ) {
            $b[$k] = clean($b[$k] ?? "", 500);
        }
        if (!str_contains($b["transfer_template"], "{code}")) {
            fail(422, "Nội dung chuyển khoản cần có {code}.");
        }
        $b["demo"] = (bool) ($b["demo"] ?? true);
        $b["cod"] = (bool) ($b["cod"] ?? false);
        $b["bank"] = (bool) ($b["bank"] ?? false);
        if (
            $b["bank"] &&
            (!preg_match('/^[0-9]{6}$/', $b["bank_bin"]) ||
                !preg_match('/^[A-Za-z0-9]{5,30}$/', $b["bank_account"]) ||
                $b["bank_owner"] === "")
        ) {
            fail(
                422,
                "Cần mã BIN 6 số, số tài khoản và tên chủ tài khoản hợp lệ.",
            );
        }
        if (!$b["cod"] && !$b["bank"]) {
            fail(422, "Cần ít nhất một phương thức thanh toán.");
        }
    }
    if ($key === "store") {
        foreach (
            [
                "name",
                "address",
                "phone",
                "email",
                "hero_title",
                "hero_subtitle",
                "banner",
            ]
            as $k
        ) {
            $b[$k] = clean($b[$k] ?? "", 1000);
        }
    }
    query(
        "INSERT INTO settings(`key`,value) VALUES(?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
        [$key, json_value($b)],
    );
    audit(null, $u["email"], "admin", "settings_updated", ["key" => $key]);
    return ["ok" => true];
}
function upload_image(): array
{
    if (
        empty($_FILES["image"]) ||
        $_FILES["image"]["error"] !== UPLOAD_ERR_OK
    ) {
        fail(422, "Không nhận được ảnh.");
    }
    $f = $_FILES["image"];
    if ($f["size"] > 5 * 1024 * 1024) {
        fail(422, "Ảnh tối đa 5MB.");
    }
    $type = (new finfo(FILEINFO_MIME_TYPE))->file($f["tmp_name"]);
    $ext =
        ["image/jpeg" => "jpg", "image/png" => "png", "image/webp" => "webp"][
            $type
        ] ?? null;
    $size = getimagesize($f["tmp_name"]);
    if (!$ext || !$size || $size[0] > 6000 || $size[1] > 6000) {
        fail(422, "Chỉ nhận ảnh JPG, PNG, WebP tối đa 6000px.");
    }
    $dir = dirname(__DIR__, 2) . "/uploads";
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $name = bin2hex(random_bytes(20)) . "." . $ext;
    if (!move_uploaded_file($f["tmp_name"], $dir . "/" . $name)) {
        fail(500, "Không lưu được ảnh.");
    }
    return ["path" => "uploads/" . $name];
}

function save_flash_sale(array $b, array $u): array
{
    return transaction(function () use ($b, $u) {
        $id = integer($b["id"] ?? null, 1);
        $p = one("SELECT * FROM products WHERE id=? FOR UPDATE", [$id]);
        if (!$p) {
            fail(404, "Không tìm thấy sản phẩm.");
        }
        if (empty($b["enabled"])) {
            query(
                "UPDATE products SET flash_price=NULL,flash_start=NULL,flash_end=NULL WHERE id=?",
                [$id],
            );
            audit(null, $u["email"], "admin", "flash_sale_disabled", [
                "product_id" => $id,
            ]);
            return ["ok" => true];
        }
        $price = integer($b["flash_price"] ?? null, 1);
        $start = required($b, "flash_start", 25);
        $end = required($b, "flash_end", 25);
        $startTime = strtotime($start);
        $endTime = strtotime($end);
        if (!$startTime || !$endTime || $endTime <= $startTime) {
            fail(422, "Giờ kết thúc phải sau giờ bắt đầu.");
        }
        $min = one(
            "SELECT MIN(price) price FROM variants WHERE product_id=? AND active=1",
            [$id],
        );
        if (!$min || $min["price"] === null || $price >= (int) $min["price"]) {
            fail(
                422,
                "Giá Flash sale phải thấp hơn giá bán của các biến thể đang hoạt động.",
            );
        }
        query(
            "UPDATE products SET flash_price=?,flash_start=?,flash_end=? WHERE id=?",
            [
                $price,
                date("Y-m-d H:i:s", $startTime),
                date("Y-m-d H:i:s", $endTime),
                $id,
            ],
        );
        audit(null, $u["email"], "admin", "flash_sale_scheduled", [
            "product_id" => $id,
            "price" => $price,
            "start" => $start,
            "end" => $end,
        ]);
        return ["ok" => true];
    });
}
function dashboard_data(string $from, string $to): array
{
    $report = report($from, $to);
    $statuses = [];
    $payments = [];
    foreach ($report["rows"] as $o) {
        $statuses[$o["status"]] = ($statuses[$o["status"]] ?? 0) + 1;
        $payments[$o["payment_status"]] =
            ($payments[$o["payment_status"]] ?? 0) + 1;
    }
    $lowStock = all(
        "SELECT v.id,v.name variant_name,v.sku,v.stock,p.name,p.slug,p.images FROM variants v JOIN products p ON p.id=v.product_id WHERE v.active=1 AND p.active=1 AND v.stock<=5 ORDER BY v.stock,p.name LIMIT 6",
    );
    foreach ($lowStock as &$p) {
        $p["image"] = json_decode($p["images"], true)[0] ?? "";
    }
    return [
        "report" => $report,
        "statuses" => $statuses,
        "payments" => $payments,
        "low_stock" => $lowStock,
        "low_stock_count" => (int) one(
            "SELECT COUNT(*) n FROM variants v JOIN products p ON p.id=v.product_id WHERE v.active=1 AND p.active=1 AND v.stock<=5",
        )["n"],
        "server_time" => date(DATE_ATOM),
    ];
}
