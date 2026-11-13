import { cp, mkdir, writeFile, rm, chmod, readdir } from 'node:fs/promises';
await rm('build/cpanel', { recursive: true, force: true });
await mkdir('build/cpanel/api', { recursive: true });
await cp('dist', 'build/cpanel', { recursive: true });
await cp('backend', 'build/cpanel/api', {
  recursive: true,
  filter: (p) =>
    !p.endsWith('config.php') && !p.endsWith('install.key') && !p.includes('/storage/'),
});
await mkdir('build/cpanel/api/storage', { recursive: true });
await mkdir('build/cpanel/uploads', { recursive: true });
await writeFile(
  'build/cpanel/api/.htaccess',
  `Options -Indexes\n<FilesMatch "^(config.*|install\\.key)$">\nRequire all denied\n</FilesMatch>\nRewriteEngine On\nRewriteRule ^(src|bin|migrations|storage|demo)(/|$) - [F,L]\n`,
);
await writeFile(
  'build/cpanel/uploads/.htaccess',
  `Options -Indexes\nRemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8 .phar\n<FilesMatch "\\.(php.*|phtml|phar|cgi|pl|py|sh|html|svg)$">\nRequire all denied\n</FilesMatch>\n`,
);
await writeFile(
  'build/cpanel/.htaccess',
  `Options -Indexes\nDirectoryIndex index.html\n<IfModule mod_headers.c>\nHeader always set X-Content-Type-Options "nosniff"\nHeader always set Referrer-Policy "no-referrer"\nHeader always set X-Frame-Options "DENY"\nHeader always set Permissions-Policy "geolocation=(self), camera=(), microphone=()"\nHeader always set Content-Security-Policy "default-src 'self'; img-src 'self' data: https://img.vietqr.io https://*.tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"\n</IfModule>\n`,
);
await writeFile(
  'build/cpanel/robots.txt',
  'User-agent: *\nDisallow: /api/\n# Order links use hash routes; order pages also set robots=noindex.\n',
);
for (const directory of ['src', 'bin', 'migrations', 'storage', 'demo'])
  await writeFile(`build/cpanel/api/${directory}/.htaccess`, 'Require all denied\n');
async function permissions(dir) {
  await chmod(dir, 0o755);
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const path = dir + '/' + f.name;
    if (f.isDirectory()) await permissions(path);
    else await chmod(path, 0o644);
  }
}
await permissions('build/cpanel');
console.log('cPanel package: build/cpanel (no Node.js runtime needed)');
