#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: node check-post.mjs <kebab-case-slug>");
  process.exit(2);
}

const root = process.cwd();
const postPath = path.join(root, "source", "_posts", `${slug}.md`);
const assetDir = path.join(root, "source", "_posts", slug);
const errors = [];

if (!fs.existsSync(postPath)) {
  console.error(`Post not found: ${postPath}`);
  process.exit(1);
}

const source = fs.readFileSync(postPath, "utf8");
const frontMatter = source.match(/^---\n([\s\S]*?)\n---\n/);

if (!frontMatter) {
  errors.push("Missing YAML front matter");
} else {
  const yaml = frontMatter[1];
  for (const key of ["title", "date", "categories", "featured_image"]) {
    if (!new RegExp(`^${key}:`, "m").test(yaml)) {
      errors.push(`Missing front matter key: ${key}`);
    }
  }
  if (!/^date:\s+\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?\s*$/m.test(yaml)) {
    errors.push("Date must use YYYY-MM-DD or YYYY-MM-DD HH:mm:ss");
  }
}

if (!fs.existsSync(assetDir)) {
  errors.push(`Missing post asset directory: ${assetDir}`);
}

const imagePaths = [...source.matchAll(/!\[[^\]]*\]\((\.\/[^\s)]+)(?:\s+["'][^"']*["'])?\)/g)]
  .map((match) => match[1]);
const featuredImage = frontMatter?.[1].match(/^featured_image:\s+["']?(\.\/\S+?)["']?\s*$/m)?.[1];

if (featuredImage) imagePaths.push(featuredImage);

for (const imagePath of new Set(imagePaths)) {
  const resolved = path.resolve(assetDir, imagePath.slice(2));
  const assetRoot = path.resolve(assetDir);
  if (resolved !== assetRoot && !resolved.startsWith(`${assetRoot}${path.sep}`)) {
    errors.push(`Image escapes asset directory: ${imagePath}`);
  } else if (!fs.existsSync(resolved)) {
    errors.push(`Missing local image: ${imagePath}`);
  }
}

const fence = "```";
for (const language of ["mermaid", "plantuml"]) {
  const opening = `${fence}${language}`;
  const openingCount = source.split(opening).length - 1;
  if (openingCount === 0) continue;

  const blockPattern = new RegExp(`^${fence}${language}\\s*\\n[\\s\\S]*?^${fence}\\s*$`, "gm");
  const closedCount = (source.match(blockPattern) || []).length;
  if (closedCount !== openingCount) {
    errors.push(`Unclosed or malformed ${language} code fence`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(`Post structure OK: ${postPath}`);
console.log(`Local image references: ${new Set(imagePaths).size}`);
