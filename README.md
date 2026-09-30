# Clash 科技官网 · Astro

本地重设计，未发布。旧Hugo源码已备份到工作区私密维护教程/redesign-backups，正文保留content路径。

## 开发

Node.js 24，pnpm 11。运行pnpm install，pnpm build，pnpm preview（端口4205）。

生产候选构建静态HTML并保留noindex，发布前需单独决定索引策略。工作流仅手动触发，无自动push部署。GitHub远程保持原仓库。

## 文章

content/blog每篇一个Markdown；现有Hugo relref由内容加载器兼容转换。统一JSON导入：node scripts/import-content.mjs 文件.json。成功导入后pnpm build更新页面、RSS与网站地图。
