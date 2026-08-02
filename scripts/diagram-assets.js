const fs = require("node:fs");
const path = require("node:path");

const mermaidScript = require.resolve("mermaid/dist/mermaid.min.js");
const pakoModule = path.join(
  path.dirname(require.resolve("pako/package.json")),
  "dist/pako.mjs",
);

hexo.extend.generator.register("diagram-assets", () => [
  {
    path: "js/mermaid.min.js",
    data: fs.readFileSync(mermaidScript, "utf8"),
  },
  {
    path: "js/pako.mjs",
    data: fs.readFileSync(pakoModule, "utf8"),
  },
]);
