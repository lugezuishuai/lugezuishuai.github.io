const fs = require("node:fs");
const path = require("node:path");

const highlightRoot = path.dirname(require.resolve("highlight.js/package.json"));

function readTheme(name) {
  return fs.readFileSync(path.join(highlightRoot, "styles", name), "utf8");
}

hexo.extend.generator.register("highlight-assets", () => [
  {
    path: "css/highlight-github.css",
    data: readTheme("github.min.css"),
  },
  {
    path: "css/highlight-github-dark.css",
    data: readTheme("github-dark.min.css"),
  },
]);
