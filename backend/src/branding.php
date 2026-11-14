<?php
declare(strict_types=1);
require_once __DIR__ . "/content.php";

function branding_theme_defaults(): array
{
    return [
        "primary" => "#313131",
        "accent" => "#c5f36a",
        "background" => "#fffefb",
        "surface" => "#ffffff",
        "text" => "#272727",
        "header" => "#ffffff",
        "footer" => "#f5f5f5",
        "flash_background" => "#2f2f2f",
        "flash_text" => "#ffffff",
        "flash_accent" => "#c5f36a",
        "flash_surface" => "#ffffff",
        "flash_border" => "#e3e3e3",
        "sale" => "#b9402c",
    ];
}

function branding_defaults(): array
{
    $defaults = [
        "revision" => "default",
        "logo" => "",
        "footer_logo" => "",
        "favicon" => "",
        "wordmark" => "od.",
        "logo_alt" => "",
        "logo_width" => 112,
        "logo_mobile_width" => 88,
        "footer_logo_width" => 112,
        "loading" => [
            "enabled" => true,
            "image" => "",
            "width" => 128,
            "background" => "#ffffff",
            "shine" => true,
        ],
        "theme" => branding_theme_defaults(),
        "announcement_enabled" => true,
        "announcement" => "Technology accessories, choose to fit your needs.",
        "footer_title" => "Accessories for work.\nAnd hours of entertainment.",
        "footer_description" =>
            "Headset, keyboard, mouse and speakers.\nFind the right option for how you use it.",
        "translations" => [
            "vi" => [
                "announcement" => "Phụ kiện công nghệ, chọn vừa nhu cầu.",
                "footer_title" => "Phụ kiện cho công việc.\nVà giờ giải trí.",
                "footer_description" =>
                    "Tai nghe, bàn phím, chuột và loa.\nTìm lựa chọn phù hợp với cách bạn sử dụng.",
            ],
            "ko" => [
                "announcement" => "기술 액세서리를 필요에 맞게 선택하세요.",
                "footer_title" =>
                    "업무용 액세서리.\n그리고 몇 시간의 엔터테인먼트도 제공됩니다.",
                "footer_description" =>
                    "헤드셋, 키보드, 마우스 및 스피커.\n사용 방법에 적합한 옵션을 찾으십시오.",
            ],
            "zh" => [
                "announcement" => "科技配件，选择适合您的需求。",
                "footer_title" => "工作配件。\n以及数小时的娱乐活动。",
                "footer_description" =>
                    "耳机、键盘、鼠标和扬声器。\n找到适合您使用方式的正确选项。",
            ],
        ],
    ];
    $legacy = setting("store")["banner"] ?? "";
    if ($legacy !== "") {
        $defaults["announcement"] = $legacy;
        foreach (["vi", "ko", "zh"] as $lang) {
            $defaults["translations"][$lang]["announcement"] = "";
        }
    }
    $saved = setting("branding");
    // Existing stores keep their current palette and gain defaults without a migration.
    return array_replace_recursive($defaults, $saved);
}

function branding_save(array $b, array $u): array
{
    if (
        !is_array($b["theme"] ?? null) ||
        !is_array($b["loading"] ?? null) ||
        !is_array($b["translations"] ?? [])
    ) {
        fail(422, "Thiết kế cửa hàng không hợp lệ.");
    }
    $v = [];
    foreach (["logo", "footer_logo", "favicon"] as $k) {
        $v[$k] = content_image($b[$k] ?? "");
    }
    $v["wordmark"] = required($b, "wordmark", 80);
    $v["logo_alt"] = clean($b["logo_alt"] ?? "", 150);
    foreach (["logo_width", "logo_mobile_width", "footer_logo_width"] as $k) {
        $v[$k] = integer(
            $b[$k] ?? 112,
            32,
            $k === "logo_mobile_width" ? 160 : 240,
        );
    }
    foreach (branding_theme_defaults() as $k => $default) {
        $v["theme"][$k] = branding_color($b["theme"][$k] ?? $default);
    }
    $l = $b["loading"];
    $v["loading"] = [
        "enabled" => !empty($l["enabled"]),
        "image" => content_image($l["image"] ?? ""),
        "width" => integer($l["width"] ?? 128, 64, 240),
        "background" => branding_color($l["background"] ?? "#ffffff"),
        "shine" => !empty($l["shine"]),
    ];
    $v["announcement_enabled"] = !empty($b["announcement_enabled"]);
    foreach (
        [
            "announcement" => 250,
            "footer_title" => 300,
            "footer_description" => 1000,
        ]
        as $k => $max
    ) {
        $v[$k] = clean($b[$k] ?? "", $max);
        foreach (["vi", "ko", "zh"] as $lang) {
            if (!is_array($b["translations"][$lang] ?? [])) {
                fail(422, "Thiết kế cửa hàng không hợp lệ.");
            }
            $v["translations"][$lang][$k] = clean(
                $b["translations"][$lang][$k] ?? "",
                $max,
            );
        }
    }
    return transaction(function () use ($v, $b, $u) {
        $row = one(
            "SELECT value FROM settings WHERE `key`='branding' FOR UPDATE",
        );
        $current = $row ? json_decode($row["value"], true) : [];
        if (
            ($b["revision"] ?? "default") !==
            ($current["revision"] ?? "default")
        ) {
            fail(
                409,
                "Thiết kế đã được chỉnh ở phiên khác. Tải lại trước khi lưu.",
            );
        }
        $v["revision"] = bin2hex(random_bytes(8));
        query(
            "INSERT INTO settings(`key`,value) VALUES('branding',?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
            [json_value($v)],
        );
        audit(null, $u["email"], "admin", "branding_updated", [
            "revision" => $v["revision"],
        ]);
        return branding_defaults();
    });
}

function branding_color(mixed $value): string
{
    if (!is_string($value) || !preg_match('/^#[a-f0-9]{6}$/i', $value)) {
        fail(422, "Màu cần có dạng HEX gồm 6 ký tự, ví dụ #313131.");
    }
    return strtolower($value);
}

function branding_ink(string $hex): string
{
    $rgb = array_map(
        fn($v) => $v / 255 <= 0.04045
            ? $v / 255 / 12.92
            : (($v / 255 + 0.055) / 1.055) ** 2.4,
        [
            hexdec(substr($hex, 1, 2)),
            hexdec(substr($hex, 3, 2)),
            hexdec(substr($hex, 5, 2)),
        ],
    );
    $l = $rgb[0] * 0.2126 + $rgb[1] * 0.7152 + $rgb[2] * 0.0722;
    return 1.05 / ($l + 0.05) > ($l + 0.05) / 0.05 ? "#ffffff" : "#000000";
}

function branding_variables(array $b): array
{
    $vars = [];
    foreach ($b["theme"] as $k => $color) {
        if (preg_match('/^#[a-f0-9]{6}$/i', (string) $color)) {
            $vars["--od-" . str_replace("_", "-", $k)] = $color;
        }
    }
    foreach (
        [
            "primary",
            "accent",
            "sale",
            "header",
            "footer",
            "flash_surface",
            "surface",
        ]
        as $k
    ) {
        $vars["--od-on-" . str_replace("_", "-", $k)] = branding_ink(
            $b["theme"][$k],
        );
    }
    $vars["--od-loading-bg"] = $b["loading"]["background"];
    $vars["--od-loading-ink"] = branding_ink($b["loading"]["background"]);
    $vars["--od-loading-width"] = (int) $b["loading"]["width"] . "px";
    $vars["--od-loading-mobile-width"] =
        round((int) $b["loading"]["width"] * 0.875) . "px";
    return $vars;
}
