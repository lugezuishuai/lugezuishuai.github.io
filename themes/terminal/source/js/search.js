(function () {
  const input = document.querySelector("[data-terminal-search-input]");
  const results = document.querySelector("[data-terminal-search-results]");
  const dataNode = document.getElementById("terminal-search-data");

  if (!input || !results || !dataNode) return;

  let posts = [];
  try {
    posts = JSON.parse(dataNode.textContent || "[]");
  } catch {
    posts = [];
  }

  const normalize = (value) => String(value || "").trim().toLowerCase();

  function clearResults() {
    results.hidden = true;
    results.textContent = "";
  }

  function createResultItem(post) {
    const link = document.createElement("a");
    link.className = "search-result";
    link.href = post.url;

    const title = document.createElement("span");
    title.className = "search-result-title";
    title.textContent = post.title;

    const meta = document.createElement("span");
    meta.className = "search-result-meta";
    meta.textContent = [post.date, ...(post.tags || []).slice(0, 3).map((tag) => "#" + tag)].join(" ");

    link.append(title, meta);
    return link;
  }

  function renderResults() {
    const query = normalize(input.value);
    results.textContent = "";

    if (!query) {
      clearResults();
      return;
    }

    const matches = posts
      .map((post) => ({ post, haystack: normalize(post.text) }))
      .filter(({ haystack }) => haystack.includes(query))
      .slice(0, 6)
      .map(({ post }) => post);

    results.hidden = false;

    if (matches.length === 0) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "no matches";
      results.append(empty);
      return;
    }

    matches.forEach((post) => {
      results.append(createResultItem(post));
    });
  }

  input.addEventListener("input", renderResults);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const firstLink = results.querySelector("a");
    if (firstLink) {
      event.preventDefault();
      window.location.href = firstLink.href;
    }
  });
})();
