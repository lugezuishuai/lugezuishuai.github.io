(function () {
  if (!window.mediumZoom) return;

  var zoomableSelector =
    ".article-cover img:not([data-no-zoom]), .terminal-content img:not([data-no-zoom])";
  var zoom = window.mediumZoom({
    margin: 24,
    background: getOverlayColor(),
    scrollOffset: 40,
  });
  var minPreviewScale = 0.5;
  var maxPreviewScale = 4;
  var previewScaleStep = 0.25;
  var activePreview = null;
  var previewScale = 1;
  var baseTransform = "";
  var previewOffsetX = 0;
  var previewOffsetY = 0;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragOriginX = 0;
  var dragOriginY = 0;
  var isDragging = false;
  var controls = createControls();

  function getOverlayColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--terminal-bg")
      .trim();
  }

  function createControlButton(action, label, text) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "image-zoom-button";
    button.dataset.imageZoomAction = action;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.textContent = text;
    return button;
  }

  function createControls() {
    var toolbar = document.createElement("div");
    var scale = document.createElement("output");

    toolbar.className = "image-zoom-controls";
    toolbar.hidden = true;
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "图片预览控制");
    scale.className = "image-zoom-scale";
    scale.dataset.imageZoomScale = "";
    scale.setAttribute("aria-live", "polite");

    toolbar.append(
      createControlButton("out", "缩小图片", "−"),
      scale,
      createControlButton("in", "放大图片", "+"),
      createControlButton("fit", "自适应图片", "适应"),
      createControlButton("close", "关闭图片预览", "×"),
    );
    toolbar.addEventListener("click", handleControlClick);
    document.body.appendChild(toolbar);
    return toolbar;
  }

  function clampPreviewScale(scale) {
    return Math.min(maxPreviewScale, Math.max(minPreviewScale, scale));
  }

  function renderPreviewTransform() {
    if (!activePreview) return;

    activePreview.style.transform =
      `translate3d(${previewOffsetX}px, ${previewOffsetY}px, 0) ` +
      `${baseTransform} scale(${previewScale})`;
    activePreview.dataset.previewScale = String(previewScale);
    activePreview.dataset.previewOffsetX = String(Math.round(previewOffsetX));
    activePreview.dataset.previewOffsetY = String(Math.round(previewOffsetY));
    activePreview.classList.toggle("image-zoom-draggable", previewScale > 1);
    controls.querySelector("[data-image-zoom-scale]").textContent =
      `${Math.round(previewScale * 100)}%`;
    controls.querySelector('[data-image-zoom-action="out"]').disabled =
      previewScale === minPreviewScale;
    controls.querySelector('[data-image-zoom-action="in"]').disabled =
      previewScale === maxPreviewScale;
  }

  function updatePreviewScale(nextScale, focalPoint) {
    if (!activePreview) return;

    var clampedScale = clampPreviewScale(nextScale);
    if (focalPoint && clampedScale !== previewScale) {
      var bounds = activePreview.getBoundingClientRect();
      var scaleRatio = clampedScale / previewScale;
      var focalOffsetX = focalPoint.x - (bounds.left + bounds.width / 2);
      var focalOffsetY = focalPoint.y - (bounds.top + bounds.height / 2);
      previewOffsetX += (1 - scaleRatio) * focalOffsetX;
      previewOffsetY += (1 - scaleRatio) * focalOffsetY;
    }

    previewScale = clampedScale;
    renderPreviewTransform();
  }

  function fitPreview() {
    previewScale = 1;
    previewOffsetX = 0;
    previewOffsetY = 0;
    renderPreviewTransform();
  }

  function openPreviewControls() {
    activePreview = document.querySelector(".medium-zoom-image--opened");
    if (!activePreview) return;

    baseTransform = activePreview.style.transform;
    controls.hidden = false;
    activePreview.addEventListener("pointerdown", handlePreviewPointerDown);
    activePreview.addEventListener("click", preventZoomedImageClose, true);
    activePreview.addEventListener("dragstart", preventImageDrag);
    fitPreview();
  }

  function closePreviewControls() {
    controls.hidden = true;
    activePreview = null;
    previewScale = 1;
    baseTransform = "";
    previewOffsetX = 0;
    previewOffsetY = 0;
    isDragging = false;
  }

  function handleControlClick(event) {
    var button = event.target.closest("[data-image-zoom-action]");
    if (!button || !activePreview) return;

    var action = button.dataset.imageZoomAction;
    if (action === "in") updatePreviewScale(previewScale + previewScaleStep);
    if (action === "out") updatePreviewScale(previewScale - previewScaleStep);
    if (action === "fit") fitPreview();
    if (action === "close") zoom.close();
  }

  function handlePreviewWheel(event) {
    if (!activePreview) return;
    event.preventDefault();
    updatePreviewScale(
      previewScale + (event.deltaY < 0 ? previewScaleStep : -previewScaleStep),
      { x: event.clientX, y: event.clientY },
    );
  }

  function preventImageDrag(event) {
    event.preventDefault();
  }

  function preventZoomedImageClose(event) {
    if (previewScale <= 1) return;
    event.stopImmediatePropagation();
  }

  function handlePreviewPointerDown(event) {
    if (!activePreview || previewScale <= 1 || event.button !== 0) return;

    event.preventDefault();
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = previewOffsetX;
    dragOriginY = previewOffsetY;
    activePreview.classList.add("image-zoom-dragging");
    activePreview.setPointerCapture(event.pointerId);
  }

  function handlePreviewPointerMove(event) {
    if (!activePreview || !isDragging) return;

    previewOffsetX = dragOriginX + event.clientX - dragStartX;
    previewOffsetY = dragOriginY + event.clientY - dragStartY;
    renderPreviewTransform();
  }

  function stopPreviewDrag(event) {
    if (!activePreview || !isDragging) return;

    isDragging = false;
    activePreview.classList.remove("image-zoom-dragging");
    if (activePreview.hasPointerCapture(event.pointerId)) {
      activePreview.releasePointerCapture(event.pointerId);
    }
  }

  function handlePreviewKeyboard(event) {
    if (!activePreview) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      updatePreviewScale(previewScale + previewScaleStep);
    }
    if (event.key === "-") {
      event.preventDefault();
      updatePreviewScale(previewScale - previewScaleStep);
    }
    if (event.key === "0") {
      event.preventDefault();
      fitPreview();
    }
  }

  function attachPreviewEvents(image) {
    if (image.dataset.zoomControlsAttached === "true") return;
    image.addEventListener("medium-zoom:opened", openPreviewControls);
    image.addEventListener("medium-zoom:closed", closePreviewControls);
    image.dataset.zoomControlsAttached = "true";
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
      attachPreviewEvents(image);
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

  window.addEventListener("wheel", handlePreviewWheel, { passive: false });
  window.addEventListener("keydown", handlePreviewKeyboard);
  window.addEventListener("pointermove", handlePreviewPointerMove);
  window.addEventListener("pointerup", stopPreviewDrag);
  window.addEventListener("pointercancel", stopPreviewDrag);
})();
