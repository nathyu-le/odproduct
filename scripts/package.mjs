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
    !p.endsWith(".htaccess") &&
    !p.endsWith("config.php") &&
    !p.endsWith("install.key") &&
    !p.includes("/storage/"),
});
// This is a blank template. A real server config is never copied into the ZIP.
// Fresh installer creates config.php privately; existing configs are never packaged.

await mkdir(root + "/api/storage", { recursive: true });
await mkdir(root + "/uploads", { recursive: true });
// A public build marker makes it possible to verify an automatic deployment.
await writeFile(root + "/assets/release.txt", new Date().toISOString() + "\n");
// Access guards are merged by PHP, preserving every cPanel PHP handler already on hosting.
await writeFile(root + "/robots.txt", "User-agent: *\nDisallow: /api/\n");
await cp("HUONG-DAN.txt", root + "/HUONG-DAN.txt");
await cp("KIEM-TRA.txt", root + "/KIEM-TRA.txt");
await writeFile(
  root + "/VERSION.txt",
  "MUAPLUS / CPANEL V3\nBuild: " + new Date().toISOString() + "\n",
);
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
for (const entry of ["index.html", "index.php", "assets", "images", "fonts"])
  await cp(root + "/" + entry, updateRoot + "/" + entry, { recursive: true });
await mkdir(updateRoot + "/api/bin", { recursive: true });
await cp(root + "/api/src", updateRoot + "/api/src", {
  recursive: true,
  filter: (p) => !p.endsWith(".htaccess"),
});
await cp(root + "/api/index.php", updateRoot + "/api/index.php");
await cp(root + "/api/bin/cron.php", updateRoot + "/api/bin/cron.php");
await cp(root + "/api/bin/update.php", updateRoot + "/api/bin/update.php");
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
await cp("odproduct-cpanel.zip", "muaplus-cpanel-v3.zip");
console.log(
  "Upload odproduct-cpanel.zip to cPanel and Extract. No Node.js/Docker/Terminal required.",
);
