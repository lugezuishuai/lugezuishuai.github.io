#!/usr/bin/env node

import { statSync } from "node:fs";
import { extname } from "node:path";
import { spawnSync } from "node:child_process";

const MAX_IMAGE_BYTES = 500 * 1024;
const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".tif",
  ".tiff",
  ".webp",
]);

const staged = spawnSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMRT"],
  { encoding: "utf8" },
);

if (staged.status !== 0) {
  process.stderr.write(staged.stderr || "Failed to inspect staged files.\n");
  process.exit(staged.status || 1);
}

const oversizedImages = staged.stdout
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((file) => IMAGE_EXTENSIONS.has(extname(file).toLowerCase()))
  .map((file) => {
    try {
      return { file, size: statSync(file).size };
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .filter(({ size }) => size > MAX_IMAGE_BYTES);

if (oversizedImages.length === 0) {
  process.exit(0);
}

process.stderr.write("提交被阻止：以下图片超过 500KB，请先压缩。\n\n");
for (const { file, size } of oversizedImages) {
  const sizeKb = (size / 1024).toFixed(1);
  process.stderr.write(`- ${file} (${sizeKb}KB)\n`);
}
process.stderr.write("\n可用 tinypng、squoosh、imagemagick 或本地图片工具压缩后再提交。\n");
process.exit(1);
