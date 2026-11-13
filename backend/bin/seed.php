<?php
if (one('SELECT id FROM products LIMIT 1')) {
  exit("Demo already exists; no changes\n");
}
transaction(function () {
  $demo = json_decode(
    file_get_contents(dirname(__DIR__) . '/demo/catalog.json'),
    true,
    512,
    JSON_THROW_ON_ERROR,
  );
  foreach ($demo['settings'] as $key => $value) {
    query(
      'INSERT INTO settings(`key`,value) VALUES(?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)',
      [$key, json_value($value)],
    );
  }
  $categories = [];
  foreach ($demo['categories'] as $index => $category) {
    query(
      'INSERT INTO categories(name,slug,icon,sort_order) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
      [...$category, $index],
    );
    $categories[$index + 1] = (int) one('SELECT id FROM categories WHERE slug=?', [$category[1]])[
      'id'
    ];
  }
  foreach ($demo['products'] as $index => $p) {
    [$cat, $name, $slug, $brand, $image, $price, $cost, $stock, $pin, $variant, $description] = $p;
    query(
      'INSERT INTO products(category_id,name,slug,brand,description,images,featured,pinned,sort_order,created_at) VALUES(?,?,?,?,?,?,1,?,?,?)',
      [
        $categories[$cat],
        $name,
        $slug,
        $brand,
        $description,
        json_value(['images/' . $image . '.jpg', 'images/desk.jpg']),
        $pin,
        $index,
        now(),
      ],
    );
    $id = (int) db()->lastInsertId();
    query('INSERT INTO variants(product_id,sku,name,price,cost,stock) VALUES(?,?,?,?,?,?)', [
      $id,
      'OD-' . strtoupper($slug),
      $variant,
      $price,
      $cost,
      $stock,
    ]);
  }
  query('UPDATE products SET flash_price=590000,flash_start=?,flash_end=? WHERE slug=?', [
    date('Y-m-d H:i:s', time() - 3600),
    date('Y-m-d H:i:s', time() + 86400 * 7),
    'sound-mini',
  ]);
  query(
    'INSERT INTO coupons(code,type,value,min_total,max_discount,max_uses,starts_at,ends_at) VALUES(?,?,?,?,?,?,?,?)',
    [
      'HELLOOD',
      'percent',
      10,
      500000,
      100000,
      100,
      now(),
      date('Y-m-d H:i:s', time() + 86400 * 90),
    ],
  );
});
echo "Demo seeded. No sales, customers or admin passwords are fabricated.\n";
