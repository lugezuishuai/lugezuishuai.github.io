const fs = require("node:fs");

const mediumZoomScript = require.resolve("medium-zoom/dist/medium-zoom.min.js");

hexo.extend.generator.register("medium-zoom-assets", () => ({
  path: "js/medium-zoom.min.js",
  data: fs.readFileSync(mediumZoomScript, "utf8"),
}));
