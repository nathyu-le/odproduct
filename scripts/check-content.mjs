import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import ts from "typescript";
const compiled = ts.transpileModule(
  await readFile("src/features/blog/slug.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
await mkdir("work", { recursive: true });
await writeFile("work/content-slug-runtime.mjs", compiled);
const { postSlug } = await import("../work/content-slug-runtime.mjs");
assert.equal(postSlug("Tai nghe mới – Đồ dùng"), "tai-nghe-moi-do-dung");
assert.equal(postSlug("테스트 글"), "테스트-글");
assert.equal(postSlug("音频指南"), "音频指南");
assert.equal(postSlug("  A guide: daily audio! "), "a-guide-daily-audio");
assert.equal(postSlug("테스트 글").normalize("NFC"), postSlug("테스트 글"));
console.log(
  "Content checks passed: Vietnamese, Korean NFC, Chinese and readable SEO slugs.",
);
