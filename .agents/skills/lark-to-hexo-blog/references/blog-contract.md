# jackson_blog repository contract

Use these values unless the user explicitly supplies a different repository or deployment target.

| Item | Value |
|---|---|
| Repository root | `/Users/bytedance/own/jackson_blog` |
| Publishing branch | `master` |
| Git remote | `origin` → `https://github.com/lugezuishuai/lugezuishuai.github.io.git` |
| Live base URL | `https://blog.humorsoul.com` |
| Post file | `source/_posts/<slug>.md` |
| Post assets | `source/_posts/<slug>/` |
| Permalink | `/:category/:title/` with trailing slash |
| Pages workflow | `.github/workflows/hexo.yml`, workflow name `Pages` |
| Runtime | Node.js 22 in GitHub Actions |

## Repository behavior

- `post_asset_folder: true`, `marked.postAsset: true`, and `marked.prependRoot: true` are enabled.
- Use local post-relative image paths such as `./cover.jpg` and `./image-01.png`.
- `future: true` is enabled, so user-specified future publication dates are valid and must be preserved.
- Hexo highlighting excludes `mermaid` and `plantuml` because the theme renders them as diagrams at runtime.
- The theme supports H1-H5 TOC, Highlight.js, Mermaid, PlantUML, theme-aware diagrams, and a shared zoomable image preview.

## Required checks

Run in this order:

```bash
node .agents/skills/lark-to-hexo-blog/scripts/check-post.mjs <slug>
npm run check:images
npm run check:highlight
npm run build
npm run clean
git diff --check
```

The image check rejects assets larger than 500 KB. Resize or recompress oversized images without changing their visible content, then update references if the extension changes.

## GitHub Pages proof

- A push to `master` triggers the `Pages` workflow.
- Track the workflow run for the exact pushed commit, not merely the latest repository run.
- Require both build and deploy jobs to succeed.
- Use the run URL in the completion report.
- Only after Actions succeeds, validate the live article with an available Chrome control capability. If the current Agent has no Chrome control capability, keep deployment success as a valid outcome, mark visual verification as pending, and return the exact URL plus a manual verification checklist.

## Process-file closeout

Every task in this repository ends with a residue scan. Remove only task-generated intermediates:

- `public/` and `db.json` from Hexo.
- `.lark-to-hexo-work/<this-run>/`.
- Temporary Feishu downloads and conversion files.
- Cover-generation prompt files, backup candidates, and rejected covers unless explicitly requested as deliverables.
- Temporary QA posts, screenshots, browser logs, and task logs.

Retain the final post Markdown, all referenced post assets, the chosen cover, required source/theme code, manifests, and configuration. Re-run `git status --short` to prove only intentional changes remain.
