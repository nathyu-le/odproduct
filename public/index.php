<?php
header("Cache-Control: no-store, no-cache, must-revalidate");
if (PHP_VERSION_ID >= 80200) {
    require_once __DIR__ . "/api/src/updater.php";
    deployment_prepare_access();
}
if (
    PHP_VERSION_ID < 80200 ||
    !is_file(getenv("OD_CONFIG") ?: __DIR__ . "/api/config.php")
) {
    $base = rtrim(
        str_replace(
            "\\",
            "/",
            dirname($_SERVER["SCRIPT_NAME"] ?? "/index.php"),
        ),
        "/.",
    );
    header("Location: " . $base . "/api/install.php");
    exit();
}
require_once __DIR__ . "/api/src/seo.php";
try {
    $base = rtrim(
        str_replace(
            "\\",
            "/",
            dirname($_SERVER["SCRIPT_NAME"] ?? "/index.php"),
        ),
        "/.",
    );
    $request = parse_url($_SERVER["REQUEST_URI"] ?? "/", PHP_URL_PATH) ?: "/";
    $path = "/" . ltrim(substr($request, strlen($base)), "/");
    if ($path === "/sitemap.xml") {
        seo_xml();
    }
    if ($path === "/robots.txt") {
        header("Content-Type: text/plain; charset=utf-8");
        echo "User-agent: *\nDisallow: " .
            $base .
            "/api/\nDisallow: " .
            $base .
            "/admin\nDisallow: " .
            $base .
            "/order/\nDisallow: " .
            $base .
            "/lookup\nDisallow: " .
            $base .
            "/checkout\nDisallow: " .
            $base .
            "/cart\nSitemap: " .
            rtrim(config()["url"], "/") .
            "/sitemap.xml\n";
        exit();
    }
    $lang = "en";
    $prefix = "";
    if (preg_match('~^/(vi|ko|zh|en)(/|$)~', $path, $m)) {
        $lang = $m[1];
        $prefix = "/" . $lang;
        $path = substr($path, strlen($prefix)) ?: "/";
        if ($lang === "en") {
            header(
                "Location: " .
                    $base .
                    $path .
                    (empty($_SERVER["QUERY_STRING"])
                        ? ""
                        : "?" . $_SERVER["QUERY_STRING"]),
                true,
                301,
            );
            exit();
        }
    }
    if (str_starts_with($path, "/admin")) {
        if ($prefix !== "") {
            header(
                "Location: " .
                    $base .
                    $path .
                    (empty($_SERVER["QUERY_STRING"])
                        ? ""
                        : "?" . $_SERVER["QUERY_STRING"]),
                true,
                301,
            );
            exit();
        }
        $lang = "vi";
    }
    if ($path === "/index.php" || $path === "/index.html") {
        header("Location: " . $base . "/", true, 301);
        exit();
    }
    $page = seo_page($path, $lang);
    http_response_code($page["status"]);
    if ($page["private"]) {
        header("X-Robots-Tag: noindex, nofollow");
    }
    $head = '<base href="' . seo_escape($base . "/") . '">';
    $head .=
        '<meta name="description" content="' .
        seo_escape($page["description"]) .
        '"><title>' .
        seo_escape($page["title"]) .
        "</title>";
    $head .=
        '<meta name="robots" content="' .
        ($page["private"]
            ? "noindex,nofollow"
            : "index,follow,max-image-preview:large") .
        '">';
    $head .=
        '<link rel="canonical" href="' . seo_escape($page["canonical"]) . '">';
    foreach ($page["alternates"] as $l => $url) {
        $head .=
            '<link rel="alternate" hreflang="' .
            seo_escape($l) .
            '" href="' .
            seo_escape($url) .
            '">';
    }
    if (isset($page["alternates"]["en"])) {
        $head .=
            '<link rel="alternate" hreflang="x-default" href="' .
            seo_escape($page["alternates"]["en"]) .
            '">';
    }
    foreach (
        [
            "og:title" => $page["title"],
            "og:description" => $page["description"],
            "og:type" => $page["kind"],
            "og:url" => $page["canonical"],
            "og:locale" => [
                "en" => "en_US",
                "vi" => "vi_VN",
                "ko" => "ko_KR",
                "zh" => "zh_CN",
            ][$lang],
            "twitter:card" => "summary_large_image",
        ]
        as $key => $value
    ) {
        $head .=
            "<meta " .
            (str_starts_with($key, "og:") ? "property" : "name") .
            '="' .
            $key .
            '" content="' .
            seo_escape($value) .
            '">';
    }
    if ($page["image"]) {
        $head .=
            '<meta property="og:image" content="' .
            seo_escape(rtrim(config()["url"], "/") . "/" . $page["image"]) .
            '">';
    }
    foreach ($page["schema"] as $schema) {
        $head .=
            '<script type="application/ld+json" data-seo-schema>' .
            json_encode(
                $schema,
                JSON_UNESCAPED_UNICODE |
                    JSON_UNESCAPED_SLASHES |
                    JSON_HEX_TAG |
                    JSON_HEX_AMP |
                    JSON_HEX_APOS |
                    JSON_HEX_QUOT,
            ) .
            "</script>";
    }
    $runtime = [
        "base" => $base . "/",
        "locale" => $lang,
        "routerBase" => $base . $prefix,
        "alternates" => $page["alternates"],
    ];
    $head .=
        '<script type="application/json" id="od-runtime">' .
        json_encode(
            $runtime,
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT,
        ) .
        "</script>";
    $html = file_get_contents(__DIR__ . "/index.html");
    $html = preg_replace(
        '/<html lang="[^"]*"/',
        '<html lang="' . $lang . '"',
        $html,
    );
    $html = preg_replace(
        '/<title>.*?<\/title>|<meta name="description"[^>]*>/s',
        "",
        $html,
    );
    $html = str_replace("</head>", $head . "</head>", $html);
    // JavaScript renders the real UI; keep the plain HTML fallback for no-JS clients.
    $html = str_replace(
        '<div id="root"></div>',
        '<div id="root"></div><noscript><main class="seo-initial">' .
            $page["body"] .
            "</main></noscript>",
        $html,
    );
    $html = preg_replace_callback(
        '~(src|href)="\./(assets/[^"?]+\.(?:js|css))"~',
        function ($m) use ($base) {
            $file = __DIR__ . "/" . $m[2];
            return $m[1] .
                '="' .
                seo_escape($base . "/" . $m[2]) .
                "?v=" .
                (is_file($file) ? filemtime($file) : 0) .
                '"';
        },
        $html,
    );
    header("Content-Type: text/html; charset=utf-8");
    echo $html;
} catch (Throwable $e) {
    error_log("OD frontend: " . get_class($e) . " " . $e->getMessage());
    http_response_code(503);
    header("Content-Type: text/html; charset=utf-8");
    header("Retry-After: 60");
    echo '<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>Store temporarily unavailable</title></head><body><h1>Store temporarily unavailable</h1><p>Please try again shortly.</p></body></html>';
}
