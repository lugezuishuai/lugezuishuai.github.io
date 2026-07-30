(function () {
  if (!window.mediumZoom) return;

  var zoom = window.mediumZoom(
    ".article-cover img:not([data-no-zoom]), .terminal-content img:not([data-no-zoom])",
    {
      margin: 24,
      background: getOverlayColor(),
      scrollOffset: 40,
    },
  );

  function getOverlayColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--terminal-bg")
      .trim();
  }

  new MutationObserver(function () {
    zoom.update({ background: getOverlayColor() });
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-terminal-theme"],
  });
})();
