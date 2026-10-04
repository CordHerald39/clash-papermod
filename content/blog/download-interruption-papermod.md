---
{
  "title": "Clash 怎样保存失败下载日志而不公开凭据",
  "description": "Clash 怎样保存失败下载日志而不公开凭据。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.868285+00:00",
  "lastmod": "2026-10-04T21:38:12.868285+00:00",
  "type": "post"
}
---

当外部界面压缩包或 GEO 数据下载失败时，要把失败阶段留在可保存的内核输出里，同时避免把代理口令、API 密钥和证书正文一并公开。以下只依据全局配置文档，说明适用条件、操作步骤、判断依据和失败后的下一步。

## 适用条件与日志级别

适用条件是：正在使用可下载外部资源的全局项，并且配置里可能写有用户验证或密钥。`log-level` 控制内核输出日志的等级，文档写明这些日志仅在控制台和控制页面输出。取值包括 `silent`（静默，不输出）、`error`（仅输出发生错误至无法使用的日志）、`warning`（输出发生错误但不影响运行的日志以及 error 级别内容）、`info`（输出一般运行内容以及 error 与 warning）、`debug`（尽可能输出运行中所有信息）。

判断依据如下。当前为 `silent` 时，下载失败不会形成文字记录，不能假定另外还有独立日志文件可翻。失败已经导致功能不可用时，`error` 是首先应对齐的级别。资源未更新但内核仍在运行时，应对照 `warning` 或 `info` 是否出现下载或校验类记录。仍无法区分请求是否发出时，再使用 `debug`。文档没有把日志级别写成会把密钥自动写入独立文件，因此保存动作应针对控制台或控制页面当时可见的文本。

## 围绕下载项保存记录

与失败下载直接相关的字段包括：`external-ui-url`（自定义外部用户界面下载地址）、`external-ui` 与 `external-ui-name`、`geo-auto-update` 与 `geo-update-interval`（单位为小时）、`geox-url`、`etag-support`（外部资源下载的 ETag 支持，默认为 true）、`global-ua`（自定义外部资源下载 UA，默认为 clash.meta）。

可按下列步骤操作：

1. 先判定失败对象。界面资源看 `external-ui` 是绝对路径还是工作目录相对路径；文档注明若路径不在工作目录，需手动设置 `SAFE_PATHS` 环境变量加入安全路径，语法同本操作系统 PATH（Windows 下分号分割，其他系统冒号分割）。路径不在安全范围内时，应先记路径问题，而不是把失败记成凭据错误。
2. 把 `log-level` 调整到能覆盖该失败的级别，在控制台或控制页面复制当时输出并保存。不要把完整配置文件当作日志附件发送。
3. 若启用了 `geo-auto-update`，记录间隔是否已到；`etag-support` 为 true 时，要在记录中区分未实际拉取与拉取后不可用。
4. `global-ua` 只说明下载使用的 UA，不能用来代替密钥排查。

`tls` 目前仅用于 API 的 https，包含证书、私钥和可选 ECH 密钥；自 v1.19.18 起，当这些项为本地文件时支持自动重载。保存失败记录时不要附带 PEM 正文。`profile` 下的 `store-selected` 与 `store-fake-ip` 只说明策略选择和 fakeip 映射是否落盘，不能当作下载失败日志的保存开关。

## 凭据隔离与失败后下一步

`authentication` 为 http(s)/socks/mixed 的用户验证，`skip-auth-prefixes` 设置允许跳过验证的 IP 段。`secret` 是 API 访问密钥。文档明确：从 Unix socket 或 Windows namedpipe 访问 API 不会验证 secret；在 RESTful API 端口开启 DOH 的 URL 也不会验证 secret。对外保存的失败日志中不应出现上述口令、密钥，也不应同时给出监听地址与密钥。`bind-address`、`allow-lan`、`lan-allowed-ips` 与 `lan-disallowed-ips` 描述的是局域网访问范围，同样不要连同验证信息一起公开。

失败后的下一步：日志为空时，检查是否为 `silent`，并只在文档写明的控制台与控制页面取文本。若记录指向路径或安全路径，处理 `external-ui` 与 `SAFE_PATHS`，不要用无限制提高日志级别代替。必须交付给他人时，从副本删除 `authentication`、`secret` 和证书内容后再保存。若涉及 API 或界面异常，确认未把不校验 secret 的监听暴露到不可信环境。

资料：https://wiki.metacubex.one/config/general/
