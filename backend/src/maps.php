<?php
require_once __DIR__ . "/bootstrap.php";
function maps_http_json(
    string $url,
    int $timeout = 7,
    ?array &$diagnostic = null,
): array {
    $response = "";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_USERAGENT => "MuaplusStore/1.1 (https://muaplus.com; delivery routing)",
        CURLOPT_HTTPHEADER => ["Accept: application/json"],
        CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$response) {
            if (strlen($response) + strlen($chunk) > 700000) {
                return 0;
            }
            $response .= $chunk;
            return strlen($chunk);
        },
    ]);
    $ok = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $errno = curl_errno($ch);
    curl_close($ch);
    $diagnostic = [
        "service" => parse_url($url, PHP_URL_HOST),
        "http" => $status,
        "network_error" => $errno,
    ];
    if (!$ok || $status !== 200) {
        return [];
    }
    $data = json_decode($response, true);
    return is_array($data) ? $data : [];
}
function free_route_distance(
    float $lat,
    float $lng,
    array $rules,
    ?string &$reason = null,
    ?array &$details = null,
): ?float {
    $dir = dirname(__DIR__) . "/storage/routes";
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $id = hash(
        "sha256",
        json_value([
            $rules["origin_lat"],
            $rules["origin_lng"],
            round($lat, 6),
            round($lng, 6),
        ]),
    );
    $file = $dir . "/" . $id . ".json";
    if (is_file($file) && filemtime($file) > time() - 600) {
        $cached = json_decode(file_get_contents($file), true);
        if (is_numeric($cached["km"] ?? null)) {
            return (float) $cached["km"];
        }
    }
    $configured = config()["routing"]["base_url"] ?? "";
    $endpoints = array_unique(
        array_filter([
            "https://routing.openstreetmap.de/routed-car",
            $configured,
            "https://router.project-osrm.org",
        ]),
    );
    $attempts = [];
    foreach ($endpoints as $endpoint) {
        if (!str_starts_with($endpoint, "https://")) {
            continue;
        }
        $coordinates =
            (float) $rules["origin_lng"] .
            "," .
            (float) $rules["origin_lat"] .
            ";" .
            $lng .
            "," .
            $lat;
        $info = null;
        $data = maps_http_json(
            rtrim($endpoint, "/") .
                "/route/v1/driving/" .
                $coordinates .
                "?overview=false&steps=false",
            6,
            $info,
        );
        $attempts[] = $info;
        $meters = $data["routes"][0]["distance"] ?? null;
        if (
            ($data["code"] ?? "") === "Ok" &&
            is_numeric($meters) &&
            $meters >= 0
        ) {
            $km = round($meters / 1000, 3);
            if (is_writable($dir)) {
                file_put_contents($file, json_value(["km" => $km]), LOCK_EX);
            }
            $reason = null;
            $details = $attempts;
            return $km;
        }
    }
    $details = $attempts;
    $reason =
        "Chưa lấy được đường xe chạy. Cửa hàng sẽ báo phí để bạn xác nhận; không tự tính phí bằng 0.";
    return null;
}
