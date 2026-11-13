// Parse source only; this does not execute PHP or connect to a database.
import fs from "node:fs/promises";
import path from "node:path";
import PhpParser from "php-parser";
const parser = new PhpParser({
  parser: { extractDoc: true, suppressErrors: false, version: "8.2" },
  ast: { withPositions: true },
});
async function visit(dir) {
  let count = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "storage") count += await visit(file);
    } else if (file.endsWith(".php") && !file.endsWith("/config.php")) {
      parser.parseCode(await fs.readFile(file, "utf8"), file);
      count++;
    }
  }
  return count;
}
console.log(
  `Parsed ${(await visit("backend")) + (await visit("scripts")) + (await visit("public"))} PHP files. Runtime/business tests not run.`,
);
