import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
const traverse = traverseModule.default || traverseModule;
export function translationKeys() {
  const keys = new Set();
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "locales") walk(file);
      } else if (/\.(ts|tsx)$/.test(file) && !file.endsWith(".d.ts")) {
        const tree = parse(fs.readFileSync(file, "utf8"), {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        });
        traverse(tree, {
          CallExpression(p) {
            if (
              p.node.callee.type === "Identifier" &&
              p.node.callee.name === "tx" &&
              p.node.arguments[0]?.type === "StringLiteral"
            )
              keys.add(p.node.arguments[0].value.trim());
          },
        });
      }
    }
  }
  walk("src");
  return [...keys].sort();
}
if (process.argv[1]?.endsWith("check-i18n.mjs")) {
  const keys = translationKeys();
  let failures = 0;
  for (const lang of ["en", "vi", "ko", "zh"]) {
    const dictionary = JSON.parse(
      fs.readFileSync("src/i18n/locales/" + lang + ".json", "utf8"),
    );
    for (const key of keys) {
      if (typeof dictionary[key] !== "string" || !dictionary[key].trim()) {
        console.error(lang + ": missing " + key);
        failures++;
        continue;
      }
      const slots = key.match(/\{\d+\}/g) || [];
      if (slots.some((s) => !dictionary[key].includes(s))) {
        console.error(lang + ": missing placeholder " + key);
        failures++;
      }
    }
  }
  if (failures) process.exit(1);
  console.log(
    `Translation checks passed: ${keys.length} UI keys in English, Korean and Chinese; Vietnamese source preserved.`,
  );
}
