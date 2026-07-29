(function () {
  const osNode = document.querySelector("[data-terminal-os]");
  if (!osNode) return;

  function detectOS(platform, userAgent) {
    const source = `${platform || ""} ${userAgent || ""}`.toLowerCase();

    if (source.includes("iphone") || source.includes("ipad") || source.includes("ipod")) return "iOS";
    if (source.includes("android")) return "Android";
    if (source.includes("mac")) return "macOS";
    if (source.includes("win")) return "Windows";
    if (source.includes("linux")) return "Linux";

    return osNode.textContent.trim() || "Unknown";
  }

  async function updateOS() {
    const nav = window.navigator || {};
    const uaData = nav.userAgentData;
    let platform = uaData && uaData.platform ? uaData.platform : nav.platform;
    let architecture = "";

    if (uaData && typeof uaData.getHighEntropyValues === "function") {
      try {
        const values = await uaData.getHighEntropyValues(["architecture", "bitness", "platform"]);
        platform = values.platform || platform;
        architecture = values.architecture || "";
        if (values.bitness && architecture) architecture += values.bitness;
      } catch {
        architecture = "";
      }
    }

    const os = detectOS(platform, nav.userAgent);
    osNode.textContent = architecture ? `${os} ${architecture}` : os;
  }

  updateOS();
})();
