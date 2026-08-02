(function () {
  var tocSelector = ".js-toc";
  var contentSelector = ".terminal-content";
  var headingSelector = "h1, h2, h3, h4";
  var desktopScroller = ".terminal-main";
  var mobileQuery = window.matchMedia("(max-width: 820px)");
  var panel = document.querySelector("[data-post-toc-panel]");
  var content = document.querySelector(contentSelector);
  var main = document.querySelector(desktopScroller);
  var frameRequested = false;

  if (!panel || !content || !window.tocbot) return;

  var headings = Array.from(content.querySelectorAll(headingSelector));

  if (!headings.length) {
    panel.hidden = true;
    return;
  }

  headings.forEach(function (heading, index) {
    if (!heading.id) heading.id = "section-" + (index + 1);
  });

  function syncActiveLink() {
    frameRequested = false;

    var rootTop =
      mobileQuery.matches || !main ? 0 : main.getBoundingClientRect().top;
    var activeHeading = headings[0];

    headings.forEach(function (heading) {
      if (heading.getBoundingClientRect().top <= rootTop + 48) {
        activeHeading = heading;
      }
    });

    document.querySelectorAll(".post-toc .toc-link").forEach(function (link) {
      var target = link.getAttribute("href").slice(1);
      var matches =
        target === activeHeading.id ||
        decodeURIComponent(target) === activeHeading.id;

      link.classList.toggle("is-current-link", matches);
    });
  }

  function scheduleActiveLinkSync() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(syncActiveLink);
  }

  function getHeading(link) {
    var target = link.getAttribute("href").slice(1);

    return (
      document.getElementById(target) ||
      document.getElementById(decodeURIComponent(target))
    );
  }

  function scrollToHeading(link) {
    var heading = getHeading(link);
    if (!heading) return;

    var destination =
      window.location.pathname +
      window.location.search +
      link.getAttribute("href");
    window.history.pushState(null, "", destination);

    if (mobileQuery.matches || !main) {
      window.scrollTo({
        top: window.scrollY + heading.getBoundingClientRect().top - 20,
        behavior: "smooth",
      });
    } else {
      main.scrollTo({
        top:
          main.scrollTop +
          heading.getBoundingClientRect().top -
          main.getBoundingClientRect().top -
          20,
        behavior: "smooth",
      });
    }
  }

  function renderToc() {
    window.tocbot.destroy();

    var options = {
      tocSelector: tocSelector,
      contentSelector: contentSelector,
      headingSelector: headingSelector,
      collapseDepth: 6,
      headingsOffset: 24,
      scrollSmooth: false,
    };

    if (!mobileQuery.matches) options.scrollContainer = desktopScroller;

    window.tocbot.init(options);
    scheduleActiveLinkSync();
  }

  renderToc();
  mobileQuery.addEventListener("change", renderToc);
  window.addEventListener("scroll", scheduleActiveLinkSync, { passive: true });
  if (main) {
    main.addEventListener("scroll", scheduleActiveLinkSync, { passive: true });
  }
  panel.addEventListener("click", function (event) {
    var link = event.target.closest(".toc-link");
    if (!link) return;

    event.preventDefault();
    scrollToHeading(link);
    window.setTimeout(scheduleActiveLinkSync, 360);
  });
})();
