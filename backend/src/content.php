<?php
declare(strict_types=1);
require_once __DIR__ . "/bootstrap.php";

function content_locale(mixed $value): string
{
    return is_string($value) && in_array($value, ["en", "vi", "ko", "zh"], true)
        ? $value
        : "en";
}

function content_schema(): void
{
    static $ready = false;
    if ($ready) {
        return;
    }
    $marker = dirname(__DIR__) . "/storage/content-schema-v1";
    if (!is_file($marker)) {
        // Additive, idempotent migration. Never touches customers, orders or stock.
        $ddl = require __DIR__ . "/content-schema.php";
        db()->exec($ddl);
        @file_put_contents($marker, "1", LOCK_EX);
    }
    $ready = true;
}

function content_image(mixed $value): string
{
    $p = clean($value ?? "", 500);
    if ($p === "") {
        return "";
    }
    $base = rtrim(config()["url"], "/") . "/";
    if (str_starts_with($p, $base)) {
        $p = substr($p, strlen($base));
    }
    $sub = rtrim((string) parse_url($base, PHP_URL_PATH), "/");
    if ($sub !== "" && str_starts_with($p, $sub . "/")) {
        $p = substr($p, strlen($sub) + 1);
    }
    $p = ltrim($p, "/");
    if (
        !preg_match(
            '~^(uploads|images)/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp)$~',
            $p,
        ) ||
        str_contains($p, "..")
    ) {
        fail(
            422,
            "Hãy upload ảnh JPG, PNG hoặc WebP vào thư viện của website.",
        );
    }
    return $p;
}

function content_link(mixed $value): string
{
    $url = clean($value ?? "", 500);
    if ($url === "") {
        return "";
    }
    if (preg_match('~^/(?!/)[^\x00-\x20\\\\]*$~u', $url)) {
        return $url;
    }
    if (
        filter_var($url, FILTER_VALIDATE_URL) &&
        in_array(parse_url($url, PHP_URL_SCHEME), ["http", "https"], true)
    ) {
        return $url;
    }
    fail(422, "Liên kết cần bắt đầu bằng / hoặc https://.");
}

function content_defaults(): array
{
    $saved = setting("appearance");
    if ($saved) {
        return $saved;
    }
    return [
        "banners" => array_map(
            fn($row) => [
                "id" => $row[0],
                "enabled" => true,
                "image" => $row[1],
                "mobile_image" => "",
                "alt" => $row[2],
                "eyebrow" => $row[3],
                "title" => $row[4],
                "caption" => $row[5],
                "button" => "Explore the collection",
                "link" => $row[6],
                "theme" => "dark",
                "translations" => content_banner_translations($row[0]),
            ],
            [
                [
                    "sound",
                    "images/headphones.jpg",
                    "Wireless headphones on a desk",
                    "SOUND / EVERY DAY",
                    "Find your focus.",
                    "Sound for your space. Discover headphones for work, travel and everything in between.",
                    "/products?category=tai-nghe",
                ],
                [
                    "workspace",
                    "images/desk.jpg",
                    "A calm desk and workspace",
                    "WORK / YOUR WAY",
                    "Make room for ideas.",
                    "A thoughtful workspace starts with the things you use every day.",
                    "/products?category=ban-phim",
                ],
                [
                    "listen",
                    "images/speaker.jpg",
                    "A portable speaker",
                    "PRESS PLAY",
                    "Good sound. Anywhere.",
                    "Bring your favourite music a little closer.",
                    "/products?category=loa",
                ],
            ],
        ),
        "autoplay" => false,
        "interval" => 7,
        "brands" => [],
        "brands_enabled" => true,
        "brands_title" => "BRANDS",
        "brands_speed" => 35,
        "brands_translations" => [],
    ];
}

function content_save_appearance(array $b, array $u): array
{
    if (!is_array($b["banners"] ?? null) || count($b["banners"]) !== 3) {
        fail(422, "Cần đúng 3 banner; bạn có thể tắt từng banner.");
    }
    $banners = [];
    foreach ($b["banners"] as $i => $row) {
        $r = [
            "id" => "banner-" . ($i + 1),
            "enabled" => !empty($row["enabled"]),
            "image" => content_image($row["image"] ?? ""),
            "mobile_image" => content_image($row["mobile_image"] ?? ""),
            "theme" => ($row["theme"] ?? "") === "light" ? "light" : "dark",
        ];
        foreach (
            [
                "alt" => 250,
                "eyebrow" => 100,
                "title" => 200,
                "caption" => 1000,
                "button" => 100,
            ]
            as $key => $max
        ) {
            $r[$key] = clean($row[$key] ?? "", $max);
        }
        $r["link"] = content_link($row["link"] ?? "");
        if ($r["enabled"] && ($r["image"] === "" || $r["title"] === "")) {
            fail(422, "Banner đang bật cần có ảnh và tiêu đề.");
        }
        $r["translations"] = [];
        foreach (["vi", "ko", "zh"] as $lang) {
            $tr = $row["translations"][$lang] ?? [];
            foreach (
                [
                    "alt" => 250,
                    "eyebrow" => 100,
                    "title" => 200,
                    "caption" => 1000,
                    "button" => 100,
                ]
                as $k => $max
            ) {
                $r["translations"][$lang][$k] = clean($tr[$k] ?? "", $max);
            }
        }
        $banners[] = $r;
    }
    $brands = [];
    if (!is_array($b["brands"] ?? [])) {
        fail(422, "Danh sách thương hiệu không hợp lệ.");
    }
    // No fixed item count. The normal request size limit protects server memory.
    foreach ($b["brands"] ?? [] as $row) {
        $image = content_image($row["image"] ?? "");
        if ($image === "") {
            fail(422, "Mỗi thương hiệu cần có ảnh logo.");
        }
        $brands[] = [
            "id" => bin2hex(random_bytes(6)),
            "image" => $image,
            "name" => required($row, "name", 150),
            "link" => content_link($row["link"] ?? ""),
            "enabled" => !empty($row["enabled"]),
        ];
    }
    $value = [
        "banners" => $banners,
        "brands" => $brands,
        "autoplay" => !empty($b["autoplay"]),
        "interval" => integer($b["interval"] ?? 7, 4, 30),
        "brands_enabled" => !empty($b["brands_enabled"]),
        "brands_title" => clean($b["brands_title"] ?? "BRANDS", 100),
        "brands_speed" => integer($b["brands_speed"] ?? 35, 10, 120),
        "brands_translations" => [],
    ];
    foreach (["vi", "ko", "zh"] as $lang) {
        $value["brands_translations"][$lang] = clean(
            $b["brands_translations"][$lang] ?? "",
            100,
        );
    }
    query(
        "INSERT INTO settings(`key`,value) VALUES(?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
        ["appearance", json_value($value)],
    );
    audit(null, $u["email"], "admin", "appearance_updated", [
        "banners" => 3,
        "brands" => count($brands),
    ]);
    return ["ok" => true];
}

function content_save_seo(array $b, array $u): array
{
    $value = [];
    foreach (
        ["site_title" => 100, "description" => 320, "og_image" => 500]
        as $key => $max
    ) {
        $value[$key] = clean($b[$key] ?? "", $max);
    }
    $value["og_image"] = content_image($value["og_image"]);
    foreach (["en", "vi", "ko", "zh"] as $lang) {
        foreach (["title" => 100, "description" => 320] as $key => $max) {
            $value["translations"][$lang][$key] = clean(
                $b["translations"][$lang][$key] ?? "",
                $max,
            );
        }
    }
    query(
        "INSERT INTO settings(`key`,value) VALUES(?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
        ["seo", json_value($value)],
    );
    audit(null, $u["email"], "admin", "seo_updated");
    return ["ok" => true];
}

function content_sanitize(string $html): string
{
    if (!class_exists("DOMDocument")) {
        fail(503, "PHP cần bật extension DOM/XML để xử lý bài viết.");
    }
    if (strlen($html) > 500000) {
        fail(422, "Nội dung bài viết quá lớn.");
    }
    $doc = new DOMDocument("1.0", "UTF-8");
    $prior = libxml_use_internal_errors(true);
    $doc->loadHTML(
        '<?xml encoding="UTF-8"><html><body>' . $html . "</body></html>",
        LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING,
    );
    libxml_clear_errors();
    libxml_use_internal_errors($prior);
    $allowed = [
        "p",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "blockquote",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "figure",
        "figcaption",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "pre",
        "code",
        "hr",
        "br",
        "span",
    ];
    $drop = [
        "script",
        "style",
        "svg",
        "math",
        "iframe",
        "form",
        "input",
        "textarea",
        "select",
        "object",
        "embed",
        "template",
        "noscript",
    ];
    $counter = 0;
    $walk = function (DOMNode $node) use (
        &$walk,
        $allowed,
        $drop,
        $doc,
        &$counter,
    ) {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if (
                $child instanceof DOMComment ||
                $child instanceof DOMProcessingInstruction
            ) {
                $node->removeChild($child);
                continue;
            }
            if (!($child instanceof DOMElement)) {
                continue;
            }
            $tag = strtolower($child->tagName);
            if (in_array($tag, $drop, true)) {
                $node->removeChild($child);
                continue;
            }
            $walk($child);
            if (!in_array($tag, $allowed, true)) {
                while ($child->firstChild) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);
                continue;
            }
            $attrs = [];
            foreach (iterator_to_array($child->attributes) as $attr) {
                $attrs[$attr->name] = $attr->value;
            }
            foreach (array_keys($attrs) as $name) {
                $child->removeAttribute($name);
            }
            if ($tag === "a") {
                try {
                    $href = content_link($attrs["href"] ?? "");
                } catch (HttpError) {
                    $href = "";
                }
                if ($href !== "") {
                    $child->setAttribute("href", $href);
                    $child->setAttribute("rel", "noopener noreferrer");
                }
            }
            if ($tag === "img") {
                try {
                    $src = content_image($attrs["src"] ?? "");
                } catch (HttpError) {
                    $src = "";
                }
                if ($src === "") {
                    $node->removeChild($child);
                    continue;
                }
                $child->setAttribute(
                    "src",
                    rtrim(config()["url"], "/") . "/" . $src,
                );
                $child->setAttribute(
                    "alt",
                    mb_substr($attrs["alt"] ?? "", 0, 250),
                );
                $child->setAttribute("loading", "lazy");
                $child->setAttribute("decoding", "async");
            }
            if (in_array($tag, ["h2", "h3", "h4", "h5", "h6"], true)) {
                $child->setAttribute("id", "section-" . ++$counter);
            }
            if (
                in_array($tag, ["p", "h2", "h3", "h4", "th", "td"], true) &&
                preg_match(
                    '/^text-align:\s*(left|right|center|justify);?$/',
                    $attrs["style"] ?? "",
                    $m,
                )
            ) {
                $child->setAttribute("style", "text-align:" . $m[1]);
            }
            if (in_array($tag, ["td", "th"], true)) {
                foreach (["colspan", "rowspan"] as $a) {
                    if (
                        isset($attrs[$a]) &&
                        preg_match('/^[0-9]+$/D', $attrs[$a]) &&
                        (int) $attrs[$a] <= 20
                    ) {
                        $child->setAttribute($a, $attrs[$a]);
                    }
                }
            }
            if (
                $tag === "ol" &&
                isset($attrs["start"]) &&
                preg_match('/^[0-9]+$/D', $attrs["start"])
            ) {
                $child->setAttribute(
                    "start",
                    (string) min(10000, (int) $attrs["start"]),
                );
            }
        }
    };
    $body = $doc->getElementsByTagName("body")->item(0);
    $walk($body);
    $out = "";
    foreach ($body->childNodes as $node) {
        $out .= $doc->saveHTML($node);
    }
    return $out;
}

function blog_summary(array $row): array
{
    unset($row["content"]);
    return $row;
}
function blog_list(string $lang, bool $admin = false): array
{
    content_schema();
    $q = clean($_GET["q"] ?? "", 150);
    $page = integer($_GET["page"] ?? 1, 1, 100000);
    $limit = $admin ? 20 : 9;
    $where = $admin ? "1=1" : "status='published' AND published_at<=?";
    $args = $admin ? [] : [now()];
    if (!$admin || !empty($_GET["locale"])) {
        $where .= " AND locale=?";
        $args[] = $lang;
    }
    if (
        $admin &&
        !empty($_GET["status"]) &&
        in_array($_GET["status"], ["draft", "published", "archived"], true)
    ) {
        $where .= " AND status=?";
        $args[] = $_GET["status"];
    }
    if ($q !== "") {
        $where .= " AND (title LIKE ? OR excerpt LIKE ?)";
        $args[] = "%" . $q . "%";
        $args[] = "%" . $q . "%";
    }
    $total = (int) one(
        "SELECT COUNT(*) n FROM blog_posts WHERE " . $where,
        $args,
    )["n"];
    $rows = all(
        "SELECT id,translation_group,locale,slug,title,excerpt,cover_image,cover_alt,seo_title,seo_description,status,noindex,published_at,author_name,version,created_at,updated_at FROM blog_posts WHERE " .
            $where .
            " ORDER BY COALESCE(published_at,created_at) DESC,id DESC LIMIT " .
            $limit .
            " OFFSET " .
            ($page - 1) * $limit,
        $args,
    );
    return [
        "items" => $rows,
        "total" => $total,
        "page" => $page,
        "pages" => (int) ceil($total / $limit),
    ];
}
function blog_get(string $slug, string $lang, bool $admin = false): array
{
    content_schema();
    $row = $admin
        ? one("SELECT * FROM blog_posts WHERE id=?", [integer($slug, 1)])
        : one(
            "SELECT * FROM blog_posts WHERE locale=? AND slug=? AND status='published' AND published_at<=?",
            [$lang, $slug, now()],
        );
    if (!$row) {
        fail(404, "Bài viết không tồn tại hoặc chưa được xuất bản.");
    }
    $row["translations"] = all(
        "SELECT id,locale,slug,title FROM blog_posts WHERE translation_group=?" .
            ($admin ? "" : " AND status='published' AND published_at<=?"),
        $admin
            ? [$row["translation_group"]]
            : [$row["translation_group"], now()],
    );
    return $row;
}
function blog_save(array $b, array $u): array
{
    content_schema();
    $id = empty($b["id"]) ? null : integer($b["id"], 1);
    $slug = required($b, "slug", 180);
    if (!preg_match('/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u', $slug)) {
        fail(422, "Slug chỉ dùng chữ, số và dấu gạch ngang.");
    }
    $locale = content_locale($b["locale"] ?? "en");
    $state = $b["status"] ?? "draft";
    if (!in_array($state, ["draft", "published", "archived"], true)) {
        fail(422, "Trạng thái bài viết không hợp lệ.");
    }
    $title = required($b, "title", 200);
    $html = content_sanitize(clean($b["content"] ?? "", 500000));
    if ($state === "published" && trim(strip_tags($html)) === "") {
        fail(422, "Cần nội dung trước khi xuất bản.");
    }
    $published = $b["published_at"] ?? null ?: null;
    if ($published) {
        $normalized =
            str_replace("T", " ", $published) .
            (strlen($published) === 16 ? ":00" : "");
        $d = DateTime::createFromFormat("!Y-m-d H:i:s", $normalized);
        if (!$d || $d->format("Y-m-d H:i:s") !== $normalized) {
            fail(422, "Ngày xuất bản không hợp lệ.");
        }
        $published = $d->format("Y-m-d H:i:s");
    }
    if ($state === "published" && !$published) {
        $published = now();
    }
    $group = $b["translation_group"] ?? "";
    if (!preg_match('/^[a-f0-9]{32}$/', $group)) {
        $group = bin2hex(random_bytes(16));
    }
    $vals = [
        $group,
        $locale,
        $slug,
        $title,
        clean($b["excerpt"] ?? "", 1000),
        $html,
        content_image($b["cover_image"] ?? ""),
        clean($b["cover_alt"] ?? "", 250),
        clean($b["seo_title"] ?? "", 200),
        clean($b["seo_description"] ?? "", 320),
        $state,
        (int) !empty($b["noindex"]),
        $published,
        $u["id"],
        $u["name"],
    ];
    return transaction(function () use ($id, $b, $u, $vals, $locale, $slug) {
        if (
            one(
                "SELECT id FROM blog_posts WHERE translation_group=? AND locale=? AND id<>?",
                [$vals[0], $locale, $id ?? 0],
            )
        ) {
            fail(409, "Nhóm bài này đã có bản dịch trong ngôn ngữ được chọn.");
        }
        if (
            one(
                "SELECT id FROM blog_posts WHERE locale=? AND slug=? AND id<>?",
                [$locale, $slug, $id ?? 0],
            )
        ) {
            fail(409, "Đường dẫn đã được dùng trong ngôn ngữ này.");
        }
        if ($id) {
            $old = one("SELECT id FROM blog_posts WHERE id=? FOR UPDATE", [
                $id,
            ]);
            if (!$old) {
                fail(404, "Bài viết không tồn tại.");
            }
            $s = query(
                "UPDATE blog_posts SET translation_group=?,locale=?,slug=?,title=?,excerpt=?,content=?,cover_image=?,cover_alt=?,seo_title=?,seo_description=?,status=?,noindex=?,published_at=?,author_id=?,author_name=?,updated_at=?,version=version+1 WHERE id=? AND version=?",
                [...$vals, now(), $id, integer($b["version"] ?? 0, 1)],
            );
            if ($s->rowCount() !== 1) {
                fail(
                    409,
                    "Bài viết đã được chỉnh ở phiên khác. Tải lại trước khi lưu.",
                );
            }
        } else {
            query(
                "INSERT INTO blog_posts(translation_group,locale,slug,title,excerpt,content,cover_image,cover_alt,seo_title,seo_description,status,noindex,published_at,author_id,author_name,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [...$vals, now(), now()],
            );
            $id = (int) db()->lastInsertId();
        }
        audit(null, $u["email"], "admin", "blog_saved", [
            "id" => $id,
            "locale" => $locale,
            "status" => $vals[10],
        ]);
        return blog_get((string) $id, $locale, true);
    });
}

function content_translations(string $entity, int $id): array
{
    content_schema();
    $out = [];
    foreach (
        all(
            "SELECT locale,fields FROM content_translations WHERE entity=? AND entity_id=?",
            [$entity, $id],
        )
        as $row
    ) {
        $out[$row["locale"]] = json_decode($row["fields"], true);
    }
    return $out;
}
function content_save_translations(
    string $entity,
    int $id,
    array $translations,
): void {
    content_schema();
    foreach (["en", "vi", "ko", "zh"] as $lang) {
        $tr = $translations[$lang] ?? [];
        $fields = [];
        foreach (
            [
                "name" => 200,
                "description" => 20000,
                "seo_title" => 200,
                "seo_description" => 320,
            ]
            as $key => $max
        ) {
            $fields[$key] = clean($tr[$key] ?? "", $max);
        }
        query(
            "INSERT INTO content_translations(entity,entity_id,locale,fields) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE fields=VALUES(fields)",
            [$entity, $id, $lang, json_value($fields)],
        );
    }
}

function content_categories(): array
{
    content_schema();
    $rows = all("SELECT * FROM categories ORDER BY sort_order,id");
    foreach ($rows as &$row) {
        $row["translations"] = content_translations(
            "category",
            (int) $row["id"],
        );
    }
    return $rows;
}

function content_banner_translations(string $id): array
{
    $all = [
        "sound" => [
            "vi" => [
                "alt" => "Tai nghe không dây trên bàn",
                "eyebrow" => "ÂM THANH / MỖI NGÀY",
                "title" => "Tìm khoảng tập trung.",
                "caption" =>
                    "Âm thanh cho không gian của bạn. Khám phá tai nghe cho công việc, chuyến đi và những phút nghỉ.",
                "button" => "Khám phá bộ sưu tập",
            ],
            "ko" => [
                "alt" => "책상 위 무선 헤드폰",
                "eyebrow" => "일상 속 사운드",
                "title" => "나만의 집중을 찾다.",
                "caption" =>
                    "나의 공간을 채우는 사운드. 업무와 여행, 일상의 순간을 위한 헤드폰을 만나보세요.",
                "button" => "컬렉션 둘러보기",
            ],
            "zh" => [
                "alt" => "桌面上的无线耳机",
                "eyebrow" => "日常好声音",
                "title" => "找到专注的时刻。",
                "caption" =>
                    "用声音装点您的空间。探索适合工作、出行与日常休闲的耳机。",
                "button" => "探索系列",
            ],
        ],
        "workspace" => [
            "vi" => [
                "alt" => "Góc bàn làm việc gọn gàng",
                "eyebrow" => "LÀM VIỆC / THEO CÁCH BẠN",
                "title" => "Dành chỗ cho ý tưởng.",
                "caption" =>
                    "Một góc làm việc chỉn chu bắt đầu từ những vật dụng bạn dùng mỗi ngày.",
                "button" => "Khám phá bộ sưu tập",
            ],
            "ko" => [
                "alt" => "차분하고 깔끔한 작업 공간",
                "eyebrow" => "나만의 작업 방식",
                "title" => "아이디어를 위한 공간.",
                "caption" =>
                    "매일 사용하는 물건부터, 나에게 맞는 작업 공간을 완성해 보세요.",
                "button" => "컬렉션 둘러보기",
            ],
            "zh" => [
                "alt" => "整洁舒适的工作空间",
                "eyebrow" => "工作 / 随心而行",
                "title" => "为灵感留出空间。",
                "caption" => "用每天使用的好物，打造属于您的理想工作空间。",
                "button" => "探索系列",
            ],
        ],
        "listen" => [
            "vi" => [
                "alt" => "Loa di động",
                "eyebrow" => "BẬT BẢN NHẠC YÊU THÍCH",
                "title" => "Âm thanh hay. Mọi nơi.",
                "caption" => "Mang âm nhạc yêu thích đến gần bạn hơn.",
                "button" => "Khám phá bộ sưu tập",
            ],
            "ko" => [
                "alt" => "휴대용 스피커",
                "eyebrow" => "음악을 재생하세요",
                "title" => "어디서나 좋은 사운드.",
                "caption" => "좋아하는 음악을 더 가까이에서 즐겨보세요.",
                "button" => "컬렉션 둘러보기",
            ],
            "zh" => [
                "alt" => "便携式音箱",
                "eyebrow" => "即刻播放",
                "title" => "好声音。随处相伴。",
                "caption" => "让喜爱的音乐离您更近一些。",
                "button" => "探索系列",
            ],
        ],
    ];
    return $all[$id] ?? [];
}
