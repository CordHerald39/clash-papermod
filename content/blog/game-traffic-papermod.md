---
{
  "title": "Clash 结束游戏排查后怎样恢复日常分流",
  "description": "Clash 结束游戏排查后怎样恢复日常分流。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.871274+00:00",
  "lastmod": "2026-10-04T21:38:12.871274+00:00",
  "type": "post"
}
---

结束游戏相关排查后，若日常浏览、系统更新或局域网访问变成全部走代理、全部直连，或根本不进入 Clash，应先恢复 `tun` 段，而不是先改节点。Tun 只负责把本机流量导入虚网卡；日常分流里哪些走直连、哪些走出站，仍由后续路由规则决定。若入口仍按游戏包名、UID 或网卡收窄，日常应用不会进入那套规则。

## 适用条件

出现下列残留时按本文处理：曾开关 `enable`、`auto-route`、`auto-redirect`；曾用 `include-package`、`exclude-package`、`include-android-user` 或 Linux 的 `include-uid`、`exclude-uid` 只放行或排除游戏；曾改 `stack`、`strict-route`、`dns-hijack`、`route-address`、`route-exclude-address`、接口名单或 `auto-detect-interface`。

判断依据：`include-package` 仍只有游戏包名时，未列出的应用不会被 Tun 路由；`exclude-package` 若包含浏览器或 `com.android.captiveportallogin`，日常页面会绕过 Tun。Linux 上未写入 `include-uid` 的用户同样不进 Tun。`include-interface` 与 `exclude-interface` 不能同时配置。这些现象与出站是否可连接不是同一层问题。

## 按场景恢复 Tun 入口

1. 日常需要流量重新进入规则匹配时，将 `enable` 设为 `true`。排查阶段若关闭 Tun、只留系统代理端口，必须重新打开。
2. `auto-route` 可自动把全局流量导入 tun 网卡。若排查时关闭自动路由或改成过窄的 `route-address`，日常应重新开启。Linux 若还依赖把 TCP 重定向进栈，需 `auto-redirect: true` 且 `auto-route` 已启用。Android 上 auto-redirect 仅转发本地 IPv4。
3. Android 包名是白名单逻辑：未写入 `include-package` 的应用不会被路由。结束排查应取消「仅游戏」，恢复为默认不限制，或改回日常需要进入 Tun 的包名。`exclude-package` 只保留确实要绕过的项。`include-android-user` 常用机主 `0`、分身 `10`、应用多开 `999`；只写分身则机主应用不进 Tun。
4. Linux 同步恢复 UID、MAC 与接口限制。按来源 MAC 限制仅在启用 auto-route 与 auto-redirect 时有效。多网卡应恢复 `auto-detect-interface`，或按文档建议在多出口同时连接时手动指定日常出口网卡。
5. `stack` 可选 system、gvisor、mixed、mips；无使用问题时建议 mips。若排查改成 system 或 mixed 且防火墙未放行：Windows 需允许内核通过防火墙；Linux 可对 TUN 网卡出站做 ACCEPT。开防火墙时无法使用 system 与 mixed，除非已按文档放行。栈只决定协议实现，不是分流策略本身。
6. `dns-hijack` 将匹配连接导入内部 DNS。日常应恢复如 `any:53` 与 `tcp://any:53`。MacOS 与 Windows 无法自动劫持发往局域网的 DNS；Android 开启私人 DNS 时无法自动劫持。
7. `route-exclude-address` 用于排除网段，文档示例包括 `192.168.0.0/16` 与 `fc00::/7`。若游戏排查改成只路由部分 `route-address`，应恢复排除局域网，或取消过窄自定义网段。Linux 上 `route-address-set` 与 `route-exclude-address-set` 需要 nftables，且与 routing-mark 冲突，临时规则集绕过要撤掉。
8. `strict-route` 在 Linux 会让不支持的网络无法到达并减少地址泄漏；在 Windows 会添加防火墙规则抑制多宿主 DNS 泄漏，但可能影响 VirtualBox。按日常是否需要严格路由显式写回。

`mtu`、`gso`、`udp-timeout`、`endpoint-independent-nat` 与分流名单无关，未改则不必动。IPv6 的 `inet6-address` 需顶层 `ipv6: true`；启动时若系统其他网卡没有 IPv6 会禁用该功能，强制开启才设置环境变量 `SKIP_SYSTEM_IPV6_CHECK=1`。

## 失败时下一步

流量仍完全不进 Clash：检查包含型名单是否漏掉日常应用、UID 或接口。仅局域网或虚拟机异常：核对 `strict-route` 与 `route-exclude-address`。解析异常但 Tun 已起：核对 `dns-hijack` 与私人 DNS、局域网 DNS 限制。Tun 已恢复但访问仍全代理或全直连：入口已不是原因，下一步只应检查路由规则自上而下的匹配，而不是继续增减 Tun 开关。本文不处理具体域名或 GEOIP 条目。

资料：https://wiki.metacubex.one/config/inbound/tun/
