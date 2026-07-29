const fs = require("node:fs");

const tocbotScript = require.resolve("tocbot/dist/tocbot.min.js");

hexo.extend.generator.register("tocbot-assets", () => ({
  path: "js/tocbot.min.js",
  data: fs.readFileSync(tocbotScript, "utf8"),
}));
