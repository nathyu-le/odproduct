<?php
require_once __DIR__ . '/commerce.php';
function telegram_request(string $method, array $data): array
{
  $t = telegram_config();
  if (empty($t['token'])) {
    throw new RuntimeException('Telegram chưa cấu hình');
  }
  $ch = curl_init('https://api.telegram.org/bot' . $t['token'] . '/' . $method);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_value($data),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
  ]);
  $raw = curl_exec($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $r = json_decode($raw ?: '{}', true);
  if ($status !== 200 || empty($r['ok'])) {
    throw new RuntimeException('Telegram gửi thất bại (HTTP ' . $status . ')');
  }
  return $r;
}
function telegram_buttons(int $id): array
{
  return [
    'inline_keyboard' => [
      [
        ['text' => '✓ Xác nhận đơn', 'callback_data' => "o:$id:confirm"],
        ['text' => '₫ Nhận tiền', 'callback_data' => "o:$id:paid"],
      ],
      [
        ['text' => 'Chuẩn bị', 'callback_data' => "o:$id:prepare"],
        ['text' => 'Đang giao', 'callback_data' => "o:$id:ship"],
      ],
      [
        ['text' => 'Giao thành công', 'callback_data' => "o:$id:deliver"],
        ['text' => 'Huỷ đơn', 'callback_data' => "o:$id:cancel"],
      ],
    ],
  ];
}
function outbox_run(int $limit = 10): array
{
  $processed = 0;
  $failed = 0;
  for ($i = 0; $i < $limit; $i++) {
    $job = transaction(function () {
      $j = one(
        "SELECT * FROM outbox WHERE (state='pending' OR state='processing') AND next_attempt<=? ORDER BY id LIMIT 1 FOR UPDATE",
        [now()],
      );
      if ($j) {
        query("UPDATE outbox SET state='processing',next_attempt=? WHERE id=?", [
          date('Y-m-d H:i:s', time() + 120),
          $j['id'],
        ]);
      }
      return $j;
    });
    if (!$job) {
      break;
    }
    try {
      $o = one('SELECT * FROM orders WHERE id=?', [$job['order_id']]);
      $lines = [];
      foreach (all('SELECT * FROM order_items WHERE order_id=?', [$o['id']]) as $item) {
        $lines[] =
          $item['quantity'] . ' × ' . $item['product_name'] . ' / ' . $item['variant_name'];
      }
      $total =
        $o['total'] === null
          ? 'Chờ xác nhận phí giao'
          : number_format((int) $o['total'], 0, ',', '.') . 'đ';
      $text =
        "Đơn hàng {$o['code']}\n" .
        mb_substr(implode("\n", $lines), 0, 2200) .
        "\nTổng: $total\nThanh toán: {$o['payment_method']} / {$o['payment_status']}\n{$o['customer_name']} · {$o['phone']}\n{$o['address']}, {$o['region']}\n" .
        config()['url'] .
        '/#/admin/orders/' .
        $o['id'];
      telegram_request('sendMessage', [
        'chat_id' => telegram_config()['chat_id'],
        'text' => $text,
        'reply_markup' => telegram_buttons((int) $o['id']),
      ]);
      query("UPDATE outbox SET state='sent',attempts=attempts+1,last_error=NULL WHERE id=?", [
        $job['id'],
      ]);
      $processed++;
    } catch (Throwable $e) {
      $attempt = (int) $job['attempts'] + 1;
      query('UPDATE outbox SET state=?,attempts=?,last_error=?,next_attempt=? WHERE id=?', [
        $attempt >= 8 ? 'failed' : 'pending',
        $attempt,
        'Gửi Telegram thất bại; kiểm tra cấu hình/kết nối.',
        date('Y-m-d H:i:s', time() + min(3600, 30 * 2 ** $attempt)),
        $job['id'],
      ]);
      $failed++;
    }
  }
  return compact('processed', 'failed');
}
function telegram_webhook(array $b): array
{
  $t = telegram_config();
  $secret = $_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '';
  if (empty($t['secret']) || !hash_equals($t['secret'], $secret)) {
    fail(403, 'Webhook không hợp lệ.');
  }
  $update = integer($b['update_id'] ?? null, 0, PHP_INT_MAX);
  $cb = $b['callback_query'] ?? null;
  $msg = $cb['message'] ?? ($b['message'] ?? []);
  $uid = (string) ($cb['from']['id'] ?? ($msg['from']['id'] ?? ''));
  $chat = (string) ($msg['chat']['id'] ?? '');
  if (
    $chat !== (string) $t['chat_id'] ||
    !in_array($uid, array_map('strval', $t['allowed_users']), true)
  ) {
    fail(403, 'Telegram không được cấp quyền.');
  }
  // Transitions are transactional and idempotent; only acknowledge the update after applying it.
  if (one('SELECT update_id FROM telegram_updates WHERE update_id=?', [$update])) {
    return ['ok' => true];
  }
  $data = $cb['data'] ?? '';
  $actor = 'telegram:' . $uid;
  $reply = '';
  if (preg_match('/^o:(\d+):(confirm|paid|prepare|ship|deliver|cancel)$/', $data, $m)) {
    $id = (int) $m[1];
    $action = $m[2];
    if (in_array($action, ['paid', 'cancel'], true)) {
      $nonce = bin2hex(random_bytes(16));
      query(
        'INSERT INTO telegram_pending(nonce,order_id,user_id,chat_id,action,expires_at) VALUES(?,?,?,?,?,?)',
        [$nonce, $id, $uid, $chat, $action, date('Y-m-d H:i:s', time() + 300)],
      );
      if ($action === 'paid') {
        telegram_request('sendMessage', [
          'chat_id' => $chat,
          'text' => 'Xác nhận đã thực nhận đủ tiền?',
          'reply_markup' => [
            'inline_keyboard' => [
              [['text' => 'Đúng, đã nhận tiền', 'callback_data' => 'yes:' . $nonce]],
            ],
          ],
        ]);
      } else {
        telegram_request('sendMessage', [
          'chat_id' => $chat,
          'text' => 'Chọn lý do huỷ hoặc nhập: /cancel ' . $nonce . ' lý do',
          'reply_markup' => [
            'inline_keyboard' => [
              [
                ['text' => 'Khách yêu cầu', 'callback_data' => 'no:' . $nonce . ':customer'],
                ['text' => 'Hết hàng', 'callback_data' => 'no:' . $nonce . ':stock'],
              ],
              [
                ['text' => 'Không liên hệ được', 'callback_data' => 'no:' . $nonce . ':contact'],
                ['text' => 'Ngoài phạm vi', 'callback_data' => 'no:' . $nonce . ':range'],
              ],
            ],
          ],
        ]);
      }
      $reply = 'Cần xác nhận thêm.';
    } else {
      transition($id, $action, [], $actor, 'telegram');
      $reply = 'Đã cập nhật đơn.';
    }
  } elseif (
    preg_match('/^(yes|no):([a-f0-9]{32})(?::(customer|stock|contact|range))?$/', $data, $m)
  ) {
    $p = one(
      'SELECT * FROM telegram_pending WHERE nonce=? AND user_id=? AND chat_id=? AND expires_at>?',
      [$m[2], $uid, $chat, now()],
    );
    if (!$p) {
      fail(409, 'Xác nhận đã hết hạn.');
    }
    $reason = [
      'customer' => 'Khách yêu cầu',
      'stock' => 'Hết hàng',
      'contact' => 'Không liên hệ được',
      'range' => 'Ngoài phạm vi giao',
    ];
    if (
      ($m[1] === 'yes' && $p['action'] !== 'paid') ||
      ($m[1] === 'no' && $p['action'] !== 'cancel')
    ) {
      fail(422, 'Xác nhận không hợp lệ.');
    }
    transition(
      (int) $p['order_id'],
      $p['action'],
      $p['action'] === 'cancel' ? ['reason' => $reason[$m[3]] ?? 'Lý do khác'] : [],
      $actor,
      'telegram',
    );
    query('DELETE FROM telegram_pending WHERE nonce=?', [$m[2]]);
    $reply = 'Đã xác nhận.';
  } elseif (preg_match('/^\/cancel ([a-f0-9]{32}) (.+)$/su', $msg['text'] ?? '', $m)) {
    $p = one(
      "SELECT * FROM telegram_pending WHERE nonce=? AND user_id=? AND chat_id=? AND action='cancel' AND expires_at>?",
      [$m[1], $uid, $chat, now()],
    );
    if (!$p) {
      fail(409, 'Yêu cầu huỷ hết hạn.');
    }
    transition((int) $p['order_id'], 'cancel', ['reason' => clean($m[2], 500)], $actor, 'telegram');
    query('DELETE FROM telegram_pending WHERE nonce=?', [$m[1]]);
    $reply = 'Đã huỷ; hoàn tiền xử lý riêng.';
  } else {
    $reply = 'Mở đơn từ thông báo để thao tác.';
  }
  query('INSERT IGNORE INTO telegram_updates(update_id,created_at) VALUES(?,?)', [$update, now()]);
  try {
    if ($cb) {
      telegram_request('answerCallbackQuery', ['callback_query_id' => $cb['id'], 'text' => $reply]);
    } else {
      telegram_request('sendMessage', ['chat_id' => $chat, 'text' => $reply]);
    }
  } catch (Throwable) {
  }
  return ['ok' => true];
}
function telegram_config(): array
{
  $base = config()['telegram'];
  $r = setting('telegram_credentials');
  if (!empty($r['encrypted'])) {
    $stored = json_decode(decrypt_token($r['encrypted']), true);
    return array_merge($base, $stored);
  }
  return $base;
}
function telegram_config_save(array $b, string $actor): array
{
  $current = telegram_config();
  $token = trim($b['token'] ?? '');
  $secret = trim($b['secret'] ?? '');
  if ($token !== '') {
    if (!preg_match('/^[0-9]+:[A-Za-z0-9_-]{25,}$/', $token)) {
      fail(422, 'Bot token không hợp lệ.');
    }
    $current['token'] = $token;
  }
  if ($secret !== '') {
    if (!preg_match('/^[A-Za-z0-9_-]{32,256}$/', $secret)) {
      fail(422, 'Secret cần từ 32 đến 256 ký tự a-z, số, _ hoặc -.');
    }
    $current['secret'] = $secret;
  }
  $chat = clean((string) ($b['chat_id'] ?? ''), 30);
  if (!preg_match('/^-?[0-9]+$/', $chat)) {
    fail(422, 'Chat ID phải là số.');
  }
  $allowed = $b['allowed_users'] ?? [];
  if (is_string($allowed)) {
    $allowed = array_filter(array_map('trim', explode(',', $allowed)));
  }
  if (!is_array($allowed) || !count($allowed)) {
    fail(422, 'Cần ít nhất một Telegram User ID.');
  }
  foreach ($allowed as $uid) {
    if (!preg_match('/^[0-9]+$/', (string) $uid)) {
      fail(422, 'User ID không hợp lệ.');
    }
  }
  $current['chat_id'] = $chat;
  $current['allowed_users'] = array_map('strval', $allowed);
  query(
    'INSERT INTO settings(`key`,value) VALUES(?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)',
    ['telegram_credentials', json_value(['encrypted' => encrypt_token(json_value($current))])],
  );
  audit(null, $actor, 'admin', 'telegram_config_updated', [
    'chat_id' => $chat,
    'allowed_users' => $allowed,
  ]);
  return ['ok' => true];
}
