(function () {
  const content = document.querySelector(".terminal-content");
  if (!content) return;

  const themeChangeEvent = "terminal-theme-change";
  const plantUmlServer = "https://www.plantuml.com/plantuml/svg/";
  let requestedRender = 0;
  let renderQueue = Promise.resolve();

  function diagramBlocks(language) {
    return Array.from(
      content.querySelectorAll(
        `figure.highlight.${language}, pre > code.language-${language}, pre > code.highlight.${language}, pre > code.hljs.${language}`,
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

  function createPreview(type) {
    const preview = document.createElement("figure");
    preview.className = `diagram-preview diagram-${type}`;
    return preview;
  }

  function createImage(alt) {
    const image = document.createElement("img");
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";
    return image;
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

  function themePalette() {
    const styles = getComputedStyle(document.documentElement);
    const color = (name) => styles.getPropertyValue(name).trim();
    return {
      background: color("--terminal-code-bg"),
      surface: color("--terminal-surface"),
      panel: color("--terminal-panel"),
      text: color("--terminal-text"),
      muted: color("--terminal-muted"),
      line: color("--terminal-line-bright"),
      accent: color("--terminal-green"),
      secondary: color("--terminal-cyan"),
    };
  }

  const mermaidDiagrams = diagramBlocks("mermaid").map((block, index) => {
    const source = sourceFromBlock(block);
    const preview = createPreview("mermaid");
    const image = createImage(`Mermaid 图表 ${index + 1}`);
    preview.appendChild(image);
    replaceTarget(block).replaceWith(preview);
    return { source, preview, image, index };
  });

  const plantUmlDiagrams = diagramBlocks("plantuml").map((block, index) => {
    const source = sourceFromBlock(block);
    const preview = createPreview("plantuml");
    const image = createImage(`PlantUML 图表 ${index + 1}`);
    preview.appendChild(image);
    replaceTarget(block).replaceWith(preview);
    return { source, preview, image };
  });

  function mermaidTheme(palette) {
    return {
      background: palette.background,
      primaryColor: palette.surface,
      primaryTextColor: palette.text,
      primaryBorderColor: palette.accent,
      lineColor: palette.line,
      secondaryColor: palette.panel,
      secondaryTextColor: palette.text,
      secondaryBorderColor: palette.secondary,
      tertiaryColor: palette.background,
      tertiaryTextColor: palette.text,
      tertiaryBorderColor: palette.line,
      noteBkgColor: palette.surface,
      noteTextColor: palette.text,
      noteBorderColor: palette.secondary,
      actorBkg: palette.surface,
      actorBorder: palette.accent,
      actorTextColor: palette.text,
      signalColor: palette.accent,
      signalTextColor: palette.text,
      labelBoxBkgColor: palette.panel,
      labelBoxBorderColor: palette.line,
      labelTextColor: palette.text,
      loopTextColor: palette.text,
      activationBkgColor: palette.panel,
      activationBorderColor: palette.secondary,
      gridColor: palette.line,
      taskBkgColor: palette.surface,
      taskBorderColor: palette.accent,
      taskTextColor: palette.text,
    };
  }

  function normalizeMermaidSvg(svg) {
    return svg.replace(/<br\s*\/?>/gi, "<br/>");
  }

  async function renderMermaid(palette, renderId) {
    if (mermaidDiagrams.length === 0) return;
    if (!window.mermaid) {
      mermaidDiagrams.forEach(({ source, preview }) => {
        preview.replaceWith(fallbackDiagram(source, "Mermaid 渲染器加载失败"));
      });
      return;
    }

    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: mermaidTheme(palette),
    });

    for (const diagram of mermaidDiagrams) {
      try {
        const result = await window.mermaid.render(
          `mermaid-diagram-${renderId}-${diagram.index}`,
          diagram.source,
        );
        if (renderId !== requestedRender) return;
        const svg = normalizeMermaidSvg(result.svg);
        diagram.image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        diagram.image.dataset.diagramTheme =
          document.documentElement.dataset.terminalTheme || "green";
      } catch (error) {
        if (renderId !== requestedRender) return;
        diagram.preview.replaceWith(
          fallbackDiagram(diagram.source, "Mermaid 图表渲染失败"),
        );
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

  function themedPlantUmlSource(source, palette) {
    const lines = source
      .split("\n")
      .filter((line) => !/^\s*!theme(?:\s|$)/i.test(line));
    const settings = [
      "skinparam backgroundColor transparent",
      "skinparam shadowing false",
      `skinparam defaultFontColor ${palette.text}`,
      `skinparam ArrowColor ${palette.accent}`,
      `skinparam BorderColor ${palette.line}`,
      `skinparam ActivityBackgroundColor ${palette.surface}`,
      `skinparam ActivityBorderColor ${palette.accent}`,
      `skinparam ClassBackgroundColor ${palette.surface}`,
      `skinparam ClassBorderColor ${palette.accent}`,
      `skinparam NoteBackgroundColor ${palette.surface}`,
      `skinparam NoteBorderColor ${palette.secondary}`,
      `skinparam ParticipantBackgroundColor ${palette.surface}`,
      `skinparam ParticipantBorderColor ${palette.accent}`,
      `skinparam SequenceLifeLineBorderColor ${palette.line}`,
      `skinparam SequenceArrowColor ${palette.accent}`,
    ];
    const endIndex = lines.findIndex((line) => /^\s*@end\w*/i.test(line));

    if (endIndex >= 0) {
      lines.splice(endIndex, 0, ...settings);
      return lines.join("\n");
    }
    return ["@startuml", ...lines, ...settings, "@enduml"].join("\n");
  }

  async function renderPlantUml(palette, renderId) {
    if (plantUmlDiagrams.length === 0) return;

    try {
      const { deflateRaw } = await import("/js/pako.mjs");
      if (renderId !== requestedRender) return;

      plantUmlDiagrams.forEach((diagram) => {
        const source = themedPlantUmlSource(diagram.source, palette);
        const encoded = plantUmlBase64(
          deflateRaw(new TextEncoder().encode(source), { level: 9 }),
        );
        diagram.image.dataset.diagramTheme =
          document.documentElement.dataset.terminalTheme || "green";
        diagram.image.dataset.diagramRender = String(renderId);
        diagram.image.onerror = () => {
          if (diagram.image.dataset.diagramRender !== String(requestedRender)) return;
          diagram.preview.replaceWith(
            fallbackDiagram(diagram.source, "PlantUML 图表渲染失败"),
          );
        };
        diagram.image.src = `${plantUmlServer}${encoded}`;
      });
    } catch (error) {
      if (renderId !== requestedRender) return;
      plantUmlDiagrams.forEach(({ source, preview }) => {
        preview.replaceWith(fallbackDiagram(source, "PlantUML 渲染器加载失败"));
      });
    }
  }

  function requestRender() {
    const renderId = ++requestedRender;
    renderQueue = renderQueue.then(async () => {
      if (renderId !== requestedRender) return;
      const palette = themePalette();
      await renderMermaid(palette, renderId);
      if (renderId !== requestedRender) return;
      await renderPlantUml(palette, renderId);
    });
  }

  if (mermaidDiagrams.length === 0 && plantUmlDiagrams.length === 0) return;
  document.addEventListener(themeChangeEvent, requestRender);
  requestRender();
})();
