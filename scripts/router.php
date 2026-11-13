<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($path, '/api/')) {
  if ($path === '/api/index.php') {
    require dirname(__DIR__) . '/backend/index.php';
    return true;
  }
  http_response_code(404);
  return true;
}
if (str_starts_with($path, '/images/') || str_starts_with($path, '/fonts/')) {
  $file = realpath(dirname(__DIR__) . '/public' . $path);
  if ($file && str_starts_with($file, dirname(__DIR__) . '/public/')) {
    header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->file($file));
    readfile($file);
    return true;
  }
}
if (str_starts_with($path, '/uploads/')) {
  $file = realpath(dirname(__DIR__) . $path);
  if (
    $file &&
    str_starts_with($file, dirname(__DIR__) . '/uploads/') &&
    preg_match('/\.(jpg|jpeg|png|webp)$/i', $file)
  ) {
    header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->file($file));
    header('X-Content-Type-Options: nosniff');
    readfile($file);
    return true;
  }
}
http_response_code(404);
echo 'API development server';
