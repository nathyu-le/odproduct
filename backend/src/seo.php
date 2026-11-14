<?php
declare(strict_types=1);
require_once __DIR__ . "/commerce.php";

function seo_escape(mixed $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8");
}
function seo_words(string $key, string $lang): string
{
    $words = [
        "home" => [
            "Technology for every day",
            "Phụ kiện công nghệ mỗi ngày",
            "일상을 위한 테크 액세서리",
            "日常科技配件",
        ],
        "products" => [
            "Shop all products",
            "Tất cả sản phẩm",
            "전체 상품",
            "全部商品",
        ],
        "flash-sale" => [
            "Flash sale",
            "Ưu đãi giới hạn",
            "타임 세일",
            "限时优惠",
        ],
        "blog" => ["Journal", "Bài viết", "저널", "品牌日志"],
        "cart" => ["Shopping bag", "Giỏ hàng", "장바구니", "购物袋"],
        "checkout" => ["Checkout", "Đặt hàng", "주문 결제", "结账"],
        "lookup" => [
            "Track your orders",
            "Tra cứu đơn hàng",
            "주문 조회",
            "订单查询",
        ],
        "order" => [
            "Order details",
            "Chi tiết đơn hàng",
            "주문 내역",
            "订单详情",
        ],
        "admin" => [
            "Store administration",
            "Quản trị cửa hàng",
            "스토어 관리",
            "商店管理",
        ],
        "404" => [
            "Page not found",
            "Trang không tồn tại",
            "페이지를 찾을 수 없습니다",
            "页面不存在",
        ],
        "description" => [
            "Headphones, keyboards, mice and speakers. Explore accessories for work and everyday listening.",
            "Tai nghe, bàn phím, chuột và loa. Khám phá phụ kiện cho công việc và cuộc sống.",
            "헤드폰, 키보드, 마우스, 스피커. 업무와 일상을 위한 액세서리를 만나보세요.",
            "耳机、键盘、鼠标和音箱。探索适合工作与日常生活的科技配件。",
        ],
    ];
    return $words[$key][array_search($lang, ["en", "vi", "ko", "zh"], true)] ??
        $key;
}
function seo_localized(array $value, string $lang): array
{
    static $words;
    $words ??= require __DIR__ . "/locales.php";
    foreach (["name", "description", "category"] as $field) {
        if (isset($value[$field]) && is_string($value[$field])) {
            $value[$field] = $words[$lang][$value[$field]] ?? $value[$field];
        }
    }
    foreach ($value["translations"][$lang] ?? [] as $k => $v) {
        if (is_string($v) && $v !== "") {
            $value[$k] = $v;
        }
    }
    return $value;
}
function seo_url(string $path, string $lang = "en"): string
{
    return rtrim(config()["url"], "/") .
        ($lang === "en" ? "" : "/" . $lang) .
        ($path === "/" ? "" : $path) .
        ($path === "/" && $lang === "en" ? "/" : "");
}
function seo_page(string $path, string $lang): array
{
    $store = setting("store");
    $seo = setting("seo");
    $tr = $seo["translations"][$lang] ?? [];
    $name = $store["name"] ?? "OD. Store";
    $segments = explode("/", trim($path, "/"));
    $section = $segments[0] ?: "home";
    $page = [
        "title" => seo_words($section, $lang) . " | " . $name,
        "description" =>
            $tr["description"] ?? "" ?:
            $seo["description"] ?? "" ?:
            seo_words("description", $lang),
        "image" => $seo["og_image"] ?? "",
        "canonical" => seo_url($path, $lang),
        "private" => in_array(
            $section,
            ["admin", "order", "cart", "checkout", "lookup"],
            true,
        ),
        "status" => 200,
        "body" => "",
        "schema" => [],
        "alternates" => [],
        "kind" => "website",
    ];
    if ($section === "home") {
        $page["title"] = $tr["title"] ?? "" ?: $seo["site_title"] ?? "";
        if ($page["title"] === "") {
            $page["title"] = seo_words("home", $lang) . " | " . $name;
        }
        $page["body"] =
            "<h1>" .
            seo_escape(seo_words("home", $lang)) .
            "</h1><p>" .
            seo_escape($page["description"]) .
            "</p>";
        foreach (content_defaults()["banners"] as $banner) {
            if ($banner["enabled"]) {
                $banner = seo_localized($banner, $lang);
                $page["body"] .=
                    "<section><h2>" .
                    seo_escape($banner["title"]) .
                    "</h2><p>" .
                    seo_escape($banner["caption"]) .
                    "</p></section>";
            }
        }
        $page["schema"][] = [
            "@context" => "https://schema.org",
            "@type" => "Store",
            "name" => $name,
            "url" => seo_url("/"),
            "telephone" => $store["phone"] ?? "",
            "address" => [
                "@type" => "PostalAddress",
                "streetAddress" => $store["address"] ?? "",
            ],
        ];
    } elseif ($section === "product" && !empty($segments[1])) {
        $slug = rawurldecode($segments[1]);
        $product = null;
        foreach (catalog() as $p) {
            if ($p["slug"] === $slug) {
                $product = seo_localized($p, $lang);
                break;
            }
        }
        if (!$product) {
            $page["status"] = 404;
        } else {
            $page["title"] =
                $product["seo_title"] ?? "" ?: $product["name"] . " | " . $name;
            $page["description"] =
                $product["seo_description"] ?? "" ?:
                mb_substr(
                    preg_replace(
                        "/\s+/u",
                        " ",
                        strip_tags($product["description"]),
                    ),
                    0,
                    180,
                );
            $page["image"] = $product["images"][0] ?? "";
            $page["body"] =
                "<article><h1>" .
                seo_escape($product["name"]) .
                "</h1><p>" .
                nl2br(seo_escape($product["description"])) .
                "</p><p>" .
                seo_escape(number_format((float) $product["price"])) .
                " VND</p></article>";
            $page["schema"][] = [
                "@context" => "https://schema.org",
                "@type" => "Product",
                "name" => $product["name"],
                "description" => $product["description"],
                "image" => array_map(
                    fn($i) => rtrim(config()["url"], "/") . "/" . $i,
                    $product["images"],
                ),
                "brand" => ["@type" => "Brand", "name" => $product["brand"]],
                "offers" => [
                    "@type" => "AggregateOffer",
                    "priceCurrency" => "VND",
                    "lowPrice" => min(
                        array_column($product["variants"], "price") ?: [0],
                    ),
                    "highPrice" => max(
                        array_column($product["variants"], "price") ?: [0],
                    ),
                    "offerCount" => count($product["variants"]),
                    "availability" =>
                        array_sum(array_column($product["variants"], "stock")) >
                        0
                            ? "https://schema.org/InStock"
                            : "https://schema.org/OutOfStock",
                    "url" => $page["canonical"],
                ],
            ];
        }
    } elseif ($section === "blog" && !empty($segments[1])) {
        try {
            $post = blog_get(rawurldecode($segments[1]), $lang);
        } catch (HttpError $e) {
            if ($e->status !== 404) {
                throw $e;
            }
            $post = null;
        }
        if (!$post) {
            $page["status"] = 404;
        } else {
            $page["kind"] = "article";
            $page["title"] =
                $post["seo_title"] ?: $post["title"] . " | " . $name;
            $page["description"] = $post["seo_description"] ?: $post["excerpt"];
            $page["image"] = $post["cover_image"];
            $page["private"] = (bool) $post["noindex"];
            $page["body"] =
                "<article><h1>" .
                seo_escape($post["title"]) .
                "</h1><p>" .
                seo_escape($post["excerpt"]) .
                "</p>" .
                $post["content"] .
                "</article>";
            $page["schema"][] = [
                "@context" => "https://schema.org",
                "@type" => "BlogPosting",
                "headline" => $post["title"],
                "description" => $page["description"],
                "inLanguage" => $lang,
                "datePublished" => date(
                    DATE_ATOM,
                    strtotime($post["published_at"]),
                ),
                "dateModified" => date(
                    DATE_ATOM,
                    strtotime($post["updated_at"]),
                ),
                "author" => [
                    "@type" => "Person",
                    "name" => $post["author_name"],
                ],
                "publisher" => ["@type" => "Organization", "name" => $name],
                "mainEntityOfPage" => $page["canonical"],
                "image" => $post["cover_image"]
                    ? rtrim(config()["url"], "/") . "/" . $post["cover_image"]
                    : null,
            ];
            foreach ($post["translations"] as $r) {
                $page["alternates"][$r["locale"]] = seo_url(
                    "/blog/" . rawurlencode($r["slug"]),
                    $r["locale"],
                );
            }
        }
    } elseif (in_array($section, ["products", "flash-sale"], true)) {
        $page["body"] =
            "<h1>" . seo_escape(seo_words($section, $lang)) . "</h1><ul>";
        foreach (catalog() as $product) {
            $product = seo_localized($product, $lang);
            $page["body"] .=
                '<li><a href="' .
                seo_escape(
                    seo_url(
                        "/product/" . rawurlencode($product["slug"]),
                        $lang,
                    ),
                ) .
                '">' .
                seo_escape($product["name"]) .
                "</a></li>";
        }
        $page["body"] .= "</ul>";
    } elseif ($section === "blog") {
        $page["body"] = "<h1>" . seo_escape(seo_words("blog", $lang)) . "</h1>";
        foreach (blog_list($lang)["items"] as $post) {
            $page["body"] .=
                '<article><h2><a href="' .
                seo_escape(
                    seo_url("/blog/" . rawurlencode($post["slug"]), $lang),
                ) .
                '">' .
                seo_escape($post["title"]) .
                "</a></h2><p>" .
                seo_escape($post["excerpt"]) .
                "</p></article>";
        }
    } elseif (!$page["private"]) {
        $page["status"] = 404;
    }
    if ($page["status"] === 404) {
        $page["private"] = true;
        $page["title"] = seo_words("404", $lang) . " | " . $name;
        $page["body"] = "<h1>" . seo_escape(seo_words("404", $lang)) . "</h1>";
    }
    if (!$page["alternates"] && !$page["private"]) {
        foreach (["en", "vi", "ko", "zh"] as $l) {
            $page["alternates"][$l] = seo_url($path, $l);
        };
    }
    if (!$page["private"]) {
        $page["schema"][] = [
            "@context" => "https://schema.org",
            "@type" => "BreadcrumbList",
            "itemListElement" => array_values(
                array_filter([
                    [
                        "@type" => "ListItem",
                        "position" => 1,
                        "name" => $name,
                        "item" => seo_url("/", $lang),
                    ],
                    $section === "home"
                        ? null
                        : [
                            "@type" => "ListItem",
                            "position" => 2,
                            "name" =>
                                $section === "product"
                                    ? $product["name"] ?? $section
                                    : seo_words($section, $lang),
                            "item" => $page["canonical"],
                        ],
                ]),
            ),
        ];
    }
    return $page;
}
function seo_xml(): never
{
    content_schema();
    header("Content-Type: application/xml; charset=utf-8");
    $urls = [];
    foreach (["en", "vi", "ko", "zh"] as $lang) {
        foreach (["/", "/products", "/flash-sale", "/blog"] as $p) {
            $urls[] = ["loc" => seo_url($p, $lang)];
        }
        foreach (all("SELECT slug FROM products WHERE active=1") as $p) {
            $urls[] = [
                "loc" => seo_url("/product/" . rawurlencode($p["slug"]), $lang),
            ];
        }
    }
    foreach (
        all(
            "SELECT locale,slug,updated_at FROM blog_posts WHERE status='published' AND published_at<=? AND noindex=0",
            [now()],
        )
        as $p
    ) {
        $urls[] = [
            "loc" => seo_url("/blog/" . rawurlencode($p["slug"]), $p["locale"]),
            "lastmod" => date(DATE_ATOM, strtotime($p["updated_at"])),
        ];
    }
    echo '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    foreach ($urls as $r) {
        echo "<url><loc>" . seo_escape($r["loc"]) . "</loc>";
        if (isset($r["lastmod"])) {
            echo "<lastmod>" . seo_escape($r["lastmod"]) . "</lastmod>";
        }
        echo "</url>";
    }
    echo "</urlset>";
    exit();
}
