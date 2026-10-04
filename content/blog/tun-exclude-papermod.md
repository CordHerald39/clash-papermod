---
{
  "title": "Clash 维护排除列表时怎样避免范围不断扩大",
  "description": "Clash 维护排除列表时怎样避免范围不断扩大。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.103436+00:00",
  "lastmod": "2026-10-04T19:25:01.103436+00:00",
  "type": "post"
}
---

## 优先用规则集收口，而不是持续追加网段

维护 Clash（mihomo）TUN 排除时，范围容易越来越大，是因为把本应集中管理的目的 CIDR 直接写进 `route-exclude-address`。官方提供了 `route-exclude-address-set`：将指定规则集中的目标 IP CIDR 加入防火墙，匹配流量绕过路由。适用条件是 Linux、已安装并可使用 nftables，且 `auto-route` 与 `auto-redirect` 均已启用。满足时，排除范围应落在规则集里维护，`tun` 段只保留规则集名称，避免每出现一个地址就加一行前缀。

`route-address-set` 语义相反：不匹配的流量绕过路由。不要为了“少进 TUN”把两个集合都越写越大。二者都与任意配置中的 `routing-mark` 冲突，维护时若已用 mark，就不要再靠地址集扩范围。`route-address` / `route-exclude-address` 是启用 `auto-route` 时的自定义网段；文档写明 `route-address` 一般无需配置。默认全局路由已经由 `auto-route` 完成，排除列表只放必须绕过的网段（文档示例为 `192.168.0.0/16`、`fc00::/7`），而不是把半个互联网写进排除。

旧键 `inet4-route-exclude-address`、`inet6-route-exclude-address` 即将废弃。维护时合并到 `route-exclude-address`，避免新旧两套同时膨胀。IPv6 列表是否生效还取决于启动时系统是否存在 IPv6，以及顶层 `ipv6`；条件不满足时加再多 v6 前缀也不会扩大实际排除，只会造成配置膨胀。

## 分清包含与排除，避免两套名单对打

`include-interface` 限制被路由的接口，默认不限制；`exclude-interface` 排除接口。二者冲突，不可一起配置。维护原则是只保留一种：要么白名单网卡，要么黑名单网卡。UID 同样有 `include-uid` / `include-uid-range` 与 `exclude-uid` / `exclude-uid-range`。包含未配置的用户不会被 TUN 路由，因此在“只有少量用户需要进 TUN”时用包含范围，而不是把其余 UID 逐个加入排除。UID 规则仅 Linux 且需要 `auto-route`。

Android 上 `include-package` 与 `exclude-package` 并列，用户规则仅 Android 且需要 `auto-route`。常用用户 ID：机主 0、分身 10、应用多开 999。若只有少数应用需要进 TUN，用包含包名，未配置的包不会被路由；不要把系统应用一个个写入排除。`include-android-user` 未列出的用户也不会被路由，可先收口用户再收口包名。MAC 的 include/exclude 仅 Linux，且需要 `auto-route` 和 `auto-redirect`，同一维护策略：只选一侧。

## 按平台关掉无效维度，防止列表空转扩张

不是每个平台都该维护全部排除键。Windows/macOS 没有 UID、包名、MAC、nftables 地址集这些项，写上去只会让文件变长。macOS 只允许 `utun` 开头的 `device`。Linux 才考虑 `route-exclude-address-set` 与 MAC。Android 才维护包名与用户。`auto-redirect` 仅 Linux；Android 上仅转发本地 IPv4，不要为热点对端再复制一份排除。`strict-route`、防火墙与 system/mixed 栈限制影响的是能否使用 TUN，不是再加排除前缀能解决的；打开防火墙时需按文档放行内核，而不是扩大 `route-exclude-address`。

`dns-hijack` 在 macOS/Windows 无法自动劫持发往局域网的 DNS，Android 私人 DNS 也无法自动劫持。不要把这些平台限制用“再排除 53 端口网段”来绕，那会让排除列表失去边界。`endpoint-independent-nat`、`gso`、`mtu` 等与排除范围无关，维护排除时不要把它们卷进同一份“例外清单”。

## 范围已经失控时的下一步

先删互斥项：接口 include/exclude 成对、地址集与 `routing-mark` 共存、新旧排除键重复。再把零散 CIDR 迁到（仅当 Linux 条件满足时）`route-exclude-address-set` 所引用的规则集。然后按“能用包含就不用排除”收缩 UID/包名/MAC/接口。最后核对 `enable`、`auto-route`、必要时的 `auto-redirect` 与 nftables；依赖不满足时停止加项。平台不支持的维度从配置中移除，而不是注释堆积。这样排除范围回到文档定义的字段语义，而不是无限追加。

资料来源：https://wiki.metacubex.one/config/inbound/tun/
