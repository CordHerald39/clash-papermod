---
{
  "title": "Clash 长期使用规则模式需要保存哪些自定义项",
  "description": "Clash 长期使用规则模式需要保存哪些自定义项。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:59:37.571397+00:00",
  "lastmod": "2026-10-04T18:59:37.571397+00:00",
  "type": "post"
}
---

长期使用规则模式，需要保存的是全局配置里会改变「是否在做规则匹配」以及匹配条件、出站路径、GEO 数据和入口鉴权的那些项。运行模式默认已是规则模式，但默认不等于你的定制。本页不包含规则表本身；规则条目要另存在承载路由规则的配置里，不能用本页字段代替。

## 适用条件

适用于准备备份或迁移一份长期以 `mode: rule` 运行的配置，需要知道全局段哪些键一旦丢失会改变规则模式行为的场合。适用于工作目录、GEO 文件来源或外部界面路径曾经改过的场合。不适用于把已弃用的全局 TLS 指纹继续当作必存项。

## 应保存的自定义项与判断依据

1. 运行模式与可观察性。保存 `mode`（明确为 `rule`，以免环境默认被改成 `global` 或 `direct`）和 `log-level`。日志只在控制台和控制页面输出，等级从 `silent` 到 `debug` 会改变你事后能否看到错误。判断：备份里能读到这两项，才能确认下次启动仍是规则匹配且日志策略不变。
2. 匹配条件。保存 `ipv6`（是否接受 IPv6 流量，默认 true）、`find-process-mode`（`always` / `strict` / `off`，路由器场景资料推荐 `off`）。保存 GEO 一组：`geodata-mode`（true 为 dat，默认 false 为 mmdb）、`geodata-loader`（`standard` 或默认 `memconservative`）、`geo-auto-update`、`geo-update-interval`（小时）、`geox-url` 下的 geoip、geosite、mmdb、asn。保存 `global-ua`（默认 `clash.meta`）和 `etag-support`（默认 true），二者影响外部资源下载。判断：规则模式若依赖进程或 GEO 数据，缺这些键等于匹配条件回到默认，不一定等于你现在的分流结果。
3. 出站与连接行为。保存 `interface-name`、`routing-mark`（Linux 出站标记）、`tcp-concurrent`（用 dns 解析出的所有 IP 连接并取第一个成功者）、`unified-delay`（计算 RTT，消除握手带来的延迟差异）。移动设备上若改过 Keep Alive，一并保存 `keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive`（Android 上禁用 Keep Alive 被强制为 true）。判断：这些项不改变 `mode` 的名称，但会改变规则匹配之后流量怎样离开主机。
4. 入口、API 与缓存。保存 `allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`（黑名单优先级高于白名单）、`authentication`、`skip-auth-prefixes`。保存 `external-controller` 及相关 CORS、Unix socket、Windows namedpipe、TLS 监听、`secret`、`external-controller-routing-mark`。若使用外部用户界面，保存 `external-ui`、`external-ui-name`、`external-ui-url`；路径不在工作目录时还须保存已加入的 `SAFE_PATHS`（语法同系统 PATH：Windows 分号，其他系统冒号）。`profile.store-selected` 储存 API 对策略组的选择供下次启动使用，`store-fake-ip` 储存 fakeip 映射，长期使用规则模式时这两项决定重启后选择和映射是否还在。TLS 段目前仅用于 API 的 https，若启用了 `external-controller-tls`，证书、私钥与 `ech-key` 也要纳入备份（自 v1.19.18，本地文件支持自动重载）。判断：缺入口与密钥项，其他设备或面板会连不上；缺 `store-selected` / `store-fake-ip`，重启后策略选择和 fakeip 映射不必保持。

资料写明全局 TLS 指纹已弃用，应在 proxy 内设置 `client-fingerprint`，不要把已弃用的全局指纹当作长期必选项保存。Unix socket、namedpipe 和 DOH 的 API 路径不会验证 secret，若曾开启，备份时同时记下自行保证安全这一前提。

## 失败时下一步

迁移后不再按规则分流，先核对备份中的 `mode` 是否仍为 `rule`。匹配范围不对，再核进程模式和 GEO 下载项是否丢失。重启后策略选择或域名映射变化，检查 `profile` 两项。面板或局域网设备无法接入，核对外控制器、鉴权和 `SAFE_PATHS`。不要把本页未列出的规则文件路径写成全局配置的一部分。

资料来源：
https://wiki.metacubex.one/config/general/
