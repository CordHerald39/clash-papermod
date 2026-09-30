# Clash 配置笔记 · PaperMod

使用真实上游主题，vendored在themes/PaperMod，保留LICENSE。

## 本地预览

安装Hugo extended 0.167.0，执行：

```sh
hugo server --bind 127.0.0.1 --port 4195 --baseURL http://127.0.0.1:4195/ --disableFastRender
```

正式构建：`hugo --minify`。输出public，源文章在content/blog，每篇一个Markdown。

## GitHub Pages

仓库Settings → Pages选择GitHub Actions。工作流由configure-pages获取base_url，支持仓库子路径。hugo.json存储正式GitHubPages地址，使用自定义域名时修改baseURL并在Pages中配置域名。

## 内容导入

`node scripts/import-content.mjs article.json`校验后写入content/blog。输入status=draft时正式构建不发布。不要把API密钥放入仓库。
