<?php
return [
  'env' => 'production',
  'url' => 'https://example.com/shop', // No trailing slash; supports a subdirectory.
  'app_key' => '', // Tự sinh khóa riêng trên hosting, không cần điền.
  'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'TEN_DATABASE',
    'user' => 'USER_DATABASE',
    'password' => '',
  ],
  'routing' => [
    'enabled' => false,
    'base_url' => 'https://router.project-osrm.org',
    'timeout' => 5,
  ],
  // OSRM public server is for evaluation. Use a contracted/self-hosted routing service in production.
  'telegram' => ['token' => '', 'secret' => '', 'chat_id' => '', 'allowed_users' => []],
];
