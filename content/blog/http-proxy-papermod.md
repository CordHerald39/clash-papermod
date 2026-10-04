---
{
  "title": "Clash 修改监听端口后需要同步哪些应用设置",
  "description": "Clash 修改监听端口后需要同步哪些应用设置。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:59:37.575388+00:00",
  "lastmod": "2026-10-04T18:59:37.575388+00:00",
  "type": "post"
}
---

修改 Clash 的 HTTP、SOCKS 或 mixed 入站端口之后，内核不会通知已经填好旧端口的浏览器、系统代理或其他应用。需要同步的是这些客户端里的代理主机和端口，而不是策略组选择或 API 密钥。漏改一台客户端，就会出现“有的程序能走代理、有的提示连不上”的分裂状态。

## 适用条件

适用于你已经更改 HTTP 或 mixed（以及仍在使用的 SOCKS）监听端口，并希望原有客户端继续把流量送进 Clash。官方文档将 http(s)/socks/mixed 作为可验证的代理入站，并用 `allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips` 约束谁能使用代理端口。`external-controller`（示例 `127.0.0.1:9090`）是另一套监听，改代理入站端口通常不必改 API；只改 `secret`、`mode`、`log-level` 或 GEO 相关项，也不属于本问题所说的同步。

若 `bind-address` 从 `"*"` 改成单一 IPv4/IPv6，或反过来，主机字段也要一起改，不能只改端口数字。

## 需要同步的设置

本机侧：所有手动填写了 HTTP 代理的浏览器、开发工具、终端环境变量，都应把端口改成新的入站端口，主机保持为当前绑定且本机可访问的地址。只重载 Clash 配置而不改这些字段，应用仍会连接旧端口。协议栏保持为 HTTP 代理；若客户端实际使用 SOCKS，则必须与仍在监听的 SOCKS 或 mixed 入站一致。

其他设备侧：当 `allow-lan` 为 true，且设备 IP 落在 `lan-allowed-ips`（默认 `0.0.0.0/0`、`::/0`）、又不在优先生效的 `lan-disallowed-ips` 中时，那些设备上的系统或浏览器代理端口也要改为新端口。绑定地址变更后，还要同步主机，否则会打到未监听的网卡地址。

鉴权侧：改端口不会自动取消 `authentication`。来源仍属于 `skip-auth-prefixes`（默认 `127.0.0.1/8`、`::1/128`）时，本机一般不必改密码；来源不在前缀内的应用仍要带原用户名和密码。不要把 API 的 `secret` 填进 HTTP 代理密码。`ipv6` 若被关闭，原先填写 `::1` 的应用要改回可用的 IPv4 回环。

不必当作代理端口去同步的项：`external-ui`、CORS、`profile.store-selected`、GEO 下载地址等。控制面板连接的是 API 端口，只有同时修改了 `external-controller` 或 `external-controller-tls` 时才需要改面板地址。

## 核对方法与失败后的下一步

同步完成的判断依据：每个客户端的代理端口与当前 HTTP/mixed（或 SOCKS）入站一致；主机与 `bind-address` 一致；局域网客户端仍满足 `allow-lan` 与地址段；鉴权规则未被意外收紧。

若只有部分应用恢复，按应用逐个改旧端口，而不是反复切换 `mode`。把 `log-level` 设为 `info` 或 `debug`：仅新端口出现入站、旧端口没有任何连接，说明未同步的程序还在用旧值。新端口绑定失败（例如被占用）时，入站并未真正改成功，应改回可绑定的端口并再次同步客户端。`mode` 为 `direct` 时入站仍在、出站直连，不能用“网页还能打开”证明端口已同步。

https://wiki.metacubex.one/config/general/
