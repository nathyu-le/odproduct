<?php
require_once __DIR__ . "/bootstrap.php";
function geocode_search(array $body): array
{
    $q = required($body, "query", 300);
    if (mb_strlen($q) < 4) {
        fail(422, "Nhập thêm số nhà, tên đường và tỉnh/thành phố.");
    }
    $key = hash("sha256", mb_strtolower($q));
    $directory = dirname(__DIR__) . "/storage/geocoding";
    if (
        !is_dir($directory) &&
        !mkdir($directory, 0700, true) &&
        !is_dir($directory)
    ) {
        fail(503, "Chưa tìm được địa chỉ. Hãy chọn điểm trên bản đồ.");
    }
    $cache = $directory . "/" . $key . ".json";
    if (is_file($cache) && filemtime($cache) > time() - 86400) {
        $cached = json_decode(file_get_contents($cache), true);
        if (is_array($cached)) {
            return $cached;
        }
    }
    rate_limit("address_search", 45, 60);
    $lock = fopen($directory . "/requests.lock", "c+");
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
        fail(429, "Đang tìm địa chỉ khác. Chờ một chút rồi thử lại.");
    }
    try {
        $last = (float) stream_get_contents($lock);
        if (microtime(true) - $last < 0.35) {
            fail(429, "Đợi một chút rồi tiếp tục tìm địa chỉ.");
        }
        ftruncate($lock, 0);
        rewind($lock);
        fwrite($lock, (string) microtime(true));
        fflush($lock);
        $base = rtrim(
            config()["geocoding"]["base_url"] ?? "https://photon.komoot.io",
            "/",
        );
        if (!str_starts_with($base, "https://")) {
            fail(503, "Dịch vụ địa chỉ cần HTTPS.");
        }
        $params = [
            "q" => $q,
            "limit" => 7,
            "countrycode" => "vn",
            "lang" => "en",
        ];
        $origin = setting("shipping");
        if (isset($origin["origin_lat"], $origin["origin_lng"])) {
            $params["lat"] = $origin["origin_lat"];
            $params["lon"] = $origin["origin_lng"];
        }
        $ch = curl_init($base . "/api/?" . http_build_query($params));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 7,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_USERAGENT =>
                "ODStore/1.0 (" . config()["url"] . "; address search)",
        ]);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code !== 200 || !$raw) {
            fail(
                503,
                "Chưa kết nối được dịch vụ địa chỉ. Thử lại hoặc chạm bản đồ để chọn điểm nhận.",
            );
        }
        $data = json_decode($raw, true);
        $results = [];
        foreach ($data["features"] ?? [] as $feature) {
            $p = $feature["properties"] ?? [];
            $coordinates = $feature["geometry"]["coordinates"] ?? [];
            if (
                count($coordinates) !== 2 ||
                !is_numeric($coordinates[0]) ||
                !is_numeric($coordinates[1])
            ) {
                continue;
            }
            if (
                isset($p["countrycode"]) &&
                strtoupper($p["countrycode"]) !== "VN"
            ) {
                continue;
            }
            $street = trim(
                ($p["housenumber"] ?? "") . " " . ($p["street"] ?? ""),
            );
            $region = implode(
                ", ",
                array_unique(
                    array_filter([
                        $p["district"] ?? null,
                        $p["city"] ?? ($p["county"] ?? null),
                        $p["state"] ?? null,
                    ]),
                ),
            );
            $name = $p["name"] ?? "";
            $address = $street ?: $name;
            $label = implode(
                ", ",
                array_unique(array_filter([$name, $street, $region])),
            );
            if (!$label) {
                continue;
            }
            $results[] = [
                "id" => (string) ($p["osm_id"] ?? hash("sha256", $label)),
                "label" => $label,
                "address" => $address,
                "region" => $region,
                "latitude" => (float) $coordinates[1],
                "longitude" => (float) $coordinates[0],
            ];
        }
        $out = [
            "results" => $results,
            "attribution" => "© OpenStreetMap contributors / Photon",
        ];
        file_put_contents($cache, json_value($out), LOCK_EX);
        return $out;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
