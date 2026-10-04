---
{
  "title": "Clash 为局域网增加例外后怎样检查范围",
  "description": "Clash 为局域网增加例外后怎样检查范围。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.872271+00:00",
  "lastmod": "2026-10-04T21:38:12.872271+00:00",
  "type": "post"
}
---

在 Clash（mihomo）中为局域网增加例外，指的是 Tun 入站在打开自动路由之后，把指定目的网段从“送进虚接口”的集合里拿掉。配置里出现排除项，只说明准备绕过这些前缀，并不等于当前局域网里每一个地址都已绕过。检查范围时，要同时核对生效条件、CIDR 包含关系，以及接口、设备过滤是否把某次访问划出自动路由。

## 先确认例外有没有生效前提

`route-exclude-address` 的官方说明是：启用 `auto-route` 时排除自定义网段。因此范围检查的第一条判断依据不是浏览器能否打开内网页面，而是这三项是否同时成立：`tun.enable` 为 true，`auto-route` 为 true，排除列表写在核心会读取的字段上。未启用自动全局路由时，不存在“从自动路由中排除某网段”的对象，列表不能当成已生效例外。

字段要分清新旧。现行写法是 `route-exclude-address`；文档仍列出即将废弃的 `inet4-route-exclude-address` 与 `inet6-route-exclude-address`。两套同时出现时，不要假设会合并去重，应以实际被读取的一组作为检查输入。Linux 上还有 `route-exclude-address-set`：把指定规则集中的目标 IP CIDR 加入防火墙，匹配的流量绕过路由。它仅支持 Linux，需要 nftables，且 `auto-route` 与 `auto-redirect` 均已启用，并与任意配置中的 `routing-mark` 冲突。缺任一条件，规则集前缀都不应计入当前范围。方向相反的 `route-address-set` 表示不匹配的流量绕过路由，不能当作局域网例外。

## 按前缀逐条换算覆盖范围

文档示例在 `route-exclude-address` 中写了 `192.168.0.0/16` 和 `fc00::/7`。检查范围应对每一条做包含判断：把目的地址写成单一 IP，看它是否落在已声明前缀内。`192.168.0.0/16` 覆盖 `192.168.0.0` 至 `192.168.255.255`。目的为 `192.168.1.1` 则在该条内；目的为 `10.0.0.1` 或 `172.16.0.1` 则不在该条示例中。`route-address` 在启用 `auto-route` 时用于路由自定义网段而不是默认路由，示例为 `0.0.0.0/1`、`128.0.0.0/1` 以及 IPv6 的 `::/1`、`8000::/1`。那是“要被路由进 Tun 的集合”，与排除列表不是同一字段。只检查例外时，不得把 `route-address` 里的前缀算进绕过范围。

IPv6 示例 `fc00::/7` 只覆盖该唯一本地前缀。链路本地或全局单播若不在已写前缀内，就不能算已排除。`inet6-address` 会在程序启动时检查系统其他网卡是否有 IPv6，不存在可能禁用相关能力；强制开启需环境变量 `SKIP_SYSTEM_IPV6_CHECK=1`，且顶层 `ipv6` 为 true。Tun 侧 v6 已被启动检查关掉时，讨论 IPv6 例外范围没有意义。

## 范围与预期不一致时的下一步

若目的 IP 按 CIDR 应被排除，行为仍像进入 Tun，先看接口过滤。`include-interface` 限制被路由的接口，`exclude-interface` 排除接口，二者冲突、不可一起配置。例外网段只作用于仍被纳入自动路由的那一侧接口。Linux 在启用 `auto-route` 与 `auto-redirect` 时，可用 `include-mac-address` 与 `exclude-mac-address` 按来源 MAC 限制或排除局域网设备。网段例外与设备例外同时存在时按交集理解：设备未被包含或已被排除，不能单凭网段下结论。UID 字段仅 Linux 支持且需要 `auto-route`；Android 一旦配置了 `include-package` 或 `include-android-user`，未列出的应用不会被 Tun 路由，那些应用不适用“网段例外范围”这套说法。

`strict-route` 在启用 `auto-route` 时执行严格路由。Linux 上会让不支持的网络无法到达，并将连接路由到 Tun，用于防止地址泄漏。排除列表漏写当前网关前缀时，该地址会按进 Tun 处理。下一步只补写缺的那一族 CIDR，并再次确认 `auto-route` 仍为 true，而不是改 `stack`、`mtu` 或 `gso`。把目的 IPv4 与 IPv6 分别与列表做包含测试，任一家族未覆盖即视为范围不足。

参考资料：https://wiki.metacubex.one/config/inbound/tun/
