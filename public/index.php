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
readfile(__DIR__ . "/index.html");
