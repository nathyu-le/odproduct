<?php
declare(strict_types=1);
require __DIR__ . "/src/commerce.php";
require __DIR__ . "/src/admin.php";
require __DIR__ . "/src/telegram.php";
require __DIR__ . "/src/geocoding.php";
require __DIR__ . "/src/updater.php";
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
header("X-Content-Type-Options: nosniff");
header("X-Robots-Tag: noindex, nofollow");
header("Referrer-Policy: no-referrer");
set_exception_handler(function (Throwable $e) {
    $status = $e instanceof HttpError ? $e->status : 500;
    http_response_code($status);
    if ($status === 500) {
        error_log("OD error: " . get_class($e) . " " . $e->getMessage());
    }
    $needsInstall =
        $status === 503 &&
        !is_file(__DIR__ . "/config.php") &&
        !getenv("OD_CONFIG");
    echo json_value([
        "installation_required" => $needsInstall,
        "error" =>
            $e instanceof HttpError
                ? $e->getMessage()
                : "Lỗi máy chủ. Vui lòng thử lại.",
    ]);
});
$path = trim($_GET["route"] ?? "", "/");
$method = $_SERVER["REQUEST_METHOD"];
if (!in_array($method, ["GET", "POST"], true)) {
    header("Allow: GET, POST");
    fail(405, "Phương thức không được hỗ trợ.");
}
$body = [];
if (
    $method !== "GET" &&
    !str_starts_with($_SERVER["CONTENT_TYPE"] ?? "", "multipart/form-data")
) {
    $raw = file_get_contents("php://input");
    if (strlen($raw) > 1024 * 1024) {
        fail(413, "Yêu cầu quá lớn.");
    }
    $body = $raw ? json_decode($raw, true) : [];
    if (!is_array($body)) {
        fail(400, "JSON không hợp lệ.");
    }
}
if ($path === "telegram/webhook") {
    if ($method !== "POST") {
        fail(405, "Webhook yêu cầu POST.");
    }
    try {
        echo json_value(telegram_webhook($body));
    } catch (HttpError $e) {
        if (!in_array($e->status, [409, 422, 404], true)) {
            throw $e;
        }
        try {
            if (isset($body["callback_query"]["id"])) {
                telegram_request("answerCallbackQuery", [
                    "callback_query_id" => $body["callback_query"]["id"],
                    "text" => $e->getMessage(),
                    "show_alert" => true,
                ]);
            }
        } catch (Throwable) {
        }
        echo json_value(["ok" => true]);
    }
    exit();
}
if ($method !== "GET") {
    csrf();
}
$result = null;
if ($method === "GET" && in_array($path, ["session", "catalog"], true)) {
    deployment_background();
}
if ($path === "session" && $method === "GET") {
    session_start_safe();
    $u = null;
    try {
        $u = user();
    } catch (HttpError) {
    }
    $result = ["csrf" => $_SESSION["csrf"], "user" => $u];
} elseif ($path === "catalog" && $method === "GET") {
    $result = [
        "products" => catalog(),
        "categories" => content_categories(),
        "store" => setting("store"),
        "appearance" => content_defaults(),
        "seo" => setting("seo"),
        "payment" => setting("payment"),
        "shipping" => setting("shipping"),
        "server_time" => date(DATE_ATOM),
        "maps" => ["provider" => "openstreetmap"],
    ];
} elseif ($path === "blog" && $method === "GET") {
    $result = blog_list(content_locale($_GET["locale"] ?? "en"));
} elseif (str_starts_with($path, "blog/") && $method === "GET") {
    $result = blog_get(
        rawurldecode(substr($path, 5)),
        content_locale($_GET["locale"] ?? "en"),
    );
} elseif ($path === "geocoding/search" && $method === "POST") {
    $result = geocode_search($body);
} elseif ($path === "geocoding/reverse" && $method === "POST") {
    $result = geocode_reverse($body);
} elseif ($path === "lookup/phone" && $method === "POST") {
    $result = phone_order_history($body);
} elseif ($path === "quote" && $method === "POST") {
    rate_limit("quote", 60, 60);
    $result = public_quote(cart_quote($body));
} elseif ($path === "orders" && $method === "POST") {
    rate_limit("checkout", 15, 300);
    $result = place_order($body, $_SERVER["HTTP_IDEMPOTENCY_KEY"] ?? "");
} elseif ($path === "lookup" && $method === "POST") {
    rate_limit("lookup", 6, 900);
    $code = strtoupper(required($body, "code", 24));
    $p = phone(required($body, "phone", 25));
    $o = one("SELECT * FROM orders WHERE lookup_code=? AND phone=?", [
        $code,
        $p,
    ]);
    if (!$o) {
        fail(404, "Thông tin tra cứu không khớp.");
    }
    $result = ["token" => decrypt_token($o["token_cipher"])];
} elseif (
    preg_match(
        '~^order/([a-f0-9]{64})(?:/(review|accept-shipping))?$~',
        $path,
        $m,
    )
) {
    $token = $m[1];
    if ($method === "GET") {
        $result = order_response(guest_order($token));
    } elseif ($method === "POST") {
        $result = transaction(function () use ($token, $m) {
            $o = guest_order($token, true);
            if ($o["status"] === "cancelled") {
                fail(409, "Đơn đã huỷ.");
            }
            if (($m[2] ?? "") === "accept-shipping") {
                if ($o["shipping_status"] !== "awaiting_customer") {
                    fail(409, "Không có phí chờ xác nhận.");
                }
                query(
                    "UPDATE orders SET shipping_status='confirmed',updated_at=? WHERE id=?",
                    [now(), $o["id"]],
                );
                audit(
                    (int) $o["id"],
                    "customer",
                    "storefront",
                    "shipping_accepted",
                );
                enqueue_order((int) $o["id"]);
            } elseif (($m[2] ?? "") === "review") {
                if (
                    $o["payment_method"] !== "bank" ||
                    $o["shipping_status"] !== "confirmed"
                ) {
                    fail(409, "Chưa thể yêu cầu kiểm tra chuyển khoản.");
                }
                if ($o["payment_status"] === "pending") {
                    query(
                        "UPDATE orders SET payment_status='review',updated_at=? WHERE id=?",
                        [now(), $o["id"]],
                    );
                    audit(
                        (int) $o["id"],
                        "customer",
                        "storefront",
                        "payment_review",
                    );
                    enqueue_order((int) $o["id"]);
                }
            } else {
                fail(404, "Không tìm thấy.");
            }
            return order_response(guest_order($token));
        });
    }
} elseif ($path === "login" && $method === "POST") {
    rate_limit("login", 8, 900);
    $email = required($body, "email", 190);
    $u = one("SELECT * FROM users WHERE email=? AND active=1", [$email]);
    $dummy = '$2y$10$OX8j8I4B1bNP0.IgRXBgQuyNzAmVQkGaSofmnm2uZCcxcXtElZp6m';
    if (
        !password_verify($body["password"] ?? "", $u["password"] ?? $dummy) ||
        !$u
    ) {
        fail(401, "Email hoặc mật khẩu không đúng.");
    }
    session_regenerate_id(true);
    $_SESSION["uid"] = $u["id"];
    $_SESSION["last"] = time();
    $_SESSION["csrf"] = bin2hex(random_bytes(32));
    $result = [
        "user" => array_intersect_key(
            $u,
            array_flip(["id", "name", "email", "role"]),
        ),
        "csrf" => $_SESSION["csrf"],
    ];
} elseif ($path === "logout" && $method === "POST") {
    session_start_safe();
    $_SESSION = [];
    session_destroy();
    $result = ["ok" => true];
} elseif (str_starts_with($path, "admin/")) {
    $u = user();
    $actor = $u["email"];
    if (!str_starts_with($path, "admin/orders")) {
        user(true);
    }
    if ($path === "admin/blog") {
        $result =
            $method === "GET"
                ? blog_list(content_locale($_GET["locale"] ?? "en"), true)
                : blog_save($body, $u);
    } elseif (preg_match('~^admin/blog/(\d+)$~', $path, $m)) {
        if ($method === "GET") {
            $result = blog_get($m[1], "en", true);
        } else {
            $id = integer($m[1], 1);
            $action = $body["action"] ?? "";
            if ($action !== "archive") {
                fail(422, "Thao tác không hợp lệ.");
            }
            content_schema();
            query(
                "UPDATE blog_posts SET status='archived',version=version+1,updated_at=? WHERE id=?",
                [now(), $id],
            );
            audit(null, $actor, "admin", "blog_archived", ["id" => $id]);
            $result = ["ok" => true];
        }
    } elseif ($path === "admin/appearance") {
        $result =
            $method === "GET"
                ? content_defaults()
                : content_save_appearance($body, $u);
    } elseif ($path === "admin/seo") {
        $result =
            $method === "GET" ? setting("seo") : content_save_seo($body, $u);
    } elseif ($path === "admin/maps") {
        $result = [
            "provider" => "OpenStreetMap / Photon",
            "routing" => "OSRM",
            "requires_key" => false,
        ];
    } elseif ($path === "admin/maps/test" && $method === "POST") {
        $rules = setting("shipping");
        $diagnostic = null;
        $reason = null;
        $km = free_route_distance(
            (float) $rules["origin_lat"] + 0.003,
            (float) $rules["origin_lng"] + 0.003,
            $rules,
            $reason,
            $diagnostic,
        );
        $result = [
            "distance_km" => $km,
            "diagnostic" => $diagnostic,
            "message" =>
                $km !== null
                    ? "Dịch vụ đường đi đã phản hồi."
                    : "Chưa kết nối được dịch vụ đường đi.",
        ];
    } elseif ($path === "admin/deployment") {
        $result =
            $method === "POST" ? deployment_check(true) : deployment_status();
    } elseif ($path === "admin/flash-sales" && $method === "POST") {
        $result = save_flash_sale($body, $u);
    } elseif ($path === "admin/dashboard" && $method === "GET") {
        $result = dashboard_data(
            $_GET["from"] ?? date("Y-m-01"),
            $_GET["to"] ?? date("Y-m-d"),
        );
    } elseif ($path === "admin/products") {
        $result =
            $method === "GET"
                ? [
                    "products" => catalog(true),
                    "categories" => content_categories(),
                ]
                : save_product($body, user(true));
    } elseif ($path === "admin/categories") {
        if ($method === "GET") {
            $result = content_categories();
        } else {
            user(true);
            $name = required($body, "name", 100);
            $slug = required($body, "slug", 100);
            if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
                fail(422, "Slug không hợp lệ.");
            }
            if (!empty($body["id"])) {
                query(
                    "UPDATE categories SET name=?,slug=?,sort_order=? WHERE id=?",
                    [
                        $name,
                        $slug,
                        integer($body["sort_order"] ?? 0),
                        integer($body["id"], 1),
                    ],
                );
            } else {
                query(
                    "INSERT INTO categories(name,slug,sort_order) VALUES(?,?,?)",
                    [$name, $slug, integer($body["sort_order"] ?? 0)],
                );
            }
            $categoryId = !empty($body["id"])
                ? (int) $body["id"]
                : (int) db()->lastInsertId();
            if (
                isset($body["translations"]) &&
                is_array($body["translations"])
            ) {
                content_save_translations(
                    "category",
                    $categoryId,
                    $body["translations"],
                );
            }
            $result = ["ok" => true];
        }
    } elseif ($path === "admin/orders" && $method === "GET") {
        $page = integer($_GET["page"] ?? 1, 1, 100000);
        $conditions = ["1=1"];
        $args = [];
        foreach (["status", "payment_status", "payment_method"] as $key) {
            if (!empty($_GET[$key])) {
                $conditions[] = "$key=?";
                $args[] = clean($_GET[$key], 30);
            }
        }
        if (!empty($_GET["q"])) {
            $conditions[] =
                "(code LIKE ? OR customer_name LIKE ? OR phone LIKE ?)";
            $q = "%" . clean($_GET["q"], 100) . "%";
            array_push($args, $q, $q, $q);
        }
        foreach (["from" => ">=", "to" => "<="] as $key => $op) {
            if (!empty($_GET[$key])) {
                $conditions[] = "created_at $op ?";
                $args[] =
                    $_GET[$key] . ($key === "from" ? " 00:00:00" : " 23:59:59");
            }
        }
        $where = implode(" AND ", $conditions);
        $total = (int) one("SELECT COUNT(*) n FROM orders WHERE $where", $args)[
            "n"
        ];
        $offset = ($page - 1) * 20;
        $result = [
            "total" => $total,
            "page" => $page,
            "orders" => all(
                "SELECT id,code,customer_name,phone,total,status,payment_status,payment_method,created_at FROM orders WHERE $where ORDER BY id DESC LIMIT 20 OFFSET $offset",
                $args,
            ),
        ];
    } elseif (preg_match('~^admin/orders/(\d+)(?:/(\w+))?$~', $path, $m)) {
        $id = (int) $m[1];
        if ($method === "GET") {
            $o = one("SELECT * FROM orders WHERE id=?", [$id]);
            if (!$o) {
                fail(404, "Không có đơn.");
            }
            $result = order_response($o, true);
        } else {
            $action = $m[2] ?? "";
            if (
                in_array(
                    $action,
                    ["paid", "refund", "costs", "shipping_quote"],
                    true,
                )
            ) {
                user(true);
            }
            $result = transition($id, $action, $body, $actor, "admin");
        }
    } elseif ($path === "admin/report" && $method === "GET") {
        user(true);
        $result = report(
            $_GET["from"] ?? date("Y-m-01"),
            $_GET["to"] ?? date("Y-m-d"),
            clean($_GET["status"] ?? "", 30),
        );
    } elseif ($path === "admin/settings") {
        user(true);
        if ($method === "GET") {
            $t = telegram_config();
            $result = [
                "store" => setting("store"),
                "shipping" => setting("shipping"),
                "payment" => setting("payment"),
                "telegram" => [
                    "configured" => !empty($t["token"]),
                    "chat_id" => $t["chat_id"],
                    "allowed_users" => $t["allowed_users"],
                    "webhook" =>
                        config()["url"] .
                        "/api/index.php?route=telegram/webhook",
                ],
                "outbox" => all(
                    "SELECT id,order_id,state,attempts,last_error,next_attempt FROM outbox ORDER BY id DESC LIMIT 30",
                ),
            ];
        } else {
            $result = save_settings(
                required($body, "key", 30),
                $body["value"] ?? [],
                $u,
            );
        }
    } elseif ($path === "admin/telegram/config" && $method === "POST") {
        user(true);
        $result = telegram_config_save($body, $actor);
    } elseif ($path === "admin/telegram/webhook" && $method === "POST") {
        user(true);
        $t = telegram_config();
        if (empty($t["token"]) || strlen($t["secret"]) < 32) {
            fail(422, "Lưu bot token và secret ít nhất 32 ký tự trước.");
        }
        $result = telegram_request("setWebhook", [
            "url" => config()["url"] . "/api/index.php?route=telegram/webhook",
            "secret_token" => $t["secret"],
            "allowed_updates" => ["message", "callback_query"],
        ]);
    } elseif ($path === "admin/telegram/retry" && $method === "POST") {
        user(true);
        query(
            "UPDATE outbox SET state='pending',attempts=0,next_attempt=? WHERE state='failed'",
            [now()],
        );
        $result = outbox_run();
    } elseif ($path === "admin/upload" && $method === "POST") {
        user(true);
        $result = upload_image();
    } elseif ($path === "admin/coupons") {
        user(true);
        if ($method === "GET") {
            $result = all("SELECT * FROM coupons ORDER BY ends_at DESC");
        } else {
            $code = strtoupper(required($body, "code", 40));
            $type = $body["type"] ?? "";
            if (!in_array($type, ["fixed", "percent"], true)) {
                fail(422, "Loại mã không hợp lệ.");
            }
            $value = integer(
                $body["value"] ?? null,
                1,
                $type === "percent" ? 100 : 1000000000,
            );
            $start = required($body, "starts_at", 30);
            $end = required($body, "ends_at", 30);
            if (
                strtotime($start) === false ||
                strtotime($end) <= strtotime($start)
            ) {
                fail(422, "Ngày áp dụng không hợp lệ.");
            }
            query(
                "INSERT INTO coupons(code,type,value,min_total,max_discount,max_uses,starts_at,ends_at,active) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE type=VALUES(type),value=VALUES(value),min_total=VALUES(min_total),max_discount=VALUES(max_discount),max_uses=VALUES(max_uses),starts_at=VALUES(starts_at),ends_at=VALUES(ends_at),active=VALUES(active)",
                [
                    $code,
                    $type,
                    $value,
                    integer($body["min_total"] ?? 0),
                    ($body["max_discount"] ?? "") === ""
                        ? null
                        : integer($body["max_discount"]),
                    integer($body["max_uses"] ?? 100, 1),
                    $start,
                    $end,
                    (int) !empty($body["active"]),
                ],
            );
            audit(null, $actor, "admin", "coupon_saved", ["code" => $code]);
            $result = ["ok" => true];
        }
    } elseif ($path === "admin/users") {
        user(true);
        if ($method === "GET") {
            $result = all("SELECT id,name,email,role,active FROM users");
        } else {
            $name = required($body, "name", 120);
            $email = required($body, "email", 190);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                fail(422, "Email không hợp lệ.");
            }
            $role = $body["role"] ?? "";
            if (!in_array($role, ["admin", "staff"], true)) {
                fail(422, "Vai trò không hợp lệ.");
            }
            $newPassword = clean($body["password"] ?? "", 200);
            if ($newPassword !== "" && strlen($newPassword) < 12) {
                fail(422, "Mật khẩu tối thiểu 12 ký tự.");
            }
            $id = $body["id"] ?? null;
            if ($id) {
                $id = integer($id, 1);
                if (
                    $id === $u["id"] &&
                    ($role !== "admin" || empty($body["active"]))
                ) {
                    fail(422, "Không thể tự khoá hoặc hạ quyền.");
                }
                query(
                    "UPDATE users SET name=?,email=?,role=?,active=? WHERE id=?",
                    [$name, $email, $role, (int) !empty($body["active"]), $id],
                );
                if (!empty($body["password"])) {
                    if (strlen($body["password"]) < 12) {
                        fail(422, "Mật khẩu tối thiểu 12 ký tự.");
                    }
                    query("UPDATE users SET password=? WHERE id=?", [
                        password_hash($body["password"], PASSWORD_DEFAULT),
                        $id,
                    ]);
                }
            } else {
                $password = required($body, "password", 200);
                if (strlen($password) < 12) {
                    fail(422, "Mật khẩu tối thiểu 12 ký tự.");
                }
                query(
                    "INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
                    [
                        $name,
                        $email,
                        password_hash($password, PASSWORD_DEFAULT),
                        $role,
                    ],
                );
            }
            audit(null, $actor, "admin", "user_saved", ["email" => $email]);
            $result = ["ok" => true];
        }
    } elseif ($path === "admin/audit" && $method === "GET") {
        user(true);
        $result = all("SELECT * FROM audit_log ORDER BY id DESC LIMIT 200");
    } else {
        fail(404, "Không tìm thấy chức năng.");
    }
} else {
    fail(404, "Không tìm thấy API.");
}
if (
    str_starts_with($path, "admin/orders/") &&
    isset($u) &&
    $u["role"] === "staff" &&
    is_array($result)
) {
    unset($result["actual_shipping"], $result["other_cost"]);
    foreach ($result["items"] ?? [] as $k => $i) {
        unset(
            $result["items"][$k]["unit_cost"],
            $result["items"][$k]["cost_reversed"],
        );
    }
    foreach ($result["history"] ?? [] as $k => $e) {
        if (in_array($e["action"], ["costs", "refund"], true)) {
            unset($result["history"][$k]["detail"]);
        }
    }
}
echo json_value($result);
