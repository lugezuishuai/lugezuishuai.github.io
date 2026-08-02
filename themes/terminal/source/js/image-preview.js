(function () {
  if (!window.mediumZoom) return;

  var zoomableSelector =
    ".article-cover img:not([data-no-zoom]), .terminal-content img:not([data-no-zoom])";
  var zoom = window.mediumZoom({
    margin: 24,
    background: getOverlayColor(),
    scrollOffset: 40,
  });

  function getOverlayColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--terminal-bg")
      .trim();
  }

  function attachZoom(root) {
    var images = [];
    if (root instanceof HTMLImageElement && root.matches(zoomableSelector)) {
      images.push(root);
    }
    if (root.querySelectorAll) {
      images = images.concat(Array.from(root.querySelectorAll(zoomableSelector)));
    }

    images = images.filter(function (image) {
      return image.dataset.zoomAttached !== "true";
    });
    if (images.length === 0) return;

    zoom.attach.apply(zoom, images);
    images.forEach(function (image) {
      image.dataset.zoomAttached = "true";
    });
  }

  attachZoom(document);

  var content = document.querySelector(".terminal-content");
  if (content) {
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) attachZoom(node);
        });
      });
    }).observe(content, { childList: true, subtree: true });
  }

  new MutationObserver(function () {
    zoom.update({ background: getOverlayColor() });
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-terminal-theme"],
  });
})();
