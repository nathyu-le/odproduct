<?php
declare(strict_types=1);
require __DIR__ . "/../backend/src/updater.php";
$dir = sys_get_temp_dir() . "/od-routing-" . bin2hex(random_bytes(6));
mkdir($dir, 0700);
$file = $dir . "/.htaccess";
$handler =
    "# cPanel PHP handler\nAddHandler application/x-httpd-ea-php83 .php\n";
$old =
    $handler .
    "# OD CLEAN URLS V1\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteCond %{REQUEST_FILENAME} -d\nRewriteRule ^ - [L]\nRewriteRule ^ index.php [QSA,L]\n</IfModule>\n# User directive\nOptions -Indexes\n";
try {
    file_put_contents($file, $old);
    deployment_clean_urls($dir);
    $new = file_get_contents($file);
    if (
        !str_contains($new, "# OD CLEAN URLS V2") ||
        str_contains($new, "# OD CLEAN URLS V1")
    ) {
        throw new RuntimeException("Owned rule was not upgraded");
    }
    if (
        strpos($new, 'RewriteRule ^$ index.php [QSA,L]') >
        strpos($new, "RewriteCond %{REQUEST_FILENAME} -d")
    ) {
        throw new RuntimeException(
            "Directory handling still bypasses PHP homepage",
        );
    }
    if (
        !str_contains($new, $handler) ||
        !str_contains($new, "# User directive")
    ) {
        throw new RuntimeException("Unrelated hosting directives changed");
    }
    deployment_clean_urls($dir);
    if (file_get_contents($file) !== $new) {
        throw new RuntimeException("Routing guard is not idempotent");
    }
    $legacyCache = <<<'APACHE'
# OD EDITABLE ASSET CACHE V1
<IfModule mod_headers.c>
<FilesMatch \"\\.(js|css)$\">
Header always set Cache-Control \"no-cache, must-revalidate\"
</FilesMatch>
</IfModule>
APACHE;
    file_put_contents($file, $new . "\n" . $legacyCache . "\n");
    deployment_asset_cache($dir);
    $cache = file_get_contents($file);
    if (!str_contains($cache, '<FilesMatch "\.(js|css)$">') || str_contains($cache, chr(92) . chr(34))) {
        throw new RuntimeException("Apache asset regex or quotes are incorrectly escaped");
    }
    if (str_contains($cache, "OD EDITABLE ASSET CACHE V1") || !str_contains($cache, 'Header always set Cache-Control "no-cache, no-store, must-revalidate"')) {
        throw new RuntimeException("Asset cache policy was not upgraded");
    }
    if (!str_contains($cache, $handler) || !str_contains($cache, "# User directive")) {
        throw new RuntimeException("Asset cache upgrade changed hosting directives");
    }
    deployment_asset_cache($dir);
    if (file_get_contents($file) !== $cache) {
        throw new RuntimeException("Asset cache guard is not idempotent");
    }
    echo "PASS routing/cache: PHP homepage, Apache asset rules, idempotent upgrades and preserved hosting directives.\n";
} finally {
    @unlink($file);
    @rmdir($dir);
}
