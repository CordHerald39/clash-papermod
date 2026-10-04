---
{
  "title": "Clash 关闭 TUN 后怎样确认日常网络恢复",
  "description": "Clash 关闭 TUN 后怎样确认日常网络恢复。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.099440+00:00",
  "lastmod": "2026-10-04T19:25:01.099440+00:00",
  "type": "post"
}
---

关闭 Tun 后，日常网络恢复的含义是：流量不再进入虚网卡，默认路由与 DNS 回到启用前的出口，且程序写入的防火墙或 iptables/nftables 规则已不再接管。适用条件是：已将 `tun.enable` 设为 `false` 并完成内核重启或退出。判断依据是手册中 `auto-route`、`auto-redirect`、`strict-route`、`dns-hijack` 与 IPv6 检查的行为均不再成立，物理网卡可以不经过 tun 出站。

## 确认虚网卡与自动路由已经停用

`enable` 用于启用 tun，关闭后不应再出现配置中的 `device` 作为默认入口。MacOS 上该名称本就只能是 `utun` 前缀，关闭后也不应残留默认路由指向该接口。`auto-route` 会在启用时自动把全局流量导入 tun；关闭后应核对默认路由是否回到物理出口，而不是仍指向已消失的 tun。若启用时用过 `route-address`/`route-exclude-address`（或即将废弃的 inet4/inet6 旧字段），关闭后这些自定义网段不应再出现在生效路由里。

Linux 上 `auto-route` 会生成 iproute2 路由表与规则，默认表索引 2022、规则起始索引 9000。关闭后若这两处仍把查找指向 tun，应视为未恢复。`include-interface`/`exclude-interface` 只在 Tun 启用时限制被路由接口；关闭后不应再依赖它们来解释物理网卡是否可用。多出口设备若曾用 `auto-detect-interface`，恢复日常网络时以实际默认出口为准，而不是沿用启用期间自动选中的接口。

## 确认重定向、防火墙与 DNS 副作用已解除

`auto-redirect` 仅 Linux，且依赖已启用的 `auto-route`，会自动配置 iptables/nftables 重定向 TCP。关闭 Tun 后应检查这些重定向是否仍把本机 TCP 送进已不存在的虚网卡。`route-address-set`/`route-exclude-address-set` 同样依赖 Linux、nftables 以及上述两项，并与 `routing-mark` 冲突；关闭后防火墙中按规则集写入的目标 CIDR 处理应停止，否则会出现部分网段仍被绕过或仍被劫持的假恢复。

`strict-route` 在 Windows 上会添加防火墙规则，用于阻止普通多宿主 DNS 解析造成的 DNS 泄露，并可能影响部分应用。关闭 Tun 后应确认这类规则不再阻止日常出站或 DNS。`dns-hijack` 在启用时把匹配连接导入内部 DNS；关闭后本机解析应回到系统 DNS。若系统 DNS 指向局域网，本来就不会被 MacOS/Windows 自动劫持；恢复确认时不要把“局域网 DNS 仍可用”误当成 Tun 残留。Android 私人 DNS 在启用阶段也无法被自动劫持，关闭后同样以系统设置为准。

## 核对 IPv6 与过滤残留，失败时下一步

程序启动时会检查其他网卡是否有 IPv6，没有则禁用 tun 的 v6。关闭后应确认物理网卡 IPv6 未被误关；若曾设置 `SKIP_SYSTEM_IPV6_CHECK=1` 并打开顶层 `ipv6` 来强制给 tun 配 `inet6-address`，恢复日常网络时要避免系统仍尝试把 v6 默认路由指向已删除地址。Linux UID、MAC 与 Android 包名过滤只在 Tun 启用且满足 `auto-route`（MAC 还需要 `auto-redirect`）时生效；关闭后这些过滤不应再让某个应用或用户单独无网，否则说明路由或防火墙未清干净。

若关闭 `enable` 后仍无外网：先看默认路由是否还指向 tun 或空接口，Linux 再清残留 iproute2 规则与 iptables/nftables 重定向，Windows 再查 `strict-route` 留下的防火墙项。若只有部分应用恢复：核对这些应用是否曾被 `exclude-package`、UID 或 MAC 规则影响，以及物理出口是否被 `exclude-interface` 误伤后未恢复。若 DNS 异常：区分系统 DNS、局域网 DNS 与私人 DNS，避免把平台本就不能劫持的行为当成关闭失败。处理顺序是保持 Tun 关闭，先恢复备份配置中的非 Tun 部分，再手动收回路由与防火墙，确认物理网卡直连可用后再决定是否重新启用 Tun。

资料：https://wiki.metacubex.one/config/inbound/tun/
