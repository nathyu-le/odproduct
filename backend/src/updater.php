<?php
// Updates only application files from this project's public GitHub repository.
// Customer data, config, uploads, database and encryption keys are never included.
function deployment_paths(): array
{
    return [
        "root" => dirname(__DIR__, 2),
        "state" => dirname(__DIR__) . "/storage/updates",
    ];
}
function deployment_status(): array
{
    $paths = deployment_paths();
    $file = $paths["state"] . "/status.json";
    $status = is_file($file) ? json_decode(file_get_contents($file), true) : [];
    return array_merge(
        [
            "enabled" => !is_file($paths["state"] . "/disabled"),
            "repository" => "nathyu-le/odproduct",
            "branch" => "main",
            "release" => null,
            "checked_at" => null,
            "deployed_at" => null,
            "error" => null,
        ],
        is_array($status) ? $status : [],
    );
}
function deployment_fetch(string $url, int $limit): string
{
    $data = "";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => ["Cache-Control: no-cache"],
        CURLOPT_USERAGENT => "ODStore-Updater/1.0",
        CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$data, $limit) {
            if (strlen($data) + strlen($chunk) > $limit) {
                return 0;
            }
            $data .= $chunk;
            return strlen($chunk);
        },
    ]);
    $ok = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (!$ok || $code !== 200) {
        throw new RuntimeException(
            "Chưa tải được bản cập nhật GitHub (HTTP " . $code . ").",
        );
    }
    return $data;
}
function deployment_allowed(string $name): bool
{
    if (
        str_contains($name, "\0") ||
        str_contains($name, "\\") ||
        str_starts_with($name, "/") ||
        in_array("..", explode("/", $name), true)
    ) {
        return false;
    }
    if (
        in_array(
            $name,
            [
                "index.html",
                "index.php",
                ".htaccess",
                "api/index.php",
                "api/.htaccess",
                "api/bin/cron.php",
                "api/bin/update.php",
                "api/src/.htaccess",
            ],
            true,
        )
    ) {
        return true;
    }
    if (preg_match('~^api/src/[a-z0-9_-]+\.php$~', $name)) {
        return true;
    }
    return (bool) preg_match(
        '~^(assets|images|fonts)/[A-Za-z0-9_./-]+\.(js|css|woff2?|ttf|jpg|jpeg|png|webp|svg|txt)$~',
        $name,
    );
}
function deployment_extract(string $archive, string $directory): array
{
    $offset = 0;
    $files = [];
    $expanded = 0;
    $length = strlen($archive);
    while ($offset + 4 <= $length) {
        $signature = unpack("V", substr($archive, $offset, 4))[1];
        if ($signature === 0x02014b50) {
            break;
        }
        if ($signature !== 0x04034b50 || $offset + 30 > $length) {
            throw new RuntimeException("Gói cập nhật ZIP không hợp lệ.");
        }
        $h = unpack(
            "Vsignature/vversion/vflags/vmethod/vtime/vdate/Vcrc/Vcompressed/Vsize/vname/vextra",
            substr($archive, $offset, 30),
        );
        if (
            ($h["flags"] & 9) !== 0 ||
            !in_array($h["method"], [0, 8], true) ||
            $h["size"] > 15000000
        ) {
            throw new RuntimeException("Gói ZIP không được hỗ trợ.");
        }
        $name = substr($archive, $offset + 30, $h["name"]);
        if (!deployment_allowed($name) || isset($files[$name])) {
            throw new RuntimeException(
                "Gói cập nhật chứa đường dẫn không được phép.",
            );
        }
        $offset += 30 + $h["name"] + $h["extra"];
        if ($offset + $h["compressed"] > $length) {
            throw new RuntimeException("Gói ZIP bị thiếu dữ liệu.");
        }
        $bytes = substr($archive, $offset, $h["compressed"]);
        $offset += $h["compressed"];
        $raw = $h["method"] === 8 ? gzinflate($bytes, 15000000) : $bytes;
        if (
            $raw === false ||
            strlen($raw) !== $h["size"] ||
            sprintf("%u", crc32($raw)) !== sprintf("%u", $h["crc"])
        ) {
            throw new RuntimeException("Kiểm tra nội dung ZIP thất bại.");
        }
        $expanded += strlen($raw);
        if ($expanded > 80000000 || count($files) > 500) {
            throw new RuntimeException("Gói cập nhật vượt giới hạn.");
        }
        $path = $directory . "/" . $name;
        if (!is_dir(dirname($path)) && !mkdir(dirname($path), 0700, true)) {
            throw new RuntimeException("Không tạo được thư mục tạm.");
        }
        if (file_put_contents($path, $raw) !== strlen($raw)) {
            throw new RuntimeException("Không lưu được file cập nhật.");
        }
        $files[$name] = true;
    }
    if (!isset($files["index.html"], $files["api/index.php"])) {
        throw new RuntimeException("Gói cập nhật thiếu file chính.");
    }
    return array_keys($files);
}
function deployment_merge_access(string $current, string $incoming): string
{
    // Preserve cPanel's selected PHP handler and custom rewrites. Change only our CSP line.
    if (
        preg_match(
            '/^Header always set Content-Security-Policy .*$/m',
            $incoming,
            $new,
        )
    ) {
        if (
            preg_match(
                '/^Header always set Content-Security-Policy .*$/m',
                $current,
            )
        ) {
            return preg_replace_callback(
                '/^Header always set Content-Security-Policy .*$/m',
                fn() => $new[0],
                $current,
            );
        }
        return $current .
            "\n<IfModule mod_headers.c>\n" .
            $new[0] .
            "\n</IfModule>\n";
    }
    return $current;
}
function deployment_check(bool $force = false): array
{
    $paths = deployment_paths();
    $stateDir = $paths["state"];
    if (!is_dir($stateDir) && !mkdir($stateDir, 0700, true)) {
        return ["error" => "Không ghi được trạng thái cập nhật."];
    }
    if (is_file($stateDir . "/disabled") && !$force) {
        return deployment_status();
    }
    $lock = fopen($stateDir . "/lock", "c+");
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
        return deployment_status();
    }
    $state = deployment_status();
    $stateFile = $stateDir . "/status.json";
    $changed = [];
    $backup = null;
    $stage = null;
    try {
        if (
            !$force &&
            is_file($stateFile) &&
            filemtime($stateFile) > time() - 60
        ) {
            return $state;
        }
        $state["checked_at"] = date(DATE_ATOM);
        $state["error"] = null;
        file_put_contents(
            $stateFile,
            json_encode($state, JSON_UNESCAPED_UNICODE),
            LOCK_EX,
        );
        $manifest = json_decode(
            deployment_fetch(
                "https://raw.githubusercontent.com/nathyu-le/odproduct/main/deploy.json?t=" .
                    floor(time() / 60),
                20000,
            ),
            true,
        );
        if (
            !is_array($manifest) ||
            !preg_match('/^[a-f0-9]{64}$/', $manifest["sha256"] ?? "")
        ) {
            throw new RuntimeException(
                "Chưa có thông tin phiên bản hợp lệ trên GitHub.",
            );
        }
        if ((int) ($manifest["php_min"] ?? 80200) > PHP_VERSION_ID) {
            throw new RuntimeException(
                "Bản mới cần phiên bản PHP cao hơn trên hosting.",
            );
        }
        $release = $manifest["sha256"];
        $local = dirname(__DIR__) . "/release.json";
        if (is_file($local)) {
            $localManifest = json_decode(file_get_contents($local), true);
            if (empty($state["release"])) {
                $state["release"] = $localManifest["sha256"] ?? null;
            }
            if (
                empty($state["built_at"]) &&
                ($state["release"] ?? null) ===
                    ($localManifest["sha256"] ?? null)
            ) {
                $state["built_at"] = $localManifest["built_at"] ?? null;
            }
        }
        if (
            !empty($state["built_at"]) &&
            strtotime($manifest["built_at"] ?? "") <=
                strtotime($state["built_at"]) &&
            $state["release"] !== $release
        ) {
            file_put_contents(
                $stateFile,
                json_encode($state, JSON_UNESCAPED_UNICODE),
                LOCK_EX,
            );
            return $state;
        }
        if ($state["release"] === $release) {
            file_put_contents(
                $stateFile,
                json_encode($state, JSON_UNESCAPED_UNICODE),
                LOCK_EX,
            );
            return $state;
        }
        $archive = deployment_fetch(
            "https://raw.githubusercontent.com/nathyu-le/odproduct/main/odproduct-update.zip?t=" .
                floor(time() / 60),
            20000000,
        );
        if (!hash_equals($release, hash("sha256", $archive))) {
            throw new RuntimeException(
                "Gói GitHub đang thay đổi. Sẽ kiểm tra lại ở lượt sau.",
            );
        }
        $stage = $stateDir . "/stage-" . bin2hex(random_bytes(8));
        if (!mkdir($stage, 0700, true)) {
            throw new RuntimeException("Không tạo được vùng cập nhật.");
        }
        $files = deployment_extract($archive, $stage);
        $backup =
            $stateDir .
            "/backups/" .
            date("Ymd-His") .
            "-" .
            substr($release, 0, 10);
        if (!mkdir($backup, 0700, true)) {
            throw new RuntimeException("Không tạo được bản sao lưu.");
        }
        foreach ($files as $name) {
            $target = $paths["root"] . "/" . $name;
            if (is_file($target)) {
                if (!is_dir(dirname($backup . "/" . $name))) {
                    mkdir(dirname($backup . "/" . $name), 0700, true);
                }
                if (!copy($target, $backup . "/" . $name)) {
                    throw new RuntimeException(
                        "Không sao lưu được file hiện tại.",
                    );
                }
                if (str_ends_with($name, ".htaccess")) {
                    file_put_contents(
                        $stage . "/" . $name,
                        deployment_merge_access(
                            file_get_contents($target),
                            file_get_contents($stage . "/" . $name),
                        ),
                    );
                }
            }
        }
        usort(
            $files,
            fn($a, $b) => ($a === "index.html"
                ? 3
                : ($a === "api/index.php"
                    ? 2
                    : 0)) <=>
                ($b === "index.html" ? 3 : ($b === "api/index.php" ? 2 : 0)),
        );
        foreach ($files as $name) {
            $target = $paths["root"] . "/" . $name;
            if (!is_dir(dirname($target))) {
                mkdir(dirname($target), 0755, true);
            }
            chmod($stage . "/" . $name, 0644);
            if (!rename($stage . "/" . $name, $target)) {
                throw new RuntimeException("Không áp dụng được file cập nhật.");
            }
            $changed[] = $name;
            if (
                function_exists("opcache_invalidate") &&
                str_ends_with($name, ".php")
            ) {
                opcache_invalidate($target, true);
            }
        }
        $state["release"] = $release;
        $state["built_at"] = $manifest["built_at"] ?? date(DATE_ATOM);
        $state["deployed_at"] = date(DATE_ATOM);
        $state["files"] = count($files);
        $state["error"] = null;
    } catch (Throwable $e) {
        foreach (array_reverse($changed) as $name) {
            $target = $paths["root"] . "/" . $name;
            if ($backup && is_file($backup . "/" . $name)) {
                copy($backup . "/" . $name, $target);
            } elseif (is_file($target)) {
                unlink($target);
            }
            if (
                function_exists("opcache_invalidate") &&
                str_ends_with($name, ".php")
            ) {
                opcache_invalidate($target, true);
            }
        }
        $state["error"] =
            $e instanceof RuntimeException
                ? $e->getMessage()
                : "Chưa cập nhật được. Bản đang chạy được giữ lại.";
        error_log("OD deployment: " . get_class($e));
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
    file_put_contents(
        $stateFile,
        json_encode($state, JSON_UNESCAPED_UNICODE),
        LOCK_EX,
    );
    return $state;
}
function deployment_append_guard(
    string $file,
    string $marker,
    string $rules,
): void {
    $old = is_file($file) ? file_get_contents($file) : "";
    if (str_contains($old, $marker)) {
        return;
    }
    if (
        (is_file($file) && !is_writable($file)) ||
        (!is_file($file) && !is_writable(dirname($file)))
    ) {
        return;
    }
    $new = $old . "\n# " . $marker . "\n" . $rules . "\n";
    $tmp = dirname($file) . "/.od-guard-" . bin2hex(random_bytes(8));
    if (file_put_contents($tmp, $new, LOCK_EX) === strlen($new)) {
        chmod($tmp, 0644);
        if (!rename($tmp, $file)) {
            unlink($tmp);
        }
    } elseif (is_file($tmp)) {
        unlink($tmp);
    }
}
function deployment_prepare_access(): void
{
    $root = deployment_paths()["root"];
    $deny =
        "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>";
    foreach (["src", "storage", "migrations", "demo", "bin"] as $private) {
        $directory = $root . "/api/" . $private;
        if (is_dir($directory)) {
            deployment_append_guard(
                $directory . "/.htaccess",
                "OD PRIVATE DIRECTORY",
                $deny,
            );
        }
    }
    deployment_append_guard(
        $root . "/api/.htaccess",
        "OD API CONFIG GUARD",
        '<FilesMatch "^(config(?:\\.example)?\\.php|install\\.key|release\\.json)$">' .
            "\n" .
            $deny .
            "\n</FilesMatch>",
    );
    if (is_dir($root . "/uploads")) {
        deployment_append_guard(
            $root . "/uploads/.htaccess",
            "OD UPLOAD GUARD",
            '<FilesMatch "\\.(php[0-9]?|phtml|phar|cgi|pl|py|sh|html?|svg)$">' .
                "\n" .
                $deny .
                "\n</FilesMatch>",
        );
    }
    deployment_append_guard(
        $root . "/.htaccess",
        "OD DIRECTORY INDEX",
        "DirectoryIndex index.php index.html",
    );
    $file = $root . "/.htaccess";
    if (is_file($file) && !is_writable($file)) {
        return;
    }
    $text = is_file($file) ? file_get_contents($file) : "";
    $patched = $text;
    // The unsharded OSM tile host is separate from *.tile.openstreetmap.org.
    if (!str_contains($patched, "https://tile.openstreetmap.org")) {
        $patched = preg_replace_callback(
            '/^Header always set Content-Security-Policy .*$/m',
            fn($m) => preg_replace(
                "/(img-src[^;]*)(;)/",
                '$1 https://tile.openstreetmap.org$2',
                $m[0],
            ),
            $patched,
        );
    }
    if (!str_contains($patched, "https://basemaps.cartocdn.com")) {
        $patched = preg_replace_callback(
            '/^Header always set Content-Security-Policy .*$/m',
            fn($m) => str_replace(
                "; style-src",
                " https://basemaps.cartocdn.com; style-src",
                $m[0],
            ),
            $patched,
        );
    }
    if (!str_contains($patched, "# OD HTML CACHE")) {
        $patched .=
            "\n# OD HTML CACHE\n<IfModule mod_headers.c>\n<FilesMatch \"^index\\.(html|php)$\">\nHeader always set Cache-Control \"no-store, no-cache, must-revalidate\"\n</FilesMatch>\nHeader always set X-Frame-Options \"DENY\"\nHeader always set X-Content-Type-Options \"nosniff\"\nHeader always set Referrer-Policy \"strict-origin-when-cross-origin\"\n</IfModule>\n";
    }
    if ($patched === $text) {
        return;
    }
    $temporary = $root . "/.od-access-" . bin2hex(random_bytes(8));
    if (file_put_contents($temporary, $patched, LOCK_EX) === strlen($patched)) {
        chmod($temporary, 0644);
        if (!rename($temporary, $file)) {
            unlink($temporary);
        }
    } elseif (is_file($temporary)) {
        unlink($temporary);
    }
}
function deployment_background(): void
{
    try {
        deployment_prepare_access();
    } catch (Throwable $e) {
        error_log("OD access header update unavailable");
    }
    if (
        !function_exists("fastcgi_finish_request") &&
        !function_exists("litespeed_finish_request")
    ) {
        return;
    }
    register_shutdown_function(function () {
        if (function_exists("fastcgi_finish_request")) {
            fastcgi_finish_request();
        } elseif (function_exists("litespeed_finish_request")) {
            litespeed_finish_request();
        }
        try {
            deployment_check();
        } catch (Throwable $e) {
            error_log("OD background update unavailable");
        }
    });
}
