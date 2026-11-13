<?php
return [
  'env' => 'production',
  'url' => 'https://example.com/shop', // No trailing slash; supports a subdirectory.
  'app_key' => 'REPLACE_WITH_64_RANDOM_HEX_CHARACTERS',
  'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'cpanel_odproduct',
    'user' => 'cpanel_store',
    'password' => 'REPLACE',
  ],
  'routing' => [
    'enabled' => false,
    'base_url' => 'https://router.project-osrm.org',
    'timeout' => 5,
  ],
  // OSRM public server is for evaluation. Use a contracted/self-hosted routing service in production.
  'telegram' => ['token' => '', 'secret' => '', 'chat_id' => '', 'allowed_users' => []],
];
