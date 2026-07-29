# 提交规范

## 图片大小

提交前会自动检查已暂存的图片文件。

- 单张图片不能超过 500KB。
- 超过限制时请先压缩，再重新 `git add`。
- 检查命令：`npm run check:images`

当前规则由 Husky 的 `pre-commit` 钩子执行。
