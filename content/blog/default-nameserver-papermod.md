---
{
  "title": "Clash 更换加密 DNS 服务前应检查哪些依赖",
  "description": "Clash 更换加密 DNS 服务前应检查哪些依赖。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.490425+00:00",
  "lastmod": "2026-10-04T20:33:43.490425+00:00",
  "type": "post"
}
---

更换加密 DNS 前，要把“能不能启用加密上游、用什么 IP 去解析上游主机名、查询是否走代理或路由、DOH 附加参数是否仍成立”当成依赖清单，而不是只替换一串地址。以下只依据手册中的 DNS 配置字段，说明适用条件、步骤和失败后的下一步。

## 总开关与引导解析是否仍成立

适用条件：准备把 `nameserver`、`nameserver-policy`、`fallback`、`proxy-server-nameserver` 或 `direct-nameserver` 换成加密上游，尤其是主机名为域名的 DOH。文档规定 `enable` 表示是否启用；若为 `false`，则使用系统 DNS 解析。判断依据：未启用时，加密条目不会按手册中的分流与上游逻辑接管解析，此时谈更换没有意义。

`default-nameserver` 用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。域名形态的 DOH 要先得到主机名对应地址，再建立 HTTPS 查询；引导项若写成仍需再解析的域名，或写成进程访问不到的 IP，会在更换后立刻失去上游。步骤：确认 `enable` 为 `true`；列出新服务中所有需要解析的主机名；把 `default-nameserver` 保持为 IP（允许其本身是加密 DNS，但形态仍须是 IP）。失败时下一步：先核对引导项是否为 IP、是否仍可达，不要先改 `fake-ip-filter` 或业务路由。

## 分流字段与代理侧依赖是否对齐

适用条件：配置里同时存在多组上游，或加密 DNS 需要经过代理。`nameserver` 是默认域名解析服务器；`fallback` 是后备域名解析服务器；`nameserver-policy` 指定域名查询的解析服务器，可使用 geosite，且优先于 nameserver/fallback。判断依据：只改 `nameserver` 而 policy 仍指向旧加密服务时，匹配到键的域名不会换到新服务。

`proxy-server-nameserver` 仅用于解析代理节点的域名；不填则遵循 nameserver-policy、nameserver 和 fallback。文档写明：如需经过代理查询，应配置 `proxy-server-nameserver`，以防出现鸡蛋问题。`proxy-server-nameserver-policy` 格式同 nameserver-policy，当且仅当 `proxy-server-nameserver` 不为空时生效。`direct-nameserver` 用于 direct 出口域名解析；`direct-nameserver-follow-policy` 默认不遵守 nameserver-policy，仅当 `direct-nameserver` 不为空时生效。

`respect-rules` 表示 dns 连接遵守路由规则，需配置 `proxy-server-nameserver`，并强烈不建议和 `prefer-h3` 一起使用。步骤：标明本次替换的是默认上游、policy、节点解析还是 direct 解析；凡查询要走代理或遵守路由，先写好 `proxy-server-nameserver`；若已开 `prefer-h3`，更换前按文档视为不建议组合，需先取舍。失败时下一步：节点主机名为域名且节点连不上时，检查该项是否为空或是否仍指向已失效上游。

## 附加参数、HTTP/3 与证书依赖

适用条件：条目使用 `#` 附加参数，或全局 `prefer-h3` 为 true。附加参数用于发向公网地址的 DNS 服务器，使用 `#` 附加、`&` 连接。可指定代理或接口：优先使用已有代理，不存在该名称的代理则指定接口连接。`#RULES` 表示遵守路由规则，等同 `respect-rules`。`h3` 强制 HTTP/3 建立 DOH 连接，使用前需确保 DOH 服务器支持 HTTP/3，且与 `prefer-h3` 不冲突。`skip-cert-verify` 跳过 TLS 证书验证；`name-cert-verify` 仅修改证书 DNSName 校验目标，不修改 SNI。

步骤：逐条抄下旧地址 `#` 后的参数；新服务若不声明支持 HTTP/3，不要沿用 `h3` 或把连通性押在 `prefer-h3` 上；证书校验是否跳过，按新服务证书单独决定。失败时下一步：握手阶段异常优先核对证书两项与 HTTP/3；仍无法解析上游主机名则回到 `default-nameserver`；结果被当成污染时检查 `fallback-filter`（其中 `geosite` 已废弃，请使用 `nameserver-policy`）。`listen` 只是 DNS 服务监听，不是更换加密上游的前置依赖。

资料：https://wiki.metacubex.one/config/dns/
