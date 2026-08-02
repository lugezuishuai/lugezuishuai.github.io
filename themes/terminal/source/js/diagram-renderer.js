(function () {
  const content = document.querySelector(".terminal-content");
  if (!content) return;

  function diagramBlocks(language) {
    return Array.from(
      content.querySelectorAll(
        `figure.highlight.${language}, pre > code.language-${language}, pre > code.highlight.${language}`,
      ),
    );
  }

  function sourceFromBlock(block) {
    if (block.matches("figure.highlight")) {
      return (block.querySelector("td.code") || block.querySelector("pre"))
        .textContent.trim();
    }
    return block.textContent.trim();
  }

  function replaceTarget(block) {
    return block.matches("figure.highlight") ? block : block.parentElement;
  }

  function fallbackDiagram(source, message) {
    const fallback = document.createElement("figure");
    fallback.className = "diagram-preview diagram-error";

    const label = document.createElement("figcaption");
    label.textContent = message;

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = source;
    pre.appendChild(code);
    fallback.append(label, pre);
    return fallback;
  }

  async function renderMermaid() {
    const blocks = diagramBlocks("mermaid");
    if (blocks.length === 0) return;
    if (!window.mermaid) {
      blocks.forEach((block) => {
        const source = sourceFromBlock(block);
        replaceTarget(block).replaceWith(
          fallbackDiagram(source, "Mermaid 渲染器加载失败"),
        );
      });
      return;
    }

    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        background: "transparent",
        primaryColor: "#111816",
        primaryTextColor: "#e7e7df",
        primaryBorderColor: "#49f59a",
        lineColor: "#89a69a",
        secondaryColor: "#17211d",
        tertiaryColor: "#0b0f0d",
      },
    });

    for (const block of blocks) {
      const source = sourceFromBlock(block);
      const target = replaceTarget(block);
      const preview = document.createElement("figure");
      preview.className = "diagram-preview diagram-mermaid mermaid";
      preview.textContent = source;
      target.replaceWith(preview);

      try {
        await window.mermaid.run({ nodes: [preview], suppressErrors: true });
        if (!preview.querySelector("svg")) {
          throw new Error("No SVG output");
        }
      } catch (error) {
        preview.replaceWith(fallbackDiagram(source, "Mermaid 图表渲染失败"));
      }
    }
  }

  function encode6Bit(value) {
    if (value < 10) return String.fromCharCode(48 + value);
    value -= 10;
    if (value < 26) return String.fromCharCode(65 + value);
    value -= 26;
    if (value < 26) return String.fromCharCode(97 + value);
    value -= 26;
    return value === 0 ? "-" : "_";
  }

  function append3Bytes(first, second, third) {
    const firstSix = first >> 2;
    const secondSix = ((first & 0x3) << 4) | (second >> 4);
    const thirdSix = ((second & 0xf) << 2) | (third >> 6);
    const fourthSix = third & 0x3f;
    return [firstSix, secondSix, thirdSix, fourthSix].map(encode6Bit).join("");
  }

  function plantUmlBase64(bytes) {
    let encoded = "";
    for (let index = 0; index < bytes.length; index += 3) {
      const remaining = bytes.length - index;
      const chunk = append3Bytes(
        bytes[index],
        remaining > 1 ? bytes[index + 1] : 0,
        remaining > 2 ? bytes[index + 2] : 0,
      );
      encoded += remaining === 1 ? chunk.slice(0, 2) : remaining === 2 ? chunk.slice(0, 3) : chunk;
    }
    return encoded;
  }

  async function renderPlantUml() {
    const blocks = diagramBlocks("plantuml");
    if (blocks.length === 0) return;

    try {
      const { deflateRaw } = await import("/js/pako.mjs");
      blocks.forEach((block, index) => {
        const source = sourceFromBlock(block);
        const encoded = plantUmlBase64(deflateRaw(new TextEncoder().encode(source), { level: 9 }));
        const preview = document.createElement("figure");
        preview.className = "diagram-preview diagram-plantuml";

        const image = document.createElement("img");
        image.src = `https://www.plantuml.com/plantuml/svg/${encoded}`;
        image.alt = `PlantUML 图表 ${index + 1}`;
        image.loading = "lazy";
        image.addEventListener("error", () => {
          preview.replaceWith(fallbackDiagram(source, "PlantUML 图表渲染失败"));
        }, { once: true });

        preview.appendChild(image);
        replaceTarget(block).replaceWith(preview);
        if (window.mediumZoom) window.mediumZoom(image);
      });
    } catch (error) {
      blocks.forEach((block) => {
        const source = sourceFromBlock(block);
        replaceTarget(block).replaceWith(
          fallbackDiagram(source, "PlantUML 渲染器加载失败"),
        );
      });
    }
  }

  renderMermaid();
  renderPlantUml();
})();
