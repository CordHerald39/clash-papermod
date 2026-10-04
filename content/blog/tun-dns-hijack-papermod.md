---
{
  "title": "Clash 修改 DNS 接管配置后如何恢复测试环境",
  "description": "Clash 修改 DNS 接管配置后如何恢复测试环境。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.101443+00:00",
  "lastmod": "2026-10-04T19:25:01.101443+00:00",
  "type": "post"
}
---

修改 dns-hijack 或与之配套的 auto-route、strict-route 后，测试环境可能因路由表、防火墙规则或劫持范围变化而无法回到修改前状态。官方 TUN 文档给出了各字段的默认含义与平台行为，恢复时应按这些字段把配置退回原样，而不是另增未记载的步骤。

## 适用条件
恢复操作适用于已经改动过 tun 段、尤其是 dns-hijack 列表、auto-route、strict-route、route-address / route-exclude-address、include-interface 等项的场合。tun.enable 仍为 true 时，残留的劫持或严格路由会继续影响 DNS 与全局流量。Linux 上 auto-redirect 会改写 iptables/nftables，Windows 上 strict-route 会添加用于抑制多宿主 DNS 泄漏的防火墙规则，这些副作用不会在仅删除列表项后自动消失，因此恢复必须把相关开关一并还原。MacOS 仅允许 utun 开头的 device，Android 私人 DNS 与局域网 DNS 的劫持限制在恢复后依然存在，不能当作“改回配置即可忽略”的条件。

## 恢复步骤与判断依据
第一步使用修改前备份的整段 tun 配置覆盖当前文件，重点核对 dns-hijack 是否回到原列表（或清空）、auto-route 与 strict-route 是否回到原布尔值。第二步确认没有把即将废弃的 inet4-route-address 等旧字段和现行 route-address 混用。第三步检查 include-uid、include-package、exclude-mac-address 等过滤是否被误改，它们会改变谁的流量进入 TUN。判断恢复成功的依据是：53 端口行为与修改前一致（劫持范围相同或同样不劫持），且 IP 与域名连通性回到修改前水平。Linux 需同时还原 auto-redirect；若曾改 iproute2-table-index / iproute2-rule-index，应恢复默认 2022 与 9000，以免残留策略路由。防火墙方面，若测试期间按文档放行了内核或 TUN 出站，恢复测试环境时按原策略决定是否保留放行，避免把临时放行当成永久规则。

## 失败时的下一步
若还原 YAML 后网络仍异常，将 enable 设为 false，让系统重新接管路由与 DNS，确认基础连通后再打开 TUN。核对 stack：防火墙仍开启时 system/mixed 不可用，需按文档放行或改回 mips。device、mtu、inet6-address（需顶层 ipv6 为 true 且注意 SKIP_SYSTEM_IPV6_CHECK）若被改动，一并退回。route-address-set / route-exclude-address-set 仅 Linux + nftables 有效且与 routing-mark 冲突，残留会导致部分网段绕过或强制进入 TUN，应删除测试时加入的集合。完成字段级还原后仍异常，再检查 auto-detect-interface 是否在测试中被改成错误网卡。按文档逐步开关 auto-route 与 dns-hijack，可确认是路由残留还是劫持残留。

https://wiki.metacubex.one/config/inbound/tun/
