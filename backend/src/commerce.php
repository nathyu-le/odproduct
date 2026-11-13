<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
function catalog(bool $admin = false): array
{
  $products = all(
    'SELECT p.*,c.name category,c.slug category_slug FROM products p JOIN categories c ON c.id=p.category_id ' .
      ($admin ? '' : 'WHERE p.active=1') .
      ' ORDER BY p.pinned DESC,p.sort_order,p.id',
  );
  foreach ($products as &$p) {
    $p['images'] = json_decode($p['images'], true);
    $p['variants'] = all(
      'SELECT ' .
        ($admin ? '*' : 'id,product_id,sku,name,price,stock,active') .
        ' FROM variants WHERE product_id=? ' .
        ($admin ? '' : 'AND active=1') .
        ' ORDER BY id',
      [$p['id']],
    );
    foreach ($p['variants'] as &$v) {
      $v['compare_price'] = (int) $v['price'];
      if (!$admin) {
        $v['price'] = effective_price($p, $v);
      }
    }
    $p['price'] = $p['variants'][0]['price'] ?? 0;
  }
  return $products;
}
function effective_price(array $p, array $v): int
{
  if ($p['flash_price'] !== null && $p['flash_start'] <= now() && $p['flash_end'] > now()) {
    return min((int) $p['flash_price'], (int) $v['price']);
  }
  return (int) $v['price'];
}
function shipping_fee(float $km, array $r, int $subtotal): int
{
  if ($km < 0 || !is_finite($km)) {
    fail(422, 'Khoảng cách không hợp lệ.');
  }
  if ($km > (float) $r['max_km']) {
    fail(422, 'Địa chỉ ngoài phạm vi giao hàng.');
  }
  if ((int) $r['free_above'] > 0 && $subtotal >= (int) $r['free_above']) {
    return 0;
  }
  $extra = max(0, $km - (float) $r['included_km']);
  $step = (float) $r['round_step'];
  if ($step <= 0) {
    fail(422, 'Bước làm tròn không hợp lệ.');
  }
  $units = $extra / $step;
  $rounded = match ($r['round_mode']) {
    'nearest' => round($units),
    'exact' => $units,
    default => ceil($units - 0.0000001),
  };
  return (int) round((int) $r['base_fee'] + $rounded * $step * (int) $r['per_km']);
}
function distance(array $b, array $rules): ?float
{
  if (!isset($b['latitude'], $b['longitude']) || $b['latitude'] === '' || $b['longitude'] === '') {
    return null;
  }
  $lat = filter_var($b['latitude'], FILTER_VALIDATE_FLOAT);
  $lng = filter_var($b['longitude'], FILTER_VALIDATE_FLOAT);
  if ($lat === false || $lng === false || abs($lat) > 90 || abs($lng) > 180) {
    fail(422, 'Tọa độ không hợp lệ.');
  }
  $r = config()['routing'];
  if (!$r['enabled']) {
    return null;
  }
  $base = rtrim($r['base_url'], '/');
  if (!str_starts_with($base, 'https://')) {
    fail(503, 'Routing yêu cầu HTTPS.');
  }
  $url =
    $base .
    '/route/v1/driving/' .
    (float) $rules['origin_lng'] .
    ',' .
    (float) $rules['origin_lat'] .
    ';' .
    $lng .
    ',' .
    $lat .
    '?overview=false';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => min(10, (int) $r['timeout']),
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
  ]);
  $response = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code !== 200 || !$response) {
    return null;
  }
  $data = json_decode($response, true);
  $meters = $data['routes'][0]['distance'] ?? null;
  return is_numeric($meters) && $meters >= 0 ? round($meters / 1000, 3) : null;
}
function cart_quote(array $b, bool $lock = false): array
{
  $raw = $b['items'] ?? [];
  if (!is_array($raw) || !count($raw) || count($raw) > 50) {
    fail(422, 'Giỏ hàng trống hoặc quá nhiều sản phẩm.');
  }
  $merged = [];
  foreach ($raw as $i) {
    $id = integer($i['variant_id'] ?? null, 1);
    $merged[$id] = ($merged[$id] ?? 0) + integer($i['quantity'] ?? null, 1, 99);
  }
  ksort($merged);
  $items = [];
  $subtotal = 0;
  foreach ($merged as $id => $qty) {
    $v = one(
      'SELECT v.*,p.name product_name,p.images,p.active product_active,p.flash_price,p.flash_start,p.flash_end FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=?' .
        ($lock ? ' FOR UPDATE' : ''),
      [$id],
    );
    if (!$v || !$v['active'] || !$v['product_active']) {
      fail(409, 'Sản phẩm đã ngừng bán.');
    }
    if ($qty > 99 || (int) $v['stock'] < $qty) {
      fail(409, ($v['product_name'] ?? 'Sản phẩm') . ' không đủ tồn kho.');
    }
    $price = effective_price($v, $v);
    $subtotal += $price * $qty;
    $items[] = [
      'variant_id' => (int) $id,
      'product_name' => $v['product_name'],
      'variant_name' => $v['name'],
      'sku' => $v['sku'],
      'image' => json_decode($v['images'], true)[0] ?? '',
      'quantity' => $qty,
      'unit_price' => $price,
      'unit_cost' => (int) $v['cost'],
      'discount' => 0,
    ];
  }
  $coupon = null;
  $discount = 0;
  $code = strtoupper(clean($b['coupon'] ?? '', 40));
  if ($code) {
    $coupon = one('SELECT * FROM coupons WHERE code=?' . ($lock ? ' FOR UPDATE' : ''), [$code]);
    if (
      !$coupon ||
      !$coupon['active'] ||
      $coupon['starts_at'] > now() ||
      $coupon['ends_at'] < now() ||
      $coupon['uses'] >= $coupon['max_uses'] ||
      $subtotal < $coupon['min_total']
    ) {
      fail(422, 'Mã giảm giá chưa đủ điều kiện, đã hết hạn hoặc hết lượt.');
    }
    $discount =
      $coupon['type'] === 'percent'
        ? (int) round(($subtotal * $coupon['value']) / 100)
        : (int) $coupon['value'];
    if ($coupon['max_discount'] !== null) {
      $discount = min($discount, (int) $coupon['max_discount']);
    }
    $discount = min($subtotal, $discount);
  }
  $remaining = $discount;
  foreach ($items as $idx => &$i) {
    $i['discount'] =
      $idx === count($items) - 1
        ? $remaining
        : min(
          $remaining,
          (int) floor(($discount * $i['unit_price'] * $i['quantity']) / max(1, $subtotal)),
        );
    $remaining -= $i['discount'];
  }
  unset($i);
  $rules = setting('shipping');
  $km = distance($b, $rules);
  $shipping = $km === null ? null : shipping_fee($km, $rules, $subtotal - $discount);
  return [
    'items' => $items,
    'subtotal' => $subtotal,
    'discount' => $discount,
    'coupon' => $code ?: null,
    'shipping_fee' => $shipping,
    'distance_km' => $km,
    'shipping_status' => $shipping === null ? 'pending' : 'confirmed',
    'shipping_snapshot' => $rules,
    'total' => $shipping === null ? null : $subtotal - $discount + $shipping,
  ];
}
function quote_hash(array $q): string
{
  return hash_hmac(
    'sha256',
    json_value([
      'items' => array_map(
        fn($i) => [$i['variant_id'], $i['quantity'], $i['unit_price'], $i['discount']],
        $q['items'],
      ),
      'shipping_fee' => $q['shipping_fee'],
      'total' => $q['total'],
    ]),
    hex2bin(config()['app_key']),
  );
}
function public_quote(array $q): array
{
  $q['quote_hash'] = quote_hash($q);
  foreach ($q['items'] as &$i) {
    unset($i['unit_cost']);
  }
  return $q;
}
function order_response(array $o, bool $admin = false): array
{
  $o['items'] = all('SELECT * FROM order_items WHERE order_id=? ORDER BY id', [$o['id']]);
  $o['history'] = all(
    'SELECT actor,channel,action,detail,created_at FROM audit_log WHERE order_id=? ' .
      ($admin ? '' : "AND action NOT IN ('internal_note','costs','payment_review_rejected')") .
      ' ORDER BY id',
    [$o['id']],
  );
  $o['store_snapshot'] = json_decode($o['store_snapshot'], true);
  $o['payment_snapshot'] = json_decode($o['payment_snapshot'], true);
  $o['shipping_snapshot'] = json_decode($o['shipping_snapshot'], true);
  unset($o['token_cipher'], $o['token_hash'], $o['idempotency_key']);
  if (!$admin) {
    unset($o['actual_shipping'], $o['other_cost'], $o['internal_note']);
    if (isset($o['shipping_snapshot']['manual_actor'])) {
      unset($o['shipping_snapshot']['manual_actor']);
    }
    foreach ($o['items'] as &$i) {
      unset($i['unit_cost'], $i['cost_reversed']);
    }
    foreach ($o['history'] as &$e) {
      unset($e['actor'], $e['channel'], $e['detail']);
    }
  }
  return $o;
}
function guest_order(string $token, bool $lock = false): array
{
  if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    fail(404, 'Không tìm thấy đơn hàng.');
  }
  $o = one('SELECT * FROM orders WHERE token_hash=?' . ($lock ? ' FOR UPDATE' : ''), [
    hash('sha256', $token),
  ]);
  if (!$o) {
    fail(404, 'Không tìm thấy đơn hàng.');
  }
  return $o;
}
function place_order(array $b, string $key): array
{
  if (!preg_match('/^[a-zA-Z0-9-]{20,100}$/', $key)) {
    fail(422, 'Thiếu mã chống gửi lặp.');
  }
  $key = hash('sha256', $key);
  $existing = one('SELECT * FROM orders WHERE idempotency_key=?', [$key]);
  if ($existing) {
    return [
      'token' => decrypt_token($existing['token_cipher']),
      'order' => order_response($existing),
    ];
  }
  $name = required($b, 'name', 120);
  $phone = phone(required($b, 'phone', 25));
  $address = required($b, 'address', 500);
  $region = required($b, 'region', 180);
  $method = required($b, 'payment_method', 20);
  $payment = setting('payment');
  if (!in_array($method, ['cod', 'bank'], true) || empty($payment[$method])) {
    fail(422, 'Phương thức thanh toán không khả dụng.');
  }
  try {
    return transaction(function () use (
      $b,
      $key,
      $name,
      $phone,
      $address,
      $region,
      $method,
      $payment,
    ) {
      query('INSERT IGNORE INTO checkout_keys(idempotency_key,created_at) VALUES(?,?)', [
        $key,
        now(),
      ]);
      one('SELECT idempotency_key FROM checkout_keys WHERE idempotency_key=? FOR UPDATE', [$key]);
      $existing = one('SELECT * FROM orders WHERE idempotency_key=?', [$key]);
      if ($existing) {
        return [
          'token' => decrypt_token($existing['token_cipher']),
          'order' => order_response($existing),
        ];
      }
      $q = cart_quote($b, true);
      if (!hash_equals(quote_hash($q), (string) ($b['quote_hash'] ?? ''))) {
        fail(
          409,
          'Giá, tồn kho hoặc phí giao đã thay đổi. Vui lòng xem lại tổng tiền mới và xác nhận lại.',
        );
      }
      $token = bin2hex(random_bytes(32));
      $code = 'OD' . strtoupper(bin2hex(random_bytes(4)));
      $lookup = strtoupper(bin2hex(random_bytes(6)));
      $vals = [
        'code' => $code,
        'token_hash' => hash('sha256', $token),
        'token_cipher' => encrypt_token($token),
        'lookup_code' => $lookup,
        'idempotency_key' => $key,
        'customer_name' => $name,
        'phone' => $phone,
        'address' => $address,
        'region' => $region,
        'note' => clean($b['note'] ?? '', 1000),
        'latitude' => $b['latitude'] ?? null ?: null,
        'longitude' => $b['longitude'] ?? null ?: null,
        'payment_method' => $method,
        'subtotal' => $q['subtotal'],
        'discount' => $q['discount'],
        'shipping_fee' => $q['shipping_fee'],
        'distance_km' => $q['distance_km'],
        'shipping_status' => $q['shipping_status'],
        'shipping_snapshot' => json_value($q['shipping_snapshot']),
        'store_snapshot' => json_value(setting('store')),
        'payment_snapshot' => json_value($payment),
        'total' => $q['total'],
        'coupon_code' => $q['coupon'],
        'internal_note' => '',
        'created_at' => now(),
        'updated_at' => now(),
        'expires_at' => date('Y-m-d H:i:s', time() + 86400),
      ];
      $cols = array_keys($vals);
      query(
        'INSERT INTO orders(' .
          implode(',', $cols) .
          ') VALUES(' .
          implode(',', array_fill(0, count($cols), '?')) .
          ')',
        array_values($vals),
      );
      $id = (int) db()->lastInsertId();
      foreach ($q['items'] as $i) {
        query(
          'INSERT INTO order_items(order_id,variant_id,product_name,variant_name,sku,image,quantity,unit_price,unit_cost,discount) VALUES(?,?,?,?,?,?,?,?,?,?)',
          [
            $id,
            $i['variant_id'],
            $i['product_name'],
            $i['variant_name'],
            $i['sku'],
            $i['image'],
            $i['quantity'],
            $i['unit_price'],
            $i['unit_cost'],
            $i['discount'],
          ],
        );
        query('UPDATE variants SET stock=stock-?,version=version+1 WHERE id=?', [
          $i['quantity'],
          $i['variant_id'],
        ]);
        inventory($i['variant_id'], $id, -$i['quantity'], 'reserve');
      }
      if ($q['coupon']) {
        query('UPDATE coupons SET uses=uses+1 WHERE code=?', [$q['coupon']]);
      }
      audit($id, 'customer', 'storefront', 'received');
      query('INSERT INTO outbox(order_id,next_attempt,created_at) VALUES(?,?,?)', [
        $id,
        now(),
        now(),
      ]);
      return [
        'token' => $token,
        'order' => order_response(one('SELECT * FROM orders WHERE id=?', [$id])),
      ];
    });
  } catch (PDOException $e) {
    if ($e->getCode() === '23000') {
      $existing = one('SELECT * FROM orders WHERE idempotency_key=?', [$key]);
      if ($existing) {
        return [
          'token' => decrypt_token($existing['token_cipher']),
          'order' => order_response($existing),
        ];
      }
    }
    throw $e;
  }
}
function inventory(int $variant, ?int $order, int $delta, string $reason): void
{
  query(
    'INSERT INTO inventory_moves(variant_id,order_id,delta,reason,created_at) VALUES(?,?,?,?,?)',
    [$variant, $order, $delta, $reason, now()],
  );
}
function enqueue_order(int $id): void
{
  query(
    "INSERT INTO outbox(order_id,next_attempt,created_at) SELECT ?,?,? WHERE NOT EXISTS (SELECT id FROM outbox WHERE order_id=? AND state='pending')",
    [$id, now(), now(), $id],
  );
}
function transition(int $id, string $action, array $b, string $actor, string $channel): array
{
  return transaction(function () use ($id, $action, $b, $actor, $channel) {
    $o = one('SELECT * FROM orders WHERE id=? FOR UPDATE', [$id]);
    if (!$o) {
      fail(404, 'Không tìm thấy đơn hàng.');
    }
    $before = $o['status'];
    if (!empty($b['request_key'])) {
      $request = hash('sha256', $id . '|' . $action . '|' . required($b, 'request_key', 100));
      if (one('SELECT idempotency_key FROM order_actions WHERE idempotency_key=?', [$request])) {
        return order_response($o, true);
      }
      query(
        'INSERT INTO order_actions(idempotency_key,order_id,action,created_at) VALUES(?,?,?,?)',
        [$request, $id, $action, now()],
      );
    } elseif ($action === 'refund') {
      fail(422, 'Thiếu mã chống xử lý hoàn/trả lặp.');
    }
    $map = [
      'confirm' => ['received', 'confirmed'],
      'prepare' => ['confirmed', 'preparing'],
      'ship' => ['preparing', 'shipping'],
      'deliver' => ['shipping', 'delivered'],
    ];
    if (isset($map[$action])) {
      [$from, $to] = $map[$action];
      if ($before === $to) {
        return order_response($o, true);
      }
      if ($before !== $from) {
        fail(409, 'Không thể chuyển trạng thái ở bước hiện tại.');
      }
      if ($o['shipping_status'] !== 'confirmed') {
        fail(409, 'Khách chưa xác nhận phí giao hàng.');
      }
      if ($o['payment_method'] === 'bank' && $o['payment_status'] !== 'paid') {
        fail(409, 'Cần xác nhận thanh toán chuyển khoản trước.');
      }
      query('UPDATE orders SET status=?,updated_at=? WHERE id=?', [$to, now(), $id]);
    } elseif ($action === 'paid') {
      if ($before === 'cancelled') {
        fail(409, 'Đơn đã huỷ.');
      }
      if ($o['payment_status'] === 'paid') {
        return order_response($o, true);
      }
      if ($o['total'] === null || $o['shipping_status'] !== 'confirmed') {
        fail(409, 'Tổng tiền chưa được khách xác nhận.');
      }
      if ((int) $o['refunded_amount'] > 0) {
        fail(409, 'Không ghi nhận lại tiền sau hoàn tiền.');
      }
      query("UPDATE orders SET payment_status='paid',paid_amount=total,updated_at=? WHERE id=?", [
        now(),
        $id,
      ]);
    } elseif ($action === 'cancel') {
      if (
        $actor === 'cron' &&
        ($before !== 'received' ||
          (int) $o['paid_amount'] > 0 ||
          $o['payment_status'] === 'review' ||
          $o['expires_at'] >= now())
      ) {
        return order_response($o, true);
      }
      if ($before === 'cancelled') {
        return order_response($o, true);
      }
      if (in_array($before, ['shipping', 'delivered'], true)) {
        fail(409, 'Đơn đang/đã giao cần xử lý trả hàng.');
      }
      $reason = required($b, 'reason', 500);
      if (!$o['stock_released']) {
        foreach (
          all('SELECT * FROM order_items WHERE order_id=? ORDER BY variant_id', [$id])
          as $i
        ) {
          query('UPDATE variants SET stock=stock+?,version=version+1 WHERE id=?', [
            $i['quantity'],
            $i['variant_id'],
          ]);
          inventory((int) $i['variant_id'], $id, (int) $i['quantity'], 'cancel');
        }
        if ($o['coupon_code']) {
          query('UPDATE coupons SET uses=GREATEST(0,uses-1) WHERE code=?', [$o['coupon_code']]);
        }
      }
      query(
        "UPDATE orders SET status='cancelled',cancel_reason=?,stock_released=1,updated_at=? WHERE id=?",
        [$reason, now(), $id],
      );
    } elseif ($action === 'costs') {
      query('UPDATE orders SET actual_shipping=?,other_cost=?,updated_at=? WHERE id=?', [
        integer($b['actual_shipping'] ?? 0),
        integer($b['other_cost'] ?? 0),
        now(),
        $id,
      ]);
    } elseif ($action === 'internal_note') {
      query('UPDATE orders SET internal_note=?,updated_at=? WHERE id=?', [
        clean($b['note'] ?? '', 2000),
        now(),
        $id,
      ]);
    } elseif ($action === 'shipping_quote') {
      if (!in_array($before, ['received', 'confirmed'], true) || $o['paid_amount'] > 0) {
        fail(409, 'Không thể thay phí giao cho đơn này.');
      }
      $fee = integer($b['shipping_fee'] ?? null);
      $snapshot = json_decode($o['shipping_snapshot'], true);
      $snapshot['manual_fee'] = $fee;
      $snapshot['manual_actor'] = $actor;
      query('UPDATE orders SET shipping_snapshot=? WHERE id=?', [json_value($snapshot), $id]);
      query(
        "UPDATE orders SET shipping_fee=?,total=subtotal-discount+?,shipping_status='awaiting_customer',updated_at=? WHERE id=?",
        [$fee, $fee, now(), $id],
      );
    } elseif ($action === 'refund') {
      $shippingReversal = integer($b['shipping_reversal'] ?? 0);
      if ($shippingReversal > max(0, (int) $o['shipping_fee'] - (int) $o['shipping_reversed'])) {
        fail(422, 'Phần giảm doanh thu phí giao vượt số phí còn lại.');
      }
      $amount = integer($b['amount'] ?? null, 0);
      if ($amount > (int) $o['paid_amount'] - (int) $o['refunded_amount']) {
        fail(422, 'Hoàn tiền vượt số thực thu còn lại.');
      }
      $reason = required($b, 'reason', 500);
      $qty = integer($b['quantity'] ?? 0, 0, 99);
      $itemId = null;
      if ($qty) {
        if ($before !== 'delivered') {
          fail(409, 'Chỉ trả hàng của đơn đã giao.');
        }
        $itemId = integer($b['item_id'] ?? null, 1);
        $i = one('SELECT * FROM order_items WHERE id=? AND order_id=? FOR UPDATE', [$itemId, $id]);
        if (!$i || $qty > $i['quantity'] - $i['returned_quantity']) {
          fail(422, 'Số lượng trả không hợp lệ.');
        }
        $returned = (int) $i['returned_quantity'] + $qty;
        $net = (int) $i['unit_price'] * (int) $i['quantity'] - (int) $i['discount'];
        $reverse =
          $returned === (int) $i['quantity']
            ? $net
            : (int) floor(($net * $returned) / (int) $i['quantity']);
        query(
          'UPDATE order_items SET returned_quantity=?,revenue_reversed=?,cost_reversed=? WHERE id=?',
          [$returned, $reverse, $returned * (int) $i['unit_cost'], $itemId],
        );
        query('UPDATE variants SET stock=stock+?,version=version+1 WHERE id=?', [
          $qty,
          $i['variant_id'],
        ]);
        inventory((int) $i['variant_id'], $id, $qty, 'return');
      }
      if ($amount === 0 && $qty === 0 && $shippingReversal === 0) {
        fail(422, 'Nhập số tiền hoàn hoặc số lượng trả.');
      }
      query(
        'INSERT INTO refunds(order_id,amount,item_id,quantity,reason,created_at) VALUES(?,?,?,?,?,?)',
        [$id, $amount, $itemId, $qty, $reason, now()],
      );
      $refunded = (int) $o['refunded_amount'] + $amount;
      $status =
        $refunded > 0
          ? ($refunded === (int) $o['paid_amount']
            ? 'refunded'
            : 'partial_refund')
          : $o['payment_status'];
      query(
        'UPDATE orders SET refunded_amount=?,shipping_reversed=shipping_reversed+?,payment_status=?,updated_at=? WHERE id=?',
        [$refunded, $shippingReversal, $status, now(), $id],
      );
    } else {
      fail(422, 'Thao tác không hợp lệ.');
    }
    audit($id, $actor, $channel, $action, ['from' => $before] + $b);
    if (!in_array($action, ['costs', 'internal_note'], true)) {
      enqueue_order($id);
    }
    return order_response(one('SELECT * FROM orders WHERE id=?', [$id]), true);
  });
}
function financials(array $o, array $items): array
{
  $recognized = $o['status'] === 'delivered';
  $revenue = 0;
  $cost = 0;
  foreach ($items as $i) {
    if ($recognized) {
      $revenue +=
        (int) $i['unit_price'] * (int) $i['quantity'] -
        (int) $i['discount'] -
        (int) $i['revenue_reversed'];
      $cost += (int) $i['unit_cost'] * (int) $i['quantity'] - (int) $i['cost_reversed'];
    }
  }
  $ship = $recognized ? max(0, (int) $o['shipping_fee'] - (int) $o['shipping_reversed']) : 0;
  $gross = $revenue - $cost;
  return [
    'revenue' => $revenue,
    'cost' => $cost,
    'gross' => $gross,
    'shipping_collected' => $ship,
    'actual_shipping' => (int) $o['actual_shipping'],
    'other_cost' => (int) $o['other_cost'],
    'profit' => $gross + $ship - (int) $o['actual_shipping'] - (int) $o['other_cost'],
    'cash' => (int) $o['paid_amount'] - (int) $o['refunded_amount'],
    'receivable' =>
      $o['status'] === 'cancelled'
        ? 0
        : max(
          0,
          (int) $o['total'] -
            array_sum(array_column($items, 'revenue_reversed')) -
            (int) $o['shipping_reversed'] -
            (int) $o['paid_amount'] +
            (int) $o['refunded_amount'],
        ),
  ];
}
function report(string $from, string $to, string $status = ''): array
{
  if (
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) ||
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) ||
    $from > $to
  ) {
    fail(422, 'Khoảng ngày không hợp lệ.');
  }
  $rows = all(
    'SELECT * FROM orders WHERE created_at>=? AND created_at<=?' .
      ($status ? ' AND status=?' : '') .
      ' ORDER BY created_at DESC',
    $status
      ? [$from . ' 00:00:00', $to . ' 23:59:59', $status]
      : [$from . ' 00:00:00', $to . ' 23:59:59'],
  );
  $totals = array_fill_keys(
    [
      'revenue',
      'cost',
      'gross',
      'shipping_collected',
      'actual_shipping',
      'other_cost',
      'profit',
      'cash',
      'receivable',
    ],
    0,
  );
  $out = [];
  foreach ($rows as $o) {
    $f = financials($o, all('SELECT * FROM order_items WHERE order_id=?', [$o['id']]));
    foreach ($f as $k => $v) {
      $totals[$k] += $v;
    }
    $out[] =
      [
        'id' => $o['id'],
        'code' => $o['code'],
        'created_at' => $o['created_at'],
        'customer_name' => $o['customer_name'],
        'status' => $o['status'],
        'payment_status' => $o['payment_status'],
      ] + $f;
  }
  return [
    'from' => $from,
    'to' => $to,
    'timezone' => 'Asia/Ho_Chi_Minh',
    'basis' =>
      'Đơn theo ngày đặt; doanh thu chỉ ghi nhận khi giao thành công. Hoàn/trả điều chỉnh nhóm ngày đặt gốc.',
    'rows' => $out,
    'totals' => $totals,
  ];
}
