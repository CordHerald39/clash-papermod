---
{
  "title": "Clash 里的两个 IPv6 开关：接收流量与 AAAA 解析分别检查",
  "description": "区别顶层 ipv6 与 dns.ipv6，并说明为何关掉 AAAA 返回不能证明 IPv6 流量没有绕行。",
  "draft": false,
  "date": "2026-10-04T06:25:42+08:00",
  "lastmod": "2026-10-04T06:25:42+08:00",
  "type": "blog",
  "author": "编辑部",
  "tags": [
    "Clash IPv6",
    "dns.ipv6",
    "AAAA 解析"
  ]
}
---

配置里出现顶层 `ipv6` 与 `dns.ipv6`，它们不是同一个开关。mihomo 全局文档用顶层字段控制内核是否接受 IPv6 流量；DNS 文档说明，dns.ipv6 为 false 时回应 AAAA 的空解析。一个作用于内核流量能力，一个作用于解析回答，不能只看字段名称相同就认为作用一致。

## 先把系统、解析与接管分开

设备本身有 IPv6 地址，不代表内核已经接管 IPv6。内核允许 IPv6，也不代表 DNS 会向应用返回 AAAA。反过来，内核 DNS 不返回 AAAA，应用仍可能使用缓存、自己的解析器或明确的 IPv6 地址。

因此，“把 dns.ipv6 关掉后某网站能开”是一个现场现象，不足以证明全部 IPv6 已关闭或不再绕过代理。记录系统网络、顶层设置、DNS 设置和接管模式，才能解释变化发生在哪里。

## 一次只变更一个设置

保留当前配置，在同一网络、同一目标和同一节点下检查新连接。先观察应用取得的地址类型，再看连接记录是否显示目标 IPv6 以及匹配策略。只有 DNS 有结果但没有连接记录时，继续检查应用是否经过当前接管路径。

需要对照时，一次只变更 dns.ipv6 或顶层 ipv6 中的一项，重新建立连接并记录结果。两个同时改掉，即使故障消失，也无法判断是解析选择还是转发能力导致。无需为这一步更改整台设备的系统 IPv6 设置。

## TUN 还有独立的路由条件

TUN 文档说明，inet6-address 还需顶层 ipv6 为 true 才生效，并会在启动时检查系统其他网卡是否存在 IPv6。字段写进文件但启动条件不满足，也可能与预期不同。当前文档中的平台差异和内核版本应一起核对，不机械照搬环境变量强制开启。

遇到问题保留 IPv4/IPv6 两类请求的对照、内核版本及错误，不把单次成功写成泄漏测试结论。相关：[TUN 的 DNS 接管范围](/blog/tun-dns-hijack-limits/)。依据：[mihomo 全局 IPv6](https://wiki.metacubex.one/config/general/) · [DNS IPv6](https://wiki.metacubex.one/config/dns/) · [TUN IPv6 条件](https://wiki.metacubex.one/config/inbound/tun/)。本文没有开展 IPv6 泄漏测试。
