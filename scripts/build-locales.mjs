import fs from "node:fs/promises";
const dictionaries = {};
for (const lang of ["en", "vi", "ko", "zh"])
  dictionaries[lang] = JSON.parse(
    await fs.readFile("src/i18n/locales/" + lang + ".json", "utf8"),
  );
await fs.writeFile(
  "backend/src/locales.php",
  "<?php\n// Generated from src/i18n/locales/*.json. Never contains customer content.\nreturn json_decode(<<<'JSON'\n" +
    JSON.stringify(dictionaries) +
    "\nJSON, true, 512, JSON_THROW_ON_ERROR);\n",
);
const schema = await fs.readFile("backend/migrations/002_content.sql", "utf8");
await fs.writeFile(
  "backend/src/content-schema.php",
  "<?php\n// Generated from migrations/002_content.sql for automatic, additive upgrades.\nreturn <<<'SQL'\n" +
    schema +
    "SQL;\n",
);
console.log("Generated PHP locale dictionaries and additive content schema.");
