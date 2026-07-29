(function () {
  const themes = ["green", "amber", "cyan", "magenta", "white"];
  const names = {
    green: "terminal-green",
    amber: "terminal-amber",
    cyan: "terminal-cyan",
    magenta: "terminal-magenta",
    white: "terminal-white",
  };
  const key = "terminal-theme";
  const currentNodes = Array.from(document.querySelectorAll("[data-terminal-theme-current]"));
  const choices = Array.from(document.querySelectorAll("[data-terminal-theme-choice]"));

  function setTheme(theme) {
    const nextTheme = themes.includes(theme) ? theme : "green";
    document.documentElement.dataset.terminalTheme = nextTheme;
    currentNodes.forEach((node) => {
      node.textContent = names[nextTheme];
    });
    choices.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.terminalThemeChoice === nextTheme));
    });
    try {
      localStorage.setItem(key, nextTheme);
    } catch {
    }
  }

  function savedTheme() {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  choices.forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.terminalThemeChoice);
    });
  });

  currentNodes.forEach((node) => {
    node.addEventListener("click", () => {
      const activeTheme = document.documentElement.dataset.terminalTheme || "green";
      const index = themes.indexOf(activeTheme);
      setTheme(themes[(index + 1) % themes.length]);
    });
  });

  setTheme(savedTheme() || "green");
})();
