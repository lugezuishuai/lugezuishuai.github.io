# Jackson Blog

Jackson 的个人技术博客，基于 [Hexo](https://hexo.io/) 与自定义 Terminal 主题构建，通过 GitHub Actions 发布到 GitHub Pages。

- 线上地址：<https://lugezuishuai.github.io/>
- 内容方向：React、大语言模型、上下文工程与 Agent
- Node.js：22
- Hexo：8

## 项目结构

```text
.
├── .github/workflows/hexo.yml   # GitHub Pages 构建与发布流程
├── source/
│   ├── _posts/                  # Markdown 文章
│   │   ├── post-name.md
│   │   └── post-name/           # 文章本地图片
│   ├── about/
│   ├── categories/
│   └── tags/
├── themes/terminal/             # 自定义 Terminal 主题
├── tools/check-image-size.mjs   # 图片大小检查
├── _config.yml                  # Hexo 配置
└── package.json
```

文章与图片采用 Hexo 的 `post_asset_folder` 组织形式：

```text
source/_posts/react-server-side-rendering.md
source/_posts/react-server-side-rendering/architecture.jpg
```

Markdown 中使用相对路径引用图片：

```markdown
![架构图](./architecture.jpg)
```

不要在文章中使用远程图片链接。提交前，所有图片都应下载到对应文章的资源目录。

## 本地开发

首次安装依赖：

```bash
npm ci
```

启动本地开发服务器：

```bash
npm run server
```

默认访问：

```text
http://localhost:4000/
```

生成静态站点：

```bash
npm run clean
npm run check:images
npm run build
```

构建产物位于 `public/`，该目录不会提交到 Git。

## 新建文章

在 `source/_posts/` 创建 Markdown 文件，并添加 Front Matter：

```yaml
---
title: 文章标题
date: 2026-07-29 10:00:00
tags:
  - React
categories:
  - [React]
featured_image: ./cover.jpg
series: 大模型上下文工程实践
series_order: 1
---
```

字段说明：

- `title`：文章标题。
- `date`：发布时间，首页按时间倒序排列。
- `tags`：文章标签，可配置多个。
- `categories`：文章分类。
- `featured_image`：首页缩略图和文章封面，必须使用本地图片。
- `series`：可选，系列名称；同一系列的文章使用相同值。
- `series_order`：可选，文章在系列中的阅读顺序，从 `0` 开始递增。

文章页会由 `tocbot` 根据二至四级标题自动生成目录，无需在 Markdown 中添加目录占位符。桌面端目录显示在右侧栏并随滚动高亮当前章节，移动端显示在正文上方。

配置 `series` 和 `series_order` 后，文章页脚会自动显示该系列的“上一章”和“下一章”导航。普通文章不需要配置这两个字段。

## 图片规范

- 图片必须存放在 `source/` 内。
- 单张图片不得超过 500 KB。
- 优先使用 WebP、压缩后的 JPEG 或优化后的 PNG。
- 图片文件名使用小写英文、数字和连字符。
- 提交时会由 Husky 和 GitHub Actions 执行 `npm run check:images`。

## GitHub Pages 发布

仓库使用 GitHub 用户站点命名：

```text
lugezuishuai/lugezuishuai.github.io
```

该命名让站点直接发布在 `https://lugezuishuai.github.io/`，不需要仓库名路径前缀。Hexo 对应配置为：

```yaml
url: https://lugezuishuai.github.io
root: /
```

推送到 `master` 后，`.github/workflows/hexo.yml` 会自动执行：

1. 检出代码。
2. 使用 GitHub 自动生成的 `secrets.GITHUB_TOKEN` 验证仓库 API 访问。
3. 安装依赖并检查图片。
4. 构建 Hexo 静态站点。
5. 上传 Pages artifact。
6. 部署到 GitHub Pages。

也可以在 GitHub Actions 页面手动运行 `Pages` 工作流。

## GITHUB_TOKEN

`GITHUB_TOKEN` 不需要、也不能作为普通仓库 Secret 手工创建。GitHub 会为每个 Workflow Job 自动生成短期 Token，并通过以下方式提供：

```yaml
${{ secrets.GITHUB_TOKEN }}
```

工作流使用最小权限：

```yaml
permissions:
  contents: read
```

部署 Job 额外申请：

```yaml
permissions:
  pages: write
  id-token: write
```

`Verify GITHUB_TOKEN access` 步骤会调用当前仓库 API；该步骤通过即代表 Token 已正确注入并可用。

## 发布检查清单

- [ ] Front Matter 标题、日期、标签和分类正确。
- [ ] 标题层级连续，文章目录结构正确。
- [ ] 所有图片均为本地相对路径。
- [ ] `npm run check:images` 通过。
- [ ] `npm run build` 通过。
- [ ] Git 工作区不包含 `public/`、`db.json` 或临时文件。
- [ ] GitHub Actions 的 `Pages` 工作流成功。
- [ ] 线上首页、目录、标签、分类和图片显示正常。
