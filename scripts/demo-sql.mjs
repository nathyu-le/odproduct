import { readFile, writeFile } from 'node:fs/promises';
const d = JSON.parse(await readFile('backend/demo/catalog.json', 'utf8'));
const sql = (v) =>
  v == null
    ? 'NULL'
    : typeof v === 'number'
      ? String(v)
      : "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
const out = [
  '-- Demo only: import once into a fresh, migrated database.',
  'SET NAMES utf8mb4;',
  "SET time_zone='+07:00';",
  'START TRANSACTION;',
];
for (const [key, value] of Object.entries(d.settings))
  out.push(
    `INSERT INTO settings(\`key\`,value) VALUES(${sql(key)},${sql(JSON.stringify(value))});`,
  );
d.categories.forEach(([name, slug, icon], i) =>
  out.push(
    `INSERT INTO categories(name,slug,icon,sort_order) VALUES(${sql(name)},${sql(slug)},${sql(icon)},${i});`,
  ),
);
d.products.forEach(
  ([cat, name, slug, brand, image, price, cost, stock, pin, variant, description], i) => {
    out.push(
      `INSERT INTO products(category_id,name,slug,brand,description,images,featured,pinned,sort_order,created_at) VALUES((SELECT id FROM categories WHERE slug=${sql(d.categories[cat - 1][1])}),${[name, slug, brand, description, JSON.stringify([`images/${image}.jpg`, 'images/desk.jpg'])].map(sql).join(',')},1,${pin},${i},NOW());`,
    );
    out.push(
      `INSERT INTO variants(product_id,sku,name,price,cost,stock) VALUES(LAST_INSERT_ID(),${[('OD-' + slug).toUpperCase(), variant, price, cost, stock].map(sql).join(',')});`,
    );
  },
);
out.push(
  "UPDATE products SET flash_price=590000,flash_start=DATE_SUB(NOW(),INTERVAL 1 HOUR),flash_end=DATE_ADD(NOW(),INTERVAL 7 DAY) WHERE slug='sound-mini';",
  "INSERT INTO coupons(code,type,value,min_total,max_discount,max_uses,starts_at,ends_at) VALUES('HELLOOD','percent',10,500000,100000,100,NOW(),DATE_ADD(NOW(),INTERVAL 90 DAY));",
  'COMMIT;',
);
await writeFile('backend/demo/demo.sql', out.join('\n') + '\n');
console.log('Generated schema-compatible demo SQL (no real customers/orders).');
