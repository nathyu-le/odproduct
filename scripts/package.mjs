import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  writeFile,
  rm,
  chmod,
  readdir,
  readFile,
} from "node:fs/promises";
import { zipDirectory } from "./zip.mjs";
const root = "build/cpanel";
await rm(root, { recursive: true, force: true });
await mkdir(root + "/api", { recursive: true });
await cp("dist", root, { recursive: true });
await cp("backend", root + "/api", {
  recursive: true,
  filter: (p) =>
    !p.endsWith("config.php") &&
    !p.endsWith("install.key") &&
    !p.includes("/storage/"),
});
// This is a blank template. A real server config is never copied into the ZIP.
await cp("backend/config.example.php", root + "/api/config.php");
await rm(root + "/api/config.example.php");
await mkdir(root + "/api/storage", { recursive: true });
await mkdir(root + "/uploads", { recursive: true });
await writeFile(
  root + "/api/.htaccess",
  `Options -Indexes
<FilesMatch "^config.*">
Require all denied
</FilesMatch>
RewriteEngine On
RewriteRule ^(src|bin|migrations|storage|demo)(/|$) - [F,L]
`,
);
for (const dir of ["src", "bin", "migrations", "storage", "demo"])
  await writeFile(root + "/api/" + dir + "/.htaccess", "Require all denied\n");
await writeFile(
  root + "/uploads/.htaccess",
  `Options -Indexes
RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8 .phar
<FilesMatch "\\.(php.*|phtml|phar|cgi|pl|py|sh|html|svg)$">
Require all denied
</FilesMatch>
`,
);
await writeFile(
  root + "/.htaccess",
  `Options -Indexes
DirectoryIndex index.html
<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "no-referrer"
Header always set X-Frame-Options "DENY"
Header always set Permissions-Policy "geolocation=(self), camera=(), microphone=()"
Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data: https://img.vietqr.io https://*.tile.openstreetmap.org https://basemaps.cartocdn.com; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
</IfModule>
`,
);
await writeFile(root + "/robots.txt", "User-agent: *\nDisallow: /api/\n");
await cp("HUONG-DAN.txt", root + "/HUONG-DAN.txt");
async function permissions(dir) {
  await chmod(dir, 0o755);
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = dir + "/" + e.name;
    if (e.isDirectory()) await permissions(p);
    else await chmod(p, 0o644);
  }
}
await permissions(root);
const updateRoot = "build/update";
await rm(updateRoot, { recursive: true, force: true });
await mkdir(updateRoot, { recursive: true });
for (const entry of ["index.html", "assets", "images", "fonts"])
  await cp(root + "/" + entry, updateRoot + "/" + entry, { recursive: true });
await mkdir(updateRoot + "/api/bin", { recursive: true });
await cp(root + "/api/src", updateRoot + "/api/src", {
  recursive: true,
  filter: (p) => !p.endsWith(".htaccess"),
});
await cp(root + "/api/index.php", updateRoot + "/api/index.php");
await cp(root + "/api/bin/cron.php", updateRoot + "/api/bin/cron.php");
await zipDirectory(updateRoot, "odproduct-update.zip");
const sha256 = createHash("sha256")
  .update(await readFile("odproduct-update.zip"))
  .digest("hex");
const manifest = {
  sha256,
  built_at: new Date().toISOString(),
  php_min: 80200,
  archive: "odproduct-update.zip",
};
await writeFile("deploy.json", JSON.stringify(manifest, null, 2) + "\n");
await writeFile(
  root + "/api/release.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
await zipDirectory(root, "odproduct-cpanel.zip");
console.log(
  "Upload odproduct-cpanel.zip to cPanel and Extract. No Node.js/Docker/Terminal required.",
);
