---
{
  "title": "Clash 网络切换后怎样复核 TUN 路由状态",
  "description": "Clash 网络切换后怎样复核 TUN 路由状态。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.102448+00:00",
  "lastmod": "2026-10-04T19:25:01.102448+00:00",
  "type": "post"
}
---

网络切换（更换无线、有线或蜂窝）之后，TUN 的出口选择和自动路由可能不再对应当前接口或局域网网段。复核应围绕官方给出的 auto-detect-interface、auto-route、接口包含排除以及 Linux 路由表索引来进行，确认流量是否仍按文档描述进入 tun。

## 适用条件

复核的前提是 tun.enable 与 auto-route 仍为 true，否则切换后不会自动设置全局路由。auto-detect-interface 为 true 时自动选择流量出口接口；文档明确多出口网卡同时连接的设备建议手动指定出口网卡。include-interface 与 exclude-interface 限制被路由的接口，切换后接口名变化会导致不匹配，且二者冲突。route-exclude-address 按 CIDR 排除，切换后新局域网可能不再被原 192.168.0.0/16 等示例覆盖。strict-route、auto-redirect（仅 Linux，需 auto-route）会在新网络下继续影响到达性与 TCP 重定向。macOS 的 device 仍须 utun 开头。Android 的用户和包名规则不随网络切换自动失效，但接口和 DNS 条件会变。不满足这些条件时，复核结论不能套用文档行为。

## 具体复核步骤

切换网络后立刻查看 tun 段：auto-detect-interface 是否仍为 true，若为手动指定则确认所写接口名在新环境中仍然存在。检查 include-interface、exclude-interface 是否还指向当前活动网卡。阅读 route-exclude-address 与 route-address，看新局域网或新网段是否仍被正确排除或包含。Linux 核对接 iproute2-table-index（默认 2022）和 iproute2-rule-index（默认 9000）生成的表和规则是否还指向 tun 设备。确认 auto-redirect 在切换后是否仍满足“带 auto-route 时在路由器上按预期工作”的场景。查看 strict-route 是否因“不支持的网络无法到达”把新网络判死。同时核对 dns-hijack 在 Windows/macOS 对局域网 DNS 无效、Android 私人 DNS 会阻止劫持等平台限制是否被新网络触发。device、stack、mtu 一般不随切换改变，但应确认未被改动。

## 判断依据

若 auto-detect-interface 为 true 且新接口被选为出口，流量应继续按 auto-route 描述进入 tun。若手动指定的接口在新网络中消失，则出口选择失败。新局域网 CIDR 未出现在 route-exclude-address 中时，局域网访问被导入 tun 符合全局路由描述，属于复核应发现的状态变化。include-interface 未包含新接口则该接口流量不会被路由。strict-route 在 Linux 的强制路由到 tun 会在切换后仍然生效。route-address-set 在 nftables 下仍可能让部分目标绕过，且与 routing-mark 冲突。用“当前出口是否被检测到或被包含、新网段是否被排除、路由表索引是否仍指向 tun”对照文档，即可判断路由状态是否仍有效。

## 失败时下一步

将 auto-detect-interface 设为 false 并改为当前实际出口接口。更新 route-exclude-address 以覆盖新局域网网段。Linux 重新加载以使 auto-redirect 重建 iptables/nftables 规则，并检查表索引是否被占用。确认防火墙在新网络下仍放行（Windows 安全中心允许内核，Linux 对 TUN 网卡出站 ACCEPT）。macOS 核对 utun 名称。Android 检查私人 DNS 与热点共享限制。可临时关闭 strict-route 观察新网络到达性。IPv6 网络切换时重新确认 inet6-address 条件。避免 include-interface 与 exclude-interface 同时配置。完成单项修改后再次对照 auto-route 与接口字段复核。

https://wiki.metacubex.one/config/inbound/tun/
