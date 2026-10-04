---
{
  "title": "Clash 怎样把订阅凭据与教程笔记分开保存",
  "description": "Clash 怎样把订阅凭据与教程笔记分开保存。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:34:48.395439+00:00",
  "lastmod": "2026-10-04T18:34:48.395439+00:00",
  "type": "post"
}
---

要把 Clash 的订阅凭据和教程笔记分开，先分清代理集合里哪些键是“本机才能持有的秘密”，哪些键只描述行为。秘密应只出现在 HomeDir 内实际加载的配置（以及环境变量/命令行）中；笔记只保存可公开复述的结构、单位和限制，并用占位符代替真实取值。

## 适用条件

适用于同时维护一份可运行配置和一份给自己或他人看的说明。`proxy-providers` 的 `name` 必须且不可重复，也建议不与策略组重名，这类约束可以写进笔记。`type` 为 `http` / `file` / `inline` 的选择、`interval` 的秒、`size-limit` 的字节、`health-check` 各子项、`filter` 与 `exclude-filter` 的关键词/正则、`exclude-type` 用 `|` 分割且不支持正则，都属于可记录的规则。必须留在凭据侧的是：`http` 的 `url`、`header` 中的授权、`age-secret-key`、`payload` 里的 `password` 与真实 `server`。`path` 指向的本地集合文件同样按凭据文件管理。

## 分开保存的做法与判断

运行配置：需要自动更新就在本机 YAML 写 `type: http` 和真实 `url`，可选 `header`、`interval`、`proxy`（经指定代理下载）。不需要把链接写进笔记。若已把集合落在本地，笔记中只写“使用 `file` 与 HomeDir 内 `path`”，不写盘符以外的真实路径；因安全限制，`path` 默认只允许 HomeDir，其它位置要靠环境变量 `SAFE_PATHS`，该变量本身也不宜写进会转发的笔记。加密集合的密钥用 `-age-secret-key` 或 `CLASH_AGE_SECRET_KEY` 注入，避免密钥和教程复制在同一文档。`inline` 的 `payload` 只放在本机文件；笔记若需说明字段，只保留 `name`/`type`/`server`/`port`/`cipher` 的键名和假值。

教程笔记：可抄写健康检查是否启用、`lazy` 含义、`expected-status` 需另见期望状态说明、`override` 的前缀后缀与 `proxy-name` 正则替换、`override-expr` 基于 yq v4 风格及文档列出的限制。这些都不构成下载权。判断是否已分开：把笔记全文发出后，他人应无法用其中任何字符串完成代理集合的 HTTP 下载或节点认证；若还能，说明 `url`、头、密钥或口令被写进了笔记。

## 失败时的下一步

若发现笔记里已有完整 `url` 或 `AGE-SECRET-KEY-` 开头的密钥，把该笔记视为已污染，从运行配置轮换订阅与密钥，并从笔记中改为占位符。之后核对本机仍能更新：`http` 类型是否只在 HomeDir 配置中保留真实 `url`；`file` 类型 `path` 是否越界；加密文件是否改为由环境变量提供密钥。不要为了让笔记“能直接粘贴就用”而把凭据拷回去。需要验证语法时，用文档那种明显假地址和假口令的结构示例，而不是可访问的订阅链接。

https://wiki.metacubex.one/config/proxy-providers/
