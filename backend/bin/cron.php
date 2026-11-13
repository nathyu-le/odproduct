<?php
if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit();
}
require dirname(__DIR__) . "/src/commerce.php";
require dirname(__DIR__) . "/src/telegram.php";
$ids = all(
    "SELECT id FROM orders WHERE status='received' AND paid_amount=0 AND payment_status!='review' AND expires_at<?",
    [now()],
);
foreach ($ids as $o) {
    try {
        transition(
            (int) $o["id"],
            "cancel",
            ["reason" => "Hết hạn giữ hàng 24 giờ"],
            "cron",
            "system",
        );
    } catch (Throwable $e) {
        error_log($e->getMessage());
    }
}
query("DELETE FROM rate_limits WHERE expires_at<?", [now()]);
query("DELETE FROM telegram_pending WHERE expires_at<?", [now()]);
echo json_value(outbox_run()) . "\n";

require dirname(__DIR__) . "/src/updater.php";
echo json_encode(deployment_check(), JSON_UNESCAPED_UNICODE) . PHP_EOL;
