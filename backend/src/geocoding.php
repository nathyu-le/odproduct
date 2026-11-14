<?php
require_once __DIR__ . "/bootstrap.php";
require_once __DIR__ . "/maps.php";
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
        if (
            is_array($cached) &&
            (!empty($cached["results"]) || empty($body["explicit"]))
        ) {
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
        if (($code !== 200 || !$raw) && empty($body["explicit"])) {
            fail(
                503,
                "Chưa kết nối được dịch vụ địa chỉ. Thử lại hoặc chạm bản đồ để chọn điểm nhận.",
            );
        }
        $data = $code === 200 && $raw ? json_decode($raw, true) : [];
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
        if (!$results && !empty($body["explicit"])) {
            $lastFile = $directory . "/nominatim.time";
            if (!is_file($lastFile) || time() - filemtime($lastFile) >= 2) {
                touch($lastFile);
                $search = maps_http_json(
                    "https://nominatim.openstreetmap.org/search?" .
                        http_build_query([
                            "q" => preg_replace("/\bsố\s+/iu", "", $q),
                            "format" => "jsonv2",
                            "countrycodes" => "vn",
                            "limit" => 6,
                            "addressdetails" => 1,
                        ]),
                );
                foreach ($search as $place) {
                    if (
                        !is_numeric($place["lat"] ?? null) ||
                        !is_numeric($place["lon"] ?? null)
                    ) {
                        continue;
                    }
                    $results[] = [
                        "id" => "osm-" . $place["place_id"],
                        "address" => $place["display_name"],
                        "label" => $place["display_name"],
                        "region" => "Việt Nam",
                        "latitude" => (float) $place["lat"],
                        "longitude" => (float) $place["lon"],
                    ];
                }
            }
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

function geocode_reverse(array $b): array
{
    rate_limit("reverse_address", 30, 60);
    foreach (["latitude" => 90, "longitude" => 180] as $k => $max) {
        if (!is_numeric($b[$k] ?? null) || abs((float) $b[$k]) > $max) {
            fail(422, "Vị trí không hợp lệ.");
        }
    }
    $r = maps_http_json(
        "https://photon.komoot.io/reverse?" .
            http_build_query([
                "lat" => (float) $b["latitude"],
                "lon" => (float) $b["longitude"],
                "lang" => "en",
                "limit" => 1,
            ]),
    );
    $p = $r["features"][0]["properties"] ?? null;
    if (!$p) {
        fail(
            503,
            "Chưa tìm được tên đường ở ghim này. Bạn vẫn có thể nhập địa chỉ bằng tay.",
        );
    }
    $street = trim(
        ($p["housenumber"] ?? "") . " " . ($p["street"] ?? ($p["name"] ?? "")),
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
    return [
        "address" => implode(", ", array_filter([$street, $region])),
        "label" => implode(", ", array_filter([$street, $region])),
        "region" => $region ?: "Việt Nam",
        "latitude" => (float) $b["latitude"],
        "longitude" => (float) $b["longitude"],
    ];
}
