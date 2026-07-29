(function () {
  const shortcutTimeout = 1200;
  let pendingGoto = false;
  let pendingTimer = 0;

  const gotoKeys = {
    h: "home",
    a: "archives",
    c: "categories",
    t: "tags",
    b: "about",
  };

  function clearPendingGoto() {
    pendingGoto = false;
    if (pendingTimer) window.clearTimeout(pendingTimer);
    pendingTimer = 0;
  }

  function isPlainShortcut(event) {
    return !event.altKey && !event.ctrlKey && !event.metaKey;
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));
  }

  function navigateToLink(link) {
    if (!link || !link.href) return false;
    window.location.href = link.href;
    return true;
  }

  function navigateToMenuTarget(target) {
    return navigateToLink(document.querySelector('[data-terminal-nav="' + target + '"]'));
  }

  function focusSearch() {
    const input = document.querySelector("[data-terminal-search-input]");
    if (!input) return false;
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    input.select();
    return true;
  }

  function clearSearch() {
    const input = document.querySelector("[data-terminal-search-input]");
    if (!input || document.activeElement !== input) return false;
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.blur();
    return true;
  }

  function cycleTheme() {
    const button = document.querySelector("[data-terminal-theme-current]");
    if (!button) return false;
    button.click();
    return true;
  }

  function scrollTarget() {
    const main = document.querySelector(".terminal-main");
    if (main && main.scrollHeight > main.clientHeight) return main;
    return document.scrollingElement || document.documentElement;
  }

  function scrollPage(direction) {
    scrollTarget().scrollBy({
      top: Math.round(window.innerHeight * 0.85) * direction,
      behavior: "smooth",
    });
    return true;
  }

  function scrollToEdge(edge) {
    const target = scrollTarget();
    target.scrollTo({
      top: edge === "bottom" ? target.scrollHeight : 0,
      behavior: "smooth",
    });
    return true;
  }

  function findDirectionalLink(direction) {
    const relLink = document.querySelector('a[rel="' + direction + '"], link[rel="' + direction + '"]');
    if (relLink) return relLink;

    const markers = direction === "prev" ? ["prev", "<-"] : ["next", "->"];
    const links = Array.from(document.querySelectorAll(".terminal-pagination a"));
    return links.find((link) => {
      const label = String(link.textContent || "").trim().toLowerCase();
      return markers.some((marker) => label.includes(marker));
    });
  }

  function navigateDirection(direction) {
    return navigateToLink(findDirectionalLink(direction));
  }

  function handleGotoKey(key) {
    if (key === "g") return scrollToEdge("top");
    return navigateToMenuTarget(gotoKeys[key]);
  }

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || !isPlainShortcut(event)) return;

    const rawKey = event.key;
    const key = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;

    if (isEditableTarget(event.target)) {
      if (rawKey === "Escape" && clearSearch()) event.preventDefault();
      clearPendingGoto();
      return;
    }

    if (pendingGoto) {
      if (handleGotoKey(key)) event.preventDefault();
      clearPendingGoto();
      return;
    }

    if (rawKey === "/") {
      if (focusSearch()) event.preventDefault();
      return;
    }

    if (rawKey === "Escape") {
      if (clearSearch()) event.preventDefault();
      return;
    }

    if (rawKey === "G") {
      event.preventDefault();
      scrollToEdge("bottom");
      return;
    }

    if (key === "g") {
      event.preventDefault();
      pendingGoto = true;
      pendingTimer = window.setTimeout(clearPendingGoto, shortcutTimeout);
      return;
    }

    if (key === "j") {
      event.preventDefault();
      scrollPage(1);
      return;
    }

    if (key === "k") {
      event.preventDefault();
      scrollPage(-1);
      return;
    }

    if (key === "t") {
      event.preventDefault();
      cycleTheme();
      return;
    }

    if (rawKey === "[") {
      if (navigateDirection("prev")) event.preventDefault();
      return;
    }

    if (rawKey === "]") {
      if (navigateDirection("next")) event.preventDefault();
    }
  });
})();
