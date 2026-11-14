<?php
// Run independently of database maintenance so deployment works during setup too.
if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit();
}
if (PHP_VERSION_ID < 80200) {
    fwrite(STDERR, "OD updater requires PHP 8.2+.\n");
    exit(1);
}
date_default_timezone_set("Asia/Ho_Chi_Minh");
require dirname(__DIR__) . "/src/updater.php";
try {
    deployment_prepare_access();
    $status = deployment_check();
    echo json_encode($status, JSON_UNESCAPED_UNICODE) . PHP_EOL;
    exit(empty($status["error"]) ? 0 : 1);
} catch (Throwable $e) {
    fwrite(STDERR, "OD update failed: " . get_class($e) . PHP_EOL);
    exit(1);
}
